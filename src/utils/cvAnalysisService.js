/**
 * CV Analysis Service — Strict & Thorough
 * Uses pdf.js for PDF and mammoth for DOCX text extraction.
 * Strict Gemini prompt that catches joke CVs, blank CVs, and scores honestly.
 */

import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// Configure pdf.js worker — use the bundled worker from node_modules
// This avoids CDN version mismatch issues
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

/**
 * Analyze a CV file using Groq AI (Llama 3.3) or Gemini AI
 * @param {File} file - The CV file to analyze
 * @param {function} onProgress - Callback for progress updates (0-100)
 * @returns {Promise<object>} Analysis results
 */
export async function analyzeCV(file, onProgress = () => {}) {
  // Phase 1: Reading file
  onProgress(10, 'Đang đọc file CV...')
  await delay(400)

  // Phase 2: Extracting content
  onProgress(25, 'Đang trích xuất nội dung...')
  const extraction = await extractTextFromFile(file)
  await delay(300)

  // Phase 3: Pre-validate content
  onProgress(35, 'Đang kiểm tra nội dung...')
  const validation = validateCVContent(extraction.text)

  if (validation.isEmpty) {
    onProgress(100, 'Hoàn tất!')
    return createEmptyCVResult(file.name, validation.reason)
  }

  // Phase 4: Analyzing with AI
  onProgress(45, 'Đang phân tích bằng AI...')

  let result
  if (GROQ_API_KEY && GROQ_API_KEY !== 'your_groq_api_key_here') {
    try {
      result = await callGroqAnalysis(extraction.text, file.name)
      onProgress(85, 'Đang tạo báo cáo bằng Groq Llama 3.3...')
    } catch (error) {
      console.warn('Groq API error, trying Gemini fallback:', error)
      if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
        try {
          result = await callGeminiAnalysis(extraction.text, file.name)
          onProgress(85, 'Đang tạo báo cáo bằng Gemini...')
        } catch (geminiError) {
          console.warn('Gemini fallback failed, falling back to local analysis:', geminiError)
          result = localAnalysis(extraction.text, file.name)
          onProgress(85, 'Đang tạo báo cáo (phân tích cục bộ)...')
        }
      } else {
        result = localAnalysis(extraction.text, file.name)
        onProgress(85, 'Đang tạo báo cáo (phân tích cục bộ)...')
      }
    }
  } else if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      result = await callGeminiAnalysis(extraction.text, file.name)
      onProgress(85, 'Đang tạo báo cáo bằng Gemini...')
    } catch (error) {
      console.warn('Gemini API error, falling back to local analysis:', error)
      result = localAnalysis(extraction.text, file.name)
      onProgress(85, 'Đang tạo báo cáo (phân tích cục bộ)...')
    }
  } else {
    await delay(800)
    result = localAnalysis(extraction.text, file.name)
    onProgress(85, 'Đang tạo báo cáo (phân tích cục bộ)...')
  }

  // Phase 5: Finalizing
  onProgress(95, 'Đang hoàn tất...')
  await delay(400)
  onProgress(100, 'Hoàn tất!')

  return result
}

/**
 * Extract HTML preview from a DOCX file using mammoth
 * @param {File} file
 * @returns {Promise<string>} HTML string
 */
export async function extractDocxHtml(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.convertToHtml({ arrayBuffer })
    return result.value || ''
  } catch (err) {
    console.warn('DOCX HTML extraction failed:', err)
    return ''
  }
}

// ─────────────────────────────────────────────
//  CONTENT VALIDATION — catches blank/junk CVs
// ─────────────────────────────────────────────

function validateCVContent(text) {
  if (!text) {
    return { isEmpty: true, reason: 'CV trống hoặc không thể đọc được nội dung.' }
  }

  // Strip all whitespace for length check
  const stripped = text.replace(/\s+/g, ' ').trim()

  if (stripped.length < 20) {
    return { isEmpty: true, reason: 'CV trống hoặc không thể đọc được nội dung.' }
  }

  // Check if it's just the filename fallback (extraction totally failed)
  if (/^CV file:/.test(stripped) && stripped.length < 120) {
    return { isEmpty: true, reason: 'Không thể trích xuất nội dung từ file. Vui lòng thử file khác.' }
  }

  // Check for truly meaningless content — only whitespace/symbols, no real words
  // A "word" = 2+ consecutive letters (Latin or Vietnamese)
  const wordPattern = /[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]{2,}/g
  const words = stripped.match(wordPattern) || []

  if (words.length < 5) {
    return { isEmpty: true, reason: 'CV không chứa đủ nội dung văn bản để phân tích.' }
  }

  return { isEmpty: false }
}

function createEmptyCVResult(fileName, reason) {
  return {
    atsScore: 0,
    sectionScores: { jdRelevance: 0, experience: 0, skills: 0, achievements: 0, presentation: 0 },
    detailedReport: `# 1. Executive Summary\n\n⚠️ KHÔNG THỂ PHÂN TÍCH: ${reason}\n\nFile "${fileName}" không chứa nội dung CV hợp lệ. Vui lòng tải lên CV có nội dung thực tế bao gồm thông tin cá nhân, học vấn, kinh nghiệm, và kỹ năng.\n\n# 2. Phân tích độ tương thích ATS\n\nĐiểm ATS: 0/100. CV trống hoặc định dạng không thể trích xuất text.`
  }
}

