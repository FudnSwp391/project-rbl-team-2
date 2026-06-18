/**
 * Technical IT dictionary mapping phonetic Vietnamese approximations or common
 * misheard English terms (from Chrome's Web Speech API or Whisper) to standard IT terms.
 */
export const itDictionary = {
  // Common English Mishearings (from mixed language speech/accents)
  'business friend': 'bên phía Frontend',
  'froman batm': 'Frontend Backend',
  'froman': 'Frontend',
  'batm': 'Backend',
  'bat man': 'Backend',
  'data bay': 'Database',
  'an data bay': 'và Database',
  'lotta vice': 'load balancer',
  'load ba': 'load balancer',
  'lốt ba': 'load balancer',
  
  // Standard IT Capitalizations
  'frontend': 'Frontend',
  'backend': 'Backend',
  'database': 'Database',
  'api': 'API',
  'sql': 'SQL',
  'nosql': 'NoSQL',
  'mongodb': 'MongoDB',
  'mysql': 'MySQL',
  'postgresql': 'PostgreSQL',
  'redis': 'Redis',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'git': 'Git',
  'github': 'GitHub',
  'gitlab': 'GitLab',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'react': 'React',
  'angular': 'Angular',
  'vue': 'Vue',
  'nextjs': 'NextJS',
  'html': 'HTML',
  'css': 'CSS',
  
  // Frontend Phonetic
  'ri át': 'React',
  'ri ác': 'React',
  'ri ách': 'React',
  'vi ắc': 'React',
  'vi e': 'React',
  're ác': 'React',
  'rì ách': 'React',
  'rì ác': 'React',
  'di ác': 'React',
  'phong en': 'Frontend',
  'phông en': 'Frontend',
  'phờ rôn en': 'Frontend',
  'phờ rông en': 'Frontend',
  'xong end': 'Frontend',
  'friend end': 'Frontend',
  'frienden': 'Frontend',
  'phờ ron en': 'Frontend',
  'phiên en': 'Frontend',
  'bách en': 'Backend',
  'bác en': 'Backend',
  'pác en': 'Backend',
  'bách end': 'Backend',
  'bác end': 'Backend',
  'pác end': 'Backend',
  'bách em': 'Backend',
  'j va s crip': 'JavaScript',
  'gia va sờ cờ ríp': 'JavaScript',
  'da va sít': 'JavaScript',
  'da va sờ ríp': 'JavaScript',
  'js': 'JS',
  'h t m l': 'HTML',
  'hát tê mờ lờ': 'HTML',
  'c s s': 'CSS',
  'xê ét ét': 'CSS',
  'xi ét ét': 'CSS',
  
  // Backend & DB Phonetic
  'nốt di ét': 'NodeJS',
  'nốt j e': 'NodeJS',
  'nốt giây ét': 'NodeJS',
  'node': 'Node',
  'sắc que': 'Software',
  'sóc que': 'Software',
  'đa ta base': 'Database',
  'đa ta bây': 'Database',
  'đa ta bét': 'Database',
  'data bây': 'Database',
  'data bay': 'Database',
  'đa ta bay': 'Database',
  'đại tá bay': 'Database',
  'đập đá bay': 'Database',
  'đáp đá bây': 'Database',
  'ép cu en': 'SQL',
  'síc cồ': 'SQL',
  'xi cồ': 'SQL',
  'mai ét cu el': 'MySQL',
  'mông gô': 'Mongo',
  'mông gô đi bi': 'MongoDB',
  'a bi ai': 'API',
  'ây pi ai': 'API',
  'e pi ai': 'API',
  'áp bi ai': 'API',
  'áp pi ai': 'API',
  'ây bi ai': 'API',
  'ra sút': 'RESTful',
  'rết bun': 'RESTful',
  'rết full': 'RESTful',

  // System & Architecture Phonetic
  'phê guốc': 'Framework',
  'phờ rêm guốc': 'Framework',
  'phờ rêm uốc': 'Framework',
  'phờ rem uốc': 'Framework',
  'câm bô nần': 'Component',
  'com pô nần': 'Component',
  'ác chi tếch chờ': 'Architecture',
  'kiến trúc': 'Architecture',
  'bơ form mần': 'Performance',
  'pơ fom mần': 'Performance',
  'bơ phom mần': 'Performance',
  'ốp dếch o ri ên tịp': 'Object Oriented',
  'hướng đối tượng': 'Object Oriented (OOP)',
  'đi zai pát tần': 'Design Pattern',
  'đề size bát trần': 'Design Pattern',
  'cốt': 'Code',
  'sốt cốt': 'Source code',
  'gít húp': 'GitHub',
  'gít hấp': 'GitHub',
  'gít': 'Git',
  'đốc cờ': 'Docker',
  'đốc cơ': 'Docker',
  'độc cơ': 'Docker',
  'đọc cơ': 'Docker',
  'cúp bơ nét': 'Kubernetes',
  'rê đít': 'Redis',
  'rét đít': 'Redis',
  'mai crô sơ vít': 'Microservices',
  'mai cro sơ vit': 'Microservices',
  'mai crô sơ dịch': 'Microservices',
  'loát ba lân sơ': 'Load Balancer',
  'lốt ba lân sơ': 'Load Balancer',
  'lốt ba lân': 'Load Balancer',
  'xi cd': 'CI/CD',
  'ci cd': 'CI/CD',
  'xi ai xi đi': 'CI/CD',
  'đáp óp': 'DevOps',
  'đép óp': 'DevOps',
  'hát tê tê bê': 'HTTP',
  'hát tê tê bê ét': 'HTTPS',
  'dét sơn': 'JSON',
  'giê sơn': 'JSON',
  'nét di ét': 'NextJS',
  'nét j s': 'Next.js',
  'gờ ráp cu eo': 'GraphQL',
  'gờ ráp cu el': 'GraphQL',
  'pốt gờ rê': 'PostgreSQL',
  'pốt gre': 'PostgreSQL'
};

