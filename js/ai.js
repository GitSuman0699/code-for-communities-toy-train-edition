/**
 * ai.js — On-Device AI Module
 *
 * Provides two AI capabilities:
 *   1. Hazard classification — classifies hazard type from photo heuristics or text notes
 *   2. Multilingual note generation — generates plain-language inspection notes
 *
 * Uses Chrome's built-in Prompt API (window.ai) where available,
 * with graceful fallback to localized multilingual heuristics and image analysis.
 */

// ─── AI Availability ───────────────────────────
let _aiSession = null;
let _aiAvailable = false;

/**
 * Check if on-device AI (Prompt API) is available.
 * @returns {Promise<boolean>}
 */
async function checkAIAvailability() {
  try {
    if (window.ai && window.ai.languageModel) {
      const capabilities = await window.ai.languageModel.capabilities();
      _aiAvailable = capabilities.available === 'readily' || capabilities.available === 'after-download';
      console.log('[AI] Prompt API available:', _aiAvailable, '| Status:', capabilities.available);
      return _aiAvailable;
    }
  } catch (e) {
    console.warn('[AI] Prompt API check failed:', e);
  }

  _aiAvailable = false;
  console.log('[AI] No on-device Prompt API detected, using multilingual on-device heuristics');
  return false;
}

/**
 * Get or create an AI session.
 * @returns {Promise<Object|null>}
 */
async function getAISession() {
  if (_aiSession) return _aiSession;
  if (!_aiAvailable) return null;

  try {
    _aiSession = await window.ai.languageModel.create({
      systemPrompt: `You are an assistant for Darjeeling Himalayan Railway (DHR) track inspectors (gangmen).
Your job is to help classify track hazards and generate concise inspection notes.
The DHR is a 2-foot narrow gauge railway running 88 km from New Jalpaiguri to Darjeeling through steep Himalayan slopes.

When generating notes:
- Be concise and factual (2-3 sentences max)
- State the hazard type, severity, KM location, and recommended action
- Mention track passability (passable, with caution, or line block required)
- When requested in Nepali, Hindi, or Bengali, provide the note in that language!

When classifying hazards from descriptions:
- Respond with ONLY the hazard type: slip, rockfall, drain, wall, track, or other`,
    });

    return _aiSession;
  } catch (e) {
    console.error('[AI] Failed to create session:', e);
    _aiSession = null;
    return null;
  }
}

// ─── Hazard Types with Multilingual Keywords ───
const HAZARD_TYPES = {
  slip: {
    label: 'Slip / Landslide',
    icon: '⛰️',
    keywords: [
      'slip', 'slide', 'landslide', 'slope', 'earth', 'mud', 'soil', 'collapse', 'debris',
      'पहिरो', 'पहिरोको', 'माटो', 'खसेको', 'भासिएको', // Nepali
      'भूस्खलन', 'मलबा', 'मिट्टी', 'धंस', // Hindi
      'ধস', 'ভূমিধস', 'মাটি' // Bengali
    ],
  },
  rockfall: {
    label: 'Rockfall',
    icon: '🪨',
    keywords: [
      'rock', 'boulder', 'stone', 'fallen', 'debris', 'loose', 'cliff',
      'ढुङ्गा', 'चट्टान', 'ढुंगा', 'खस्यो', // Nepali
      'पत्थर', 'चट्टान', 'शिला', // Hindi
      'পাথর', 'শিলা' // Bengali
    ],
  },
  drain: {
    label: 'Blocked Drain',
    icon: '🌊',
    keywords: [
      'drain', 'culvert', 'water', 'blocked', 'overflow', 'clogged', 'flooding', 'gutter', 'jhora',
      'नाला', 'नाली', 'थुनिएको', 'पानी', 'खोला', 'झोरा', // Nepali
      'नाली', 'बंद', 'जलभराव', 'पानी', // Hindi
      'নর্দমা', 'বন্ধ', 'জল' // Bengali
    ],
  },
  wall: {
    label: 'Damaged Wall',
    icon: '🧱',
    keywords: [
      'wall', 'retaining', 'bulge', 'crack', 'lean', 'broken', 'masonry', 'parapet',
      'पर्खाल', 'भत्किएको', 'चर्किएको', 'गाह्रो', // Nepali
      'दीवार', 'क्षतिग्रस्त', 'टूटी', 'दरार', // Hindi
      'প্রাচীর', 'দেয়াল', 'ভাঙা' // Bengali
    ],
  },
  track: {
    label: 'Track Damage',
    icon: '🛤️',
    keywords: [
      'rail', 'track', 'sleeper', 'gauge', 'fish', 'plate', 'bent', 'broken', 'alignment', 'gap',
      'ट्रयाक', 'पटरी', 'रेल', 'स्लीपर', 'बाङ्गो', 'टुक्रिएको', // Nepali
      'पटरी', 'रेल', 'स्लीपर', 'मुड़ा', 'टूटा', // Hindi
      'রেললাইন', 'স্লিপার', 'বাঁকা' // Bengali
    ],
  },
  other: {
    label: 'Other',
    icon: '⚠️',
    keywords: ['tree', 'branch', 'animal', 'other', 'रूख', 'पेड़', 'গাছ'],
  },
};

