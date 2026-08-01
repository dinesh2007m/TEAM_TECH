/**
 * popup.js
 * --------
 * Extension Popup UI Logic for TEAM_TECH.
 * Connects UI interactions to background service worker and API layer.
 */

import {
  getSystemStatus,
  uploadEmail,
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

// ─── Tabs Navigation ───────────────────────────────────────────────────────────

function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
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
  showLoading(`Scraping active ${targetProvider === 'gmail' ? 'Gmail' : 'Outlook'} email...`);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active browser tab found.');

    chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_EMAIL' }, async (response) => {
      if (chrome.runtime.lastError) {
        hideLoading();
        alert(`Cannot access tab. Ensure you are on https://mail.google.com or https://outlook.office.com.`);
        return;
      }

      if (!response || !response.success) {
        hideLoading();
        alert(response?.error || 'Could not extract email content from DOM. Please open an email first.');
        return;
      }

      updateLoadingMsg('Analyzing email with AI Phishing Engine...');

      chrome.runtime.sendMessage(
        { action: 'ANALYZE_PARSED_EMAIL', payload: response.data },
        (res) => {
          hideLoading();
          if (!res || !res.success) {
            alert(res?.error || 'Analysis failed.');
            return;
          }
          renderResults(res.data.risk, response.data);
          switchToTab('tab-results');
        }
      );
    });
  } catch (err) {
    hideLoading();
    alert(err.message);
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
  showLoading(`Uploading ${file.name} to complete scan engine...`);
  try {
    chrome.runtime.sendMessage(
      { action: 'EXECUTE_COMPLETE_SCAN', payload: file },
      (res) => {
        hideLoading();
        if (!res || !res.success) {
          alert(res?.error || 'EML Scan failed.');
          return;
        }
        renderResults(res.data, {
          subject: res.data.subject,
          sender: res.data.sender,
          scan_id: res.data.scan_id,
        });
        switchToTab('tab-results');
      }
    );
  } catch (err) {
    hideLoading();
    alert(err.message);
  }
}

async function handleAttachmentUpload(file) {
  showLoading(`Analyzing file ${file.name} in static sandbox...`);
  try {
    const res = await analyzeAttachment(file);
    hideLoading();
    renderResults(
      {
        risk_level: res.risk_level,
        risk_score: res.risk_score,
        scan_id: `sandbox-${Date.now()}`,
        recommendation: `Attachment file analysis completed for ${res.filename}. Entropy: ${res.analysis?.entropy?.toFixed(2) || 'N/A'}.`,
        indicators: res.indicators || [],
      },
      {
        subject: `Attachment Sandbox: ${res.filename}`,
        sender: 'Manual File Upload',
      }
    );
    switchToTab('tab-results');
  } catch (err) {
    hideLoading();
    alert(err.message);
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

  document.getElementById('resRecommendation').innerText =
    riskData.recommendation || 'No critical remediation action required.';

  // Indicators list
  const indCount = document.getElementById('indCount');
  const indList = document.getElementById('indList');

  const indicators = riskData.indicators || riskData.phishing_indicators || [];
  indCount.innerText = indicators.length;
  indList.innerHTML = '';

  if (indicators.length === 0) {
    indList.innerHTML = '<p className="text-xs text-muted">No threat indicators triggered.</p>';
  } else {
    indicators.forEach((ind) => {
      const div = document.createElement('div');
      div.className = 'ind-item';
      const sev = (ind.severity || 'low').toLowerCase();
      div.innerHTML = `
        <span className="ind-badge ${sev}">${ind.severity || 'LOW'}</span>
        <div>
          <p className="font-bold">${ind.name || 'Indicator'}</p>
          <p className="text-muted">${ind.reason || ''}</p>
        </div>
      `;
      indList.appendChild(div);
    });
  }

  // Setup download buttons
  const btnJson = document.getElementById('btnDownloadJson');
  const btnPdf = document.getElementById('btnDownloadPdf');

  btnJson.onclick = async () => {
    if (!activeScanId) return alert('No active scan ID.');
    const url = await getJSONUrl(activeScanId);
    window.open(url, '_blank');
  };

  btnPdf.onclick = async () => {
    if (!activeScanId) return alert('No active scan ID.');
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
      container.innerHTML = '<p className="empty-desc text-center">No scan history recorded in SQLite.</p>';
      return;
    }

    scans.forEach((scan) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      const level = (scan.risk_level || 'Low').toLowerCase();
      item.innerHTML = `
        <div>
          <p className="font-bold text-xs">${scan.subject ? scan.subject.slice(0, 30) : 'Scan'}</p>
          <p className="text-muted text-xs">${scan.sender || '—'} • ${new Date(scan.created_at).toLocaleDateString()}</p>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <span className="ind-badge ${level}">${scan.risk_level}</span>
          <button className="btn btn-outline sm btn-view" data-id="${scan.scan_id}">View</button>
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
        } catch (e) {
          hideLoading();
          alert(e.message);
        }
      });
    });
  } catch (err) {
    spinner.classList.add('hidden');
    container.innerHTML = `<p className="text-xs text-red-400">Failed to load history: ${err.message}</p>`;
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
    alert('Settings saved successfully!');
    initStatus();
  });

  document.getElementById('btnTestBackend')?.addEventListener('click', async () => {
    const start = performance.now();
    try {
      const res = await getSystemStatus();
      const latency = Math.round(performance.now() - start);
      alert(`Backend Status: ${res.status.toUpperCase()}\nLatency: ${latency} ms\nDatabase: ${res.database?.type || 'SQLite'} (${res.database?.total_scans || 0} scans)`);
      initStatus();
    } catch (e) {
      alert(`Backend Connection Error:\n${e.message}`);
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
