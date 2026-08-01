/**
 * popup.js
 * --------
 * Extension Popup Controller for TEAM_TECH.
 * Standardized logging with [Popup] tag. Native File upload handling.
 * Zero browser alert popups, structured error boundaries, and defensive API rendering.
 */

import {
  getSystemStatus,
  uploadEmail,
  analyzeAttachment,
  executeCompleteScan,
  getHistory,
  getReport,
  getPDFUrl,
  getJSONUrl,
} from './utils/api.js';
import { getSettings, saveSettings } from './utils/storage.js';

let activeScanId = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Popup] DOM Content Loaded. Initializing Popup Controller...');
  initTabs();
  initStatus();
  initUploads();
  initWebmailActions();
  initSettings();
  initHistory();
});

// ─── Notice Banner ─────────────────────────────────────────────────────────────

function showNotice(msg, type = 'info', durationMs = 5000) {
  const banner = document.getElementById('noticeBanner');
  const text = document.getElementById('noticeMsg');

  if (!banner || !text) return;

  text.innerText = msg;
  banner.className = `notice-banner ${type}`;
  banner.classList.remove('hidden');

  if (durationMs > 0) {
    setTimeout(() => {
      banner.classList.add('hidden');
    }, durationMs);
  }
}

function clearNotice() {
  const banner = document.getElementById('noticeBanner');
  if (banner) banner.classList.add('hidden');
}

// ─── Tabs Navigation ───────────────────────────────────────────────────────────

function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      clearNotice();
      const tabId = btn.getAttribute('data-tab');
      console.log(`[Popup] Tab clicked: '${tabId}'`);

      buttons.forEach((b) => b.classList.remove('active'));
      contents.forEach((c) => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(tabId);
      if (targetContent) targetContent.classList.add('active');

      if (tabId === 'tab-history') {
        loadHistoryList();
      }
    });
  });
}

// ─── Status Check ──────────────────────────────────────────────────────────────

async function initStatus() {
  const badge = document.getElementById('statusBadge');
  const text = document.getElementById('statusText');

  try {
    console.log('[Popup] Checking backend system status...');
    const res = await getSystemStatus();
    if (res && res.status === 'online') {
      badge.classList.remove('offline');
      text.innerText = `Online (v${res.backend_version || '1.0'})`;
      console.log('[Popup] Backend is ONLINE:', res);
    } else {
      badge.classList.add('offline');
      text.innerText = 'Offline';
    }
  } catch (err) {
    console.warn('[Popup] Backend system status check returned offline:', err.message);
    badge.classList.add('offline');
    text.innerText = 'Offline';
  }
}

// ─── Webmail DOM Analysis Actions ──────────────────────────────────────────────

function initWebmailActions() {
  const btnGmail = document.getElementById('btnAnalyzeGmail');
  const btnOutlook = document.getElementById('btnAnalyzeOutlook');

  if (btnGmail) {
    btnGmail.addEventListener('click', () => {
      console.log('[Popup] Button clicked: Analyze Current Gmail Email');
      analyzeCurrentWebmail('gmail');
    });
  }
  if (btnOutlook) {
    btnOutlook.addEventListener('click', () => {
      console.log('[Popup] Button clicked: Analyze Current Outlook Email');
      analyzeCurrentWebmail('outlook');
    });
  }
}