// ─────────────────────────────────────────────
//  TEXT EXTRACTION — PDF (pdf.js) + DOCX (mammoth)
// ─────────────────────────────────────────────

export async function extractTextFromFile(file) {
  // --- PDF ---
  if (file.type === 'application/pdf') {
    return await extractPdfText(file)
  }

  // --- DOCX ---
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx')
  ) {
    return await extractDocxText(file)
  }

  // --- DOC (legacy) ---
  if (file.type === 'application/msword' || file.name.endsWith('.doc')) {
    return {
      text: `CV file: ${file.name} (Định dạng .doc cũ không được hỗ trợ. Vui lòng chuyển sang .docx hoặc .pdf)`,
      html: '',
    }
  }

  return { text: `CV file: ${file.name}`, html: '' }
}

async function extractPdfText(file) {
  function joinLineItems(items) {
    if (items.length === 0) return ''
    let result = items[0].str
    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1]
      const curr = items[i]
      
      // Estimate character width for the previous item
      const prevCharWidth = prev.width / (prev.str.length || 1)
      
      // Gap between current item's start and previous item's end
      const gap = curr.transform[4] - (prev.transform[4] + prev.width)
      
      // If the gap is larger than 25% of character width or 3 PDF units, add a space
      if (gap > Math.max(3, prevCharWidth * 0.25)) {
        result += ' ' + curr.str
      } else {
        result += curr.str
      }
    }
    return result
  }

  try {
    const arrayBuffer = await file.arrayBuffer()

    // Try with worker first, fall back to no-worker
    let pdf
    try {
      pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    } catch (workerErr) {
      console.warn('pdf.js worker failed, retrying without worker:', workerErr)
      pdfjsLib.GlobalWorkerOptions.workerSrc = ''
      pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        disableWorker: true,
      }).promise
    }

    const pages = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()

      // Build text respecting position — group items by Y position for line breaks
      const items = content.items.filter((item) => item.str && item.str.trim())
      if (items.length === 0) {
        pages.push('')
        continue
      }

      // Sort by Y (descending = top to bottom), then X (left to right)
      items.sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5]
        if (Math.abs(yDiff) > 5) return yDiff
        return a.transform[4] - b.transform[4]
      })

      // Group into lines (items with similar Y position)
      const lines = []
      let currentLine = [items[0]]
      for (let j = 1; j < items.length; j++) {
        const prevY = currentLine[0].transform[5]
        const currY = items[j].transform[5]
        if (Math.abs(prevY - currY) < 5) {
          currentLine.push(items[j])
        } else {
          lines.push(joinLineItems(currentLine))
          currentLine = [items[j]]
        }
      }
      lines.push(joinLineItems(currentLine))

      pages.push(lines.join('\n'))
    }

    const fullText = pages.join('\n\n').trim()
    console.log('[CV Analysis] PDF extracted text length:', fullText.length)
    console.log('[CV Analysis] PDF extracted preview:', fullText.substring(0, 300))

    return {
      text: fullText || `CV file: ${file.name} (PDF không chứa text — có thể là ảnh scan)`,
      html: '',
    }
  } catch (err) {
    console.error('PDF extraction failed:', err)
    return {
      text: `CV file: ${file.name} (PDF extraction failed: ${err.message})`,
      html: '',
    }
  }
}

async function extractDocxText(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()

    // Use mammoth for proper DOCX text extraction
    const textResult = await mammoth.extractRawText({ arrayBuffer })
    const text = (textResult.value || '').trim()

    // Also get HTML for preview
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer })
    const html = (htmlResult.value || '').trim()

    console.log('[CV Analysis] DOCX extracted text length:', text.length)
    console.log('[CV Analysis] DOCX extracted preview:', text.substring(0, 300))

    return {
      text: text || `CV file: ${file.name} (DOCX trống, không có nội dung)`,
      html,
    }
  } catch (err) {
    console.error('DOCX extraction failed:', err)
    return {
      text: `CV file: ${file.name} (DOCX extraction failed: ${err.message})`,
      html: '',
    }
  }
}

// ─────────────────────────────────────────────
//  GEMINI AI ANALYSIS — IT CV Professional Evaluation
//  5 Criteria: JD Relevance, Experience, Skills, Achievements, Presentation
// ─────────────────────────────────────────────

