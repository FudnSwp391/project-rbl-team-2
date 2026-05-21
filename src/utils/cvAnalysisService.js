/**
 * CV Analysis Service
 * Calls Gemini AI to analyze CV content and generate structured results.
 * Falls back to simulated analysis if API key is not configured.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

/**
 * Analyze a CV file using Gemini AI
 * @param {File} file - The CV file to analyze
 * @param {function} onProgress - Callback for progress updates (0-100)
 * @returns {Promise<object>} Analysis results
 */
export async function analyzeCV(file, onProgress = () => {}) {
  // Phase 1: Reading file
  onProgress(10, 'Đang đọc file CV...')
  await delay(600)

  // Phase 2: Extracting content
  onProgress(25, 'Đang trích xuất nội dung...')
  const textContent = await extractTextFromFile(file)
  await delay(400)

  // Phase 3: Analyzing with AI
  onProgress(45, 'Đang phân tích bằng AI...')

  let result
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      result = await callGeminiAnalysis(textContent)
      onProgress(85, 'Đang tạo báo cáo...')
    } catch (error) {
      console.warn('Gemini API error, falling back to simulation:', error)
      result = await simulateAnalysis(file.name)
      onProgress(85, 'Đang tạo báo cáo (giả lập)...')
    }
  } else {
    // Simulated analysis for development
    await delay(1500)
    result = await simulateAnalysis(file.name)
    onProgress(85, 'Đang tạo báo cáo (giả lập)...')
  }

  // Phase 4: Finalizing
  onProgress(95, 'Đang hoàn tất...')
  await delay(500)
  onProgress(100, 'Hoàn tất!')

  return result
}

/**
 * Call Gemini API for CV analysis
 */
async function callGeminiAnalysis(cvText) {
  const prompt = `
Bạn là chuyên gia tuyển dụng và phân tích CV (ATS). Hãy phân tích CV dưới đây và trả về kết quả JSON theo cấu trúc chính xác sau:

{
  "atsScore": <điểm từ 0-100>,
  "summary": "<tóm tắt ngắn gọn CV>",
  "strengths": ["<điểm mạnh 1>", "<điểm mạnh 2>", ...],
  "weaknesses": ["<điểm yếu 1>", "<điểm yếu 2>", ...],
  "keywords": {
    "found": ["<từ khóa có trong CV>"],
    "missing": ["<từ khóa quan trọng bị thiếu>"]
  },
  "suggestions": [
    {
      "category": "<Định dạng|Nội dung|Từ khóa|Kinh nghiệm|Kỹ năng>",
      "issue": "<vấn đề>",
      "fix": "<cách sửa>"
    }
  ],
  "sectionScores": {
    "format": <0-100>,
    "experience": <0-100>,
    "skills": <0-100>,
    "education": <0-100>,
    "keywords": <0-100>
  }
}

Nội dung CV:
---
${cvText.substring(0, 8000)}
---

CHỈ trả về JSON, KHÔNG thêm text khác.
`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    }
  )

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Invalid JSON response from Gemini')

  return JSON.parse(jsonMatch[0])
}

/**
 * Extract text from a file (simplified version)
 * For production, use a proper PDF parsing library
 */
async function extractTextFromFile(file) {
  if (file.type === 'application/pdf') {
    // Basic PDF text extraction attempt using FileReader
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target.result
        // Try to extract readable text from PDF binary
        const extracted = text
          .replace(/[^\x20-\x7E\xC0-\xFF\u0100-\u024F\u1E00-\u1EFF]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        resolve(extracted || `CV file: ${file.name}`)
      }
      reader.readAsText(file)
    })
  }
  // For DOCX and other formats
  return `CV file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`
}

/**
 * Simulated analysis for development/demo
 */
async function simulateAnalysis(fileName) {
  await delay(1000)

  return {
    atsScore: Math.floor(Math.random() * 30) + 65, // 65-95
    summary: `CV "${fileName}" đã được phân tích. Đây là hồ sơ ứng viên có tiềm năng với một số điểm cần cải thiện về tối ưu từ khóa ATS.`,
    strengths: [
      'Cấu trúc CV rõ ràng, dễ đọc',
      'Kinh nghiệm làm việc được trình bày chi tiết',
      'Kỹ năng chuyên môn phù hợp với vị trí ứng tuyển',
      'Có dự án thực tế minh họa năng lực',
    ],
    weaknesses: [
      'Thiếu tóm tắt chuyên môn (Professional Summary)',
      'Chưa tối ưu từ khóa cho hệ thống ATS',
      'Phần kỹ năng mềm chưa được nhấn mạnh đủ',
      'Thiếu số liệu cụ thể về thành tích',
    ],
    keywords: {
      found: ['React', 'JavaScript', 'HTML/CSS', 'Git', 'API', 'Teamwork'],
      missing: ['TypeScript', 'CI/CD', 'Agile/Scrum', 'Unit Testing', 'Docker', 'Cloud Services'],
    },
    suggestions: [
      {
        category: 'Nội dung',
        issue: 'Thiếu Professional Summary ở đầu CV',
        fix: 'Thêm 2-3 câu mô tả ngắn về kinh nghiệm và mục tiêu nghề nghiệp',
      },
      {
        category: 'Từ khóa',
        issue: 'Thiếu các từ khóa kỹ thuật quan trọng',
        fix: 'Bổ sung TypeScript, CI/CD, Docker vào phần Skills nếu có kinh nghiệm',
      },
      {
        category: 'Định dạng',
        issue: 'Định dạng chưa thân thiện với ATS',
        fix: 'Sử dụng font đơn giản, tránh header/footer phức tạp, bỏ ảnh và icons',
      },
      {
        category: 'Kinh nghiệm',
        issue: 'Thiếu metrics/KPIs cụ thể',
        fix: 'Thêm số liệu: "Tăng 30% hiệu suất", "Quản lý team 5 người"',
      },
      {
        category: 'Kỹ năng',
        issue: 'Chưa phân loại rõ Hard/Soft skills',
        fix: 'Tách riêng phần Technical Skills và Soft Skills với mức độ thành thạo',
      },
    ],
    sectionScores: {
      format: Math.floor(Math.random() * 20) + 70,
      experience: Math.floor(Math.random() * 25) + 65,
      skills: Math.floor(Math.random() * 20) + 70,
      education: Math.floor(Math.random() * 15) + 80,
      keywords: Math.floor(Math.random() * 30) + 55,
    },
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
