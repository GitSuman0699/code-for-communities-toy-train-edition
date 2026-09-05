/**
 * dashboard.js — Dashboard & Report Rendering
 *
 * Handles rendering the section-wise dashboard, report lists,
 * and report detail views with multilingual support.
 */

/**
 * Render the section-wise summary on the dashboard.
 * @param {HTMLElement} container
 */
async function renderSectionSummary(container) {
  const summary = await window.DB.getSectionSummary();
  container.innerHTML = '';

  const sections = Object.entries(summary);
  if (sections.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📊</div>
        <p class="empty-state__text">${window.I18N ? window.I18N.get('emptyFilter', 'No data yet.') : 'No data yet.'}</p>
      </div>`;
    return;
  }

  // Sort by total reports descending
  sections.sort((a, b) => b[1].total - a[1].total);

  sections.forEach(([section, counts]) => {
    const card = document.createElement('div');
    card.className = 'section-card';
    const sectionName = window.I18N ? window.I18N.getSection(section) : formatSectionName(section);

    card.innerHTML = `
      <span class="section-card__name">${sectionName}</span>
      <div class="section-card__badges">
        ${counts.critical > 0 ? `<span class="section-card__count section-card__count--critical" title="Critical">${counts.critical}</span>` : ''}
        ${counts.high > 0 ? `<span class="section-card__count section-card__count--high" title="High">${counts.high}</span>` : ''}
        ${counts.medium > 0 ? `<span class="section-card__count section-card__count--medium" title="Medium">${counts.medium}</span>` : ''}
        ${counts.low > 0 ? `<span class="section-card__count section-card__count--low" title="Low">${counts.low}</span>` : ''}
      </div>`;
    container.appendChild(card);
  });
}

/**
 * Render a list of report cards.
 * @param {HTMLElement} container
 * @param {Array} reports
 * @param {Function} onClickReport - Called with report ID when a card is clicked
 */
function renderReportList(container, reports, onClickReport) {
  container.innerHTML = '';

  if (reports.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📋</div>
        <p class="empty-state__text">${window.I18N ? window.I18N.get('emptyFilter', 'No reports found.') : 'No reports match the current filters.'}</p>
      </div>`;
    return;
  }

  reports.forEach((report) => {
    const card = document.createElement('div');
    card.className = 'report-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    const hazardMeta = window.AI.HAZARD_TYPES[report.hazardType] || window.AI.HAZARD_TYPES.other;
    const hazardLabel = window.I18N ? window.I18N.getHazard(report.hazardType) : hazardMeta.label;
    const severityLabel = window.I18N ? window.I18N.getSeverity(report.severity) : report.severity;
    const sectionName = window.I18N ? window.I18N.getSection(report.section) : formatSectionName(report.section);
    const timeAgo = formatTimeAgo(report.timestamp);

    const isSynced = report.syncStatus === 'synced';
    const syncText = isSynced
      ? (window.I18N ? window.I18N.get('statSynced', 'Synced') : 'Synced')
      : (window.I18N ? window.I18N.get('statPending', 'Pending') : 'Pending');

    card.innerHTML = `
      ${report.photo
        ? `<img class="report-card__thumbnail" src="${report.photo}" alt="${hazardLabel}" loading="lazy">`
        : `<div class="report-card__thumbnail" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;">${hazardMeta.icon}</div>`
      }
      <div class="report-card__body">
        <div class="report-card__header">
          <span class="report-card__hazard">${hazardMeta.icon} ${hazardLabel}</span>
          <span class="report-card__severity report-card__severity--${report.severity}">${severityLabel}</span>
        </div>
        <div class="report-card__meta">
          <span>${sectionName}</span>
          <span>·</span>
          <span>${timeAgo}</span>
          <span class="report-card__sync-status">
            <span class="report-card__sync-dot report-card__sync-dot--${isSynced ? 'synced' : 'pending'}"></span>
            ${syncText}
          </span>
        </div>
      </div>`;

    card.addEventListener('click', () => onClickReport(report.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') onClickReport(report.id);
    });

    container.appendChild(card);
  });
}

/**
 * Render the full detail view for a single report.
 * @param {HTMLElement} container
 * @param {Object} report
 */
function renderReportDetail(container, report) {
  const hazardMeta = window.AI.HAZARD_TYPES[report.hazardType] || window.AI.HAZARD_TYPES.other;
  const hazardLabel = window.I18N ? window.I18N.getHazard(report.hazardType) : hazardMeta.label;
  const severityLabel = window.I18N ? window.I18N.getSeverity(report.severity) : report.severity;
  const sectionName = window.I18N ? window.I18N.getSection(report.section) : formatSectionName(report.section);
  const date = new Date(report.timestamp);

  const passableText = {
    yes: `✅ ${window.I18N ? window.I18N.get('passableYes') : 'Yes'} — Track is passable`,
    caution: `⚠️ ${window.I18N ? window.I18N.get('passableCaution') : 'With Caution'} — Speed restricted`,
    no: `🚫 ${window.I18N ? window.I18N.get('passableNo') : 'No'} — Line block required`,
  };

  const isSynced = report.syncStatus === 'synced';
  const syncText = isSynced
    ? (window.I18N ? window.I18N.get('statSynced') : 'Synced')
    : (window.I18N ? window.I18N.get('statPending') : 'Pending');

  container.innerHTML = `
    ${report.photo ? `<img class="detail__photo" src="${report.photo}" alt="${hazardLabel}">` : ''}

    <div class="detail__header">
      <span class="detail__hazard-icon">${hazardMeta.icon}</span>
      <div class="detail__info">
        <div class="detail__hazard-label">${hazardLabel}</div>
        <span class="report-card__severity report-card__severity--${report.severity}">${severityLabel.toUpperCase()}</span>
      </div>
    </div>

    <div class="detail__field">
      <span class="detail__field-label">Report ID</span>
      <span class="detail__field-value" style="font-family:var(--font-mono);font-size:var(--text-sm);">${report.id}</span>
    </div>

    <div class="detail__field">
      <span class="detail__field-label">Date & Time</span>
      <span class="detail__field-value">${date.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>

    <div class="detail__field">
      <span class="detail__field-label">${window.I18N ? window.I18N.get('labelSection') : 'Track Section'}</span>
      <span class="detail__field-value">${sectionName}</span>
    </div>

    ${report.km ? `
    <div class="detail__field">
      <span class="detail__field-label">${window.I18N ? window.I18N.get('labelKm') : 'KM Marker'}</span>
      <span class="detail__field-value">~${report.km} km</span>
    </div>` : ''}

    ${report.coords ? `
    <div class="detail__field">
      <span class="detail__field-label">${window.I18N ? window.I18N.get('labelGps') : 'GPS Coordinates'}</span>
      <span class="detail__field-value" style="font-family:var(--font-mono);font-size:var(--text-sm);">${report.coords.lat.toFixed(6)}°N, ${report.coords.lng.toFixed(6)}°E</span>
    </div>` : ''}

    <div class="detail__field">
      <span class="detail__field-label">${window.I18N ? window.I18N.get('passablePrompt') : 'Track Passable'}</span>
      <span class="detail__field-value">${passableText[report.passable] || report.passable}</span>
    </div>

    <div class="detail__field">
      <span class="detail__field-label">${window.I18N ? window.I18N.get('labelNotes') : 'Notes'}</span>
      <span class="detail__field-value">${report.notes || 'No notes provided.'}</span>
    </div>

    ${report.aiNote ? `
    <div class="detail__field">
      <span class="detail__field-label"><span class="ai-badge" style="margin-right:6px;">AI</span> ${window.I18N ? window.I18N.get('aiBadge') : 'AI Summary'}</span>
      <span class="detail__field-value" style="color:var(--text-primary);line-height:1.6;font-size:0.95rem;">${report.aiNote}</span>
    </div>` : ''}

    <div class="detail__field">
      <span class="detail__field-label">Sync Status</span>
      <span class="detail__field-value">
        <span class="report-card__sync-status">
          <span class="report-card__sync-dot report-card__sync-dot--${isSynced ? 'synced' : 'pending'}"></span>
          ${syncText}
        </span>
      </span>
    </div>
  `;
}

// ─── Helpers ───────────────────────────────────

/**
 * Format section key to human-readable name.
 * e.g., "Sukna-Rangtong" → "Sukna – Rangtong"
 */
function formatSectionName(section) {
  if (!section) return 'Unknown';
  return section.replace(/-/g, ' – ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

/**
 * Format timestamp to relative time string.
 */
function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// Export
window.Dashboard = {
  renderSectionSummary,
  renderReportList,
  renderReportDetail,
  formatSectionName,
};
