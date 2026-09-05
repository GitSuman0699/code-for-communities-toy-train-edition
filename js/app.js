/**
 * app.js — Main Application Controller
 *
 * Orchestrates view routing, multilingual localization, form logic,
 * GPS acquisition & presets, camera with fallback options,
 * on-device AI classification/note generation, and sync management.
 */

// ─── State ─────────────────────────────────────
const state = {
  currentView: 'home',
  currentReport: null,       // Report being created
  capturedPhoto: null,       // Base64 data URL
  selectedHazard: null,
  selectedSeverity: null,
  selectedPassable: 'yes',
  coords: null,
  isListening: false,
};

// ─── DOM References ────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  splash:           $('#splash-screen'),
  splashStatus:     $('#splash-status'),
  app:              $('#app'),
  topbarTitle:      $('#topbar-title'),
  btnBack:          $('#btn-back'),
  btnSunlight:      $('#btn-sunlight'),
  langPicker:       $('#lang-picker'),
  syncBadge:        $('#sync-badge'),
  onlineIndicator:  $('#online-indicator'),

  // Views
  views: {
    home:           $('#view-home'),
    'new-report':   $('#view-new-report'),
    dashboard:      $('#view-dashboard'),
    detail:         $('#view-detail'),
  },

  // Home
  statToday:        $('#stat-today'),
  statPending:      $('#stat-pending'),
  statSynced:       $('#stat-synced'),
  btnSeedDemo:      $('#btn-seed-demo'),
  btnClearReports:  $('#btn-clear-reports'),
  btnNewReport:     $('#btn-new-report'),
  btnViewAll:       $('#btn-view-all'),
  recentReports:    $('#recent-reports'),
  emptyState:       $('#empty-state'),

  // Camera
  cameraBox:        $('#camera-box'),
  cameraPreview:    $('#camera-preview'),
  cameraCanvas:     $('#camera-canvas'),
  photoPreview:     $('#photo-preview'),
  cameraOverlay:    $('#camera-overlay'),
  btnCapture:       $('#btn-capture'),
  btnRetake:        $('#btn-retake'),
  btnUploadPhoto:   $('#btn-upload-photo'),
  btnSamplePhoto:   $('#btn-sample-photo'),
  filePhotoInput:   $('#file-photo-input'),

  // Hazard
  hazardGrid:       $('#hazard-grid'),
  aiSuggestion:     $('#ai-suggestion'),
  aiSuggestionText: $('#ai-suggestion-text'),

  // Severity
  severitySelector: $('#severity-selector'),

  // Details
  gpsPresets:       $('#gps-presets'),
  inputSection:     $('#input-section'),
  gpsCoords:        $('#gps-coords'),
  btnRefreshGps:    $('#btn-refresh-gps'),
  inputKm:          $('#input-km'),
  inputNotes:       $('#input-notes'),
  btnMic:           $('#btn-mic'),
  aiNoteBox:        $('#ai-note-box'),
  aiNoteText:       $('#ai-note-text'),
  btnUseAiNote:     $('#btn-use-ai-note'),
  btnDiscardAiNote: $('#btn-discard-ai-note'),
  passableToggle:   $('#passable-toggle'),
  btnSubmit:        $('#btn-submit-report'),

  // Dashboard
  filterSection:    $('#filter-section'),
  filterSeverity:   $('#filter-severity'),
  dashboardSummary: $('#dashboard-summary'),
  allReports:       $('#all-reports'),

  // Detail
  reportDetail:     $('#report-detail'),

  // Nav
  navItems:         $$('.bottomnav__item'),

  // Toast
  toastContainer:   $('#toast-container'),
};

// ─── View Routing ──────────────────────────────
function getViewTitle(viewName) {
  if (viewName === 'home') return window.I18N ? window.I18N.get('appName') : "Gangman's Logbook";
  if (viewName === 'new-report') return window.I18N ? window.I18N.get('navReport') : "New Report";
  if (viewName === 'dashboard') return window.I18N ? window.I18N.get('navDashboard') : "Dashboard";
  if (viewName === 'detail') return window.I18N ? window.I18N.get('navReport') : "Report Detail";
  return '';
}