function getAnalysisSystemPrompt() {
  return `CRITICAL TRUTH & FACTUALITY RULE (MUST OBEY):
You are an elite, brutally honest Senior Technical Recruiter and ATS scanner. You MUST evaluate the candidate based EXCLUSIVELY on the actual, literal text provided in their CV.
- NEVER invent, assume, or hallucinate any company (e.g. DO NOT invent "FPT Software" experience), project (e.g. DO NOT invent a "Smart Home System" or "chatbot"), or technology (e.g. DO NOT invent "Python", "React Hooks", "Redux") that is NOT explicitly written in their CV text!
- You must review the candidate's actual projects (e.g. "E-commerce Website using Java Servlet/JSP/JDBC/SQL Server", "Line Following Robot using Arduino/C++", and "LUMIÈRE - Cinema Streaming Platform using HTML5/CSS3/Vanilla JS/RESTful API") and actual work history.
- If they have no professional work experience, evaluate them honestly as a student/fresher based on their academic and personal projects. Do NOT invent corporate jobs.
- Strictly critique the real details. Hallucinating false information will result in immediate failure. Strictly stick to the absolute truth of the provided CV text.

You must think like:
- FAANG recruiter
- Senior HR manager
- Tech lead
- ATS screening system
- Engineering manager

You are STRICT. You DO NOT give fake compliments. You evaluate based on real-world hiring standards from 2025+.

## THE 5 CORE EVALUATION CRITERIA (For sectionScores):
1. jdRelevance (20%): IT keywords, career goals alignment.
2. experience (30%): Project size, role, tech stack, real companies, GitHub/demo links.
3. skills (20%): Categorized skills, certs (AWS, GCP, Cisco), evidence of proficiency.
4. achievements (20%): STAR model, specific metrics (response time, users, coverage).
5. presentation (10%): 1-2 pages, professional tone, ATS-friendly layout.

You are a strict JSON generator. Your output must be a single, valid JSON object containing the CV analysis. DO NOT wrap the output in markdown code blocks (like \`\`\`json ... \`\`\`) under any circumstances. Start directly with the opening curly brace { and end with the closing curly brace }.

The JSON structure must exactly match:
{
  "isNonIT": boolean,
  "atsScore": number,
  "sectionScores": {
    "jdRelevance": number,
    "experience": number,
    "skills": number,
    "achievements": number,
    "presentation": number
  },
  "detailedReport": "string (The COMPLETE 12-section markdown report in Vietnamese. Use markdown headers # and ##, bold **text**, lists -, etc. Follow the EXACT structure below. MUST BE A VALID JSON ESCAPED STRING.)"
}

(Note on isNonIT: Only set isNonIT to true if the CV is 100% unrelated to software, engineering, programming, or tech, such as nursing or marketing with absolutely no coding/technical skills. For IT students, Software Engineering candidates, or anyone with technical/coding skills, isNonIT must be false.)

CRITICAL WARNING: In the "detailedReport" field, you MUST write actual, deep, rich, custom, and highly-detailed evaluations for this specific candidate in Vietnamese. DO NOT copy-paste any description bullets or placeholder sentences. You must write 2-3 custom, deep, and highly-detailed analytical paragraphs for each of the 12 sections below, replacing the instructional guides entirely with actual recruiter comments.
DO NOT use placeholder scores like 1 or 0 for the ratings. Evaluate the candidate's CV honestly, strictly, and realistically, providing real scores between 0 and 100.

## DETAILED REPORT STRUCTURE (Must be exactly these 12 sections in Vietnamese):

# 1. Executive Summary
(Viết nhận định chi tiết và sắc sảo về thế mạnh, điểm yếu lớn nhất của ứng viên. Đánh giá rõ ràng cấp độ năng lực hiện tại: Beginner, Junior, Mid-level, hay Senior-ready. Tuyệt đối không viết chung chung, không copy câu lệnh.)

# 2. Phân tích độ tương thích ATS
(Phân tích chi tiết khả năng đọc hiểu của hệ thống ATS đối với bố cục CV này, đánh giá mật độ từ khóa chuyên ngành IT, phát hiện lỗi cấu trúc file và giải thích rõ ràng cơ sở chấm điểm ATS của bạn.)

# 3. Đánh giá bố cục và thiết kế
(Đánh giá chi tiết về mặt thị giác: cấu trúc phân bổ thông tin, khoảng trắng, tính trực quan, mức độ chuyên nghiệp của font chữ/màu sắc, và đưa ra các gợi ý chỉnh sửa cụ thể để đạt chuẩn chuyên nghiệp.)

# 4. Phân tích Kỹ năng Chuyên môn
(Phân tích sâu độ rộng và độ sâu của tập hợp kỹ năng cứng. Đánh giá xem tech stack của ứng viên có bắt kịp xu hướng thị trường năm 2025+ hay không. Cảnh báo nếu có hiện tượng "nhồi nhét từ khóa" (buzzword stuffing) và liệt kê 3 kỹ năng ứng viên cần bổ sung gấp.)

# 5. Phân tích Dự án Thực tế (CỰC KỲ QUAN TRỌNG)
(Mổ xẻ từng dự án trong CV: phân tích độ phức tạp thuật toán, kiến trúc hệ thống, vai trò thực tế và tech stack sử dụng. Phân loại rõ ràng dự án của ứng viên là đồ án sinh viên/CRUD cơ bản sơ sài hay là dự án chuẩn production thực tế. Chỉ ra điểm yếu trong cách thiết kế dự án.)

# 6. Phân tích Kinh nghiệm làm việc
(Đánh giá chất lượng công việc thông qua các mô tả. Phân tích mức độ đóng góp, khả năng giải quyết bài toán khó và kỹ năng teamwork. Chọn ra các gạch đầu dòng yếu, thiếu sức nặng trong CV và viết lại chúng thành các câu mô tả hành động chuyên nghiệp, đầy trọng lượng.)

# 7. Đánh giá Thành tích & Mức độ ảnh hưởng (STAR)
(Kiểm tra nghiêm ngặt xem các thành tích có được viết theo mô hình STAR và có số liệu đo lường cụ thể (ví dụ: % tối ưu, số lượng user, response time) hay không. Nếu thiếu số liệu, hãy phê bình nghiêm khắc và hướng dẫn cách bổ sung số liệu giả định phù hợp.)

# 8. Cờ Đỏ & Điểm Yếu (Red Flags)
(Chỉ ra các điểm yếu chí mạng có thể khiến CV bị loại ngay từ vòng gửi xe: ví dụ thiếu link deploy/GitHub, khoảng trống sự nghiệp, ôm đồm quá nhiều công nghệ không liên quan, hoặc thiếu định hướng chuyên sâu.)

# 9. Khả năng được tuyển dụng (Hiring Probability)
(Đưa ra ước lượng thực tế bằng phần trăm cơ hội nhận cuộc gọi phỏng vấn của CV này. Đánh giá độ sẵn sàng và độ phù hợp của ứng viên đối với 4 nhóm doanh nghiệp: Startup, Outsourcing, Product Company, và tập đoàn công nghệ lớn/FAANG.)

# 10. Lộ trình Cải thiện (Roadmap)
(Thiết lập một lộ trình hành động cụ thể, chia rõ thành 3 mức độ ưu tiên: HIGH PRIORITY (cần sửa ngay trong 24h), MEDIUM PRIORITY (cần bổ sung trong 1 tuần), và LOW PRIORITY (kế hoạch dài hạn).)

# 11. Các Mục Còn Thiếu Nên Bổ Sung
(Gợi ý chi tiết các mục cần thêm để CV nổi bật vượt trội như: chứng chỉ quốc tế uy tín, link Portfolio cá nhân, trang blog chia sẻ kiến thức IT, hoặc các đóng góp cho dự án mã nguồn mở.)

# 12. Tổng Kết (Final Verdict)
(Đưa ra kết luận cuối cùng: Đâu là ưu điểm lớn nhất? Đâu là rào cản lớn nhất ngăn CV này nhận được lời mời phỏng vấn? Đưa ra 3 hành động cụ thể ứng viên phải làm ngay lập tức sau khi đọc báo cáo này.)

==================================================
SPECIAL RULES FOR IT CVs
==================================================
- If Frontend: Focus on React ecosystem, State management, UI/UX, Performance.
- If Backend: Focus on API design, DB design, Scalability, Security, Architecture.
- If Fullstack: Evaluate balance between frontend/backend depth.
- If AI/ML: Focus on Model understanding, MLOps, dataset, deployment.

RESPOND WITH ONLY THE JSON OBJECT. NO MARKDOWN FENCES. NO EXTRA TEXT.
MUST FORMAT THE detailedReport FIELD AS A PROPER JSON ESCAPED STRING.`
}

