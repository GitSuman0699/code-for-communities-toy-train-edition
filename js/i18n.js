/**
 * i18n.js — Multilingual Localization Module
 * 
 * Supports:
 *   - English (en)
 *   - Nepali (ne — नेपाली) [Darjeeling hills primary language]
 *   - Hindi (hi — हिन्दी) [Indian Railways / NFR official]
 *   - Bengali (bn — বাংলা) [West Bengal & Siliguri plains]
 */

const I18N = {
  currentLang: 'en',
  
  translations: {
    en: {
      appName: "Gangman's Logbook",
      appSubtitle: "DHR Track Inspector",
      navHome: "Home",
      navReport: "Report",
      navDashboard: "Dashboard",
      statToday: "Today",
      statPending: "Pending Sync",
      statSynced: "Synced",
      btnNewReport: "New Inspection Report",
      recentReports: "Recent Reports",
      viewAll: "View All",
      emptyHome: "No reports yet. Start your first inspection.",
      emptyFilter: "No reports match the current filters.",
      step1: "Capture Photo",
      step2: "Hazard Type",
      step3: "Severity",
      step4: "Location & Notes",
      tapCamera: "Tap to open camera",
      btnCapture: "Capture",
      btnRetake: "Retake",
      btnUpload: "Upload Photo",
      btnSamplePhoto: "Sample Photo",
      sampleLandslide: "Sample: Landslide",
      sampleRockfall: "Sample: Boulder",
      sampleDrain: "Sample: Flooding",
      dhrPresets: "DHR GPS Presets",
      labelSection: "Track Section",
      selectSection: "Select section…",
      labelGps: "GPS Coordinates",
      labelKm: "Kilometre Marker (approx.)",
      labelNotes: "Notes / Voice Description",
      placeholderNotes: "Describe what you see or tap mic…",
      passablePrompt: "Is the track passable?",
      passableYes: "Yes",
      passableCaution: "With Caution",
      passableNo: "No",
      btnSaveReport: "Save Report",
      btnSaving: "Saving…",
      btnUseAi: "Use This",
      btnDismissAi: "Dismiss",
      aiBadge: "AI Generated Note",
      aiSuggestionPrefix: "AI Suggestion:",
      filterAllSections: "All Sections",
      filterAllSeverities: "All Severities",
      sectionSummaryTitle: "Section-wise Status",
      offlineMode: "Offline Mode Active",
      onlineMode: "Online — Ready to Sync",
      demoSeedBtn: "Load Demo DHR Reports",
      demoSeedSuccess: "Sample DHR patrol reports loaded!",
      voiceListening: "Listening… Speak now",
      voiceNotSupported: "Voice recognition not supported in this browser",
      
      // Hazards
      hazards: {
        slip: "Slip / Landslide",
        rockfall: "Rockfall",
        drain: "Blocked Drain",
        wall: "Damaged Wall",
        track: "Track Damage",
        other: "Other"
      },
      
      // Severity
      severities: {
        low: "Low",
        medium: "Medium",
        high: "High",
        critical: "Critical"
      },
      
      // Sections
      sections: {
        "NJP-Siliguri": "NJP – Siliguri Town",
        "Siliguri-Sukna": "Siliguri Town – Sukna",
        "Sukna-Rangtong": "Sukna – Rangtong",
        "Rangtong-Tindharia": "Rangtong – Tindharia",
        "Tindharia-Gayabari": "Tindharia – Gayabari",
        "Gayabari-Mahanadi": "Gayabari – Mahanadi",
        "Mahanadi-Kurseong": "Mahanadi – Kurseong",
        "Kurseong-Tung": "Kurseong – Tung",
        "Tung-Sonada": "Tung – Sonada",
        "Sonada-Jorbunglow": "Sonada – Jor Bunglow",
        "Jorbunglow-Ghum": "Jor Bunglow – Ghum",
        "Ghum-BatasiaLoop": "Ghum – Batasia Loop",
        "BatasiaLoop-Darjeeling": "Batasia Loop – Darjeeling"
      }
    },
    
    ne: {
      appName: "ग्याङम्यान लगबुक",
      appSubtitle: "डीएचआर ट्रयाक निरीक्षक (दार्जिलिङ)",
      navHome: "गृहपृष्ठ",
      navReport: "प्रतिवेदन",
      navDashboard: "ड्यासबोर्ड",
      statToday: "आजको",
      statPending: "प्रतीक्षारत सिङ्क",
      statSynced: "सिङ्क सम्पन्न",
      btnNewReport: "नयाँ निरीक्षण दर्ता",
      recentReports: "भर्खरका प्रतिवेदनहरू",
      viewAll: "सबै हेर्नुहोस्",
      emptyHome: "कुनै प्रतिवेदन छैन। पहिलो निरीक्षण सुरु गर्नुहोस्।",
      emptyFilter: "यस फिल्टरमा कुनै प्रतिवेदन भेटिएन।",
      step1: "तस्वीर लिनुहोस्",
      step2: "खतराको प्रकार",
      step3: "तीव्रता / गम्भीरता",
      step4: "स्थान र विवरण",
      tapCamera: "क्यामेरा खोल्न ट्याप गर्नुहोस्",
      btnCapture: "फोटो खिच्नुहोस्",
      btnRetake: "फेरि खिच्नुहोस्",
      btnUpload: "फोटो अपलोड",
      btnSamplePhoto: "नमूना फोटो",
      sampleLandslide: "नमूना: पहिरो",
      sampleRockfall: "नमूना: ढुङ्गा",
      sampleDrain: "नमूना: नाला थुनिएको",
      dhrPresets: "डीएचआर स्थान छनौट",
      labelSection: "ट्रयाक खण्ड",
      selectSection: "खण्ड छान्नुहोस्…",
      labelGps: "जीपीएस निर्देशांक",
      labelKm: "किलोमिटर चिन्ह (अनुमानित)",
      labelNotes: "विवरण / आवाज टिप्पणी",
      placeholderNotes: "के देख्नुभयो लेख्नुहोस् वा माइक थिच्नुहोस्…",
      passablePrompt: "के रेल चल्न सक्छ?",
      passableYes: "सकिन्छ",
      passableCaution: "सतर्कतापूर्वक",
      passableNo: "बन्द",
      btnSaveReport: "प्रतिवेदन सुरक्षित गर्नुहोस्",
      btnSaving: "सुरक्षित गर्दै…",
      btnUseAi: "यो प्रयोग गर्नुहोस्",
      btnDismissAi: "हटाउनुहोस्",
      aiBadge: "एआई निर्मित सारांश",
      aiSuggestionPrefix: "एआई सुझाव:",
      filterAllSections: "सबै खण्डहरू",
      filterAllSeverities: "सबै गम्भीरता",
      sectionSummaryTitle: "खण्ड अनुसार स्थिति",
      offlineMode: "अफलाइन मोड सक्रिय",
      onlineMode: "अनलाइन — सिङ्कको लागि तयार",
      demoSeedBtn: "नमूना निरीक्षण लोड गर्नुहोस्",
      demoSeedSuccess: "नमूना डीएचआर प्रतिवेदनहरू लोड गरियो!",
      voiceListening: "सुन्दैछ… बोल्नुहोस्",
      voiceNotSupported: "यस ब्राउजरमा आवाज पहिचान उपलब्ध छैन",
      
      hazards: {
        slip: "पहिरो / ल्यान्डस्लाइड",
        rockfall: "ढुङ्गा खस्नु",
        drain: "थुनिएको नाला",
        wall: "भत्किएको पर्खाल",
        track: "ट्रयाक क्षति / संरेखण",
        other: "अन्य"
      },
      
      severities: {
        low: "सामान्य",
        medium: "मध्यम",
        high: "गम्भीर",
        critical: "आपतकालीन"
      },
      
      sections: {
        "NJP-Siliguri": "एनजेपी – सिलिगुडी टाउन",
        "Siliguri-Sukna": "सिलिगुडी टाउन – सुकना",
        "Sukna-Rangtong": "सुकना – रङतोङ",
        "Rangtong-Tindharia": "रङतोङ – तिनधारिया",
        "Tindharia-Gayabari": "तिनधारिया – गायबरी",
        "Gayabari-Mahanadi": "गायबरी – महानदी",
        "Mahanadi-Kurseong": "महानदी – खरसाङ",
        "Kurseong-Tung": "खरसाङ – तुङ",
        "Tung-Sonada": "तुङ – सोनादा",
        "Sonada-Jorbunglow": "सोनादा – जोरबङ्गलो",
        "Jorbunglow-Ghum": "जोरबङ्गलो – घूम",
        "Ghum-BatasiaLoop": "घूम – बतासिया लूप",
        "BatasiaLoop-Darjeeling": "बतासिया लूप – दार्जिलिङ"
      }
    },
    
    hi: {
      appName: "गैंगमैन लॉगबुक",
      appSubtitle: "डीएचआर ट्रैक निरीक्षक (दार्जिलिंग)",
      navHome: "होम",
      navReport: "रिपोर्ट",
      navDashboard: "डैशबोर्ड",
      statToday: "आज",
      statPending: "लंबित सिंक",
      statSynced: "सिंक हुआ",
      btnNewReport: "नई निरीक्षण रिपोर्ट",
      recentReports: "हाल की रिपोर्टें",
      viewAll: "सभी देखें",
      emptyHome: "कोई रिपोर्ट नहीं। पहला निरीक्षण शुरू करें।",
      emptyFilter: "फिल्टर से कोई रिपोर्ट नहीं मिली।",
      step1: "फोटो खींचें",
      step2: "खतरे का प्रकार",
      step3: "गंभीरता",
      step4: "स्थान और विवरण",
      tapCamera: "कैमरा खोलने के लिए टैप करें",
      btnCapture: "तस्वीर लें",
      btnRetake: "पुनः लें",
      btnUpload: "फोटो अपलोड",
      btnSamplePhoto: "नमूना फोटो",
      sampleLandslide: "नमूना: भूस्खलन",
      sampleRockfall: "नमूना: चट्टान गिरना",
      sampleDrain: "नमूना: बंद नाली",
      dhrPresets: "डीएचआर जीपीएस स्थान",
      labelSection: "ट्रैक खंड",
      selectSection: "खंड चुनें…",
      labelGps: "जीपीएस निर्देशांक",
      labelKm: "किलोमीटर मार्कर (लगभग)",
      labelNotes: "विवरण / वॉयस नोट",
      placeholderNotes: "जो दिख रहा है उसका विवरण लिखें या माइक दबाएं…",
      passablePrompt: "क्या ट्रैक से गाड़ी गुजर सकती है?",
      passableYes: "हाँ",
      passableCaution: "सावधानी से",
      passableNo: "नहीं (बंद)",
      btnSaveReport: "रिपोर्ट सहेजें",
      btnSaving: "सहेजा जा रहा है…",
      btnUseAi: "यह उपयोग करें",
      btnDismissAi: "खारिज करें",
      aiBadge: "एआई जनरेटेड सारांश",
      aiSuggestionPrefix: "एआई सुझाव:",
      filterAllSections: "सभी खंड",
      filterAllSeverities: "सभी गंभीरता स्तर",
      sectionSummaryTitle: "खंड-वार स्थिति",
      offlineMode: "ऑफलाइन मोड सक्रिय",
      onlineMode: "ऑनलाइन — सिंक हेतु तैयार",
      demoSeedBtn: "नमूना डेटा लोड करें",
      demoSeedSuccess: "नमूना डीएचआर निरीक्षण लोड किए गए!",
      voiceListening: "सुन रहा हूँ… बोलिए",
      voiceNotSupported: "इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है",
      
      hazards: {
        slip: "भूस्खलन / मलबा",
        rockfall: "चट्टान गिरना",
        drain: "बंद नाली / जलभराव",
        wall: "क्षतिग्रस्त दीवार",
        track: "पटरी क्षति / संरेखण",
        other: "अन्य"
      },
      
      severities: {
        low: "सामान्य",
        medium: "मध्यम",
        high: "गंभीर",
        critical: "अत्यंत गंभीर"
      },
      
      sections: {
        "NJP-Siliguri": "एनजेपी – सिलिगुड़ी टाउन",
        "Siliguri-Sukna": "सिलिगुड़ी टाउन – सुकना",
        "Sukna-Rangtong": "सुकना – रंगतंग",
        "Rangtong-Tindharia": "रंगतंग – तीनधरिया",
        "Tindharia-Gayabari": "तीनधरिया – गयाबारी",
        "Gayabari-Mahanadi": "गयाबारी – महानदी",
        "Mahanadi-Kurseong": "महानदी – कर्सियांग",
        "Kurseong-Tung": "कर्सियांग – तुंग",
        "Tung-Sonada": "तुंग – सोनादा",
        "Sonada-Jorbunglow": "सोनादा – जोरबंगलो",
        "Jorbunglow-Ghum": "जोरबंगलो – घूम",
        "Ghum-BatasiaLoop": "घूम – बतासिया लूप",
        "BatasiaLoop-Darjeeling": "बतासिया लूप – दार्जिलिंग"
      }
    },
    
    bn: {
      appName: "গ্যাংম্যান লগবুক",
      appSubtitle: "ডিএইচআর ট্র্যাক পরিদর্শক (দার্জিলিং)",
      navHome: "হোম",
      navReport: "রিপোর্ট",
      navDashboard: "ড্যাশবোর্ড",
      statToday: "আজ",
      statPending: "অপেক্ষমান সিঙ্ক",
      statSynced: "সিঙ্ক হয়েছে",
      btnNewReport: "নতুন পরিদর্শন রিপোর্ট",
      recentReports: "সাম্প্রতিক রিপোর্ট",
      viewAll: "সব দেখুন",
      emptyHome: "কোন রিপোর্ট নেই। প্রথম পরিদর্শন শুরু করুন।",
      emptyFilter: "কোন রিপোর্ট ফিল্টারে পাওয়া যায়নি।",
      step1: "ছবি তুলুন",
      step2: "বিপদের ধরন",
      step3: "তীব্রতা",
      step4: "স্থান ও বিবরণ",
      tapCamera: "ক্যামেরা খুলতে ট্যাপ করুন",
      btnCapture: "ছবি তুলুন",
      btnRetake: "পুনরায় তুলুন",
      btnUpload: "ছবি আপলোড",
      btnSamplePhoto: "নমুনা ছবি",
      sampleLandslide: "নমুনা: ধস",
      sampleRockfall: "নমুনা: পাথর পড়া",
      sampleDrain: "নমুনা: বন্ধ নর্দমা",
      dhrPresets: "ডিএইচআর জিপিএস স্থান",
      labelSection: "ট্র্যাক সেকশন",
      selectSection: "সেকশন নির্বাচন করুন…",
      labelGps: "জিপিএস স্থানাঙ্ক",
      labelKm: "কিলোমিটার মার্কার (আনুমানিক)",
      labelNotes: "বিবরণ / ভয়েস নোট",
      placeholderNotes: "যা দেখতে পাচ্ছেন লিখুন বা মাইক চাপুন…",
      passablePrompt: "ট্র্যাক কি চলাচলের যোগ্য?",
      passableYes: "হ্যাঁ",
      passableCaution: "সতর্কতার সাথে",
      passableNo: "না (বন্ধ)",
      btnSaveReport: "রিপোর্ট সংরক্ষণ করুন",
      btnSaving: "সংরক্ষণ হচ্ছে…",
      btnUseAi: "এটি ব্যবহার করুন",
      btnDismissAi: "বাতিল করুন",
      aiBadge: "এআই নির্মিত সারাংশ",
      aiSuggestionPrefix: "এআই পরামর্শ:",
      filterAllSections: "সব সেকশন",
      filterAllSeverities: "সব তীব্রতা",
      sectionSummaryTitle: "সেকশন অনুযায়ী অবস্থা",
      offlineMode: "অফলাইন মোড সক্রিয়",
      onlineMode: "অনলাইন — সিঙ্কের জন্য প্রস্তুত",
      demoSeedBtn: "নমুনা ডিএইচআর তথ্য লোড করুন",
      demoSeedSuccess: "নমুনা ডিএইচআর পরিদর্শন লোড করা হয়েছে!",
      voiceListening: "শুনছি… কথা বলুন",
      voiceNotSupported: "এই ব্রাউজারে ভয়েস সাপোর্ট নেই",
      
      hazards: {
        slip: "ধস / ভূমিধস",
        rockfall: "পাথর খসা",
        drain: "বন্ধ নর্দমা",
        wall: "ক্ষতিগ্রস্ত প্রাচীর",
        track: "রেললাইনের ক্ষতি",
        other: "অন্যান্য"
      },
      
      severities: {
        low: "স্বাভাবিক / কম",
        medium: "মাঝারি",
        high: "বেশি / গুরুতর",
        critical: "জরুরি / বিপজ্জনক"
      },
      
      sections: {
        "NJP-Siliguri": "এনজেপি – শিলিগুড়ি টাউন",
        "Siliguri-Sukna": "শিলিগুড়ি টাউন – সুকনা",
        "Sukna-Rangtong": "সুকনা – রংতং",
        "Rangtong-Tindharia": "রংতং – তিনধারিয়া",
        "Tindharia-Gayabari": "তিনধারিয়া – গায়াবাড়ি",
        "Gayabari-Mahanadi": "গায়াবাড়ি – মহানদী",
        "Mahanadi-Kurseong": "মহানদী – কার্শিয়াং",
        "Kurseong-Tung": "কার্শিয়াং – টুং",
        "Tung-Sonada": "টুং – সোনাদা",
        "Sonada-Jorbunglow": "সোনাদা – জোরবাংলো",
        "Jorbunglow-Ghum": "জোরবাংলো – ঘুম",
        "Ghum-BatasiaLoop": "ঘুম – বাতাসিয়া লুপ",
        "BatasiaLoop-Darjeeling": "বাতাসিয়া লুপ – দার্জিলিং"
      }
    }
  },
  
  get(key, fallback = '') {
    const lang = I18N.translations[I18N.currentLang] || I18N.translations.en;
    return lang[key] || I18N.translations.en[key] || fallback || key;
  },
  
  getHazard(type) {
    const lang = I18N.translations[I18N.currentLang] || I18N.translations.en;
    return lang.hazards?.[type] || I18N.translations.en.hazards[type] || type;
  },
  
  getSeverity(sev) {
    const lang = I18N.translations[I18N.currentLang] || I18N.translations.en;
    return lang.severities?.[sev] || I18N.translations.en.severities[sev] || sev;
  },
  
  getSection(sec) {
    const lang = I18N.translations[I18N.currentLang] || I18N.translations.en;
    return lang.sections?.[sec] || I18N.translations.en.sections[sec] || sec;
  },
  
  setLanguage(langCode) {
    if (I18N.translations[langCode]) {
      I18N.currentLang = langCode;
      try {
        localStorage.setItem('dhr_lang', langCode);
      } catch (e) {}
      I18N.updateDOM();
      window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang: langCode } }));
    }
  },
  
  init() {
    try {
      const saved = localStorage.getItem('dhr_lang');
      if (saved && I18N.translations[saved]) {
        I18N.currentLang = saved;
      }
    } catch (e) {}
    I18N.updateDOM();
  },
  
  updateDOM() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((el) => {
      const key = el.dataset.i18n;
      const val = I18N.get(key);
      if (val) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = val;
        } else {
          el.textContent = val;
        }
      }
    });

    // Update hazards in grid
    document.querySelectorAll('.hazard-option').forEach((btn) => {
      const hType = btn.dataset.hazard;
      const labelEl = btn.querySelector('.hazard-option__label');
      if (labelEl && hType) {
        labelEl.textContent = I18N.getHazard(hType);
      }
    });

    // Update severity in selector
    document.querySelectorAll('.severity-btn').forEach((btn) => {
      const sev = btn.dataset.severity;
      if (sev) {
        const textNode = Array.from(btn.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
        if (textNode) {
          textNode.textContent = ' ' + I18N.getSeverity(sev);
        }
      }
    });
    
    // Update passable buttons
    document.querySelectorAll('.toggle-btn').forEach((btn) => {
      const pass = btn.dataset.passable;
      if (pass === 'yes') btn.textContent = I18N.get('passableYes');
      if (pass === 'caution') btn.textContent = I18N.get('passableCaution');
      if (pass === 'no') btn.textContent = I18N.get('passableNo');
    });

    // Update section dropdowns
    const sectionSelects = document.querySelectorAll('#input-section, #filter-section');
    sectionSelects.forEach((select) => {
      Array.from(select.options).forEach((opt) => {
        if (opt.value && opt.value !== 'all') {
          opt.textContent = I18N.getSection(opt.value);
        } else if (opt.value === 'all') {
          opt.textContent = I18N.get('filterAllSections');
        } else if (opt.value === '') {
          opt.textContent = I18N.get('selectSection');
        }
      });
    });

    // Update severity filter dropdown
    const filterSev = document.getElementById('filter-severity');
    if (filterSev) {
      Array.from(filterSev.options).forEach((opt) => {
        if (opt.value === 'all') opt.textContent = I18N.get('filterAllSeverities');
        else opt.textContent = I18N.getSeverity(opt.value);
      });
    }

    // Update active language button
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('lang-btn--active', btn.dataset.lang === I18N.currentLang);
    });
  }
};

window.I18N = I18N;
