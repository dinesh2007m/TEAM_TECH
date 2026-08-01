/**
 * popup.js
 * --------
 * Extension Popup UI Controller for TEAM_TECH.
 * Zero browser alert popups, structured error boundaries, and defensive API rendering.
 */

import {
  getSystemStatus,
  analyzeAttachment,
  getHistory,
  getReport,
  getPDFUrl,
  getJSONUrl,
} from './utils/api.js';
import { getSettings, saveSettings } from './utils/storage.js';

let activeScanId = null;

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initStatus();
  initUploads();
  initWebmailActions();
  initSettings();
  initHistory();
});

// ─── Notice Banner ─────────────────────────────────────────────────────────────

function showNotice(msg, type = 'info', durationMs = 4000) {
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
    const res = await getSystemStatus();
    if (res && res.status === 'online') {
      badge.classList.remove('offline');
      text.innerText = `Online (v${res.backend_version || '1.0'})`;
    } else {
      badge.classList.add('offline');
      text.innerText = 'Offline';
    }
  } catch (err) {
    badge.classList.add('offline');
    text.innerText = 'Offline';
  }
}

// ─── Webmail DOM Analysis Actions ──────────────────────────────────────────────

function initWebmailActions() {
  const btnGmail = document.getElementById('btnAnalyzeGmail');
  const btnOutlook = document.getElementById('btnAnalyzeOutlook');

  if (btnGmail) {
    btnGmail.addEventListener('click', () => analyzeCurrentWebmail('gmail'));
  }
  if (btnOutlook) {
    btnOutlook.addEventListener('click', () => analyzeCurrentWebmail('outlook'));
  }
}

async function analyzeCurrentWebmail(targetProvider) {
  showLoading(`Extracting active ${targetProvider === 'gmail' ? 'Gmail' : 'Outlook'} email content...`);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      hideLoading();
      showNotice('No active tab detected. Please open Gmail or Outlook.', 'error');
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_EMAIL' }, async (response) => {
      if (chrome.runtime.lastError) {
        hideLoading();
        showNotice(`Cannot read webmail tab. Open an email on https://mail.google.com or https://outlook.office.com.`, 'error');
        return;
      }

      if (!response || !response.success || !response.data) {
        hideLoading();
        showNotice(response?.error || 'No active email message detected in the DOM. Open an email view first.', 'error');
        return;
      }

      updateLoadingMsg('Analyzing email with AI Engine & Rule Processor...');

      chrome.runtime.sendMessage(
        { action: 'ANALYZE_PARSED_EMAIL', payload: response.data },
        (res) => {
          hideLoading();
          if (!res || !res.success) {
            showNotice(res?.error || 'Analysis failed. Check FastAPI backend logs.', 'error');
            return;
          }
          const riskData = res.data?.risk || res.data?.phishing || {};
          renderResults(riskData, response.data);
          switchToTab('tab-results');
          showNotice('Email analysis completed successfully.', 'success');
        }
      );
    });
  } catch (err) {
    hideLoading();
    showNotice(err.message, 'error');
  }
}

// ─── File Upload Actions ───────────────────────────────────────────────────────

function initUploads() {
  const dropEml = document.getElementById('dropzoneEml');
  const fileEml = document.getElementById('fileInputEml');

  const dropFile = document.getElementById('dropzoneFile');
  const fileFile = document.getElementById('fileInputFile');

  // EML Upload
  if (dropEml && fileEml) {
    dropEml.addEventListener('click', () => fileEml.click());
    fileEml.addEventListener('change', (e) => {
      if (e.target.files?.[0]) handleEmlUpload(e.target.files[0]);
    });
  }

  // Attachment Upload
  if (dropFile && fileFile) {
    dropFile.addEventListener('click', () => fileFile.click());
    fileFile.addEventListener('change', (e) => {
      if (e.target.files?.[0]) handleAttachmentUpload(e.target.files[0]);
    });
  }
}

async function handleEmlUpload(file) {
  showLoading(`Uploading ${file.name} for 1-click complete scan...`);
  try {
    chrome.runtime.sendMessage(
      { action: 'EXECUTE_COMPLETE_SCAN', payload: file },
      (res) => {
        hideLoading();
        if (!res || !res.success) {
          showNotice(res?.error || 'EML Scan failed.', 'error');
          return;
        }
        renderResults(res.data, {
          subject: res.data.subject,
          sender: res.data.sender,
          scan_id: res.data.scan_id,
        });
        switchToTab('tab-results');
        showNotice(`EML scan complete. Risk: ${res.data.risk_level}`, 'success');
      }
    );
  } catch (err) {
    hideLoading();
    showNotice(err.message, 'error');
  }
}

async function handleAttachmentUpload(file) {
  showLoading(`Analyzing ${file.name} in static sandbox...`);
  try {
    const res = await analyzeAttachment(file);
    hideLoading();
    renderResults(
      {
        risk_level: res.risk_level,
        risk_score: res.risk_score,
        scan_id: `sandbox-${Date.now()}`,
        recommendation: `Attachment file static analysis completed for ${res.filename}. Entropy: ${res.analysis?.entropy?.toFixed(2) || 'N/A'}.`,
        indicators: res.indicators || [],
      },
      {
        subject: `Sandbox File: ${res.filename}`,
        sender: 'Manual File Upload',
      }
    );
    switchToTab('tab-results');
    showNotice(`Sandbox analysis complete for ${res.filename}`, 'success');
  } catch (err) {
    hideLoading();
    showNotice(err.message, 'error');
  }
}