/**
 * Classify a hazard from user notes / description or photo.
 * Uses AI if available, falls back to multilingual keyword matching.
 *
 * @param {string} description - User's notes or description
 * @returns {Promise<{ type: string, confidence: string, source: string }>}
 */
async function classifyHazard(description) {
  if (!description || description.trim().length < 2) {
    return { type: 'other', confidence: 'low', source: 'none' };
  }

  // Try Chrome Prompt API
  const session = await getAISession();
  if (session) {
    try {
      const response = await session.prompt(
        `Classify this track hazard into exactly one category: slip, rockfall, drain, wall, track, or other.\n\nDescription: "${description}"\n\nRespond with ONLY the category name, nothing else.`
      );

      const aiType = response.trim().toLowerCase();
      if (HAZARD_TYPES[aiType]) {
        return { type: aiType, confidence: 'high', source: 'ai' };
      }
    } catch (e) {
      console.warn('[AI] Classification failed, using fallback:', e);
    }
  }

  // Fallback: Multilingual keyword matching
  return classifyByKeywords(description);
}

/**
 * Keyword-based hazard classification fallback supporting Nepali, Hindi, Bengali, English.
 */
function classifyByKeywords(description) {
  const lower = description.toLowerCase();
  let bestMatch = 'other';
  let bestScore = 0;

  for (const [type, data] of Object.entries(HAZARD_TYPES)) {
    if (type === 'other') continue;
    const score = data.keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = type;
    }
  }

  return {
    type: bestMatch,
    confidence: bestScore >= 2 ? 'high' : (bestScore === 1 ? 'medium' : 'low'),
    source: 'keywords',
  };
}

/**
 * On-Device Image Feature Heuristics:
 * Analyzes dominant colors & edge density in an HTML canvas/image element
 * to suggest hazard category when no textual input is provided.
 *
 * @param {HTMLCanvasElement|HTMLImageElement} imageEl
 * @returns {{ type: string, confidence: string, reason: string }}
 */
