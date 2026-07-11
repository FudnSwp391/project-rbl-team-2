/**
 * Google Cloud Text-to-Speech API integration.
 * Uses the official REST API with an API Key for high-quality Vietnamese WaveNet voices.
 * 
 * Endpoint: https://texttospeech.googleapis.com/v1/text:synthesize?key=API_KEY
 * Docs: https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize
 */

const GOOGLE_CLOUD_TTS_API_KEY = import.meta.env.VITE_GOOGLE_CLOUD_TTS_API_KEY || '';

// Voice mapping per language
const VOICE_CONFIG = {
  vi: {
    languageCode: 'vi-VN',
    name: 'vi-VN-Wavenet-A', // Female, natural WaveNet voice
    ssmlGender: 'FEMALE',
  },
  en: {
    languageCode: 'en-US',
    name: 'en-US-Wavenet-F', // Female, natural WaveNet voice
    ssmlGender: 'FEMALE',
  },
};

/**
 * Splits long text into chunks that fit within Google Cloud TTS's 5000 byte limit.
 * Splits on sentence boundaries for natural-sounding output.
 */
function splitTextIntoChunks(text, maxLength = 4500) {
  if (text.length <= maxLength) return [text];

  const chunks = [];
  const sentences = text.split(/(?<=[.!?;:\n])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > maxLength) {
      if (current.trim()) chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

/**
 * Converts text to speech using Google Cloud TTS API.
 * Returns a blob URL for the synthesized audio.
 *
 * @param {string} text - The text content to speak.
 * @param {string} lang - Language code ('vi' or 'en').
 * @returns {Promise<string>} - Object URL of the audio file.
 */
export async function getGoogleCloudTtsAudioUrl(text, lang = 'vi') {
  if (!text || !text.trim()) {
    throw new Error('[Google Cloud TTS] Text is required');
  }

  if (!GOOGLE_CLOUD_TTS_API_KEY) {
    throw new Error('[Google Cloud TTS] No API key configured (VITE_GOOGLE_CLOUD_TTS_API_KEY)');
  }

  const voiceConfig = VOICE_CONFIG[lang] || VOICE_CONFIG['vi'];
  const chunks = splitTextIntoChunks(text);

  console.log(`[Google Cloud TTS] Synthesizing ${chunks.length} chunk(s) in ${lang}...`);

  const base64Parts = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const requestBody = {
      input: { text: chunk },
      voice: {
        languageCode: voiceConfig.languageCode,
        name: voiceConfig.name,
        ssmlGender: voiceConfig.ssmlGender,
      },
      audioConfig: {
        audioEncoding: 'OGG_OPUS', // Best native support in Chrome/Firefox
        speakingRate: 1.0,
        pitch: 0,
        volumeGainDb: 0,
      },
    };

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_CLOUD_TTS_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Google Cloud TTS] API Error (chunk ${i + 1}):`, errorText);
      throw new Error(`Google Cloud TTS API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.audioContent) {
      throw new Error('[Google Cloud TTS] No audioContent in response');
    }

    base64Parts.push(data.audioContent);
  }

  // For single chunk, use data URI directly (most reliable playback)
  if (base64Parts.length === 1) {
    const audioUrl = `data:audio/ogg;base64,${base64Parts[0]}`;
    console.log('[Google Cloud TTS] ✓ Audio synthesized successfully');
    return audioUrl;
  }

  // For multiple chunks, decode and concatenate into a single blob
  const audioBlobs = [];
  for (const base64 of base64Parts) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let j = 0; j < binaryString.length; j++) {
      bytes[j] = binaryString.charCodeAt(j);
    }
    audioBlobs.push(new Blob([bytes], { type: 'audio/ogg' }));
  }

  const combinedBlob = new Blob(audioBlobs, { type: 'audio/ogg' });
  const blobUrl = URL.createObjectURL(combinedBlob);

  console.log('[Google Cloud TTS] ✓ Audio synthesized successfully');
  return blobUrl;
}