async function analyzeCurrentWebmail(targetProvider) {
  showLoading(`Extracting active ${targetProvider === 'gmail' ? 'Gmail' : 'Outlook'} email content...`);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      hideLoading();
      showNotice('No active browser tab detected. Please open Gmail or Outlook.', 'error');
      return;
    }

    console.log(`[Popup] Sending EXTRACT_EMAIL message to tab ID ${tab.id} (${tab.url})...`);
    chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_EMAIL' }, async (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Popup] Message passing error to tab script:', chrome.runtime.lastError.message);
        hideLoading();
        showNotice(`Cannot read webmail tab. Open an email view on https://mail.google.com or https://outlook.office.com.`, 'error');
        return;
      }

      if (!response || !response.success || !response.data) {
        console.warn('[Popup] Content script returned extraction failure:', response);
        hideLoading();
        showNotice(response?.error || 'No active email message detected in the DOM. Open an email view first.', 'error');
        return;
      }

      const emailData = response.data;
      console.log('[Popup] Content script returned parsed DOM data:', emailData);
      updateLoadingMsg('Analyzing email with AI Engine & SQLite persistence...');

      // Construct synthetic .eml file blob from DOM data for 1-click complete scan
      const emlContent = [
        `From: ${emailData.sender || ''}`,
        `To: ${emailData.receiver || ''}`,
        `Subject: ${emailData.subject || 'No Subject'}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        '',
        emailData.body_text || ''
      ].join('\n');

      const emlBlob = new Blob([emlContent], { type: 'message/rfc822' });
      const emlFile = new File([emlBlob], 'webmail_extracted.eml', { type: 'message/rfc822' });

      try {
        const scanRes = await executeCompleteScan(emlFile);
        hideLoading();
        console.log('[Popup] Webmail complete scan finished:', scanRes);

        renderResults(scanRes, emailData);
        switchToTab('tab-results');

        const level = scanRes.risk_analysis?.risk_level || 'Low';
        chrome.runtime.sendMessage({ action: 'UPDATE_BADGE', payload: { riskLevel: level } });
        showNotice(`Webmail analysis complete. Risk Level: ${level}`, 'success');
      } catch (err) {
        console.error('[Popup] Webmail scan execution error:', err);
        hideLoading();
        showNotice(err.message, 'error');
      }
    });
  } catch (err) {
    console.error('[Popup] Exception during webmail analysis flow:', err);
    hideLoading();
    showNotice(err.message, 'error');
  }
}

// ─── Direct File Upload Actions (Direct File Handle Execution) ────────────────

function initUploads() {
  const dropEml = document.getElementById('dropzoneEml');
  const fileEml = document.getElementById('fileInputEml');

  const dropFile = document.getElementById('dropzoneFile');
  const fileFile = document.getElementById('fileInputFile');

  // EML Upload
  if (dropEml && fileEml) {
    dropEml.addEventListener('click', () => {
      console.log('[Popup] EML dropzone clicked');
      fileEml.click();
    });
    fileEml.addEventListener('change', (e) => {
      if (e.target.files?.[0]) {
        console.log('[Popup] EML file selected:', e.target.files[0].name);
        handleEmlUpload(e.target.files[0]);
      }
    });
  }

  // Attachment Upload
  if (dropFile && fileFile) {
    dropFile.addEventListener('click', () => {
      console.log('[Popup] Sandbox Attachment dropzone clicked');
      fileFile.click();
    });
    fileFile.addEventListener('change', (e) => {
      if (e.target.files?.[0]) {
        console.log('[Popup] Attachment file selected:', e.target.files[0].name);
        handleAttachmentUpload(e.target.files[0]);
      }
    });
  }
}

async function handleEmlUpload(file) {
  showLoading(`Uploading ${file.name} for 1-click complete scan...`);
  try {
    console.log(`[Popup] Calling executeCompleteScan API for file '${file.name}' (${file.size} bytes)...`);
    const res = await executeCompleteScan(file);
    hideLoading();
    console.log('[Popup] executeCompleteScan API returned response:', res);
    
    renderResults(res, {
      subject: res.parsed_email?.subject || res.subject,
      sender: res.parsed_email?.sender || res.sender,
      scan_id: res.scan_id || res.email_id,
    });
    switchToTab('tab-results');
    const level = res.risk_analysis?.risk_level || res.risk_level || 'Low';
    chrome.runtime.sendMessage({ action: 'UPDATE_BADGE', payload: { riskLevel: level } });
    showNotice(`Complete scan finished. Risk Level: ${level}`, 'success');
  } catch (err) {
    console.error('[Popup] handleEmlUpload error:', err);
    hideLoading();
    showNotice(err.message, 'error');
  }
}

async function handleAttachmentUpload(file) {
  showLoading(`Analyzing ${file.name} in static sandbox...`);
  try {
    console.log(`[Popup] Calling analyzeAttachment API for file '${file.name}' (${file.size} bytes)...`);
    const res = await analyzeAttachment(file);
    hideLoading();
    console.log('[Popup] analyzeAttachment API returned response:', res);

    renderResults(
      {
        risk_level: res.risk_level,
        risk_score: res.risk_score,
        scan_id: `sandbox-${Date.now()}`,
        recommendation: `Attachment static analysis complete for '${res.filename}'. File type: ${res.analysis?.file_type || 'Binary'}, SHA256: ${(res.analysis?.sha256 || 'N/A').slice(0, 16)}…`,
        indicators: res.indicators || [],
      },
      {
        subject: `Sandbox File: ${res.filename}`,
        sender: 'Manual File Upload',
      }
    );
    switchToTab('tab-results');
    chrome.runtime.sendMessage({ action: 'UPDATE_BADGE', payload: { riskLevel: res.risk_level || 'Low' } });
    showNotice(`Sandbox analysis complete for '${res.filename}'`, 'success');
  } catch (err) {
    console.error('[Popup] handleAttachmentUpload error:', err);
    hideLoading();
    showNotice(err.message, 'error');
  }
}

// ─── Results Renderer ──────────────────────────────────────────────────────────

function renderResults(scanData, metaData = {}) {
  console.log('[Popup] Rendering results view:', { scanData, metaData });
  const empty = document.getElementById('resultsEmpty');
  const content = document.getElementById('resultsContent');

  if (!scanData) {
    empty.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  content.classList.remove('hidden');

  // Extract risk, parsed email, and indicator data regardless of endpoint structure
  const riskAnalysis = scanData.risk_analysis || scanData.risk || scanData;
  const parsedEmail = scanData.parsed_email || metaData;
  const phishingAnalysis = scanData.phishing_analysis || scanData.phishing || scanData;
  const sandboxAnalysis = scanData.sandbox_analysis || scanData.sandbox || null;

  activeScanId = scanData.scan_id || scanData.email_id || metaData.scan_id;

  const level = (riskAnalysis.risk_level || scanData.risk_level || 'Low').toUpperCase();
  const score = riskAnalysis.risk_score ?? scanData.risk_score ?? 0;

  const banner = document.getElementById('riskBanner');
  const title = document.getElementById('riskTitle');
  const scoreEl = document.getElementById('riskScore');

  title.innerText = level;
  scoreEl.innerText = score;

  banner.className = `risk-banner ${level.toLowerCase()}`;

  document.getElementById('resSubject').innerText = parsedEmail.subject || metaData.subject || scanData.subject || '—';
  document.getElementById('resSender').innerText = parsedEmail.sender || metaData.sender || scanData.sender || '—';
  document.getElementById('resScanId').innerText = activeScanId || '—';

  const recommendation =
    riskAnalysis.recommendation ||
    (Array.isArray(riskAnalysis.recommendations) ? riskAnalysis.recommendations.join(' ') : null) ||
    scanData.recommendation ||
    'No critical remediation action required.';

  document.getElementById('resRecommendation').innerText = recommendation;

  // Indicators list consolidation
  const indCount = document.getElementById('indCount');
  const indList = document.getElementById('indList');

  const phishingInds = phishingAnalysis?.indicators || scanData.phishing_indicators || scanData.indicators || [];
  const sandboxInds = sandboxAnalysis?.indicators || scanData.sandbox_indicators || [];
  const allIndicators = [...phishingInds, ...sandboxInds];

  indCount.innerText = allIndicators.length;
  indList.innerHTML = '';

  if (allIndicators.length === 0) {
    indList.innerHTML = '<p class="text-muted text-center py-2">No threat indicators triggered.</p>';
  } else {
    allIndicators.forEach((ind) => {
      const div = document.createElement('div');
      div.className = 'ind-badge-row';
      const sev = (ind.severity || 'low').toLowerCase();
      div.innerHTML = `
        <span class="badge-tag ${sev}">${(ind.severity || 'LOW').toUpperCase()}</span>
        <div style="flex:1;">
          <p class="font-bold">${ind.name || 'Indicator'}</p>
          <p class="text-sub" style="font-size:9.5px;">${ind.reason || ''}</p>
        </div>
      `;
      indList.appendChild(div);
    });
  }

  // Download buttons setup
  const btnJson = document.getElementById('btnDownloadJson');
  const btnPdf = document.getElementById('btnDownloadPdf');

  btnJson.onclick = async () => {
    if (!activeScanId) return showNotice('No active scan ID for JSON export.', 'error');
    console.log(`[Popup] Opening JSON report URL for scan ID '${activeScanId}'`);
    const url = await getJSONUrl(activeScanId);
    window.open(url, '_blank');
  };

  btnPdf.onclick = async () => {
    if (!activeScanId) return showNotice('No active scan ID for PDF export.', 'error');
    console.log(`[Popup] Opening PDF report URL for scan ID '${activeScanId}'`);
    const url = await getPDFUrl(activeScanId);
    window.open(url, '_blank');
  };
}

// ─── History Renderer ──────────────────────────────────────────────────────────

function initHistory() {
  const btnRefresh = document.getElementById('btnRefreshHistory');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      console.log('[Popup] Refresh History button clicked');
      loadHistoryList();
    });
  }
}

async function loadHistoryList() {
  const spinner = document.getElementById('historyLoading');
  const container = document.getElementById('historyList');

  spinner.classList.remove('hidden');
  container.innerHTML = '';

  try {
    console.log('[Popup] Fetching scan history list from backend...');
    const data = await getHistory(1, 30);
    spinner.classList.add('hidden');

    const scans = data.scans || [];
    console.log(`[Popup] History list loaded with ${scans.length} records.`);

    if (scans.length === 0) {
      container.innerHTML = '<p class="empty-subtitle text-center py-6">No scan records in SQLite database.</p>';
      return;
    }

    scans.forEach((scan) => {
      const item = document.createElement('div');
      item.className = 'history-card';
      const level = (scan.risk_level || 'Low').toLowerCase();
      item.innerHTML = `
        <div style="min-width:0; flex:1; margin-right:6px;">
          <p class="font-bold text-main" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${scan.subject || 'No Subject'}</p>
          <p class="text-sub" style="font-size:9.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">From: ${scan.sender || '—'} • ${new Date(scan.created_at).toLocaleDateString()}</p>
        </div>
        <div style="display:flex; gap:6px; align-items:center; flex-shrink:0;">
          <span class="badge-tag ${level}">${scan.risk_level}</span>
          <button class="btn btn-secondary sm btn-view" data-id="${scan.scan_id}">View</button>
        </div>
      `;
      container.appendChild(item);
    });

    container.querySelectorAll('.btn-view').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        console.log(`[Popup] Viewing detail for scan ID '${id}'...`);
        showLoading('Fetching report details...');
        try {
          const detail = await getReport(id);
          hideLoading();
          renderResults(detail, {
            subject: detail.subject,
            sender: detail.sender,
            scan_id: detail.scan_id,
          });
          switchToTab('tab-results');
          showNotice(`Loaded report for ${id.slice(0, 13)}…`, 'success');
        } catch (e) {
          hideLoading();
          showNotice(e.message, 'error');
        }
      });
    });
  } catch (err) {
    console.error('[Popup] History load error:', err);
    spinner.classList.add('hidden');
    container.innerHTML = `<p class="notice-banner error">Failed to load history: ${err.message}</p>`;
  }
}

// ─── Settings Handler ──────────────────────────────────────────────────────────

async function initSettings() {
  const settings = await getSettings();
  const urlInput = document.getElementById('backendUrl');
  const autoInput = document.getElementById('chkAutoAnalyze');
  const notifInput = document.getElementById('chkNotifications');

  if (urlInput) urlInput.value = settings.backendUrl;
  if (autoInput) autoInput.checked = settings.autoAnalyze;
  if (notifInput) notifInput.checked = settings.enableNotifications;

  document.getElementById('btnSaveSettings')?.addEventListener('click', async () => {
    console.log('[Popup] Save Preferences button clicked');
    await saveSettings({
      backendUrl: urlInput.value.trim() || 'http://127.0.0.1:8000',
      autoAnalyze: autoInput.checked,
      enableNotifications: notifInput.checked,
    });
    showNotice('Extension preferences saved successfully.', 'success');
    initStatus();
  });

  document.getElementById('btnTestBackend')?.addEventListener('click', async () => {
    console.log('[Popup] Test Backend Connection button clicked');
    const start = performance.now();
    try {
      const res = await getSystemStatus();
      const latency = Math.round(performance.now() - start);
      showNotice(`Backend Status: ${res.status.toUpperCase()} (${latency} ms latency, ${res.database?.total_scans ?? 0} scans in SQLite)`, 'success', 6000);
      initStatus();
    } catch (e) {
      showNotice(`Backend Connection Failed: ${e.message}`, 'error', 6000);
    }
  });
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

function switchToTab(tabId) {
  const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (btn) btn.click();
}

function showLoading(msg = 'Processing...') {
  const loading = document.getElementById('globalLoading');
  const txt = document.getElementById('loadingMsg');
  if (txt) txt.innerText = msg;
  if (loading) loading.classList.remove('hidden');
}

function updateLoadingMsg(msg) {
  const txt = document.getElementById('loadingMsg');
  if (txt) txt.innerText = msg;
}

function hideLoading() {
  const loading = document.getElementById('globalLoading');
  if (loading) loading.classList.add('hidden');
}