function navigateTo(viewName, options = {}) {
  // Hide all views
  Object.values(dom.views).forEach((v) => v && v.classList.remove('view--active'));

  // Show target
  const target = dom.views[viewName];
  if (target) {
    target.classList.add('view--active');
  }

  // Update topbar
  dom.topbarTitle.textContent = options.title || getViewTitle(viewName);
  dom.btnBack.hidden = viewName === 'home';

  // Update nav
  dom.navItems.forEach((item) => {
    item.classList.toggle('bottomnav__item--active', item.dataset.view === viewName);
  });

  state.currentView = viewName;

  // Lifecycle hooks
  if (viewName === 'home') onHomeEnter();
  if (viewName === 'dashboard') onDashboardEnter();
  if (viewName === 'new-report') onNewReportEnter();
  if (viewName === 'detail' && options.reportId) onDetailEnter(options.reportId);

  // Scroll to top
  window.scrollTo(0, 0);
}

// ─── Home View ─────────────────────────────────
async function onHomeEnter() {
  try {
    const today = await DB.getTodayReports();
    const pending = await DB.getPendingReports();
    const all = await DB.getAllReports();
    const synced = all.filter((r) => r.syncStatus === 'synced');

    dom.statToday.textContent = today.length;
    dom.statPending.textContent = pending.length;
    dom.statSynced.textContent = synced.length;

    // Update sync badge
    updateSyncBadge(pending.length);

    // Recent reports (last 5)
    const recent = all.slice(0, 5);
    if (recent.length > 0) {
      dom.emptyState.hidden = true;
      Dashboard.renderReportList(dom.recentReports, recent, (id) => {
        navigateTo('detail', { reportId: id });
      });
    } else {
      dom.recentReports.innerHTML = '';
      dom.recentReports.appendChild(dom.emptyState);
      dom.emptyState.hidden = false;
    }
  } catch (error) {
    console.error('[App] Failed to load home data:', error);
  }
}

// ─── New Report View ───────────────────────────
function onNewReportEnter() {
  resetForm();
  acquireGPS();
}

function resetForm() {
  state.capturedPhoto = null;
  state.selectedHazard = null;
  state.selectedSeverity = null;
  state.selectedPassable = 'yes';

  // Reset camera
  dom.photoPreview.hidden = true;
  dom.photoPreview.src = '';
  dom.cameraOverlay.classList.remove('camera-box__overlay--hidden');
  dom.btnRetake.hidden = true;
  dom.cameraPreview.hidden = false;
  dom.cameraPreview.srcObject = null;

  // Reset hazard selection
  $$('.hazard-option').forEach((btn) => btn.classList.remove('hazard-option--selected'));

  // Reset severity
  $$('.severity-btn').forEach((btn) => btn.classList.remove('severity-btn--selected'));

  // Reset fields
  dom.inputSection.value = '';
  dom.inputKm.value = '';
  dom.inputNotes.value = '';
  dom.aiSuggestion.hidden = true;
  dom.aiNoteBox.hidden = true;

  // Reset passable toggle
  $$('.toggle-btn').forEach((btn) => {
    btn.classList.toggle('toggle-btn--active', btn.dataset.passable === 'yes');
  });

  // Reset GPS preset highlight
  $$('.gps-preset-pill').forEach((pill) => pill.classList.remove('gps-preset-pill--active'));
}

// ─── Camera ────────────────────────────────────
async function openCamera() {
  try {
    dom.cameraOverlay.classList.add('camera-box__overlay--hidden');
    dom.cameraPreview.hidden = false;
    dom.photoPreview.hidden = true;
    await Camera.startCamera(dom.cameraPreview);
  } catch (error) {
    console.error('[App] Camera error:', error);
    showToast('Live camera unavailable. Use Upload or Sample Photo.', 'info');
    dom.cameraOverlay.classList.remove('camera-box__overlay--hidden');
  }
}

