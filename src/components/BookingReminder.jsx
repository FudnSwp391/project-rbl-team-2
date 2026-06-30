import React, { useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../utils/AuthContext';
import toast from 'react-hot-toast';

const BookingReminder = () => {
  const { user } = useAuth();
  const timeoutsRef = useRef({}); // Lưu trữ các ID của setTimeout để dọn dẹp

  useEffect(() => {
    if (!user) return;

    let isSubscribed = true;

    const setupReminders = async () => {
      try {
        // Lấy lịch hẹn accepted của user (có thể là candidate hoặc mentor)
        const { data: bookings, error: bookingsError } = await supabase
          .from('mentor_bookings')
          .select('*')
          .eq('status', 'accepted')
          .or(`candidate_id.eq.${user.id},mentor_id.eq.${user.id}`);

        if (bookingsError || !bookings || bookings.length === 0) return;

        // Lọc các lịch hẹn diễn ra hôm nay hoặc tương lai gần
        const now = new Date();
        const upcomingBookings = [];

        for (const booking of bookings) {
          if (!booking.booking_date || !booking.booking_time) continue;

          // Parse giờ bắt đầu (VD: "16:00 - 17:00" -> "16:00")
          const startTimeStr = booking.booking_time.split(' - ')[0];
          const [hours, minutes] = startTimeStr.split(':');
          
          const bookingDate = new Date(booking.booking_date);
          bookingDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

          // Tính toán thời gian (ms)
          const timeUntilBooking = bookingDate.getTime() - now.getTime();
          
          // Chỉ xét những lịch hẹn chưa trễ quá giờ bắt đầu
          if (timeUntilBooking >= -30 * 60 * 1000) { // Vẫn gửi nếu lỡ lố vài phút, nhưng không quá 30p
            upcomingBookings.push({ ...booking, bookingDate, timeUntilBooking });
          }
        }

        if (upcomingBookings.length === 0) return;

        // Kiểm tra xem đã gửi thông báo nhắc nhở nào cho user này chưa
        const { data: sentNotifs } = await supabase
          .from('notifications')
          .select('content, created_at')
          .eq('user_id', user.id)
          .like('title', 'Sắp tới lịch hẹn!');

        const sentContents = sentNotifs ? sentNotifs.map(n => n.content) : [];

        upcomingBookings.forEach(booking => {
          const content = `Bạn đang có 1 lịch hẹn vào lúc ${booking.booking_time} ngày ${booking.booking_date}`;
          
          // Nếu đã gửi thông báo này rồi thì bỏ qua
          if (sentContents.includes(content)) return;

          const timeUntilReminder = booking.timeUntilBooking - 30 * 60 * 1000; // Trước 30 phút

          const sendNotification = async () => {
            if (!isSubscribed) return;
            // Gửi vào DB
            await supabase.from('notifications').insert([{
              user_id: user.id,
              title: 'Sắp tới lịch hẹn!',
              content: content,
              type: 'info',
              action_link: user.id === booking.mentor_id ? '/mentor/schedule' : '/my-bookings'
            }]);
            
            toast(`Sắp tới lịch hẹn lúc ${booking.booking_time}!`, {
              icon: '⏰',
            });
          };

          if (timeUntilReminder <= 0) {
            // Đã qua mốc "trước 30 phút", nhưng vẫn chưa tới giờ hẹn (hoặc vừa mới bắt đầu) -> Bắn ngay bù lại
            sendNotification();
          } else if (timeUntilReminder < 2147483647) { // Max setTimeout delay
            // Nếu chưa tới mốc "trước 30 phút", đặt báo thức
            const timeoutId = setTimeout(sendNotification, timeUntilReminder);
            timeoutsRef.current[booking.id] = timeoutId;
          }
        });

      } catch (err) {
        console.error('Lỗi khi thiết lập nhắc nhở lịch hẹn:', err);
      }
    };

    setupReminders();

    // Dọn dẹp các setTimeout khi component unmount
    return () => {
      isSubscribed = false;
      Object.values(timeoutsRef.current).forEach(id => clearTimeout(id));
    };
  }, [user]);

  return null; // Đây là component chạy ngầm, không render UI
};

export default BookingReminder;