async function callGroqAnalysis(cvText, fileName) {
  const systemPrompt = getAnalysisSystemPrompt()
  const userPrompt = `CV CONTENT FROM FILE "${fileName}":\n---\n${cvText.substring(0, 12000)}\n---`

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.1
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Groq API returned status ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const responseText = data.choices?.[0]?.message?.content || ''

  // Extract and parse JSON
  const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Invalid JSON response from Groq')

  const result = JSON.parse(jsonMatch[0])

  // Handle non-IT CV
  if (result.isNonIT) {
    return {
      atsScore: 0,
      sectionScores: { jdRelevance: 0, experience: 0, skills: 0, achievements: 0, presentation: 0 },
      detailedReport: "# 1. Executive Summary\n\nCV của bạn không liên quan đến ngành IT, vì vậy tôi không thể đánh giá được. Hệ thống này chỉ phân tích CV cho các vị trí IT/Phần mềm/Công nghệ."
    }
  }

  // Clamp scores
  result.atsScore = Math.max(0, Math.min(100, Math.round(result.atsScore)))
  if (result.sectionScores) {
    for (const key of Object.keys(result.sectionScores)) {
      result.sectionScores[key] = Math.max(0, Math.min(100, Math.round(result.sectionScores[key])))
    }
  }

  // Ensure detailedReport exists
  if (!result.detailedReport) {
    result.detailedReport = "# Lỗi phân tích\n\nKhông thể tạo báo cáo chi tiết từ Groq. Vui lòng thử lại.";
  }

  return result
}