function analyzeImageFeatures(imageEl) {
  try {
    let canvas = imageEl;
    if (imageEl.tagName !== 'CANVAS') {
      canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 90;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageEl, 0, 0, 120, 90);
    }

    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    let rTotal = 0, gTotal = 0, bTotal = 0;
    let brownCount = 0, greyCount = 0, darkWetCount = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      rTotal += r;
      gTotal += g;
      bTotal += b;

      // Earth/Mud/Clay (Landslide)
      if (r > 90 && g > 50 && g < r && b < 60) brownCount++;
      // Rock/Stone (Rockfall/Wall)
      if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && r > 70 && r < 180) greyCount++;
      // Water / Dark sludge (Drain)
      if (r < 60 && g < 70 && b > 50) darkWetCount++;
    }

    const brownRatio = brownCount / totalPixels;
    const greyRatio = greyCount / totalPixels;
    const wetRatio = darkWetCount / totalPixels;

    if (brownRatio > 0.25) {
      return { type: 'slip', confidence: 'medium', reason: 'High earthen/mud color density detected' };
    } else if (greyRatio > 0.35) {
      return { type: 'rockfall', confidence: 'medium', reason: 'Stone/rock surface texture detected' };
    } else if (wetRatio > 0.20) {
      return { type: 'drain', confidence: 'medium', reason: 'Water pooling/drain features detected' };
    }

    return { type: 'other', confidence: 'low', reason: 'General inspection view' };
  } catch (err) {
    console.warn('[AI] Image analysis error:', err);
    return { type: 'other', confidence: 'low', reason: 'Analysis unavailable' };
  }
}

// ─── Multilingual Note Generation ─────────────

/**
 * Generate a plain-language inspection note in the active user language.
 *
 * @param {Object} params
 * @param {string} params.hazardType - 'slip', 'rockfall', etc.
 * @param {string} params.severity - 'low', 'medium', 'high', 'critical'
 * @param {string} params.section - Track section name
 * @param {string} params.passable - 'yes', 'caution', 'no'
 * @param {string} params.userNotes - User's raw notes
 * @param {number} [params.km] - Approximate KM marker
 * @param {string} [params.lang] - Active language ('en', 'ne', 'hi', 'bn')
 * @returns {Promise<{ note: string, source: string }>}
 */
async function generateNote(params) {
  const lang = params.lang || (window.I18N ? window.I18N.currentLang : 'en');
  const { hazardType, severity, section, passable, userNotes, km } = params;

  // Try Prompt API if available
  const session = await getAISession();
  if (session) {
    try {
      const langName = { ne: 'Nepali', hi: 'Hindi', bn: 'Bengali', en: 'English' }[lang] || 'English';
      const prompt = `Write a concise DHR railway track inspection note (2 sentences) in ${langName}:
Hazard: ${HAZARD_TYPES[hazardType]?.label || hazardType}
Severity: ${severity}
Section: ${section || 'Unknown'}
${km ? `KM Marker: ${km}` : ''}
Track Passable: ${passable}
Inspector observations: ${userNotes || 'None'}`;

      const response = await session.prompt(prompt);
      return { note: response.trim(), source: 'ai' };
    } catch (e) {
      console.warn('[AI] Note generation failed, using template:', e);
    }
  }

  // Fallback: Multilingual high-quality templates
  return { note: generateTemplateNote({ ...params, lang }), source: 'template' };
}

/**
 * Template-based note generation supporting English, Nepali, Hindi, Bengali.
 */
