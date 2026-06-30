import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // Bỏ qua CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const payload = await req.json()
    console.log('Received SePay Webhook:', payload)

    // Khởi tạo Supabase client với quyền Admin (Bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const content = payload.content || '';
    const amount = payload.transferAmount || 0;
    const transferType = payload.transferType; // 'in' là tiền vào
    
    if (transferType !== 'in') {
        return new Response(JSON.stringify({ success: true, message: 'Not an IN transfer' }), { headers: { "Content-Type": "application/json" } })
    }

    // Tìm mã đơn hàng có định dạng RBL kèm 6-8 ký tự (VD: RBL123456)
    const match = content.match(/RBL[a-zA-Z0-9]+/i);
    let orderCode = null;
    if (match) {
        orderCode = match[0].toUpperCase();
    } else {
        return new Response(JSON.stringify({ success: false, message: 'No order code found in content' }), { headers: { "Content-Type": "application/json" } })
    }

    // Tìm đơn hàng trong DB
    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('order_code', orderCode)
        .eq('status', 'pending')
        .single();
        
    if (orderError || !order) {
        return new Response(JSON.stringify({ success: false, message: 'Order not found or not pending' }), { headers: { "Content-Type": "application/json" } })
    }
    
    // Kiểm tra số tiền chuyển có đủ không (có thể cho phép thiếu/dư 1 chút tùy chiến lược, ở đây yêu cầu >= giá trị đơn)
    if (amount < order.price) {
        return new Response(JSON.stringify({ success: false, message: 'Insufficient amount' }), { headers: { "Content-Type": "application/json" } })
    }
    
    // 1. Cập nhật trạng thái đơn hàng thành 'paid'
    await supabaseAdmin.from('orders').update({ status: 'paid' }).eq('id', order.id);
    
    // 2. Cập nhật gói dịch vụ (plan) cho user và reset lượt sử dụng ngân hàng câu hỏi
    await supabaseAdmin.from('profiles').update({ plan: order.plan_name, question_bank_usage_count: 0 }).eq('id', order.user_id);
    
    // 3. Tạo thông báo cho user
    await supabaseAdmin.from('notifications').insert([
      {
        user_id: order.user_id,
        title: 'Thanh toán thành công 🎉',
        content: `Chúc mừng bạn đã nâng cấp thành công lên gói ${order.plan_name}. Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi!`,
        type: 'system',
        is_read: false
      }
    ]);
    
    return new Response(
      JSON.stringify({ success: true, message: 'Payment processed successfully', order_code: orderCode }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }
})