async function callGeminiAnalysis(cvText, fileName) {
  const systemPrompt = getAnalysisSystemPrompt()
  const userPrompt = `CV CONTENT FROM FILE "${fileName}":\n---\n${cvText.substring(0, 12000)}\n---`

  // Retry logic for 429 (rate limit) errors — wait and try again up to 3 times
  // Using gemini-2.0-flash-lite for higher free-tier rate limits
  const MODEL = 'gemini-2.0-flash-lite'
  const MAX_RETRIES = 3
  let response
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      }
    )

    if (response.ok) break // Success — exit retry loop

    if (response.status === 429 && attempt < MAX_RETRIES) {
      // Rate limited — wait longer before retrying (15s, then 30s)
      const waitSeconds = 15 * attempt
      console.warn(`[CV Analysis] Rate limited (429). Retrying in ${waitSeconds}s... (attempt ${attempt}/${MAX_RETRIES})`)
      await delay(waitSeconds * 1000)
      continue
    }

    // Non-429 error or final retry exhausted
    throw new Error(`Gemini API returned ${response.status}`)
  }

  const data = await response.json()
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Extract JSON from response
  const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Invalid JSON response from Gemini')

  const result = JSON.parse(jsonMatch[0])

  // Handle non-IT CV
  if (result.isNonIT) {
    return {
      atsScore: 0,
      sectionScores: { jdRelevance: 0, experience: 0, skills: 0, achievements: 0, presentation: 0 },
      detailedReport: "# 1. Executive Summary\n\nCV của bạn không liên quan đến ngành IT, vì vậy tôi không thể đánh giá được. Hệ thống này chỉ phân tích CV cho các vị trí IT/Phần mềm/Công nghệ."
    }
  }

  // Clamp scores
  result.atsScore = Math.max(0, Math.min(100, Math.round(result.atsScore)))
  if (result.sectionScores) {
    for (const key of Object.keys(result.sectionScores)) {
      result.sectionScores[key] = Math.max(0, Math.min(100, Math.round(result.sectionScores[key])))
    }
  }

  // Ensure detailedReport exists
  if (!result.detailedReport) {
    result.detailedReport = "# Lỗi phân tích\n\nKhông thể tạo báo cáo chi tiết. Vui lòng thử lại.";
  }

  return result
}

// ─────────────────────────────────────────────
//  LOCAL ANALYSIS — rule-based fallback (no API)
//  Uses same 5 criteria: JD Relevance, Experience, Skills, Achievements, Presentation
// ─────────────────────────────────────────────