function capturePhoto() {
  if (!Camera.isCameraActive()) {
    // If user clicked capture before opening camera, open it or use sample
    openCamera();
    return;
  }

  state.capturedPhoto = Camera.capturePhoto(dom.cameraPreview, dom.cameraCanvas, {
    quality: 0.8,
    maxWidth: 1024,
  });

  applyPhotoCapture(state.capturedPhoto);
  Camera.stopCamera();
}

function retakePhoto() {
  state.capturedPhoto = null;
  dom.photoPreview.hidden = true;
  dom.photoPreview.src = '';
  dom.cameraPreview.hidden = false;
  dom.btnRetake.hidden = true;
  openCamera();
}

async function applyPhotoCapture(dataUrl) {
  state.capturedPhoto = dataUrl;
  dom.photoPreview.src = dataUrl;
  dom.photoPreview.hidden = false;
  dom.cameraPreview.hidden = true;
  dom.cameraOverlay.classList.add('camera-box__overlay--hidden');
  dom.btnRetake.hidden = false;

  // Run on-device vision classification (MediaPipe Tasks with canvas heuristics fallback)
  const analysis = await AI.classifyImage(dom.photoPreview);
  if (analysis.type !== 'other' && !state.selectedHazard) {
    selectHazard(analysis.type);
    const hLabel = window.I18N ? window.I18N.getHazard(analysis.type) : analysis.type;
    const sourceLabel = analysis.source === 'mediapipe' ? 'MediaPipe Tasks' : 'On-Device Vision';
    showToast(`${sourceLabel}: ${hLabel} (${analysis.reason || 'detected'})`, 'info');
  }

  // Trigger classification or note generation
  tryAIClassification();
}

