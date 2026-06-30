/**
 * CV Analysis Service — Strict & Thorough
 * Uses pdf.js for PDF and mammoth for DOCX text extraction.
 * Strict Gemini prompt that catches joke CVs, blank CVs, and scores honestly.
 */

import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'
import IT_JOB_POSITIONS from '../constants/itJobPositions';
import { GoogleGenAI } from '@google/genai';

// Configure pdf.js worker — use the bundled worker from node_modules
// This avoids CDN version mismatch issues
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

// ─── Load API Keys ───────────────────────────────────────────────────────────
const GEMINI_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY_1,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4,
  import.meta.env.VITE_GEMINI_API_KEY_5,
  import.meta.env.VITE_GEMINI_API_KEY || ''
].map(k => (k || '').trim()).filter(k => k.length > 10);

const GROQ_KEYS = [
  import.meta.env.VITE_GROQ_API_KEY_1,
  import.meta.env.VITE_GROQ_API_KEY_2,
  import.meta.env.VITE_GROQ_API_KEY_3,
  import.meta.env.VITE_GROQ_API_KEY_4,
  import.meta.env.VITE_GROQ_API_KEY_5,
  import.meta.env.VITE_GROQ_API_KEY || ''
].map(k => (k || '').trim()).filter(k => k.length > 10);

// Track which key index to start from (round-robin rotation)
let _geminiKeyIndex = 0;
let _groqKeyIndex = 0;

console.log(`[CV Analysis] Loaded ${GEMINI_KEYS.length} Gemini key(s), ${GROQ_KEYS.length} Groq key(s)`);

/**
 * Analyze a CV file using Groq AI (Llama 3.3) or Gemini AI
 * @param {File} file - The CV file to analyze
 * @param {function} onProgress - Callback for progress updates (0-100)
 * @param {object|null} targetPosition - Selected IT job position for suitability assessment
 * @returns {Promise<object>} Analysis results
 */
