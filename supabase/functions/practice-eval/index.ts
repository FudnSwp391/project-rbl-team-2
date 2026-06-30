import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req: Request) => {
  // CORS Preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let answerId: string | null = null;
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const body = await req.json()
    answerId = body.answerId;
    
    if (!answerId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Thiếu answerId trong yêu cầu.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Lấy thông tin bài làm hiện tại
    const { data: currentAnswer, error: answerError } = await supabaseAdmin
      .from('practice_answers')
      .select('*')
      .eq('id', answerId)
      .single()

    if (answerError || !currentAnswer) {
      console.error('Lỗi lấy bài làm:', answerError)
      return new Response(
        JSON.stringify({ success: false, error: 'Không tìm thấy câu trả lời với ID đã cung cấp.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cập nhật trạng thái thành 'analyzing'
    await supabaseAdmin
      .from('practice_answers')
      .update({ status: 'analyzing' })
      .eq('id', answerId)

    // 2. Lấy thông tin câu hỏi
    const { data: question, error: questionError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('id', currentAnswer.question_id)
      .single()

    if (questionError || !question) {
      console.error('Lỗi lấy câu hỏi:', questionError)
      // Cập nhật trạng thái bài làm sang 'failed'
      await supabaseAdmin.from('practice_answers').update({ status: 'failed' }).eq('id', answerId)
      return new Response(
        JSON.stringify({ success: false, error: 'Không tìm thấy câu hỏi liên quan.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Lấy câu trả lời gần nhất trước đó của người dùng đối với câu hỏi này (nếu có)
    const { data: previousAnswers, error: prevError } = await supabaseAdmin
      .from('practice_answers')
      .select('answer_text, created_at')
      .eq('user_id', currentAnswer.user_id)
      .eq('question_id', currentAnswer.question_id)
      .neq('id', answerId) // Loại trừ chính bài làm hiện tại
      .order('created_at', { ascending: false })
      .limit(1)

    const previousAnswerText = (prevError || !previousAnswers || previousAnswers.length === 0) 
      ? null 
      : previousAnswers[0].answer_text

    // 4. Lấy API Key từ Environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const groqApiKey = Deno.env.get('GROQ_API_KEY')

    if (!geminiApiKey && !groqApiKey) {
      console.error('Lỗi: Chưa cấu hình GEMINI_API_KEY hoặc GROQ_API_KEY trong Supabase Secrets.')
      await supabaseAdmin.from('practice_answers').update({ status: 'failed' }).eq('id', answerId)
      return new Response(
        JSON.stringify({ success: false, error: 'Hệ thống chưa thiết lập API Key của AI. Vui lòng liên hệ quản trị viên.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Chuẩn bị prompt và chỉ thị cho AI
    const systemInstruction = `Bạn là chuyên gia cố vấn tuyển dụng và phỏng vấn IT cấp cao. Hãy phân tích câu trả lời của ứng viên cho câu hỏi được đưa ra và trả về một đối tượng JSON duy nhất chứa kết quả phân tích.
Cơ cấu JSON cần trả về chính xác như sau:
{
  "score": 80,
  "general_feedback": "Nhận xét tổng quát bằng tiếng Việt về điểm mạnh và hạn chế...",
  "errors": [
    { "type": "Tên loại lỗi (ví dụ: Kỹ thuật / Logic / Cấu trúc)", "detail": "Mô tả chi tiết lỗi và cách sửa..." }
  ],
  "sample_answer": "Câu trả lời mẫu tham khảo tốt nhất bằng tiếng Việt dựa trên bối cảnh câu hỏi...",
  "progress_analysis": "So sánh và chỉ ra sự tiến bộ cụ thể so với câu trả lời trước đó hoặc nhận xét khích lệ nếu đây là lần làm bài đầu tiên của họ."
}`;

    const prompt = `
Câu hỏi: "${question.content}"
Loại câu hỏi: ${question.question_type === 'behavioral' ? 'Tình huống (Behavioral - STAR)' : 'Kỹ thuật (Technical)'}

Câu trả lời HIỆN TẠI của ứng viên:
"${currentAnswer.answer_text}"

${previousAnswerText ? `Câu trả lời TRƯỚC ĐÓ của ứng viên (để so sánh tiến bộ):
"${previousAnswerText}"` : 'Đây là lần đầu tiên ứng viên trả lời câu hỏi này.'}

YÊU CẦU ĐÁNH GIÁ:
1. Chấm điểm câu trả lời hiện tại trên thang điểm 100.
2. Đưa ra nhận xét tổng quát (general_feedback) về điểm mạnh, điểm yếu.
3. Phân tích các lỗi sai cụ thể (errors) về mặt kỹ thuật, logic hoặc cấu trúc trả lời.
4. Cung cấp một câu trả lời mẫu tối ưu (sample_answer) bằng tiếng Việt phù hợp nhất.
5. Nếu có câu trả lời trước đó, hãy so sánh chi tiết và chỉ ra những tiến bộ (progress_analysis) hoặc những điểm vẫn chưa được cải thiện. Nếu không có câu trả lời trước đó, ghi nhận xét động viên cho lần thử đầu tiên.

Hãy trả về duy nhất một đối tượng JSON đúng cấu trúc ở trên.`;

    let aiResultText = ''
    let aiUsed = ''

    // Ưu tiên chạy Gemini
    if (geminiApiKey) {
      try {
        console.log('Đang gọi Gemini để đánh giá bài làm...')
        aiResultText = await callGemini(geminiApiKey, prompt, systemInstruction)
        aiUsed = 'gemini'
      } catch (geminiError: any) {
        console.warn('Gemini gặp lỗi, chuyển sang Groq:', geminiError.message)
      }
    }

    // Fallback sang Groq nếu Gemini lỗi hoặc không có key
    if (!aiResultText && groqApiKey) {
      try {
        console.log('Đang gọi Groq (Llama) để đánh giá bài làm...')
        aiResultText = await callGroq(groqApiKey, prompt, systemInstruction)
        aiUsed = 'groq'
      } catch (groqError: any) {
        console.error('Groq cũng gặp lỗi:', groqError.message)
      }
    }

    if (!aiResultText) {
      throw new Error('Cả hai kênh AI (Gemini & Groq) đều không phản hồi hoặc gặp lỗi kết nối.')
    }

    // 6. Parse JSON từ AI
    let parsedFeedback;
    try {
      // Dọn dẹp markdown code block nếu có
      let cleanedText = aiResultText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      parsedFeedback = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('Lỗi phân tích JSON từ AI:', parseError, '\nNội dung AI trả về:', aiResultText)
      throw new Error('Nội dung trả về từ AI không đúng định dạng JSON yêu cầu.')
    }

    // 7. Cập nhật bài làm với nhận xét AI và đổi trạng thái thành 'completed'
    const { data: updatedRecord, error: updateError } = await supabaseAdmin
      .from('practice_answers')
      .update({
        status: 'completed',
        ai_feedback: parsedFeedback
      })
      .eq('id', answerId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    console.log(`Đánh giá bài làm ${answerId} thành công qua ${aiUsed}.`)
    return new Response(
      JSON.stringify({ success: true, data: updatedRecord }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Lỗi xử lý Edge Function:', error.message)
    try {
      if (answerId) {
        await supabaseAdmin
          .from('practice_answers')
          .update({ 
            status: 'failed',
            ai_feedback: { error: error.message, details: error.stack }
          })
          .eq('id', answerId)
      }
    } catch (dbErr: any) {
      console.error('Không thể ghi nhận lỗi vào DB:', dbErr.message)
    }
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper gọi API Gemini
async function callGemini(apiKey: string, prompt: string, systemInstruction: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Helper gọi API Groq
async function callGroq(apiKey: string, prompt: string, systemInstruction: string): Promise<string> {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