function generateTemplateNote(params) {
  const lang = params.lang || 'en';
  const { hazardType, severity, section, passable, userNotes, km } = params;
  
  const kmStr = km ? `KM ${km}` : '';

  if (lang === 'ne') {
    const hazardLabel = window.I18N?.getHazard(hazardType) || hazardType;
    const sevLabel = window.I18N?.getSeverity(severity) || severity;
    const passMap = {
      yes: 'ट्रयाक सञ्चालन योग्य छ।',
      caution: 'सतर्कताका साथ मात्र गाडी चलाउन सकिन्छ (गति कम गर्न सल्लाह)।',
      no: 'ट्रयाक पूर्ण रूपमा अवरुद्ध छ — तत्काल लाइन ब्लक आवश्यक!',
    };
    const actionMap = {
      low: 'अर्को गस्तीमा पुनः निरीक्षण गर्ने।',
      medium: '४८ घण्टाभित्र मर्मत कार्य तालिका बनाउने।',
      high: 'तुरुन्त सेक्सन इन्जिनियरलाई जानकारी दिने।',
      critical: 'अत्यन्त गम्भीर: कन्ट्रोल रुम र इन्जिनियरलाई तत्काल खबर गरी काम रोक्ने!',
    };

    let note = `${kmStr ? kmStr + ' मा ' : ''}${sevLabel} स्तरको ${hazardLabel} फेला परेको छ। `;
    note += `${passMap[passable] || ''} `;
    note += `${actionMap[severity] || ''}`;
    if (userNotes) note += ` [टिप्पणी: ${userNotes}]`;
    return note.trim();
  }

  if (lang === 'hi') {
    const hazardLabel = window.I18N?.getHazard(hazardType) || hazardType;
    const sevLabel = window.I18N?.getSeverity(severity) || severity;
    const passMap = {
      yes: 'ट्रैक सामान्य रूप से चालू है।',
      caution: 'सावधानीपूर्वक धीमी गति से ट्रेन चलाने की सलाह।',
      no: 'ट्रैक पूरी तरह बाधित है — लाइन ब्लॉक आवश्यक!',
    };
    const actionMap = {
      low: 'अगली गश्त के दौरान निगरानी रखें।',
      medium: '४८ घंटे के भीतर मरम्मत का प्रबंध करें।',
      high: 'सेक्शन इंजीनियर को तत्काल सूचित करें।',
      critical: 'अति आवश्यक: कंट्रोल रूम और वरिष्ठ अधिकारी को तुरंत सूचित करें!',
    };

    let note = `${kmStr ? kmStr + ' पर ' : ''}${sevLabel} श्रेणी का ${hazardLabel} पाया गया है। `;
    note += `${passMap[passable] || ''} `;
    note += `${actionMap[severity] || ''}`;
    if (userNotes) note += ` [नोट: ${userNotes}]`;
    return note.trim();
  }

  if (lang === 'bn') {
    const hazardLabel = window.I18N?.getHazard(hazardType) || hazardType;
    const sevLabel = window.I18N?.getSeverity(severity) || severity;
    const passMap = {
      yes: 'ট্র্যাক চলাচলের উপযোগী।',
      caution: 'সতর্কতার সাথে গতি কমিয়ে ট্রেন চালানোর পরামর্শ।',
      no: 'ট্র্যাক সম্পূর্ণ বন্ধ — অবিলম্বে লাইন ব্লক প্রয়োজন!',
    };
    const actionMap = {
      low: 'পরবর্তী টহলে পুনরায় পর্যবেক্ষণ করতে হবে।',
      medium: '৪৮ ঘণ্টার মধ্যে রক্ষণাবেক্ষণ প্রয়োজন।',
      high: 'সেকশন ইঞ্জিনিয়ারকে অবিলম্বে জানান।',
      critical: 'জরুরি পদক্ষেপ: অবিলম্বে কন্ট্রোল রুমে রিপোর্ট করে লাইন ব্লক করুন!',
    };

    let note = `${kmStr ? kmStr + ' এ ' : ''}${sevLabel} মাত্রার ${hazardLabel} পরিলক্ষিত হয়েছে। `;
    note += `${passMap[passable] || ''} `;
    note += `${actionMap[severity] || ''}`;
    if (userNotes) note += ` [মন্তব্য: ${userNotes}]`;
    return note.trim();
  }

  // English fallback
  const hazardLabel = HAZARD_TYPES[hazardType]?.label || 'Unknown hazard';
  const passableText = {
    yes: 'Track remains passable.',
    caution: 'Track passable with caution — caution order & reduced speed advised.',
    no: 'Track NOT passable — emergency line block required.',
  };
  const severityAction = {
    low: 'Monitor during next gang patrol.',
    medium: 'Schedule permanent-way maintenance within 48 hours.',
    high: 'Urgent attention required — notify Assistant Divisional Engineer.',
    critical: 'IMMEDIATE ACTION REQUIRED — notify Kurseong/Siliguri Control Room. Issue line block.',
  };

  let note = `${severity.toUpperCase()} severity ${hazardLabel.toLowerCase()} observed`;
  if (section) note += ` in ${section} section`;
  if (km) note += ` near KM ${km}`;
  note += '. ';
  note += passableText[passable] || '';
  note += ' ';
  note += severityAction[severity] || '';

  if (userNotes) {
    note += ` Inspector notes: ${userNotes}`;
  }

  return note.trim();
}