/**
 * Escapes special regex characters.
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalizes and fixes common technical vocabulary in Speech-to-Text transcripts.
 * Uses Unicode-aware lookarounds to prevent matching partial words for both ASCII
 * and Vietnamese accented characters.
 * 
 * @param {string} text - The input transcript.
 * @returns {string} The transcript with technical vocabulary corrected.
 */
export function fixITVocabulary(text) {
  if (!text) return text;
  let fixedText = text;

  // Sort keys by descending length to prevent shorter substrings from matching inside longer phrases
  const sortedKeys = Object.keys(itDictionary).sort((a, b) => b.length - a.length);

  // Iterate over each sorted dictionary key
  sortedKeys.forEach(key => {
    // (?<!\p{L}|\p{N}) - Lookbehind: Match is NOT preceded by a letter or number (Unicode-aware)
    // (?!\p{L}|\p{N})  - Lookahead: Match is NOT followed by a letter or number (Unicode-aware)
    // flag 'u' is required for Unicode property escapes \p, flag 'i' for case-insensitive
    const regex = new RegExp(`(?<!\\p{L}|\\p{N})${escapeRegExp(key)}(?!\\p{L}|\\p{N})`, 'gui');
    fixedText = fixedText.replace(regex, itDictionary[key]);
  });

  return fixedText;
}

/**
 * Checks if the Whisper transcription is a hallucination of the technical vocabulary prompt.
 * 
 * @param {string} text - The transcription text.
 * @returns {boolean} True if detected as a hallucination, false otherwise.
 */
export function isWhisperHallucination(text) {
  if (!text) return false;
  
  // Lowercase and strip punctuation/symbols/extra whitespace
  const normalized = text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length === 0) return false;

  const promptPhrases = [
    "các từ chuyên ngành gồm",
    "tôi đang trả lời câu hỏi phỏng vấn kỹ thuật it",
    "tôi đang trả lời câu hỏi phỏng vấn",
    "i am answering technical it interview questions",
    "technologies include",
    "i am answering technical"
  ];

  // 1. Check for repetitive code patterns like "R3, V3, V4, V5" or "V50, V50, V50" under silence
  const hasHallucinatedCodes = /([a-z]\d+,\s*){3,}/i.test(normalized) || /(\b[a-z]\d+\b\s*){4,}/i.test(normalized);
  if (hasHallucinatedCodes) {
    return true;
  }

  // 2. Check if the transcript starts with our prompt context and trails into repetitive text or is very long
  const startsWithPrompt = promptPhrases.some(phrase => normalized.startsWith(phrase));
  if (startsWithPrompt && (normalized.includes("r3") || normalized.includes("v3") || normalized.length > 50)) {
    return true;
  }

  // If the text is exactly one of the prompt phrases (ignoring punctuation/case)
  if (promptPhrases.some(phrase => normalized === phrase)) {
    return true;
  }

  // Common technical prompt prefixes and full prompts normalized
  const fullPromptVi = "tôi đang trả lời câu hỏi phỏng vấn kỹ thuật it các từ chuyên ngành gồm reactjs nodejs javascript typescript nextjs frontend backend html css sql api graphql database load balancer microservices git docker kubernetes cicd oop mvc design pattern";
  const fullPromptEn = "i am answering technical it interview questions technologies include reactjs nodejs javascript typescript nextjs frontend backend html css sql api graphql database load balancer microservices git docker kubernetes cicd oop mvc design pattern";

  if (fullPromptVi.includes(normalized) || fullPromptEn.includes(normalized)) {
    // If it matches exactly one tech keyword like "react", don't treat as hallucination
    const shortTechWords = ['reactjs', 'nodejs', 'javascript', 'typescript', 'nextjs', 'frontend', 'backend', 'html', 'css', 'sql', 'api', 'graphql', 'database', 'git', 'docker', 'kubernetes', 'cicd', 'oop', 'mvc'];
    if (shortTechWords.includes(normalized)) {
      return false;
    }
    return true;
  }

  return false;
}

