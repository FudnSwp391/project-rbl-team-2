import { 
  getGroqApiKey, 
  rotateGroqKey, 
  getGeminiApiKey, 
  rotateGeminiKey,
  getOpenRouterApiKey,
  rotateOpenRouterKey
} from './aiKeyManager';
import { GoogleGenAI } from '@google/genai';

// Groq models to try in order (large → small fallback)
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant'
];

/**
 * Generate customized interview questions using Groq or Gemini AI.
 */
export async function generateInterviewQuestions({ industry, difficulty, questionType, count, cvText, language }) {
  const finalCount = count || 5;
  const industryLabel = industry?.nameVi || 'Công nghệ thông tin';
  const difficultyLabel = difficulty?.name || 'Trung bình';
  const typeLabel = questionType?.name || 'Câu hỏi kỹ thuật';
  const typeId = questionType?.id || 'technical';
  const diffId = difficulty?.id || 'medium';

  const activeGroqKey = getGroqApiKey();
  const activeGeminiKey = getGeminiApiKey();
  const activeOpenRouterKey = getOpenRouterApiKey();

  const hasGroq = activeGroqKey && activeGroqKey.trim() !== '';
  const hasGemini = activeGeminiKey && activeGeminiKey.trim() !== '';
  const hasOpenRouter = activeOpenRouterKey && activeOpenRouterKey.trim() !== '';

  console.log('[AI Interview] API Keys status:', { hasGroq, hasGemini, hasOpenRouter });

  if (!hasGroq && !hasGemini && !hasOpenRouter) {
    throw new Error('Thiếu cấu hình API Key. Vui lòng thiết lập API Keys trong file .env');
  }

  const langId = language?.id || 'vi';

  // Build prompt — keep it SHORT to avoid TPM limits
  const prompt = buildPrompt({ cvText, finalCount, industryLabel, difficultyLabel, typeLabel, typeId, diffId, industry, langId });

  // ── 1. Try Groq — multiple models ──
  if (hasGroq) {
    for (const model of GROQ_MODELS) {
      try {
        console.log(`[AI Interview] Trying Groq model: ${model}...`);
        const result = await callGroq(prompt, model, typeId, diffId);
        if (result) return result;
      } catch (error) {
        console.warn(`[AI Interview] Groq ${model} failed, attempting next step:`, error.message);
      }
    }
  }

  // ── 2. Try Gemini ──
  if (hasGemini) {
    try {
      console.log('[AI Interview] Trying Gemini...');
      const result = await callGemini(prompt, typeId, diffId);
      if (result) return result;
    } catch (error) {
      console.warn('[AI Interview] Gemini failed, attempting next step:', error.message);
    }
  }

  // ── 3. Try OpenRouter ──
  if (hasOpenRouter) {
    try {
      console.log('[AI Interview] Trying OpenRouter (Gemini Flash)...');
      const result = await callOpenRouter(prompt, typeId, diffId);
      if (result) return result;
    } catch (error) {
      console.warn('[AI Interview] OpenRouter failed:', error.message);
    }
  }

  throw new Error('Không thể kết nối đến bất kỳ máy chủ AI nào (Groq, Gemini, OpenRouter) hoặc tất cả API Key trong Pool đều bị Rate Limit. Vui lòng thử lại sau ít phút!');
}

/**
 * Build a concise prompt that stays within token limits.
 */
