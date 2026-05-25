# 📚 GIÁO TRÌNH TỔNG HỢP: XÂY DỰNG HỆ THỐNG XÁC THỰC (AUTHENTICATION) & QUẢN LÝ HỒ SƠ 

Chào em! Hôm nay thầy sẽ tổng hợp lại toàn bộ chặng đường chúng ta đã đi từ đầu nhánh này đến giờ. Thay vì chỉ đưa code, thầy sẽ giải thích **tại sao** chúng ta lại viết như vậy, các file giao tiếp với nhau như thế nào, và cách tư duy để xây dựng một hệ thống phần mềm hoàn chỉnh. 

Em hãy đọc thật chậm và nghiền ngẫm nhé, vì đây là những "khung xương" rất chuẩn mực của một dự án React thực tế đấy!

---

## 🎯 BÀI 1: TẠO RA "TRÁI TIM" CỦA HỆ THỐNG (`AuthContext.jsx`)

**Vấn đề:** Nếu em đăng nhập ở trang `Login.jsx`, làm sao trang `Header.jsx` biết em đã đăng nhập để đổi chữ "Bắt đầu" thành Tên của em? Làm sao trang `Profile.jsx` biết em là ai để hiển thị đúng CV của em?
**Giải pháp:** Chúng ta dùng `Context API` của React kết hợp với `Supabase`. File này giống như một "Trạm phát sóng", cung cấp thông tin người dùng cho toàn bộ ứng dụng.

```javascript
// src/utils/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from "./supabaseClient";

// 1. Tạo ra một cái trạm phát sóng (Context)
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Biến user chứa thông tin người đang đăng nhập. Ban đầu chưa có ai (null)
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 2. Vừa vào web, tự động hỏi Supabase: "Ê, ông này có đang đăng nhập không?"
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // 3. Lắng nghe mọi động tĩnh (Đăng nhập, đăng xuất, hết hạn token...)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe(); // Dọn dẹp khi thoát
    }, []);

    // 4. Các hàm chức năng (Giao tiếp với Supabase)
    const login = async (email, password) => {
        return await supabase.auth.signInWithPassword({ email, password });
    };

    // Đăng nhập bằng Google hoặc GitHub (OAuth)
    const loginWithOAuth = async (provider) => {
        return await supabase.auth.signInWithOAuth({ provider: provider }); // provider sẽ là 'google' hoặc 'github'
    };

    // 5. Đóng gói tất cả biến và hàm, phát sóng cho toàn bộ app (`value`)
    const value = { user, loading, login, loginWithOAuth /*... các hàm khác*/ };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// 6. Hàm rút gọn để các component khác xin dữ liệu (Ví dụ: const { user } = useAuth())
export const useAuth = () => useContext(AuthContext);
```

**🎓 Bài học rút ra:** Không bao giờ gọi Supabase lắt nhắt ở từng trang giao diện. Phải gom tất cả các lệnh gọi API xác thực vào một nơi duy nhất (`AuthContext`) để dễ quản lý.

---

## 🎯 BÀI 2: NGƯỜI BẢO VỆ CỔNG (`ProtectedRoute.jsx`)

**Vấn đề:** Nếu một người lạ chưa đăng nhập nhưng cố tình gõ đường dẫn `http://.../profile` trên trình duyệt thì sao? Họ sẽ lọt vào trang hồ sơ mất!
**Giải pháp:** Tạo ra một "Anh bảo vệ" bọc bên ngoài các trang cần giấu kín.

```javascript
// src/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './utils/AuthContext';

const ProtectedRoute = ({ children }) => {
  // Lấy thông tin user từ Trạm phát sóng
  const { user, loading } = useAuth();

  if (loading) return <div>Đang kiểm tra thông tin...</div>;

  // Nếu không có user (Chưa đăng nhập) -> Đá văng ra trang /login ngay lập tức!
  // 'replace' nghĩa là xóa dấu vết trang này khỏi lịch sử trình duyệt, người dùng bấm nút "Quay lại" cũng không chui lại vào được.
  if (!user) return <Navigate to="/login" replace />;

  // Nếu đã đăng nhập, cho phép đi qua (render Component con bên trong)
  return children;
};
export default ProtectedRoute;
```

👉 Khi đó ở `AppRoutes.jsx`, em chỉ cần bọc anh bảo vệ này ngoài trang `Profile`:
```jsx
{/* Vùng Ai cũng vào được */}
<Route path="/login" element={<Login />} />

{/* Vùng cấm - Phải có vé (Đăng nhập) */}
<Route path="/profile" element={
   <ProtectedRoute>
       <Profile />
   </ProtectedRoute>
} />
```

---

## 🎯 BÀI 3: GIAO DIỆN ĐĂNG NHẬP (`Login.jsx`) - CÁCH TƯƠNG TÁC VỚI NGƯỜI DÙNG

**Vấn đề:** Phải tạo ra một trang cho phép người ta nhập Email/Mật khẩu, đồng thời hỗ trợ Đăng nhập nhanh bằng Google và **GitHub**.