// ─── GPS & Station Presets ─────────────────────
async function acquireGPS() {
  dom.gpsCoords.textContent = 'Acquiring GPS…';
  dom.btnRefreshGps.classList.add('spin');

  try {
    const pos = await GEO.getCurrentPosition();
    state.coords = pos;
    dom.gpsCoords.textContent = GEO.formatCoords(pos.lat, pos.lng);

    // Auto-estimate KM, track section & closest preset from coordinates
    const est = GEO.estimateKM(pos.lat, pos.lng);
    console.log('[App] GPS coordinates acquired:', pos, 'Estimate:', est);

    if (est) {
      // 1. Update KM marker
      dom.inputKm.value = est.km;

      // 2. Update Track Section dropdown (value + explicit selectedIndex)
      if (est.section) {
        dom.inputSection.value = est.section;
        for (let i = 0; i < dom.inputSection.options.length; i++) {
          if (dom.inputSection.options[i].value === est.section) {
            dom.inputSection.selectedIndex = i;
            break;
          }
        }
        dom.inputSection.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 3. Highlight closest DHR GPS preset pill
      if (est.nearestPreset) {
        $$('.gps-preset-pill').forEach((pill) => {
          const pillName = (pill.dataset.station || '').toLowerCase();
          const target = est.nearestPreset.toLowerCase();
          const isMatch = pillName === target || pillName.includes(target) || target.includes(pillName);
          pill.classList.toggle('gps-preset-pill--active', isMatch);
        });
      }

      const secLabel = window.I18N ? window.I18N.getSection(est.section) : est.section;
      showToast(`📍 Track section updated: ${secLabel} (~KM ${est.km})`, 'success');

      // 4. Regenerate AI note with newly detected section & KM
      if (state.selectedHazard && state.selectedSeverity) {
        generateAINote();
      }
    }
  } catch (error) {
    console.warn('[App] Real GPS unavailable/timeout:', error);
    // If real GPS is unavailable or timed out indoors, auto-fallback to DHR station preset
    const fallback = GEO.DHR_PRESETS[0]; // Batasia Loop
    applyGpsPreset(fallback.name);
    showToast('GPS unavailable indoors. Defaulted to DHR station: ' + fallback.name, 'info');
  } finally {
    dom.btnRefreshGps.classList.remove('spin');
  }
}

function applyGpsPreset(stationName) {
  const preset = GEO.DHR_PRESETS.find((p) =>
    p.name.toLowerCase().includes(stationName.toLowerCase()) ||
    (p.key && p.key.toLowerCase().includes(stationName.toLowerCase())) ||
    stationName.toLowerCase().includes(p.name.toLowerCase())
  );
  if (!preset) return;

  state.coords = { lat: preset.lat, lng: preset.lng };
  dom.gpsCoords.textContent = GEO.formatCoords(preset.lat, preset.lng);
  dom.inputKm.value = preset.km;

  if (preset.section) {
    dom.inputSection.value = preset.section;
    for (let i = 0; i < dom.inputSection.options.length; i++) {
      if (dom.inputSection.options[i].value === preset.section) {
        dom.inputSection.selectedIndex = i;
        break;
      }
    }
    dom.inputSection.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Highlight pill
  $$('.gps-preset-pill').forEach((btn) => {
    const pillName = (btn.dataset.station || '').toLowerCase();
    const target = stationName.toLowerCase();
    const isMatch = pillName === target || pillName.includes(target) || target.includes(pillName);
    btn.classList.toggle('gps-preset-pill--active', isMatch);
  });

  const secLabel = window.I18N ? window.I18N.getSection(preset.section) : preset.section;
  showToast(`📍 Set location: ${preset.name} (KM ${preset.km}) · ${secLabel}`, 'success');

  // Re-run AI note if hazard selected
  if (state.selectedHazard && state.selectedSeverity) {
    generateAINote();
  }
}

// ─── Hazard Selection ──────────────────────────
function selectHazard(type) {
  state.selectedHazard = type;

  $$('.hazard-option').forEach((btn) => {
    btn.classList.toggle('hazard-option--selected', btn.dataset.hazard === type);
  });

  if (state.selectedSeverity) {
    setTimeout(generateAINote, 100);
  }
}

// ─── Severity Selection ────────────────────────
function selectSeverity(level) {
  state.selectedSeverity = level;

  $$('.severity-btn').forEach((btn) => {
    btn.classList.toggle('severity-btn--selected', btn.dataset.severity === level);
  });

  if (state.selectedHazard) {
    setTimeout(generateAINote, 100);
  }
}

// ─── Passable Toggle ───────────────────────────
function selectPassable(value) {
  state.selectedPassable = value;

  $$('.toggle-btn').forEach((btn) => {
    btn.classList.toggle('toggle-btn--active', btn.dataset.passable === value);
  });

  if (state.selectedHazard && state.selectedSeverity) {
    setTimeout(generateAINote, 100);
  }
}

// ─── AI Classification ────────────────────────
async function tryAIClassification() {
  const notes = dom.inputNotes.value.trim();
  if (!notes && !state.capturedPhoto) return;

  if (notes) {
    const result = await AI.classifyHazard(notes);
    if (result.type !== 'other' && result.confidence !== 'low') {
      const hazardLabel = window.I18N ? window.I18N.getHazard(result.type) : AI.HAZARD_TYPES[result.type]?.label;
      const prefix = window.I18N ? window.I18N.get('aiSuggestionPrefix') : 'AI Suggestion:';
      dom.aiSuggestionText.textContent = `${prefix} ${hazardLabel} (${result.source})`;
      dom.aiSuggestion.hidden = false;

      // Auto-select if high confidence
      if (result.confidence === 'high' && !state.selectedHazard) {
        selectHazard(result.type);
      }
    }
  }
}

// ─── AI Note Generation ───────────────────────
async function generateAINote() {
  if (!state.selectedHazard || !state.selectedSeverity) return;

  try {
    const activeLang = window.I18N ? window.I18N.currentLang : 'en';
    const result = await AI.generateNote({
      hazardType: state.selectedHazard,
      severity: state.selectedSeverity,
      section: dom.inputSection.value,
      passable: state.selectedPassable,
      userNotes: dom.inputNotes.value,
      km: dom.inputKm.value ? parseFloat(dom.inputKm.value) : null,
      lang: activeLang,
    });

    dom.aiNoteText.textContent = result.note;
    dom.aiNoteBox.hidden = false;
  } catch (error) {
    console.warn('[App] AI note generation failed:', error);
  }
}

// ─── Voice Input (Speech Recognition) ──────────
let _recognition = null;

function setupVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    dom.btnMic.title = 'Voice recognition not supported';
    return;
  }

  _recognition = new SpeechRecognition();
  _recognition.continuous = false;
  _recognition.interimResults = false;

  _recognition.onstart = () => {
    state.isListening = true;
    dom.btnMic.classList.add('recording');
    showToast(window.I18N ? window.I18N.get('voiceListening') : 'Listening… speak your observation', 'info');
  };

  _recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (transcript) {
      dom.inputNotes.value = dom.inputNotes.value ? `${dom.inputNotes.value}. ${transcript}` : transcript;
      showToast(`Transcribed: "${transcript}"`, 'success');
      tryAIClassification();
      if (state.selectedHazard && state.selectedSeverity) {
        generateAINote();
      }
    }
  };

  _recognition.onerror = (event) => {
    console.warn('[Voice] Error:', event.error);
    state.isListening = false;
    dom.btnMic.classList.remove('recording');
  };

  _recognition.onend = () => {
    state.isListening = false;
    dom.btnMic.classList.remove('recording');
  };
}

function toggleVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast(window.I18N ? window.I18N.get('voiceNotSupported') : 'Voice input not supported in this browser', 'error');
    return;
  }

  if (state.isListening) {
    _recognition.stop();
  } else {
    // Bias language according to active UI locale
    const current = window.I18N ? window.I18N.currentLang : 'en';
    const langMap = { en: 'en-IN', ne: 'ne-NP', hi: 'hi-IN', bn: 'bn-IN' };
    _recognition.lang = langMap[current] || 'en-IN';
    try {
      _recognition.start();
    } catch (e) {
      console.warn('[Voice] Start error:', e);
    }
  }
}

// ─── Submit Report ─────────────────────────────
async function submitReport() {
  // Validate
  if (!state.selectedHazard) {
    showToast('Please select a hazard type.', 'error');
    return;
  }
  if (!state.selectedSeverity) {
    showToast('Please select severity level.', 'error');
    return;
  }
  if (!dom.inputSection.value) {
    showToast('Please select a track section.', 'error');
    return;
  }

  const report = {
    hazardType: state.selectedHazard,
    severity: state.selectedSeverity,
    section: dom.inputSection.value,
    passable: state.selectedPassable,
    coords: state.coords,
    km: dom.inputKm.value ? parseFloat(dom.inputKm.value) : null,
    notes: dom.inputNotes.value.trim(),
    aiNote: dom.aiNoteBox.hidden ? null : dom.aiNoteText.textContent,
    photo: state.capturedPhoto,
  };

  try {
    dom.btnSubmit.disabled = true;
    const savingText = window.I18N ? window.I18N.get('btnSaving') : 'Saving…';
    dom.btnSubmit.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      <span>${savingText}</span>`;

    const id = await DB.saveReport(report);
    console.log('[App] Report saved:', id);

    // Request background sync
    await Sync.requestSync();

    showToast(window.I18N ? window.I18N.get('btnSaveReport') + ' ✓' : 'Report saved successfully!', 'success');

    // Return to home
    Camera.stopCamera();
    navigateTo('home');
  } catch (error) {
    console.error('[App] Failed to save report:', error);
    showToast('Failed to save report. Please try again.', 'error');
  } finally {
    dom.btnSubmit.disabled = false;
    const saveText = window.I18N ? window.I18N.get('btnSaveReport') : 'Save Report';
    dom.btnSubmit.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/></svg>
      <span>${saveText}</span>`;
  }
}

// ─── Dashboard View ────────────────────────────
async function onDashboardEnter() {
  await Dashboard.renderSectionSummary(dom.dashboardSummary);
  await loadFilteredReports();
}

async function loadFilteredReports() {
  const filters = {
    section: dom.filterSection.value,
    severity: dom.filterSeverity.value,
  };

  const reports = await DB.getAllReports(filters);
  Dashboard.renderReportList(dom.allReports, reports, (id) => {
    navigateTo('detail', { reportId: id });
  });
}