function localAnalysis(text, fileName) {
  const lower = text.toLowerCase()
  const len = text.trim().length

  // --- Check if IT-related ---
  const itKeywords = [
    'react', 'angular', 'vue', 'node', 'python', 'java', 'javascript', 'typescript',
    'docker', 'kubernetes', 'aws', 'azure', 'sql', 'mongodb', 'git', 'ci/cd',
    'agile', 'scrum', 'rest api', 'graphql', 'html', 'css', 'spring', 'django',
    'flask', 'express', 'next.js', 'tailwind', 'php', 'laravel', 'c#', '.net',
    'c++', 'golang', 'rust', 'swift', 'kotlin', 'flutter', 'react native',
    'machine learning', 'deep learning', 'data science', 'devops', 'backend',
    'frontend', 'full-stack', 'fullstack', 'software', 'developer', 'engineer',
    'programmer', 'lập trình', 'phần mềm', 'công nghệ thông tin', 'cntt',
    'database', 'linux', 'api', 'microservice', 'cloud', 'redis', 'kafka',
    'elasticsearch', 'terraform', 'jenkins', 'github', 'gitlab', 'jira',
  ]
  const itFound = itKeywords.filter((k) => lower.includes(k))

  // Non-IT detection: if almost no IT keywords found
  const nonItFields = /(?:kế toán|accounting|marketing|y tá|nursing|giáo viên|teacher|luật|law|nhân sự(?!\s*it)|bán hàng|sales manager|thời trang|fashion)/i
  if (itFound.length <= 1 && nonItFields.test(text) && len > 100) {
    return {
      atsScore: 0,
      sectionScores: { jdRelevance: 0, experience: 0, skills: 0, achievements: 0, presentation: 0 },
      detailedReport: '# 1. Executive Summary\n\nCV của bạn không liên quan đến ngành IT, vì vậy tôi không thể đánh giá được. Hệ thống chỉ phân tích CV cho các vị trí IT/Phần mềm/Công nghệ.'
    }
  }

  // --- Detect joke/troll content ---
  const jokePatterns = [
    'ctrl + c', 'ctrl+c', 'ctrl + v', 'ctrl+v', 'stackoverflow',
    'breathing', 'hít thở', 'tiêu tài nguyên', 'consuming family resources',
    'earn without working', 'kiếm tiền không cần làm', 'lương hàng chục nghìn',
    'chant a mantra', 'niệm thần chú', 'refrain from flirting',
    'struggling to survive', 'vật lộn sống sót', 'troll', 'meme',
    'tea and drink intern', 'chủ tịch hội đồng',
  ]
  const jokeCount = jokePatterns.filter((p) => lower.includes(p)).length

  // --- Criterion 1: JD Relevance (keywords + career goals) ---
  const hasCareerGoal = /(?:objective|mục tiêu|career|nghề nghiệp|summary|tóm tắt|profile|giới thiệu)/i.test(text)
  const hasItJobTitle = /(?:developer|engineer|programmer|lập trình|software|phần mềm|devops|data|frontend|backend|full.?stack)/i.test(text)

  // --- Criterion 2: Experience & Projects ---
  const hasExperience = /(?:experience|kinh nghiệm|work|làm việc|công ty|company|dự án|project)/i.test(text)
  const hasProjectDetails = /(?:team|nhóm|role|vai trò|technology|công nghệ|stack|thành viên|members)/i.test(text)
  const hasLinks = /(?:github\.com|gitlab\.com|linkedin\.com|portfolio|demo|https?:\/\/)/i.test(text)

  // --- Criterion 3: Skills & Certifications ---
  const hasCerts = /(?:certificate|chứng chỉ|aws certified|google cloud|cisco|oracle|pmp|scrum master|comptia)/i.test(text)
  const hasSkillCategories = /(?:programming|languages|frameworks|database|tools|ngôn ngữ|framework|cơ sở dữ liệu|công cụ)/i.test(text)

  // --- Criterion 4: Achievements (STAR model) ---
  const hasMetrics = /\d+\s*(%|percent|users|người dùng|concurrent|requests|seconds|giây|tps|uptime|coverage|performance|hiệu suất)/i.test(text)
  const hasStarContent = /(?:result|kết quả|achieved|đạt được|improved|cải thiện|reduced|giảm|increased|tăng|optimized|tối ưu)/i.test(text)

  // --- Criterion 5: Presentation ---
  const hasContact = /(?:email|phone|điện thoại|liên hệ|contact)[\s:]/i.test(text)
  const hasLinkedIn = /linkedin/i.test(text)
  const hasEducation = /(?:education|học vấn|university|đại học|cao đẳng|trường)/i.test(text)

  // --- Calculate 5 section scores ---
  let jdRelevance = 0, experience = 0, skills = 0, achievements = 0, presentation = 0

  if (jokeCount >= 3) {
    // Joke CV — all low
    jdRelevance = Math.max(5, itFound.length * 3)
    experience = Math.max(0, 10 - jokeCount * 2)
    skills = Math.max(0, 10 - jokeCount * 2)
    achievements = 0
    presentation = Math.max(5, 15 - jokeCount * 3)
  } else if (len < 50) {
    jdRelevance = 0; experience = 0; skills = 0; achievements = 0; presentation = 0
  } else {
    // Criterion 1: JD Relevance
    jdRelevance = Math.min(90, itFound.length * 5)
    if (hasCareerGoal) jdRelevance = Math.min(95, jdRelevance + 15)
    if (hasItJobTitle) jdRelevance = Math.min(95, jdRelevance + 10)

    // Criterion 2: Experience & Projects
    experience = hasExperience ? 30 : 5
    if (hasProjectDetails) experience = Math.min(80, experience + 20)
    if (hasLinks) experience = Math.min(90, experience + 15)
    if (itFound.length >= 5) experience = Math.min(85, experience + 10)

    // Criterion 3: Skills & Certifications
    skills = Math.min(80, itFound.length * 6)
    if (hasSkillCategories) skills = Math.min(90, skills + 15)
    if (hasCerts) skills = Math.min(95, skills + 20)
    if (jokeCount > 0) skills = Math.max(5, skills - jokeCount * 15)

    // Criterion 4: Achievements (STAR)
    achievements = 10
    if (hasMetrics) achievements = Math.min(80, achievements + 35)
    if (hasStarContent) achievements = Math.min(85, achievements + 20)
    if (!hasMetrics && !hasStarContent) achievements = 10

    // Criterion 5: Presentation
    presentation = 30
    if (hasContact) presentation += 15
    if (hasLinkedIn) presentation += 10
    if (hasEducation) presentation += 10
    if (len > 200 && len < 5000) presentation += 15
    presentation = Math.min(90, presentation)
    if (jokeCount > 0) presentation = Math.max(10, presentation - jokeCount * 10)
  }

  // Weighted ATS score: 20% + 30% + 20% + 20% + 10%
  const atsScore = Math.round(
    jdRelevance * 0.20 + experience * 0.30 + skills * 0.20 +
    achievements * 0.20 + presentation * 0.10
  )

  // --- Build strengths ---
  const strengths = []
  if (itFound.length >= 8) strengths.push(`CV chứa ${itFound.length} từ khóa kỹ thuật IT, phù hợp tốt với ATS`)
  else if (itFound.length >= 4) strengths.push(`CV chứa ${itFound.length} từ khóa kỹ thuật IT`)
  if (hasExperience && hasProjectDetails) strengths.push('Có mô tả kinh nghiệm và dự án với chi tiết vai trò/công nghệ')
  if (hasLinks) strengths.push('Có cung cấp link GitHub/portfolio/LinkedIn')
  if (hasCerts) strengths.push('Có chứng chỉ chuyên môn (điểm cộng lớn)')
  if (hasMetrics) strengths.push('Có thành tích đo lường được bằng số liệu cụ thể')
  if (hasEducation) strengths.push('Có thông tin học vấn')

  // --- Build weaknesses ---
  const weaknesses = []
  if (jokeCount >= 2) weaknesses.push('CV chứa nội dung hài hước/troll — nhà tuyển dụng sẽ loại ngay')
  if (itFound.length < 4) weaknesses.push('Quá ít từ khóa kỹ thuật IT — ATS sẽ lọc CV này')
  if (!hasCareerGoal) weaknesses.push('Thiếu Mục tiêu nghề nghiệp/Professional Summary')
  if (!hasExperience) weaknesses.push('Thiếu phần Kinh nghiệm làm việc & Dự án thực tế')
  if (!hasProjectDetails) weaknesses.push('Thiếu chi tiết dự án: vai trò, team size, tech stack')
  if (!hasLinks) weaknesses.push('Không có link GitHub/GitLab/Portfolio/LinkedIn')
  if (!hasCerts) weaknesses.push('Không có chứng chỉ chuyên môn (AWS, Google Cloud, etc.)')
  if (!hasMetrics) weaknesses.push('Không có thành tích đo lường (thiếu mô hình STAR: Situation-Task-Action-Result)')
  if (!hasContact) weaknesses.push('Thiếu thông tin liên hệ chuyên nghiệp')
  if (len < 300) weaknesses.push('Nội dung CV quá ngắn, thiếu chi tiết')

  // --- Build suggestions ---
  const suggestions = []
  if (jokeCount >= 2) {
    suggestions.push({ category: 'Tính chuyên nghiệp', issue: 'CV chứa nội dung đùa giỡn, không nghiêm túc', fix: 'Viết lại toàn bộ CV với giọng văn chuyên nghiệp. Loại bỏ mọi nội dung hài hước.' })
  }
  if (itFound.length < 5) {
    suggestions.push({ category: 'Phù hợp JD', issue: `Chỉ tìm thấy ${itFound.length} từ khóa kỹ thuật IT`, fix: 'Bổ sung các công nghệ bạn thành thạo: framework, DBMS, cloud, DevOps tools, methodology (Agile/Scrum)' })
  }
  if (!hasProjectDetails) {
    suggestions.push({ category: 'Kinh nghiệm & Dự án', issue: 'Thiếu chi tiết dự án', fix: 'Mô tả rõ: tên dự án, vai trò (FE/BE/Full-stack), team size, tech stack, thời gian, link demo/GitHub' })
  }
  if (!hasMetrics) {
    suggestions.push({ category: 'Thành tích (STAR)', issue: 'Không có thành tích đo lường được', fix: 'Áp dụng STAR: "Tối ưu API giảm response time từ 2s xuống 0.5s", "Hệ thống xử lý 10,000+ concurrent users"' })
  }
  if (!hasCerts) {
    suggestions.push({ category: 'Kỹ năng & Chứng chỉ', issue: 'Không có chứng chỉ chuyên môn', fix: 'Lấy chứng chỉ AWS/Google Cloud/Cisco/Oracle để tăng giá trị CV đáng kể' })
  }
  if (!hasLinkedIn) {
    suggestions.push({ category: 'Trình bày & Tính xác thực', issue: 'Thiếu LinkedIn profile', fix: 'Thêm link LinkedIn đã cập nhật đầy đủ — nhà tuyển dụng luôn kiểm tra LinkedIn' })
  }

  const missingKeywords = ['TypeScript', 'Docker', 'CI/CD', 'Unit Testing', 'Agile/Scrum', 'Cloud (AWS/GCP/Azure)', 'Microservices']
    .filter((k) => !lower.includes(k.toLowerCase().split(' ')[0].split('/')[0]))

  let detailedReport = `# 1. Executive Summary\n\n`;
  if (jokeCount >= 3) {
    detailedReport += `⚠️ CV "${fileName}" chứa nội dung hài hước/troll và KHÔNG phù hợp để nộp. Cần viết lại toàn bộ.\n\nĐánh giá Level: Không hợp lệ.`;
  } else if (atsScore < 30) {
    detailedReport += `CV "${fileName}" còn rất yếu. Thiếu nhiều yếu tố quan trọng: kinh nghiệm dự án, từ khóa ATS, thành tích đo lường. Cần cải thiện đáng kể.\n\nĐánh giá Level: Beginner.`;
  } else if (atsScore < 60) {
    detailedReport += `CV "${fileName}" ở mức dưới trung bình. Có cấu trúc cơ bản nhưng cần bổ sung chi tiết dự án, số liệu thành tích (STAR model), và tối ưu từ khóa ATS.\n\nĐánh giá Level: Junior.`;
  } else {
    detailedReport += `CV "${fileName}" có nền tảng IT tốt nhưng vẫn cần tối ưu thêm: bổ sung thành tích cụ thể, chứng chỉ chuyên môn, và link portfolio.\n\nĐánh giá Level: Mid-level.`;
  }

  detailedReport += `\n\n# 2. Phân tích độ tương thích ATS\n`;
  detailedReport += `- Điểm ATS: **${atsScore}/100**\n`;
  detailedReport += `- Mật độ từ khóa: Tìm thấy ${itFound.length} từ khóa chuyên ngành.\n`;
  if (itFound.length < 5) detailedReport += `- ⚠️ Cảnh báo: Số lượng từ khóa quá thấp, rất dễ bị ATS loại bỏ.\n`;

  detailedReport += `\n\n# 3. Đánh giá bố cục và thiết kế\n`;
  if (presentation >= 60) {
    detailedReport += `- Bố cục cơ bản đáp ứng được yêu cầu đọc của ATS. Có đầy đủ thông tin liên hệ và học vấn.\n`;
  } else {
    detailedReport += `- Bố cục còn yếu, thiếu thông tin liên hệ chuyên nghiệp hoặc mục tiêu nghề nghiệp.\n`;
  }

  detailedReport += `\n\n# 4. Phân tích Kỹ năng Chuyên môn\n`;
  detailedReport += `- Kỹ năng tìm thấy: ${itFound.slice(0, 10).join(', ')}${itFound.length > 10 ? '...' : ''}\n`;
  if (!hasCerts) detailedReport += `- Đang thiếu hoàn toàn các chứng chỉ chuyên môn (AWS, GCP, Cisco).\n`;

  detailedReport += `\n\n# 5. Phân tích Dự án Thực tế\n`;
  if (hasProjectDetails) {
    detailedReport += `- Đã có đề cập đến dự án thực tế, tuy nhiên cần làm rõ hơn về kiến trúc và độ phức tạp.\n`;
  } else {
    detailedReport += `- ⚠️ Đang thiếu trầm trọng phần mô tả chi tiết dự án (Role, Tech Stack, Team size).\n`;
  }

  detailedReport += `\n\n# 6. Phân tích Kinh nghiệm làm việc\n`;
  if (hasExperience) {
    detailedReport += `- Đã liệt kê kinh nghiệm làm việc. Cần đảm bảo các mô tả công việc mang tính đóng góp thực tế thay vì chỉ liệt kê nhiệm vụ.\n`;
  } else {
    detailedReport += `- ⚠️ Không tìm thấy kinh nghiệm làm việc rõ ràng. Hãy bổ sung ngay các dự án cá nhân hoặc thời gian thực tập.\n`;
  }

  detailedReport += `\n\n# 7. Đánh giá Thành tích & Mức độ ảnh hưởng (STAR)\n`;
  if (hasMetrics) {
    detailedReport += `- Đã có sự xuất hiện của số liệu đo lường. Cần tối ưu thêm theo mô hình STAR (Tình huống - Nhiệm vụ - Hành động - Kết quả).\n`;
  } else {
    detailedReport += `- ⚠️ Gần như không có số liệu (Metrics) đo lường nào. Nhà tuyển dụng rất khó đánh giá năng lực thực sự của bạn.\n`;
  }

  detailedReport += `\n\n# 8. Cờ Đỏ & Điểm Yếu\n`;
  if (weaknesses.length > 0) {
    weaknesses.forEach(w => detailedReport += `- ${w}\n`);
  } else {
    detailedReport += `- Không có điểm yếu nghiêm trọng.\n`;
  }

  detailedReport += `\n\n# 9. Khả năng được tuyển dụng (Hiring Probability)\n`;
  if (atsScore > 75) detailedReport += `- Cơ hội tốt cho các vai trò Junior/Mid-level tại các công ty Product/Outsourcing.\n`;
  else if (atsScore > 50) detailedReport += `- Có cơ hội cho vai trò Intern/Fresher, nhưng sẽ khó cạnh tranh tại các công ty lớn.\n`;
  else detailedReport += `- Cơ hội rất thấp ở thời điểm hiện tại. Cần cải thiện CV ngay lập tức.\n`;

  detailedReport += `\n\n# 10. Lộ trình Cải thiện\n`;
  if (suggestions.length > 0) {
    suggestions.forEach(s => detailedReport += `- **${s.category}**: ${s.issue} -> ${s.fix}\n`);
  } else {
    detailedReport += `- Tiếp tục phát huy và bổ sung thêm các dự án phức tạp hơn.\n`;
  }

  detailedReport += `\n\n# 11. Các Mục Còn Thiếu Nên Bổ Sung\n`;
  if (missingKeywords.length > 0) {
    detailedReport += `- **Từ khóa nên bổ sung**: ${missingKeywords.join(', ')}\n`;
  }
  if (!hasLinks) detailedReport += `- **Hồ sơ online**: GitHub, Portfolio cá nhân, LinkedIn (RẤT QUAN TRỌNG).\n`;

  detailedReport += `\n\n# 12. Tổng Kết\n`;
  detailedReport += `- **Điểm mạnh**: ${strengths.join('; ')}\n`;
  detailedReport += `- **Next Steps**: Dựa vào Lộ trình cải thiện (Mục 10) để chỉnh sửa CV, sau đó upload lại để kiểm tra.\n`;

  return {
    atsScore,
    sectionScores: { jdRelevance, experience, skills, achievements, presentation },
    detailedReport
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

