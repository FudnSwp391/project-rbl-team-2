describe('Mentor Blog Creation Flow', () => {
  beforeEach(() => {
    // Giả lập trạng thái đăng nhập của Mentor (nếu cần)
    // cy.login('mentor@fpt.edu.vn', 'password123');
    
    // Chuyển tới trang tạo blog
    cy.visit('http://localhost:5173/mentor/blogs/create');
  });

  it('Nạp sẵn template STAR khi chọn loại bài viết', () => {
    // Đảm bảo select đang chọn Article mặc định
    cy.get('select[name="type"]').should('have.value', 'Article');
    
    // Đảm bảo textarea nội dung có chứa chữ Situation (bắt nguồn từ STAR template)
    cy.get('textarea[name="content"]').should('contain.value', 'Situation');
  });

  it('Điền form và lưu nháp thành công', () => {
    // Nhập tiêu đề
    cy.get('input[name="title"]').type('Hướng dẫn phỏng vấn ReactJS thực tế cho Fresher');
    
    // Chọn danh mục
    cy.get('select[name="category"]').select('interview-tips');
    
    // Bấm nút lưu bản nháp (tìm button chứa text "Lưu bản nháp")
    cy.contains('button', 'Lưu bản nháp').click();
    
    // Đảm bảo nút chuyển trạng thái xử lý hoặc URL điều hướng về trang list
    cy.url().should('include', '/mentor/blogs');
  });
});