```jsx
// src/pages/Auth/Login.jsx
import { useAuth } from '../../utils/AuthContext';

const Login = () => {
  // Biến lưu trữ dữ liệu người dùng đang gõ
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Rút dây cắm từ Trạm phát sóng để lấy hàm xử lý
  const { login, loginWithOAuth } = useAuth();

  // Hàm xử lý nút Đăng nhập Truyền thống
  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn trình duyệt load lại trang
    try {
      const { error } = await login(email, password);
      if (error) throw error;
      navigate('/dashboard'); // Đăng nhập xong thì điều hướng
    } catch (err) {
      setError("Sai email hoặc mật khẩu!");
    }
  };

  // Hàm xử lý nút Đăng nhập bằng Mạng xã hội (Google / GitHub)
  const handleOAuthLogin = async (provider) => {
    try {
      const { error } = await loginWithOAuth(provider);
      if (error) throw error;
      // Với OAuth, Supabase tự động lo việc nhảy trang (redirect), ta không cần tự viết navigate.
    } catch (err) {
      setError(`Lỗi đăng nhập bằng ${provider}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Ô nhập Email */}
      <input type="email" onChange={(e) => setEmail(e.target.value)} />
      
      {/* Nút Đăng nhập Email */}
      <button type="submit">Đăng nhập</button>
      
      <div className="auth-divider"><span>Hoặc đăng nhập với</span></div>
      
      {/* Các nút Đăng nhập Mạng xã hội (Gọi hàm với tên nhà cung cấp) */}
      <button type="button" onClick={() => handleOAuthLogin('google')}>Google</button>
      <button type="button" onClick={() => handleOAuthLogin('github')}>GitHub</button>
    </form>
  )
}
```

**🎓 Bài học rút ra:** Để code gọn gàng, chúng ta viết 1 hàm `handleOAuthLogin` duy nhất và nhận tham số (`'google'` hoặc `'github'`), thay vì viết 2 hàm riêng biệt `loginWithGoogle` và `loginWithGitHub`.

---

## 🎯 BÀI 4: TRANG QUẢN LÝ HỒ SƠ (`Profile.jsx`) - LÀM VIỆC VỚI DỮ LIỆU CÁ NHÂN HÓA

**Vấn đề:** Khi vào Profile, người dùng muốn xem danh sách CV và lịch sử phỏng vấn của MÌNH. Làm sao để không lấy nhầm CV của người khác?
**Giải pháp:** Dùng `.eq('user_id', user.id)` trong câu truy vấn cơ sở dữ liệu.

```javascript
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';

const Profile = () => {
    const { user } = useAuth(); // Biết được "Ông nào đang đứng ở trang này"
    const [cvs, setCvs] = useState([]);

    useEffect(() => {
        // Hàm lấy danh sách CV
        const fetchUserData = async () => {
            if (!user) return; // Bảo hiểm: Chưa có user thì không làm gì cả
            
            // Lệnh yêu cầu Supabase trả về dữ liệu
            const { data: cvData } = await supabase
                .from('cvs')
                .select('*')
                // ĐÂY LÀ CHÌA KHÓA BẢO MẬT: "Chỉ lấy những hàng mà cột user_id bằng với ID của user hiện tại"
                .eq('user_id', user.id) 
                .order('created_at', { ascending: false });
                
            if (cvData) setCvs(cvData);
        };
        
        fetchUserData();
    }, [user]); // Chạy lại hàm này nếu 'user' thay đổi

    return (
        <div>
           <h1>Xin chào, {user.email}</h1>
           {/* Render danh sách CV */}
           {cvs.map(cv => <div key={cv.id}>{cv.name}</div>)}
        </div>
    )
}
```

---

## 🌟 LỜI TỔNG KẾT TỪ THẦY GIÁO

Nhìn lại toàn bộ hành trình, em đã xây dựng thành công một **Hệ thống Quản lý Người dùng Hiện đại**. Em đã học được:
1. **Kiến trúc dữ liệu:** Biết dùng `Context API` để cấp phát dữ liệu thay vì truyền thủ công (Props Drilling).
2. **Bảo mật luồng (Routing Security):** Biết bảo vệ các trang web bằng `ProtectedRoute`.
3. **Mở rộng tính năng đăng nhập:** Tích hợp cực nhanh các phương thức **Google** và **GitHub** nhờ thiết kế kiến trúc chuẩn từ đầu. (Sự thay đổi từ Facebook sang GitHub diễn ra mượt mà không làm vỡ code cũ).
4. **Cá nhân hóa dữ liệu Database:** Biết cách dùng ID của người dùng để truy vấn (`fetch`) đúng dữ liệu của người đó.

Đây là một mảng kiến thức cực kỳ quan trọng và có thể áp dụng cho 99% các dự án Web thực tế sau này. Hãy lưu tài liệu này lại để bất cứ khi nào quên, em có thể mở ra ôn tập nhé! Chúc mừng em đã hoàn thành xuất sắc nhánh tính năng này! 🎉