// ─── MediaPipe Tasks for Web Integration ────────
let _mediaPipeClassifier = null;
let _mediaPipeAvailable = false;

/**
 * Initialize MediaPipe Tasks Image Classifier if available.
 * Designed to run on-device Wasm/TFLite models with fallback to lightweight canvas heuristics.
 */
async function initMediaPipeClassifier() {
  if (_mediaPipeClassifier) return _mediaPipeClassifier;

  try {
    if (window.FilesetResolver && window.ImageClassifier) {
      const vision = await window.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      _mediaPipeClassifier = await window.ImageClassifier.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_classifier/efficientnet_lite0/float32/1/efficientnet_lite0.tflite',
        },
        maxResults: 3,
        runningMode: 'IMAGE',
      });
      _mediaPipeAvailable = true;
      console.log('[MediaPipe] ImageClassifier initialized successfully');
      return _mediaPipeClassifier;
    }
  } catch (err) {
    console.warn('[MediaPipe] ImageClassifier unavailable or offline:', err);
  }

  _mediaPipeAvailable = false;
  return null;
}

/**
 * Run MediaPipe classification on an image element, or fall back to canvas heuristics.
 * @param {HTMLImageElement|HTMLCanvasElement} imageEl
 * @returns {Promise<{ type: string, confidence: string, source: string, reason?: string, details?: any }>}
 */
async function classifyImage(imageEl) {
  // 1. Try MediaPipe Tasks if initialized
  if (_mediaPipeClassifier) {
    try {
      const results = _mediaPipeClassifier.classify(imageEl);
      if (results && results.classifications && results.classifications.length > 0) {
        const topCategory = results.classifications[0].categories[0];
        console.log('[MediaPipe] Classification result:', topCategory);
        const catName = (topCategory.categoryName || '').toLowerCase();
        let matchedType = 'other';
        if (catName.includes('rock') || catName.includes('stone') || catName.includes('cliff') || catName.includes('boulder')) matchedType = 'rockfall';
        else if (catName.includes('soil') || catName.includes('mud') || catName.includes('valley') || catName.includes('geological')) matchedType = 'slip';
        else if (catName.includes('water') || catName.includes('ditch') || catName.includes('river') || catName.includes('drain')) matchedType = 'drain';
        else if (catName.includes('wall') || catName.includes('brick') || catName.includes('fence') || catName.includes('masonry')) matchedType = 'wall';
        else if (catName.includes('rail') || catName.includes('track') || catName.includes('train')) matchedType = 'track';

        if (matchedType !== 'other') {
          return {
            type: matchedType,
            confidence: topCategory.score > 0.6 ? 'high' : 'medium',
            source: 'mediapipe',
            details: topCategory,
          };
        }
      }
    } catch (e) {
      console.warn('[MediaPipe] Execution error:', e);
    }
  }

  // 2. Fallback to ultra-lightweight zero-dependency canvas heuristics
  const heuristic = analyzeImageFeatures(imageEl);
  return {
    type: heuristic.type,
    confidence: heuristic.confidence,
    source: 'canvas-heuristics',
    reason: heuristic.reason,
  };
}

/**
 * Clean up AI resources.
 */
function destroyAI() {
  if (_aiSession && _aiSession.destroy) {
    _aiSession.destroy();
  }
  _aiSession = null;
  if (_mediaPipeClassifier && _mediaPipeClassifier.close) {
    try { _mediaPipeClassifier.close(); } catch (e) {}
  }
  _mediaPipeClassifier = null;
}

// Export
window.AI = {
  checkAIAvailability,
  initMediaPipeClassifier,
  classifyImage,
  classifyHazard,
  analyzeImageFeatures,
  generateNote,
  destroyAI,
  HAZARD_TYPES,
  isAvailable: () => _aiAvailable,
  isMediaPipeAvailable: () => _mediaPipeAvailable,
};
