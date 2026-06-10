// src/utils/validation.test.js

// Hàm mock đơn giản để mô phỏng logic validation thực tế
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const isFPTEmail = (email) => {
  return email.endsWith('@fpt.edu.vn');
};

const isValidPassword = (password) => {
  return password.length >= 8;
};

describe('Authentication Validation Logic', () => {
  describe('Kiểm tra định dạng Email', () => {
    test('Email hợp lệ đúng định dạng chuẩn', () => {
      expect(isValidEmail('test.candidate@gmail.com')).toBe(true);
      expect(isValidEmail('invalid-email-format')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
    });

    test('Xác thực ưu tiên email sinh viên FPT (@fpt.edu.vn)', () => {
      expect(isFPTEmail('nguyenanhminh@fpt.edu.vn')).toBe(true);
      expect(isFPTEmail('minh.fpt@gmail.com')).toBe(false);
    });

    test('Email không được chứa khoảng trắng', () => {
      expect(isValidEmail('minh @fpt.edu.vn')).toBe(false);
      expect(isValidEmail(' minh@fpt.edu.vn')).toBe(false);
    });
  });

  describe('Kiểm tra định dạng Mật khẩu', () => {
    test('Mật khẩu phải có ít nhất 8 ký tự', () => {
      expect(isValidPassword('12345678')).toBe(true);
      expect(isValidPassword('short')).toBe(false);
    });
  });
});