function buildPrompt({ cvText, finalCount, industryLabel, difficultyLabel, typeLabel, typeId, diffId, industry, langId }) {
  const isEnglish = langId === 'en';
  const jsonExample = isEnglish
    ? `{"questions":[{"id":1,"content":"Your question...","type":"${typeId}","difficulty":"${diffId}"}]}`
    : `{"questions":[{"id":1,"content":"Câu hỏi...","type":"${typeId}","difficulty":"${diffId}"}]}`;

  if (cvText) {
    // Limit CV to 2000 chars to stay within free-tier TPM limits (12k tokens/min)
    const trimmedCV = cvText.substring(0, 2000);

    if (isEnglish) {
      return `You are a senior IT interview expert. Generate ${finalCount} interview questions IN ENGLISH based on the CV below.

Difficulty: ${difficultyLabel} | Type: ${typeLabel}

CV:
${trimmedCV}

Requirements: Ask about SPECIFIC projects and technologies in the CV. No generic theory questions. Questions must be practical and insightful.
Return JSON only, no markdown: ${jsonExample}`;
    }

    return `Bạn là chuyên gia phỏng vấn IT cấp cao. Tạo ${finalCount} câu hỏi phỏng vấn TIẾNG VIỆT dựa trên CV bên dưới.

Độ khó: ${difficultyLabel} | Dạng: ${typeLabel}

CV:
${trimmedCV}

Yêu cầu: Hỏi về dự án, công nghệ CỤ THỂ trong CV. Không hỏi lý thuyết chung. Câu hỏi phải thực tế, sâu sắc.
Trả về JSON duy nhất, không markdown: ${jsonExample}`;
  }

  if (isEnglish) {
    return `You are a senior IT interview expert. Generate ${finalCount} interview questions IN ENGLISH.

Industry: ${industryLabel} (${industry?.name || 'IT'}) | Difficulty: ${difficultyLabel} | Type: ${typeLabel}

Requirements: Practical scenario-based questions, no definitions. Include architecture, performance optimization, error handling.
Return JSON only, no markdown: ${jsonExample}`;
  }

  return `Bạn là chuyên gia phỏng vấn IT cấp cao. Tạo ${finalCount} câu hỏi phỏng vấn TIẾNG VIỆT.

Ngành: ${industryLabel} (${industry?.name || 'IT'}) | Độ khó: ${difficultyLabel} | Dạng: ${typeLabel}

Yêu cầu: Câu hỏi tình huống thực tế, không hỏi định nghĩa. Bao gồm kiến trúc, tối ưu hiệu năng, xử lý lỗi.
Trả về JSON duy nhất, không markdown: ${jsonExample}`;
}

/**
 * Call Groq API with a specific model. Auto-rotures on 429 rate limit or 401/403 key issues.
 */