// ─── Results Renderer ──────────────────────────────────────────────────────────

function renderResults(riskData, metaData = {}) {
  const empty = document.getElementById('resultsEmpty');
  const content = document.getElementById('resultsContent');

  if (!riskData) {
    empty.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  content.classList.remove('hidden');

  activeScanId = riskData.scan_id || metaData.scan_id;

  const level = (riskData.risk_level || 'Low').toUpperCase();
  const score = riskData.risk_score ?? 0;

  const banner = document.getElementById('riskBanner');
  const title = document.getElementById('riskTitle');
  const scoreEl = document.getElementById('riskScore');

  title.innerText = level;
  scoreEl.innerText = score;

  banner.className = `risk-banner ${level.toLowerCase()}`;

  document.getElementById('resSubject').innerText = metaData.subject || riskData.subject || '—';
  document.getElementById('resSender').innerText = metaData.sender || riskData.sender || '—';
  document.getElementById('resScanId').innerText = activeScanId || '—';

  const recommendation =
    riskData.recommendation ||
    (Array.isArray(riskData.recommendations) ? riskData.recommendations.join(' ') : null) ||
    'No critical remediation action required.';

  document.getElementById('resRecommendation').innerText = recommendation;

  // Indicators list
  const indCount = document.getElementById('indCount');
  const indList = document.getElementById('indList');

  const indicators = riskData.indicators || riskData.phishing_indicators || [];
  indCount.innerText = indicators.length;
  indList.innerHTML = '';

  if (indicators.length === 0) {
    indList.innerHTML = '<p className="text-muted text-center py-2">No threat indicators triggered.</p>';
  } else {
    indicators.forEach((ind) => {
      const div = document.createElement('div');
      div.className = 'ind-badge-row';
      const sev = (ind.severity || 'low').toLowerCase();
      div.innerHTML = `
        <span className="badge-tag ${sev}">${ind.severity || 'LOW'}</span>
        <div style="flex:1;">
          <p className="font-bold">${ind.name || 'Indicator'}</p>
          <p className="text-sub" style="font-size:9.5px;">${ind.reason || ''}</p>
        </div>
      `;
      indList.appendChild(div);
    });
  }

  // Download buttons
  const btnJson = document.getElementById('btnDownloadJson');
  const btnPdf = document.getElementById('btnDownloadPdf');

  btnJson.onclick = async () => {
    if (!activeScanId) return showNotice('No active scan ID for JSON export.', 'error');
    const url = await getJSONUrl(activeScanId);
    window.open(url, '_blank');
  };

  btnPdf.onclick = async () => {
    if (!activeScanId) return showNotice('No active scan ID for PDF export.', 'error');
    const url = await getPDFUrl(activeScanId);
    window.open(url, '_blank');
  };
}

// ─── History Renderer ──────────────────────────────────────────────────────────

function initHistory() {
  const btnRefresh = document.getElementById('btnRefreshHistory');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', loadHistoryList);
  }
}

async function loadHistoryList() {
  const spinner = document.getElementById('historyLoading');
  const container = document.getElementById('historyList');

  spinner.classList.remove('hidden');
  container.innerHTML = '';

  try {
    const data = await getHistory(1, 30);
    spinner.classList.add('hidden');

    const scans = data.scans || [];
    if (scans.length === 0) {
      container.innerHTML = '<p className="empty-subtitle text-center py-6">No scan records in SQLite database.</p>';
      return;
    }

    scans.forEach((scan) => {
      const item = document.createElement('div');
      item.className = 'history-card';
      const level = (scan.risk_level || 'Low').toLowerCase();
      item.innerHTML = `
        <div style="min-width:0; flex:1; margin-right:6px;">
          <p className="font-bold text-main" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${scan.subject || 'No Subject'}</p>
          <p className="text-sub" style="font-size:9.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">From: ${scan.sender || '—'} • ${new Date(scan.created_at).toLocaleDateString()}</p>
        </div>
        <div style="display:flex; gap:6px; align-items:center; flex-shrink:0;">
          <span className="badge-tag ${level}">${scan.risk_level}</span>
          <button className="btn btn-secondary sm btn-view" data-id="${scan.scan_id}">View</button>
        </div>
      `;
      container.appendChild(item);
    });

    container.querySelectorAll('.btn-view').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
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
    spinner.classList.add('hidden');
    container.innerHTML = `<p className="notice-banner error">Failed to load history: ${err.message}</p>`;
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
    await saveSettings({
      backendUrl: urlInput.value.trim() || 'http://127.0.0.1:8000',
      autoAnalyze: autoInput.checked,
      enableNotifications: notifInput.checked,
    });
    showNotice('Extension preferences saved successfully.', 'success');
    initStatus();
  });

  document.getElementById('btnTestBackend')?.addEventListener('click', async () => {
    const start = performance.now();
    try {
      const res = await getSystemStatus();
      const latency = Math.round(performance.now() - start);
      showNotice(`Backend Status: ${res.status.toUpperCase()} (${latency} ms latency, ${res.database?.total_scans ?? 0} scans)`, 'success', 6000);
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