// ─── Detail View ───────────────────────────────
async function onDetailEnter(reportId) {
  const report = await DB.getReport(reportId);
  if (report) {
    Dashboard.renderReportDetail(dom.reportDetail, report);
  } else {
    dom.reportDetail.innerHTML = '<p class="empty-state__text">Report not found.</p>';
  }
}

// ─── Toast Notifications ───────────────────────
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(16px)';
    toast.style.transition = 'all 0.3s var(--ease-out)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ─── Sync Badge ────────────────────────────────
function updateSyncBadge(count) {
  dom.syncBadge.textContent = count;
  dom.syncBadge.dataset.count = count;
  dom.syncBadge.hidden = !count || count <= 0;
}

// ─── Online/Offline Indicator ──────────────────
function updateOnlineStatus() {
  const isOnline = navigator.onLine;
  dom.onlineIndicator.classList.toggle('online', isOnline);
  dom.onlineIndicator.title = isOnline ? 'Online' : 'Offline';
}

// ─── Event Bindings ────────────────────────────
function bindEvents() {
  // Navigation
  dom.navItems.forEach((item) => {
    item.addEventListener('click', () => navigateTo(item.dataset.view));
  });

  dom.btnBack.addEventListener('click', () => {
    if (state.currentView === 'detail') {
      navigateTo('dashboard');
    } else {
      navigateTo('home');
    }
    Camera.stopCamera();
  });

  // Home
  dom.btnNewReport.addEventListener('click', () => navigateTo('new-report'));
  dom.btnViewAll.addEventListener('click', () => navigateTo('dashboard'));

  // Demo Seed Button
  dom.btnSeedDemo.addEventListener('click', async () => {
    try {
      dom.btnSeedDemo.disabled = true;
      const count = await DB.seedDemoReports();
      showToast(window.I18N ? window.I18N.get('demoSeedSuccess') : `Loaded sample DHR patrol reports!`, 'success');
      await onHomeEnter();
    } catch (e) {
      console.warn('[App] Seed failed:', e);
    } finally {
      dom.btnSeedDemo.disabled = false;
    }
  });

  // Clear Reports Button
  if (dom.btnClearReports) {
    dom.btnClearReports.addEventListener('click', async () => {
      if (confirm('Delete all saved reports and reset logbook?')) {
        await DB.clearAllReports();
        showToast('All reports deleted', 'info');
        await onHomeEnter();
        if (state.currentView === 'dashboard') onDashboardEnter();
      }
    });
  }

  // Sunlight Mode Toggle
  dom.btnSunlight.addEventListener('click', () => {
    document.body.classList.toggle('sunlight-mode');
    const isSunlight = document.body.classList.contains('sunlight-mode');
    dom.btnSunlight.textContent = isSunlight ? '🌙' : '☀️';
    try {
      localStorage.setItem('dhr_sunlight', isSunlight ? 'true' : 'false');
    } catch (e) {}
  });

  // Language Picker
  $$('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.I18N.setLanguage(btn.dataset.lang);
      dom.topbarTitle.textContent = getViewTitle(state.currentView);
      // Re-generate AI note if form has inputs
      if (state.selectedHazard && state.selectedSeverity) {
        generateAINote();
      }
      // Re-render current view with new strings
      if (state.currentView === 'home') onHomeEnter();
      if (state.currentView === 'dashboard') onDashboardEnter();
    });
  });

  // Camera Actions
  dom.cameraOverlay.addEventListener('click', openCamera);
  dom.btnCapture.addEventListener('click', capturePhoto);
  dom.btnRetake.addEventListener('click', retakePhoto);

  // Photo Upload fallback
  dom.btnUploadPhoto.addEventListener('click', () => dom.filePhotoInput.click());
  dom.filePhotoInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      try {
        const compressed = await Camera.compressImage(file);
        applyPhotoCapture(compressed);
        showToast('Photo uploaded & compressed', 'success');
      } catch (err) {
        console.error('[Camera] File compression error:', err);
      }
    }
  });

  // Sample Photo fallback
  dom.btnSamplePhoto.addEventListener('click', () => {
    const hType = state.selectedHazard || 'slip';
    const sample = Camera.createSamplePhoto(hType);
    applyPhotoCapture(sample);
    showToast(`Loaded sample patrol photo for ${hType}`, 'info');
  });

  // Hazard grid
  $$('.hazard-option').forEach((btn) => {
    btn.addEventListener('click', () => selectHazard(btn.dataset.hazard));
  });

  // Severity
  $$('.severity-btn').forEach((btn) => {
    btn.addEventListener('click', () => selectSeverity(btn.dataset.severity));
  });

  // Passable toggle
  $$('.toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => selectPassable(btn.dataset.passable));
  });

  // GPS Refresh & Presets
  dom.btnRefreshGps.addEventListener('click', acquireGPS);
  $$('.gps-preset-pill').forEach((pill) => {
    pill.addEventListener('click', () => applyGpsPreset(pill.dataset.station));
  });

  // Voice Input Mic Button
  dom.btnMic.addEventListener('click', toggleVoiceInput);

  // Notes — trigger AI classification on blur
  dom.inputNotes.addEventListener('blur', tryAIClassification);

  // AI note actions
  dom.btnUseAiNote.addEventListener('click', () => {
    dom.inputNotes.value = dom.aiNoteText.textContent;
    dom.aiNoteBox.hidden = true;
  });
  dom.btnDiscardAiNote.addEventListener('click', () => {
    dom.aiNoteBox.hidden = true;
  });

  // Submit
  dom.btnSubmit.addEventListener('click', submitReport);

  // Dashboard filters
  dom.filterSection.addEventListener('change', loadFilteredReports);
  dom.filterSeverity.addEventListener('change', loadFilteredReports);

  // Online/offline
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Sync events
  window.addEventListener('reports-synced', (e) => {
    const { synced } = e.detail;
    showToast(`${synced} report(s) synced successfully!`, 'success');
    if (state.currentView === 'home') onHomeEnter();
    if (state.currentView === 'dashboard') onDashboardEnter();
  });
}

