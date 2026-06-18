/**
 * Google Translate Text-to-Speech API integration for high-quality, free Vietnamese and English voices.
 * Handles text chunking to bypass Google's 200-character limit and concatenates audio blobs.
 */

/**
 * Converts text to speech using Google Translate's TTS API.
 * @param {string} text - The text content to speak.
 * @param {string} lang - Language code ('vi', 'en', etc.).
 * @returns {Promise<string>} - Object URL of the combined audio file.
 */
export async function getGoogleTtsAudioUrl(text, lang = 'vi') {
  if (!text) throw new Error('Text is required for Google Text-to-Speech');

  const maxLen = 160; // Safe threshold for Google Translate TTS character limit
  const chunks = [];
  
  // Clean text and split it by punctuation for natural phrasing, keeping chunks under the length limit
  const sentences = text.split(/([.,!?;:\n]+)/);
  let currentChunk = '';

  for (let part of sentences) {
    if (!part) continue;
    if ((currentChunk + part).length > maxLen) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = part;
    } else {
      currentChunk += part;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Fallback to word splitting if a single sentence is extremely long
  const finalChunks = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxLen) {
      finalChunks.push(chunk);
    } else {
      // Split by whitespace
      const words = chunk.split(/\s+/);
      let subChunk = '';
      for (const word of words) {
        if ((subChunk + ' ' + word).length > maxLen) {
          if (subChunk.trim()) finalChunks.push(subChunk.trim());
          subChunk = word;
        } else {
          subChunk = subChunk ? subChunk + ' ' + word : word;
        }
      }
      if (subChunk.trim()) finalChunks.push(subChunk.trim());
    }
  }

  console.log(`[GoogleTtsService] Chunked text into ${finalChunks.length} parts for TTS`);

  try {
    const blobs = [];
    for (const chunk of finalChunks) {
      const url = `/api/google-tts/translate_tts?client=gtx&ie=UTF-8&tl=${lang}&q=${encodeURIComponent(chunk)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google TTS network response error: ${response.status}`);
      }
      
      const blob = await response.blob();
      blobs.push(blob);
    }

    // Binary concatenation of MP3 chunks works natively in HTML5 audio
    const combinedBlob = new Blob(blobs, { type: 'audio/mpeg' });
    return URL.createObjectURL(combinedBlob);
  } catch (error) {
    console.error('[GoogleTtsService] Error building Google TTS audio URL:', error);
    throw error;
  }
}