async function callGroq(prompt, model, typeId, diffId, retryCount = 0) {
  const activeKey = getGroqApiKey();
  console.log(`[AI Interview] Calling Groq API with key index. Remaining retries: ${3 - retryCount}`);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a professional technical interviewer. Respond with valid JSON only, no markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[AI Interview] Groq ${model} returned ${response.status}:`, errorText);

      // If Rate Limit (429) or Key Auth Error (401/403), rotate the Groq API key and retry instantly!
      if ((response.status === 429 || response.status === 401 || response.status === 403) && retryCount < 3) {
        console.log(`[AI Interview] Rate limit (429) or Key Auth error detected on Groq Key. Rotating Groq Key...`);
        rotateGroqKey();
        
        // Wait a short delay if it's 429 to avoid hammering, but retry immediately with the fresh key
        const delayMs = response.status === 429 ? 1000 : 100;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        return callGroq(prompt, model, typeId, diffId, retryCount + 1);
      }

      throw new Error(`Groq ${model}: HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    console.log('[AI Interview] Groq raw response length:', text.length);
    return parseQuestionsJson(text, typeId, diffId);
  } catch (error) {
    console.error('[AI Interview] Groq fetch error:', error.message);
    if (retryCount < 3) {
      console.log(`[AI Interview] Error calling Groq. Rotating Groq Key...`);
      rotateGroqKey();
      return callGroq(prompt, model, typeId, diffId, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Call Gemini API with auto-rotation.
 */
async function callGemini(prompt, typeId, diffId, retryCount = 0) {
  const activeKey = getGeminiApiKey();
  console.log(`[AI Interview] Calling Gemini SDK. Remaining retries: ${3 - retryCount}`);

  try {
    const ai = new GoogleGenAI({ apiKey: activeKey });
    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a professional technical interviewer. Respond with valid JSON only, no markdown.',
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    const text = result.text;
    console.log('[AI Interview] Gemini raw response length:', text.length);
    return parseQuestionsJson(text, typeId, diffId);
  } catch (error) {
    console.error('[AI Interview] Gemini SDK error:', error.message);
    if (retryCount < 3) {
      console.log(`[AI Interview] Error calling Gemini. Rotating Gemini Key...`);
      rotateGeminiKey();
      return callGemini(prompt, typeId, diffId, retryCount + 1);
    }
    throw error;
  }
}

// OpenRouter free models to try in order (verified June 2026)
const OPENROUTER_MODELS = [
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-120b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'openai/gpt-oss-20b:free'
];

/**
 * Call OpenRouter API. Tries multiple free models. Auto-rotates key on rate limits.
 */
async function callOpenRouter(prompt, typeId, diffId, modelIndex = 0, retryCount = 0) {
  if (modelIndex >= OPENROUTER_MODELS.length) {
    throw new Error('OpenRouter: All free models exhausted');
  }

  const activeKey = getOpenRouterApiKey();
  const model = OPENROUTER_MODELS[modelIndex];
  console.log(`[AI Interview] Calling OpenRouter model: ${model}. Retry: ${retryCount}`);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`,
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'AI Mock Interview'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a professional technical interviewer. Respond with valid JSON only, no markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[AI Interview] OpenRouter ${model} returned ${response.status}:`, errorText);

      // 404 = model not found → try next model
      if (response.status === 404) {
        return callOpenRouter(prompt, typeId, diffId, modelIndex + 1, 0);
      }
      // 429/401/403 = rotate key and retry same model
      if ((response.status === 429 || response.status === 401 || response.status === 403) && retryCount < 2) {
        rotateOpenRouterKey();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return callOpenRouter(prompt, typeId, diffId, modelIndex, retryCount + 1);
      }
      throw new Error(`OpenRouter ${model}: HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    console.log('[AI Interview] OpenRouter raw response length:', text.length);
    const result = parseQuestionsJson(text, typeId, diffId);
    if (result) return result;

    // Parse failed → try next model
    console.warn(`[AI Interview] OpenRouter ${model} returned unparseable response. Trying next model...`);
    return callOpenRouter(prompt, typeId, diffId, modelIndex + 1, 0);
  } catch (error) {
    console.error(`[AI Interview] OpenRouter ${model} error:`, error.message);
    // Try next model on any error
    if (modelIndex + 1 < OPENROUTER_MODELS.length) {
      return callOpenRouter(prompt, typeId, diffId, modelIndex + 1, 0);
    }
    throw error;
  }
}

/**
 * Call Groq API and return raw text output. Auto-rotates keys on failure.
 */
async function callGroqRaw(prompt, model, systemInstruction, retryCount = 0) {
  const activeKey = getGroqApiKey();
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[AI Raw Groq] ${model} returned ${response.status}:`, errorText);

      if ((response.status === 429 || response.status === 401 || response.status === 403) && retryCount < 3) {
        rotateGroqKey();
        const delayMs = response.status === 429 ? 1000 : 100;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return callGroqRaw(prompt, model, systemInstruction, retryCount + 1);
      }
      throw new Error(`Groq ${model}: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    if (retryCount < 3) {
      rotateGroqKey();
      return callGroqRaw(prompt, model, systemInstruction, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Call Gemini API and return raw text output. Auto-rotates keys on failure.
 */
async function callGeminiRaw(prompt, retryCount = 0) {
  const activeKey = getGeminiApiKey();
  try {
    const ai = new GoogleGenAI({ apiKey: activeKey });
    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    return result.text;
  } catch (error) {
    if (retryCount < 3) {
      rotateGeminiKey();
      return callGeminiRaw(prompt, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Call OpenRouter API and return raw text output. Auto-rotates keys on failure.
 */
async function callOpenRouterRaw(prompt, modelIndex = 0, systemInstruction, retryCount = 0) {
  if (modelIndex >= OPENROUTER_MODELS.length) {
    throw new Error('OpenRouter: All free models exhausted');
  }
  const activeKey = getOpenRouterApiKey();
  const model = OPENROUTER_MODELS[modelIndex];
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`,
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'AI Mock Interview'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      if (response.status === 404) {
        return callOpenRouterRaw(prompt, modelIndex + 1, systemInstruction, 0);
      }
      if ((response.status === 429 || response.status === 401 || response.status === 403) && retryCount < 2) {
        rotateOpenRouterKey();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return callOpenRouterRaw(prompt, modelIndex, systemInstruction, retryCount + 1);
      }
      throw new Error(`OpenRouter ${model}: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    if (modelIndex + 1 < OPENROUTER_MODELS.length) {
      return callOpenRouterRaw(prompt, modelIndex + 1, systemInstruction, 0);
    }
    throw error;
  }
}

/**
 * Evaluate the interview Q&A pairs using rotation-supported AI.
 */
export async function evaluateInterviewAnswers({ questionAnswerPairs, industry, difficulty, questionType, language }) {
  const activeGroqKey = getGroqApiKey();
  const activeGeminiKey = getGeminiApiKey();
  const activeOpenRouterKey = getOpenRouterApiKey();

  const hasGroq = activeGroqKey && activeGroqKey.trim() !== '';
  const hasGemini = activeGeminiKey && activeGeminiKey.trim() !== '';
  const hasOpenRouter = activeOpenRouterKey && activeOpenRouterKey.trim() !== '';

  if (!hasGroq && !hasGemini && !hasOpenRouter) {
    throw new Error('Thiếu cấu hình API Key. Vui lòng thiết lập API Keys trong file .env');
  }

  const langId = language?.id || 'vi';
  const isEnglish = langId === 'en';

  const industryName = industry?.nameVi || industry?.name || 'IT';
  const difficultyName = difficulty?.name || 'Medium';

  const prompt = buildEvaluationPrompt({ questionAnswerPairs, industryName, difficultyName, isEnglish });

  const systemInstruction = isEnglish
    ? 'You are a professional technical IT interviewer. Evaluate the candidate answers and return a JSON object ONLY.'
    : 'Bạn là chuyên gia phỏng vấn kỹ thuật IT cấp cao. Hãy đánh giá các câu trả lời của ứng viên và trả về duy nhất một đối tượng JSON.';

  // 1. Try Groq
  if (hasGroq) {
    for (const model of GROQ_MODELS) {
      try {
        console.log(`[AI Evaluation] Trying Groq model: ${model}...`);
        const text = await callGroqRaw(prompt, model, systemInstruction);
        const parsed = parseEvaluationJson(text);
        if (parsed) return parsed;
      } catch (error) {
        console.warn(`[AI Evaluation] Groq ${model} failed:`, error.message);
      }
    }
  }

  // 2. Try Gemini
  if (hasGemini) {
    try {
      console.log('[AI Evaluation] Trying Gemini...');
      const text = await callGeminiRaw(prompt);
      const parsed = parseEvaluationJson(text);
      if (parsed) return parsed;
    } catch (error) {
      console.warn('[AI Evaluation] Gemini failed:', error.message);
    }
  }

  // 3. Try OpenRouter
  if (hasOpenRouter) {
    try {
      console.log('[AI Evaluation] Trying OpenRouter...');
      const text = await callOpenRouterRaw(prompt, 0, systemInstruction);
      const parsed = parseEvaluationJson(text);
      if (parsed) return parsed;
    } catch (error) {
      console.warn('[AI Evaluation] OpenRouter failed:', error.message);
    }
  }

  throw new Error('Không thể kết nối đến bất kỳ máy chủ AI nào để chấm điểm hoặc tất cả API Key trong Pool đều bị Rate Limit. Vui lòng thử lại sau!');
}

/**
 * Build the evaluation prompt for AI.
 */
function buildEvaluationPrompt({ questionAnswerPairs, industryName, difficultyName, isEnglish }) {
  const qaString = questionAnswerPairs.map((pair, idx) => {
    const m = pair.metrics || {
      duration: 0,
      wpm: 0,
      hesitations: [],
      hesitationCount: 0,
      silenceDuration: 0,
      eyeContactPercent: 100,
      headPosePercent: 100,
      volumeLevel: 0,
      pitchStability: 100,
      calculatedConfidence: 100
    };
    const fillerWords = m.hesitations && m.hesitations.length > 0 ? m.hesitations.join(', ') : 'None';
    return `Question #${idx + 1}: ${pair.question}
Answer: ${pair.answer || '[No Answer / Silent]'}
Physical Metrics:
- Speaking Duration: ${m.duration}s
- Speaking Rate: ${m.wpm} WPM
- Filler Words Used: ${fillerWords} (Total: ${m.hesitationCount})
- Silence Duration: ${m.silenceDuration}s
- Eye Contact: ${m.eyeContactPercent}%
- Head Pose Straight: ${m.headPosePercent}%
- Vocal Volume: ${m.volumeLevel}%
- Vocal Pitch Stability: ${m.pitchStability}%
- Calculated Confidence Score: ${m.calculatedConfidence}/100
`;
  }).join('\n');

  if (isEnglish) {
    return `You are a professional IT technical interviewer. Evaluate the candidate's answers to the interview questions below.
    
Industry: ${industryName} | Difficulty: ${difficultyName}

Interview Q&A with Measured Metrics:
${qaString}

CRITICAL RULES FOR EVALUATION:
1. If the candidate's answer is "[No Answer / Silent]" or empty/blank, the scores for that question MUST be 0.
2. For such unanswered questions, the "aiEvaluation" field must explain that "No answer was provided by the candidate."
3. Do not give any partial credit for unanswered questions.
4. Review the candidate's physical metrics (WPM, filler words, eye contact, vocal volume, and pitch stability). The pre-calculated Confidence Score based on these physical metrics is provided for each question. Use this score and indicators to write qualitative feedback about their posture and speech style (do not recalculate it).

Return a valid JSON object ONLY. Do not include markdown formatting or backticks. The JSON structure MUST be exactly:
{
  "technicalAccuracy": 85,
  "completeness": 80,
  "examples": 70,
  "communication": 75,
  "overallScore": 82,
  "grade": "B+",
  "aiFeedback": "Brief summary of strengths, weaknesses and overall performance...",
  "skills": {
    "pronunciation": 85,
    "vocabulary": 80,
    "communication": 75,
    "confidence": 80,
    "technicalAccuracy": 90
  },
  "strengths": [
    "strength detail 1",
    "strength detail 2"
  ],
  "weaknesses": [
    "weakness detail 1",
    "weakness detail 2"
  ],
  "improvements": [
    { "priority": "high", "text": "high priority improvement task..." },
    { "priority": "medium", "text": "medium priority task..." }
  ],
  "careerAdvice": "advice for career progression based on their performance...",
  "questionReviews": [
    {
      "id": 1,
      "question": "Question #1 text",
      "userAnswer": "Candidate's answer text",
      "score": 85,
      "aiEvaluation": "detailed evaluation of this specific answer highlighting technical accuracy, completeness, and examples"
    }
  ],
  "resources": [
    { "title": "React Lifecycle Methods", "type": "Documentation", "url": "https://react.dev/reference/react" }
  ]
}

Ensure all texts, comments, and reviews are in English. All resources MUST have real, functional URLs matching the recommended topic. Do not return '#' as the URL.`;
  }

  return `Bạn là chuyên gia phỏng vấn kỹ thuật IT cấp cao. Hãy đánh giá các câu trả lời của ứng viên dưới đây.

Ngành nghề: ${industryName} | Độ khó: ${difficultyName}

Chi tiết câu hỏi, câu trả lời kèm theo các chỉ số vật lý đo được:
${qaString}

QUY TẮC CHẤM ĐIỂM QUAN TRỌNG:
1. Nếu câu trả lời của ứng viên là "[No Answer / Silent]" hoặc để trống/rỗng, điểm số cho câu hỏi đó BẮT BUỘC phải là 0.
2. Đối với những câu hỏi không có câu trả lời này, phần nhận xét "aiEvaluation" phải ghi rõ là "Ứng viên không trả lời câu hỏi này."
3. Hãy xem xét các chỉ số vật lý như: từ ngập ngừng (Filler Words), tốc độ nói (WPM), giao tiếp mắt (Eye Contact), tư thế đầu, âm lượng nói và độ ổn định giọng nói để đưa ra nhận xét. Điểm tự tin (Confidence) của ứng viên đã được chúng tôi đo đạc vật lý ở trên. Bạn hãy sử dụng điểm tự tin này để đưa ra nhận xét phù hợp (không tự chấm lại điểm tự tin).

Trả về một đối tượng JSON duy nhất và hợp lệ. Không bao gồm khối code markdown hay bất kỳ giải thích nào ngoài JSON. Cấu trúc JSON phải chính xác như sau:
{
  "technicalAccuracy": 85,
  "completeness": 80,
  "examples": 70,
  "communication": 75,
  "overallScore": 82,
  "grade": "B+",
  "aiFeedback": "Nhận xét tổng quan ngắn gọn về chuyên môn kỹ thuật, độ hoàn thiện câu trả lời, cách lấy ví dụ và tác phong giao tiếp của ứng viên...",
  "skills": {
    "pronunciation": 85,
    "vocabulary": 80,
    "communication": 75,
    "confidence": 80,
    "technicalAccuracy": 90
  },
  "strengths": [
    "Chi tiết điểm mạnh 1",
    "Chi tiết điểm mạnh 2"
  ],
  "weaknesses": [
    "Điểm cần cải thiện 1",
    "Điểm cần cải thiện 2"
  ],
  "improvements": [
    { "priority": "high", "text": "Hành động cải thiện quan trọng..." },
    { "priority": "medium", "text": "Hành động cải thiện trung bình..." }
  ],
  "careerAdvice": "Lời khuyên phát triển sự nghiệp dựa trên kết quả phỏng vấn...",
  "questionReviews": [
    {
      "id": 1,
      "question": "Nội dung câu hỏi #1",
      "userAnswer": "Nội dung câu trả lời của ứng viên",
      "score": 85,
      "aiEvaluation": "Nhận xét chi tiết cho câu trả lời này về mặt kỹ thuật, mức độ hoàn thiện và các ví dụ thực tế được đưa ra"
    }
  ],
  "resources": [
    { "title": "Tài liệu React Hooks", "type": "Tài liệu", "url": "https://vi.react.dev/reference/react" }
  ]
}

Hãy đảm bảo toàn bộ nhận xét, đánh giá và tài liệu đề xuất đều được viết bằng Tiếng Việt. Tất cả các tài liệu đề xuất trong danh sách 'resources' BẮT BUỘC phải có đường dẫn URL thực tế, chính xác và hoạt động được (ví dụ: các trang tài liệu chính thức như react.dev, developer.mozilla.org, w3schools.com, hoặc link video Youtube thực tế liên quan). Tuyệt đối không được trả về '#'.`;
}

/**
 * Parse the raw AI response text into the structured evaluation JSON.
 */
function parseEvaluationJson(text) {
  if (!text || text.trim().length === 0) return null;

  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^[^\{\[]*/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed.overallScore === 'number') {
      return parsed;
    }
  } catch (e) {
    const bracketJson = extractJsonByBracketMatching(cleaned);
    if (bracketJson) {
      try {
        const parsed = JSON.parse(bracketJson);
        if (parsed && typeof parsed.overallScore === 'number') {
          return parsed;
        }
      } catch (err) {}
    }
  }
  console.warn('[AI Evaluation] Failed to parse response:', text);
  return null;
}

/**
 * Parse JSON response — multi-strategy parser with bracket matching + multiple fallbacks.
 */
function parseQuestionsJson(text, defaultType, defaultDifficulty) {
  if (!text || text.trim().length === 0) {
    console.warn('[AI Interview] Empty response text');
    return null;
  }

  // 1. Clean markdown code fences and trim
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^[^\{\[]*/, '') // Remove any leading non-JSON text
    .trim();

  // Strategy 1: Try direct JSON.parse first (fastest path)
  const directResult = tryParseAndExtract(cleaned, defaultType, defaultDifficulty);
  if (directResult) return directResult;

  // Strategy 2: Balanced bracket matching
  const bracketJson = extractJsonByBracketMatching(cleaned);
  if (bracketJson) {
    const result = tryParseAndExtract(bracketJson, defaultType, defaultDifficulty);
    if (result) return result;
  }

  // Strategy 3: Find {"questions": pattern specifically
  const questionsMatch = text.match(/\{\s*"questions"\s*:\s*\[[\s\S]*?\]\s*\}/);
  if (questionsMatch) {
    const result = tryParseAndExtract(questionsMatch[0], defaultType, defaultDifficulty);
    if (result) return result;
  }

  // Strategy 4: Find array pattern [...]
  const arrayMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  if (arrayMatch) {
    const result = tryParseAndExtract(arrayMatch[0], defaultType, defaultDifficulty);
    if (result) return result;
  }

  console.warn('[AI Interview] All parse strategies failed for response length:', text.length);
  return null;
}

/**
 * Extract JSON block using balanced bracket matching (handles nested objects + strings).
 */
function extractJsonByBracketMatching(text) {
  const startIndex = text.search(/[\{\[]/);
  if (startIndex === -1) return null;

  const startChar = text[startIndex];
  const endChar = startChar === '{' ? '}' : ']';
  let depth = 0;
  let endIndex = -1;
  let inString = false;
  let escape = false;

  for (let i = startIndex; i < text.length; i++) {
    const c = text[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (!inString) {
      if (c === '{' || c === '[') depth++;
      else if (c === '}' || c === ']') {
        depth--;
        if (depth === 0) { endIndex = i; break; }
      }
    }
  }

  if (endIndex === -1) return null;
  return text.substring(startIndex, endIndex + 1);
}

/**
 * Try to JSON.parse a string and extract questions array from it.
 */
function tryParseAndExtract(jsonStr, defaultType, defaultDifficulty) {
  try {
    const parsed = JSON.parse(jsonStr);
    let questions = [];

    if (Array.isArray(parsed)) {
      questions = parsed;
    } else if (parsed && Array.isArray(parsed.questions)) {
      questions = parsed.questions;
    } else if (parsed && typeof parsed === 'object') {
      // Find the first array value in the object
      for (const key of Object.keys(parsed)) {
        if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
          questions = parsed[key];
          break;
        }
      }
    }

    if (questions.length > 0) {
      const mapped = questions
        .filter(q => q && typeof q === 'object')
        .map((q, idx) => ({
          id: q.id || idx + 1,
          content: q.content || q.question || q.text || q.cau_hoi || q.noi_dung || '',
          type: q.type || defaultType || 'technical',
          difficulty: q.difficulty || defaultDifficulty || 'medium'
        }))
        .filter(q => q.content && q.content.trim().length > 0);

      if (mapped.length > 0) {
        console.log(`[AI Interview] Successfully parsed ${mapped.length} questions`);
        return mapped;
      }
    }
  } catch (err) {
    // Silent — caller will try next strategy
  }
  return null;
}