// ─── Initialization ────────────────────────────
async function init() {
  console.log("[App] Gangman's Logbook initializing…");

  // 1. Initialize Localization
  if (window.I18N) {
    window.I18N.init();
  }

  // Restore Sunlight Mode
  try {
    if (localStorage.getItem('dhr_sunlight') === 'true') {
      document.body.classList.add('sunlight-mode');
      dom.btnSunlight.textContent = '🌙';
    }
  } catch (e) {}

  // 2. Open database
  dom.splashStatus.textContent = 'Opening database…';
  await DB.openDB();

  // Purge previous reports (including dummy images) as requested
  if (localStorage.getItem('dhr_reports_cleared_v4') !== 'true') {
    await DB.clearAllReports();
    localStorage.setItem('dhr_reports_cleared_v4', 'true');
    console.log('[App] Purged previous reports from storage.');
  }

  // 3. Register service worker
  dom.splashStatus.textContent = 'Setting up offline support…';
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('[App] Service worker registered:', reg.scope);

      // Force immediate update check when online
      if (navigator.onLine) {
        reg.update();
      }

      // Automatically reload when a new service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[App] New version activated, reloading for latest updates…');
          window.location.reload();
        }
      });
    } catch (error) {
      console.warn('[App] SW registration failed:', error);
    }
  }

  // 4. Check AI availability
  dom.splashStatus.textContent = 'Checking AI capabilities…';
  await AI.checkAIAvailability();

  // 5. Initialize voice input
  setupVoiceInput();

  // 6. Initialize sync
  Sync.initSync();

  // 7. Set online status
  updateOnlineStatus();

  // 8. Bind events
  bindEvents();

  // 9. Load home data
  dom.splashStatus.textContent = 'Ready!';
  await onHomeEnter();

  // 10. Show app, hide splash
  setTimeout(() => {
    dom.app.hidden = false;
    dom.splash.classList.add('splash--hidden');
    setTimeout(() => dom.splash.remove(), 500);
  }, 400);

  console.log("[App] Gangman's Logbook ready ✓");
}

// ─── Boot ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
