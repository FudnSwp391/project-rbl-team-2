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

/**
 * Analyze a CV file using Gemini AI
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
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      result = await callGeminiAnalysis(extraction.text, file.name)
      onProgress(85, 'Đang tạo báo cáo...')
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
    summary: `⚠️ KHÔNG THỂ PHÂN TÍCH: ${reason} File "${fileName}" không chứa nội dung CV hợp lệ. Điểm ATS: 0/100.`,
    strengths: [],
    weaknesses: [
      'CV trống hoặc không có nội dung',
      'Không có thông tin cá nhân',
      'Không có kinh nghiệm làm việc',
      'Không có kỹ năng được liệt kê',
      'Không có thông tin học vấn',
    ],
    keywords: { found: [], missing: ['Tất cả từ khóa quan trọng đều bị thiếu'] },
    suggestions: [
      {
        category: 'Nội dung',
        issue: 'CV hoàn toàn trống',
        fix: 'Vui lòng tải lên CV có nội dung thực tế bao gồm: thông tin cá nhân, học vấn, kinh nghiệm, và kỹ năng.',
      },
    ],
    sectionScores: { jdRelevance: 0, experience: 0, skills: 0, achievements: 0, presentation: 0 },
  }
}

// ─────────────────────────────────────────────
//  TEXT EXTRACTION — PDF (pdf.js) + DOCX (mammoth)
// ─────────────────────────────────────────────

async function extractTextFromFile(file) {
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
          lines.push(currentLine.map((it) => it.str).join(' '))
          currentLine = [items[j]]
        }
      }
      lines.push(currentLine.map((it) => it.str).join(' '))

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

async function callGeminiAnalysis(cvText, fileName) {
  const prompt = `You are a senior IT recruiter (HR + Tech Lead) evaluating CVs for IT/Software positions. You must analyze STRICTLY, HONESTLY, and in GREAT DETAIL based on the 5 core professional criteria below.

## STEP 0 — NON-IT CV CHECK:
First, determine if this CV is for an IT/Software/Tech role. If the CV is CLEARLY for a NON-IT field (e.g., accounting, marketing, nursing, teaching with NO tech skills), you MUST:
- Set isNonIT to true
- Set atsScore to 0
- Set summary to: "CV của bạn không liên quan đến ngành IT, vì vậy tôi không thể đánh giá được."
- Leave all section scores at 0

## THE 5 CORE EVALUATION CRITERIA:

### 1. JD Relevance (jdRelevance) — 20% weight
- Does the CV contain technical keywords that ATS systems look for? (e.g., ReactJS, AWS, Docker, Python, Java, Spring Boot, etc.)
- Does the career objective align with an IT career path?
- Are job titles and descriptions relevant to software/IT positions?
- Score HIGH (70-90) if many relevant IT keywords and clear IT career direction
- Score LOW (0-30) if no IT keywords, vague objectives, or non-IT content

### 2. Work Experience & Projects (experience) — 30% weight
- Does the CV clearly describe project size, role (Frontend/Backend/Full-stack), team size, and core technologies used?
- Are there links to live products, GitHub/GitLab repositories?
- Is there REAL work experience at actual companies with specific timeframes?
- Score HIGH (70-90) if detailed project descriptions with tech stack, role clarity, and real company names
- Score LOW (0-30) if no real projects, only vague mentions, or no work history

### 3. Professional Skills & Certifications (skills) — 20% weight
- Are skills clearly categorized? (Languages, Frameworks, Databases, DevOps Tools)
- Are there valuable certifications? (AWS, Google Cloud, Cisco, Oracle, etc.)
- Is there evidence of proficiency (not just "heard of" a technology)?
- Score HIGH (70-90) if well-organized skills with certifications
- Score LOW (0-30) if skills are vague, fake, or just a list of names without depth

### 4. Measurable Achievements — STAR Model (achievements) — 20% weight
- Does the CV use the STAR model (Situation, Task, Action, Result)?
- Are there SPECIFIC METRICS? (e.g., "Reduced API response time from 2s to 0.5s", "System handles 10,000+ concurrent users", "Increased test coverage to 85%")
- Score HIGH (70-90) if multiple quantified achievements with clear impact
- Score LOW (0-30) if only lists tasks without any measurable results

### 5. Presentation & Authenticity (presentation) — 10% weight
- Is the CV 1-2 pages, concise, and well-formatted?
- Does it have serious contact info (professional email, phone, LinkedIn)?
- Is the layout ATS-friendly (avoids complex tables, images, fancy formatting)?
- Is the tone professional throughout?
- Score HIGH (70-90) if clean, professional, ATS-friendly layout
- Score LOW (0-30) if messy, too long/short, or unprofessional tone

## SCORING SCALE:
- 0-15: UNACCEPTABLE (blank, joke, troll, non-IT)
- 16-30: VERY POOR (severely lacking, unprofessional)
- 31-45: POOR (basic structure but missing critical content)
- 46-60: BELOW AVERAGE (has content but weak/vague)
- 61-75: AVERAGE (decent, some real experience, needs improvement)
- 76-85: GOOD (well-structured, specific, quantifiable)
- 86-100: EXCELLENT (outstanding, perfect ATS optimization)

## RED FLAGS:
- Joke/troll content → atsScore ≤ 20
- Fake skills like "Ctrl+C Ctrl+V" → ≤ 25
- No real work experience → atsScore ≤ 40
- Relationship status in CV → -5 points
- A genuinely good IT CV with real experience MUST score fairly (60-85)

Return ONLY a JSON object (no markdown fences, no extra text):

{
  "isNonIT": <true if CV is not IT-related, false otherwise>,
  "atsScore": <0-100 overall weighted score>,
  "summary": "<detailed 3-4 sentence assessment in Vietnamese covering all 5 criteria>",
  "strengths": ["<specific strengths tied to the 5 criteria>"],
  "weaknesses": ["<specific weaknesses tied to the 5 criteria>"],
  "keywords": {
    "found": ["<real IT keywords found in CV>"],
    "missing": ["<important IT keywords that should be added>"]
  },
  "suggestions": [
    {
      "category": "<Phù hợp JD|Kinh nghiệm & Dự án|Kỹ năng & Chứng chỉ|Thành tích (STAR)|Trình bày & Tính xác thực|Tính chuyên nghiệp>",
      "issue": "<specific problem in Vietnamese>",
      "fix": "<actionable, detailed fix in Vietnamese>"
    }
  ],
  "sectionScores": {
    "jdRelevance": <0-100>,
    "experience": <0-100>,
    "skills": <0-100>,
    "achievements": <0-100>,
    "presentation": <0-100>
  }
}

CV CONTENT FROM FILE "${fileName}":
---
${cvText.substring(0, 12000)}
---

RESPOND WITH ONLY THE JSON OBJECT. NO MARKDOWN. NO EXTRA TEXT.`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      }),
    }
  )

  if (!response.ok) {
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
      summary: 'CV của bạn không liên quan đến ngành IT, vì vậy tôi không thể đánh giá được. Hệ thống này chỉ phân tích CV cho các vị trí IT/Phần mềm/Công nghệ.',
      strengths: [],
      weaknesses: ['CV không thuộc ngành IT/Công nghệ thông tin'],
      keywords: { found: [], missing: [] },
      suggestions: [{
        category: 'Phù hợp JD',
        issue: 'CV không liên quan đến IT',
        fix: 'Hệ thống chỉ hỗ trợ đánh giá CV cho ngành IT. Vui lòng gửi CV cho vị trí IT/phần mềm.',
      }],
      sectionScores: { jdRelevance: 0, experience: 0, skills: 0, achievements: 0, presentation: 0 },
    }
  }

  // Clamp scores
  result.atsScore = Math.max(0, Math.min(100, Math.round(result.atsScore)))
  if (result.sectionScores) {
    for (const key of Object.keys(result.sectionScores)) {
      result.sectionScores[key] = Math.max(0, Math.min(100, Math.round(result.sectionScores[key])))
    }
  }

  // Ensure arrays exist
  if (!Array.isArray(result.strengths)) result.strengths = []
  if (!Array.isArray(result.weaknesses)) result.weaknesses = []
  if (!Array.isArray(result.suggestions)) result.suggestions = []
  if (!result.keywords) result.keywords = { found: [], missing: [] }

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
      summary: 'CV của bạn không liên quan đến ngành IT, vì vậy tôi không thể đánh giá được. Hệ thống chỉ phân tích CV cho các vị trí IT/Phần mềm/Công nghệ.',
      strengths: [],
      weaknesses: ['CV không thuộc ngành IT/Công nghệ thông tin'],
      keywords: { found: [], missing: [] },
      suggestions: [{ category: 'Phù hợp JD', issue: 'CV không liên quan đến IT', fix: 'Hệ thống chỉ hỗ trợ đánh giá CV cho ngành IT.' }],
      sectionScores: { jdRelevance: 0, experience: 0, skills: 0, achievements: 0, presentation: 0 },
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

  // --- Summary ---
  let summary
  if (jokeCount >= 3) {
    summary = `⚠️ CV "${fileName}" chứa nội dung hài hước/troll và KHÔNG phù hợp để nộp. Điểm ATS: ${atsScore}/100. Cần viết lại toàn bộ.`
  } else if (atsScore < 30) {
    summary = `CV "${fileName}" còn rất yếu (${atsScore}/100). Thiếu nhiều yếu tố quan trọng: kinh nghiệm dự án, từ khóa ATS, thành tích đo lường. Cần cải thiện đáng kể.`
  } else if (atsScore < 60) {
    summary = `CV "${fileName}" ở mức dưới trung bình (${atsScore}/100). Có cấu trúc cơ bản nhưng cần bổ sung chi tiết dự án, số liệu thành tích (STAR model), và tối ưu từ khóa ATS.`
  } else {
    summary = `CV "${fileName}" đạt mức ${atsScore}/100. Có nền tảng IT tốt nhưng vẫn cần tối ưu thêm: bổ sung thành tích cụ thể, chứng chỉ chuyên môn, và link portfolio.`
  }

  return {
    atsScore, summary,
    strengths: strengths.length > 0 ? strengths : ['Không tìm thấy điểm mạnh nổi bật'],
    weaknesses,
    keywords: {
      found: itFound.map((k) => k.charAt(0).toUpperCase() + k.slice(1)),
      missing: missingKeywords,
    },
    suggestions,
    sectionScores: { jdRelevance, experience, skills, achievements, presentation },
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