export const exactResourceLinks = [
  {
    keywords: ['react hook', 'usestate', 'usereducer', 'useeffect', 'usememo', 'usecallback', 'react component', 'lifecycle'],
    url: 'https://vi.react.dev/reference/react'
  },
  {
    keywords: ['react', 'reactjs', 'nextjs', 'next.js', 'frontend', 'lập trình frontend'],
    url: 'https://vi.react.dev'
  },
  {
    keywords: ['javascript', 'js', 'closure', 'async', 'await', 'promise', 'es6', 'callback'],
    url: 'https://developer.mozilla.org/vi/docs/Web/JavaScript'
  },
  {
    keywords: ['flexbox', 'grid', 'css', 'html', 'sass', 'responsive', 'bootstrap', 'tailwind'],
    url: 'https://developer.mozilla.org/vi/docs/Web/CSS'
  },
  {
    keywords: ['uiux', 'ui/ux', 'thiết kế ui', 'figma', 'design system', 'giao diện', 'wireframe', 'prototype'],
    url: 'https://www.figma.com/resources/learn-design/'
  },
  {
    keywords: ['nodejs', 'node.js', 'express', 'nestjs', 'backend', 'lập trình backend'],
    url: 'https://nodejs.org/vi/docs/'
  },
  {
    keywords: ['typescript', 'ts'],
    url: 'https://www.typescriptlang.org/docs/'
  },
  {
    keywords: ['sql', 'mysql', 'postgresql', 'cơ sở dữ liệu', 'database', 'nosql', 'mongodb', 'redis'],
    url: 'https://www.w3schools.com/sql/'
  },
  {
    keywords: ['docker', 'kubernetes', 'k8s', 'ci/cd', 'cicd', 'devops', 'deployment'],
    url: 'https://docs.docker.com'
  },
  {
    keywords: ['git', 'github', 'gitlab', 'version control'],
    url: 'https://git-scm.com/doc'
  },
  {
    keywords: ['system design', 'microservices', 'load balancer', 'scalability', 'kiến trúc hệ thống'],
    url: 'https://github.com/donnemartin/system-design-primer'
  },
  {
    keywords: ['star', 'phương pháp star', 'phỏng vấn', 'interview', 'behavioral', 'hành vi'],
    url: 'https://www.indeed.com/career-advice/interviewing/how-to-use-the-star-method-your-next-job-interview'
  }
];

/**
 * Resolves a title and type of a resource into a high-quality, verified URL.
 * 
 * @param {string} title - The title of the resource.
 * @param {string} type - The type of the resource (e.g. Documentation, Video, etc.).
 * @param {string} originalUrl - The original URL from AI.
 * @returns {string} The resolved URL.
 */
export function resolveResourceUrl(title, type, originalUrl) {
  const cleanTitle = (title || '').toLowerCase();
  const cleanType = (type || '').toLowerCase();
  const query = encodeURIComponent(title || '');

  // 1. Detect if the original URL belongs to specific platforms we want to search directly
  if (originalUrl) {
    const isSpecificYoutube = originalUrl.includes('youtube.com/watch') || originalUrl.includes('youtu.be/');
    const isSpecificCoursera = originalUrl.includes('coursera.org/specializations/') || originalUrl.includes('coursera.org/learn/');
    const isSpecificUdemy = originalUrl.includes('udemy.com/course/');

    if (isSpecificYoutube) {
      return `https://www.youtube.com/results?search_query=${query}`;
    }
    if (isSpecificCoursera) {
      return `https://www.coursera.org/search?query=${query}`;
    }
    if (isSpecificUdemy) {
      return `https://www.udemy.com/courses/search/?q=${query}`;
    }
  }

  // 2. Try to find a match in the exact resource mapping
  for (const item of exactResourceLinks) {
    if (item.keywords.some(keyword => cleanTitle.includes(keyword) || cleanType.includes(keyword))) {
      return item.url;
    }
  }

  // 3. Fallback: If originalUrl is a valid URL, use it
  const isValidOriginal = originalUrl && originalUrl.startsWith('http') && originalUrl !== '#';
  if (isValidOriginal) {
    return originalUrl;
  }

  // 4. Last fallback: Google/YouTube search based on title
  const isVideoOrCourse = ['video', 'khóa học', 'course', 'youtube'].some(term => 
    cleanType.includes(term) || cleanTitle.includes(term)
  );

  if (isVideoOrCourse) {
    return `https://www.youtube.com/results?search_query=${query}`;
  }

  return `https://www.google.com/search?q=${query}`;
}
