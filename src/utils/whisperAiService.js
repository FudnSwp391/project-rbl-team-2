import { getGroqApiKey, rotateGroqKey } from './aiKeyManager';

/**
 * Transcribes audio blob using Groq Whisper Large V3 API with automatic key rotation.
 * @param {Blob} audioBlob - The audio recording blob.
 * @param {string} languageId - Language code ('vi' or 'en').
 * @param {number} retryCount - Retries count (internal use).
 * @returns {Promise<string>} The transcribed text.
 */
export async function transcribeAudio(audioBlob, languageId = 'vi', retryCount = 0) {
  if (!audioBlob) {
    throw new Error('Audio blob is required for transcription');
  }

  const activeKey = getGroqApiKey();
  if (!activeKey) {
    throw new Error('No Groq API Key available');
  }

  // Map language code to Whisper supported ISO 639-1 code
  const whisperLang = languageId === 'en' ? 'en' : 'vi';

  // Build tech-focused initial prompt to assist Whisper with vocabulary context
  const initialPrompt = whisperLang === 'en'
    ? 'I am answering technical IT interview questions. Technologies include: ReactJS, NodeJS, JavaScript, TypeScript, NextJS, Frontend, Backend, HTML, CSS, SQL, API, GraphQL, Database, Load Balancer, Microservices, Git, Docker, Kubernetes, CI/CD, OOP, MVC, Design Pattern.'
    : 'Tôi đang trả lời câu hỏi phỏng vấn kỹ thuật IT. Các từ chuyên ngành gồm: ReactJS, NodeJS, JavaScript, TypeScript, NextJS, Frontend, Backend, HTML, CSS, SQL, API, GraphQL, Database, Load Balancer, Microservices, Git, Docker, Kubernetes, CI/CD, OOP, MVC, Design Pattern.';

  // Prepare FormData for multipart/form-data request
  const formData = new FormData();
  // Groq Whisper API requires a filename with extension (e.g. webm) to detect MIME format
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', whisperLang);
  formData.append('temperature', '0');
  formData.append('prompt', initialPrompt);

  console.log(`[Whisper STT] Sending request to Groq API. Retry: ${retryCount}, Key Index active.`);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activeKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Whisper STT] Groq returned HTTP ${response.status}:`, errorText);

      // If Rate Limited (429) or Auth error (401/403), rotate key and retry!
      if ((response.status === 429 || response.status === 401 || response.status === 403) && retryCount < 3) {
        console.log(`[Whisper STT] Rate limit/Auth error detected on Groq Key. Rotating key...`);
        rotateGroqKey();
        
        // Wait a short delay if it's a rate limit, then retry
        const delayMs = response.status === 429 ? 1000 : 100;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        return transcribeAudio(audioBlob, languageId, retryCount + 1);
      }

      throw new Error(`Groq Whisper API returned HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('[Whisper STT] Transcription completed successfully. Length:', data.text?.length || 0);
    return data.text || '';
  } catch (error) {
    console.error('[Whisper STT] Fetch error:', error.message);
    if (retryCount < 3) {
      console.log('[Whisper STT] Request failed. Rotating key and retrying...');
      rotateGroqKey();
      return transcribeAudio(audioBlob, languageId, retryCount + 1);
    }
    throw error;
  }
}