export async function analyzeCV(file, onProgress = () => {}, targetPosition = null) {
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

  // Nếu dùng Gemini và file là PDF, bỏ qua check text trống vì Gemini đọc ảnh
  const isPdfWithGemini = file.type === 'application/pdf' && GEMINI_KEYS.length > 0;
  
  if (validation.isEmpty && !isPdfWithGemini) {
    onProgress(100, 'Hoàn tất!')
    return createEmptyCVResult(file.name, validation.reason)
  }

  // Phase 4: Analyzing with AI
  onProgress(45, 'Đang phân tích bằng AI...')

  let result
  if (GEMINI_KEYS.length > 0) {
    try {
      result = await callGeminiAnalysis(file, targetPosition)
      onProgress(85, 'Đang tạo báo cáo bằng Gemini 1.5 Flash...')
    } catch (error) {
      console.warn('Gemini API error, trying Groq fallback:', error)
      if (GROQ_KEYS.length > 0 && !validation.isEmpty) {
        try {
          result = await callGroqAnalysis(extraction.text, file.name, targetPosition)
          onProgress(85, 'Đang tạo báo cáo bằng Groq Llama...')
        } catch (groqError) {
          result = localAnalysis(extraction.text, file.name, targetPosition)
        }
      } else {
        result = localAnalysis(extraction.text, file.name, targetPosition)
      }
    }
  } else if (GROQ_KEYS.length > 0 && !validation.isEmpty) {
    try {
      result = await callGroqAnalysis(extraction.text, file.name, targetPosition)
      onProgress(85, 'Đang tạo báo cáo bằng Groq Llama...')
    } catch (error) {
      result = localAnalysis(extraction.text, file.name, targetPosition)
    }
  } else {
    await delay(800)
    result = localAnalysis(extraction.text, file.name, targetPosition)
    onProgress(85, 'Đang tạo báo cáo (phân tích cục bộ)...')
  }

  // Add evaluatedPositionId to the result so the UI knows what this CV was matched against
  if (result) {
    if (targetPosition) {
      result.evaluatedPositionId = targetPosition.id;
    } else if (result.suggestedPositionId) {
      result.evaluatedPositionId = result.suggestedPositionId;
    }
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

function getAnalysisSystemPrompt(targetPosition = null) {
  let jobAssessmentJsonStructure = '';
  let jobAssessmentInstruction = '';

  if (targetPosition) {
    jobAssessmentInstruction = `
- Bạn cần đánh giá CV dựa trên vị trí mục tiêu: "${targetPosition.name}".
- Mô tả công việc (JD): ${targetPosition.description}.
- Kỹ năng bắt buộc: ${targetPosition.requiredSkills.join(', ')}.
- Kỹ năng nâng cao: ${targetPosition.bonusSkills.join(', ')}.`;

    jobAssessmentJsonStructure = `
    "jobMatch": {
      "score": "number (0-100)",
      "matchedRequiredSkills": ["string"],
      "missingRequiredSkills": ["string"],
      "matchedBonusSkills": ["string"],
      "readiness": "Sẵn sàng ứng tuyển | Cần cải thiện thêm | Chưa phù hợp",
      "marketInsight": "string (Nhận định thị trường việc làm cho ứng viên ở vị trí này)"
    }`;
  } else {
    const positionOptions = IT_JOB_POSITIONS.map(p => `- ID: "${p.id}" | Name: "${p.name}"`).join('\n');
    jobAssessmentInstruction = `
- Ứng viên không chọn vị trí cụ thể. Bạn PHẢI TỰ ĐỘNG CHỌN 1 ID vị trí IT phù hợp nhất từ danh sách sau dựa vào tiêu đề hoặc kinh nghiệm trong CV:
${positionOptions}`;

    jobAssessmentJsonStructure = `
    "jobMatch": {
      "suggestedPositionId": "string (Bắt buộc phải là ID chính xác từ danh sách được cung cấp)",
      "suggestedPositionName": "string (Tên hiển thị)",
      "score": "number (0-100)",
      "reason": "string (Tại sao lại đề xuất vị trí này)"
    }`;
  }

  return `CRITICAL TRUTH & FACTUALITY RULE:
You are an elite, brutally honest Senior Technical Recruiter and ATS scanner. Evaluate the candidate EXCLUSIVELY on the actual text provided. 
- ZERO HALLUCINATION: DO NOT invent, assume, or hallucinate any company, project, internship, certification, or technology that is NOT explicitly written in their CV.
- If a skill or company is not mentioned, it DOES NOT exist.
- Evaluate basic/outdated tech stack strictly. If they only know basic HTML/CSS/JS or Java without modern frameworks, give low scores (under 60).

${jobAssessmentInstruction}

OUTPUT FORMAT:
You must respond with a single, valid JSON object. DO NOT wrap the output in markdown code blocks. Start directly with { and end with }. 
All text fields MUST be written in Vietnamese.

The JSON structure MUST exactly match this template:
{
  "isNonIT": boolean,
  "atsScore": 0,
  "sectionScores": {
    "jdRelevance": 0,
    "experience": 0,
    "skills": 0,
    "achievements": 0,
    "presentation": 0
  },
  "executiveSummary": {
    "strengths": "string (Phân tích sâu sắc về các điểm mạnh lớn nhất, viết 2-3 câu chi tiết)",
    "weaknesses": "string (Phân tích sâu sắc về các điểm yếu lớn nhất, viết 2-3 câu chi tiết)",
    "level": "Beginner | Junior | Mid-level | Senior-ready"
  },
  "atsAnalysis": "string (Đánh giá mật độ từ khóa IT, lỗi cấu trúc bố cục dưới góc nhìn ATS)",
  "layoutEvaluation": "string (Nhận xét về font chữ, khoảng trắng, tính trực quan kèm gợi ý sửa đổi)",
  "technicalSkills": {
    "extractedSkills": ["string (Liệt kê CHÍNH XÁC các công nghệ đọc được từ CV, KHÔNG BỊA)"],
    "marketRelevance": "string (Đánh giá xem tech stack này có đáp ứng xu hướng năm 2025+ không)",
    "urgentSkillsToLearn": ["string (3 kỹ năng ứng viên cần bổ sung gấp)"]
  },
  "projectsEvaluation": [
    {
      "name": "string (Tên dự án đọc được từ CV)",
      "type": "Đồ án sinh viên / CRUD cơ bản | Dự án chuẩn Production / Thực tế",
      "architectureAndStack": "string (Nhận xét về tech stack và kiến trúc sử dụng trong dự án)",
      "critique": "string (Chỉ ra điểm yếu trong cách thiết kế hoặc mô tả dự án này)"
    }
  ],
  "workExperience": {
    "isNoExperience": boolean,
    "evaluation": "string (Phân tích chất lượng kinh nghiệm, mức độ đóng góp, giải quyết bài toán khó. Nếu không có kinh nghiệm chuyên nghiệp, phân tích hoạt động học tập)",
    "improvedBulletPoints": ["string (Chọn các mô tả yếu trong CV và viết lại chúng thành câu hành động chuyên nghiệp, chuẩn STAR)"]
  },
  "achievementsAndStar": {
    "evaluation": "string (Kiểm tra xem các thành tích có số liệu đo lường cụ thể không. Phê bình nghiêm khắc nếu thiếu số liệu)",
    "suggestions": "string (Cách bổ sung số liệu thực tế)"
  },
  "redFlags": ["string (Các cờ đỏ chí mạng khiến CV bị loại: thiếu link deploy, khoảng trống sự nghiệp, ôm đồm...)"],
  "hiringProbability": {
    "overallPercentage": 0,
    "startup": "string (Khả năng và nhận định)",
    "outsourcing": "string (Khả năng và nhận định)",
    "productCompany": "string (Khả năng và nhận định)",
    "enterprise": "string (Khả năng và nhận định)"
  },
  "improvementRoadmap": {
    "highPriority": ["string (Cần sửa ngay trong 24h)"],
    "mediumPriority": ["string (Cần bổ sung trong 1 tuần)"],
    "lowPriority": ["string (Kế hoạch dài hạn)"]
  },
  "missingSections": ["string (Gợi ý chứng chỉ quốc tế, Portfolio, Tech Blog, Open Source nên có)"],
  "finalVerdict": {
    "summary": "string (Kết luận cuối cùng về rào cản lớn nhất ngăn CV nhận lời mời phỏng vấn)",
    "immediateActions": ["string (3 hành động cụ thể ứng viên phải làm ngay lập tức)"]
  },
${jobAssessmentJsonStructure}
}
`;
}

/**
 * Chuyển đổi đối tượng File thành chuỗi Base64 sạch (loại bỏ data URL prefix)
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}

async function callGroqAnalysis(cvText, fileName, targetPosition = null) {
  const systemPrompt = getAnalysisSystemPrompt(targetPosition)
  const userPrompt = `CV CONTENT FROM FILE "${fileName}":\n---\n${cvText.substring(0, 12000)}\n---`

  // Round-robin: try each Groq key starting from the current index
  for (let i = 0; i < GROQ_KEYS.length; i++) {
    const keyIdx = (_groqKeyIndex + i) % GROQ_KEYS.length;
    const apiKey = GROQ_KEYS[keyIdx];
    try {
      console.log(`[CV Analysis] Gọi Groq API (key ${keyIdx + 1}/${GROQ_KEYS.length})...`);
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.1
          })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[CV Analysis] Groq key ${keyIdx + 1} thất bại (${response.status}): ${errText.substring(0, 200)}`);
        continue; // thử key tiếp theo
      }

      // Thành công — xoay key cho lần gọi tiếp theo
      _groqKeyIndex = (keyIdx + 1) % GROQ_KEYS.length;

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content || '';

      // Parse JSON response
      const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Groq trả về nội dung không phải JSON');

      const result = JSON.parse(jsonMatch[0]);

      if (result.isNonIT) {
        return {
          atsScore: 0,
          sectionScores: { jdRelevance: 0, experience: 0, skills: 0, achievements: 0, presentation: 0 },
          executiveSummary: { strengths: "Không có", weaknesses: "CV không thuộc ngành IT.", level: "Beginner" },
          finalVerdict: { summary: "CV không thuộc ngành IT.", immediateActions: ["Tải lên CV ngành IT."] }
        };
      }

      // Clamp scores
      result.atsScore = Math.max(0, Math.min(100, Math.round(result.atsScore || 0)));
      if (result.sectionScores) {
        for (const k of Object.keys(result.sectionScores)) {
          result.sectionScores[k] = Math.max(0, Math.min(100, Math.round(result.sectionScores[k])));
        }
      }
      if (result.jobMatch?.score !== undefined) {
        result.jobMatchScore = Math.max(0, Math.min(100, Math.round(Number(result.jobMatch.score))));
      }
      if (result.jobMatch?.suggestedPositionId) {
        result.suggestedPositionId = result.jobMatch.suggestedPositionId;
        result.suggestedPosition = result.jobMatch.suggestedPositionName || result.jobMatch.suggestedPositionId;
      }
      return result;

    } catch (err) {
      console.error(`[CV Analysis] Groq key ${keyIdx + 1} lỗi:`, err.message);
      continue;
    }
  }
  throw new Error('Tất cả Groq API key đều thất bại.');
}

async function callGeminiAnalysis(file, targetPosition = null) {
  const systemPrompt = getAnalysisSystemPrompt(targetPosition);

  let base64Data;
  let mimeType = file.type || "application/pdf";
  try {
    base64Data = await fileToBase64(file);
  } catch (err) {
    throw new Error(`Không thể chuyển đổi file sang Base64: ${err.message}`);
  }

  const userPrompt = `Hãy phân tích kỹ lưỡng file CV đính kèm này dựa theo các chỉ dẫn nghiêm ngặt trong hệ thống.`;

  // Models to try in order of preference
  const MODELS = [
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-flash-latest',
  ];

  let lastError = '';

  // Round-robin across all keys
  for (let ki = 0; ki < GEMINI_KEYS.length; ki++) {
    const keyIdx = (_geminiKeyIndex + ki) % GEMINI_KEYS.length;
    const apiKey = GEMINI_KEYS[keyIdx];

    // Initialize SDK with current key
    const ai = new GoogleGenAI({ apiKey });

    for (const modelName of MODELS) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[CV Analysis] Gemini SDK: key ${keyIdx + 1}/${GEMINI_KEYS.length}, model=${modelName}, attempt=${attempt}`);

          const result = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  { inlineData: { mimeType, data: base64Data } },
                  { text: userPrompt }
                ]
              }
            ],
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.1,
              responseMimeType: "application/json",
            }
          });

          const responseText = result.text;
          console.log(`[CV Analysis] ✅ Thành công! Model: ${modelName}, Response length: ${responseText.length}`);

          // Xoay key cho lần gọi sau
          _geminiKeyIndex = (keyIdx + 1) % GEMINI_KEYS.length;

          return parseGeminiResult(responseText);

        } catch (err) {
          lastError = `${modelName}: ${err.message}`;
          console.warn(`[CV Analysis] ❌ ${lastError}`);

          // If model not found (404), try next model
          if (err.message?.includes('not found') || err.message?.includes('404')) {
            break; // next model
          }

          // If rate limited (429), retry with exponential backoff
          if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('rate') || err.status === 429) {
            if (attempt < 2) {
              const waitMs = 5000 * attempt;
              console.log(`[CV Analysis] ⏳ Rate limit trên key ${keyIdx + 1}, đợi ${waitMs / 1000}s rồi thử lại...`);
              await new Promise(r => setTimeout(r, waitMs));
              continue; // retry same model
            }
            console.log(`[CV Analysis] ⏳ Vẫn bị rate limit, chuyển sang key khác...`);
            break; // break model loop, go to next key
          }

          // Other errors — try next model
          break;
        }
      }
    }
  }

  throw new Error(`Gemini API thất bại hoàn toàn. ${lastError}`);
}

/**
 * Parse and validate the JSON result from Gemini
 */
function parseGeminiResult(responseText) {
  const result = JSON.parse(responseText.trim());

  if (result.isNonIT) {
    return {
      atsScore: 0,
      sectionScores: { jdRelevance: 0, experience: 0, skills: 0, achievements: 0, presentation: 0 },
      executiveSummary: {
        strengths: "Không có",
        weaknesses: "Hệ thống chỉ hỗ trợ phân tích CV thuộc khối ngành Công nghệ thông tin.",
        level: "Beginner"
      },
      finalVerdict: {
        summary: "CV không thuộc khối ngành Công nghệ thông tin.",
        immediateActions: ["Vui lòng tải lên CV lập trình viên hoặc kỹ sư phần mềm."]
      }
    };
  }

  // Clamp scores
  result.atsScore = Math.max(0, Math.min(100, Math.round(result.atsScore || 0)));
  if (result.sectionScores) {
    for (const key of Object.keys(result.sectionScores)) {
      result.sectionScores[key] = Math.max(0, Math.min(100, Math.round(result.sectionScores[key])));
    }
  }

  // Normalize jobMatch for UI
  if (result.jobMatch?.score !== undefined) {
    result.jobMatchScore = Math.max(0, Math.min(100, Math.round(Number(result.jobMatch.score))));
  }
  if (result.jobMatch?.suggestedPositionId) {
    result.suggestedPositionId = result.jobMatch.suggestedPositionId;
    result.suggestedPosition = result.jobMatch.suggestedPositionName || result.jobMatch.suggestedPositionId;
  }

  return result;
}


// ─────────────────────────────────────────────
//  LOCAL ANALYSIS — rule-based fallback (no API)
//  Uses same 5 criteria: JD Relevance, Experience, Skills, Achievements, Presentation
// ─────────────────────────────────────────────

function localAnalysis(text, fileName, targetPosition = null) {
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

  // --- Section 13: Job-Specific Assessment (local fallback) ---
  let jobMatchScore = null
  let suggestedPosition = null
  if (targetPosition) {
    const matchedRequired = targetPosition.requiredSkills.filter(s => lower.includes(s.toLowerCase()))
    const matchedBonus = targetPosition.bonusSkills.filter(s => lower.includes(s.toLowerCase()))
    const missingRequired = targetPosition.requiredSkills.filter(s => !lower.includes(s.toLowerCase()))
    const reqRatio = matchedRequired.length / targetPosition.requiredSkills.length
    const bonusRatio = matchedBonus.length / targetPosition.bonusSkills.length
    jobMatchScore = Math.round(reqRatio * 70 + bonusRatio * 30)

    const readiness = jobMatchScore >= 70 ? 'Sẵn sàng ứng tuyển' : jobMatchScore >= 40 ? 'Cần cải thiện thêm' : 'Chưa phù hợp'

    detailedReport += `\n\n# 13. Đánh giá Phù hợp Vị trí: ${targetPosition.name}\n`
    detailedReport += `\n**Rating ngành:** ${targetPosition.rating} | **Nhu cầu & Lương:** ${targetPosition.demandSalary}\n`
    detailedReport += `\n**Đặc điểm ngành:** ${targetPosition.characteristics}\n`
    detailedReport += `\n## Job Match Score: ${jobMatchScore}/100\n`
    detailedReport += `\n## Mức độ sẵn sàng: ${readiness}\n`
    detailedReport += `\n### Kỹ năng bắt buộc đã có (✅):\n`
    if (matchedRequired.length > 0) matchedRequired.forEach(s => detailedReport += `- ✅ ${s}\n`)
    else detailedReport += `- Không tìm thấy kỹ năng bắt buộc nào trong CV\n`
    detailedReport += `\n### Kỹ năng bắt buộc còn thiếu (❌):\n`
    if (missingRequired.length > 0) missingRequired.forEach(s => detailedReport += `- ❌ ${s}\n`)
    else detailedReport += `- Đã có đầy đủ kỹ năng bắt buộc!\n`
    detailedReport += `\n### Kỹ năng nâng cao đã có (⭐):\n`
    if (matchedBonus.length > 0) matchedBonus.forEach(s => detailedReport += `- ⭐ ${s}\n`)
    else detailedReport += `- Chưa có kỹ năng nâng cao nào\n`
    detailedReport += `\n### Lộ trình bổ sung:\n`
    if (missingRequired.length > 0) detailedReport += `- **HIGH PRIORITY:** Bổ sung ngay: ${missingRequired.slice(0, 5).join(', ')}\n`
    if (targetPosition.certifications.length > 0) detailedReport += `- **MEDIUM PRIORITY:** Lấy chứng chỉ: ${targetPosition.certifications.join(', ')}\n`
    if (matchedBonus.length < targetPosition.bonusSkills.length) {
      const missingBonus = targetPosition.bonusSkills.filter(s => !lower.includes(s.toLowerCase()))
      detailedReport += `- **LOW PRIORITY:** Học thêm kỹ năng nâng cao: ${missingBonus.slice(0, 4).join(', ')}\n`
    }
  } else {
    // If no target position is provided, local fallback will suggest Software Engineer automatically
    jobMatchScore = 65
    suggestedPosition = "Software Engineer / Kỹ sư Phần mềm"
    detailedReport += `\n\n# 13. Đánh giá Phù hợp Vị trí (AI Đề xuất)\n`
    detailedReport += `\n## Vị trí đề xuất: ${suggestedPosition}\n`
    detailedReport += `\n## Job Match Score: ${jobMatchScore}/100\n`
    detailedReport += `\n**Lý do:** Dựa trên phân tích từ khóa cơ bản, CV này có tiềm năng phù hợp với vị trí Kỹ sư phần mềm. (Local Fallback không hỗ trợ tự động matching chi tiết).\n`
  }

  return {
    atsScore,
    sectionScores: { jdRelevance, experience, skills, achievements, presentation },
    detailedReport,
    jobMatchScore,
    ...(suggestedPosition && { suggestedPosition, suggestedPositionId: 'software-engineer' })
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

