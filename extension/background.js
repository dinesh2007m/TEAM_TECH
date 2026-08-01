/**
 * background.js
 * -------------
 * TEAM_TECH Manifest V3 Service Worker.
 * Handles API orchestration, Chrome notifications, badge updates, and message passing.
 */

import {
  getSystemStatus,
  analyzePhishing,
  analyzeRisk,
  executeCompleteScan,
  analyzeAttachment,
} from './utils/api.js';
import { updateBadge, showNotification } from './utils/notifications.js';
import { getSettings } from './utils/storage.js';

// ─── Service Worker Setup & Message Dispatcher ────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object' || !message.action) {
    sendResponse({ success: false, error: 'Invalid message structure.' });
    return false;
  }

  const { action, payload } = message;

  if (action === 'CHECK_STATUS') {
    getSystemStatus()
      .then((status) => {
        updateBadge('Safe');
        sendResponse({ success: true, data: status });
      })
      .catch((err) => {
        updateBadge('Offline');
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep channel open for async response
  }

  if (action === 'ANALYZE_PARSED_EMAIL') {
    handleEmailAnalysis(payload)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => {
        showNotification('err_scan', 'Analysis Failed', err.message, 'Error');
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (action === 'EXECUTE_COMPLETE_SCAN') {
    handleCompleteScan(payload)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => {
        showNotification('err_scan', 'Scan Failed', err.message, 'Error');
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (action === 'UPDATE_BADGE') {
    if (payload && payload.riskLevel) {
      updateBadge(payload.riskLevel);
    }
    sendResponse({ success: true });
    return false;
  }
});

/**
 * Handle full analysis flow for DOM-extracted or parsed email JSON.
 */
async function handleEmailAnalysis(emailData) {
  if (!emailData || typeof emailData !== 'object') {
    throw new Error('Invalid email input object.');
  }

  // Phase 3: Phishing Detection Engine
  const phishingRes = await analyzePhishing(emailData);

  // Phase 5: Risk Engine Analysis
  const riskRes = await analyzeRisk(emailData, phishingRes, null);

  const finalRiskLevel = riskRes.risk_level || phishingRes.risk_level || 'Low';
  updateBadge(finalRiskLevel);

  showNotification(
    `scan_${Date.now()}`,
    `${finalRiskLevel.toUpperCase()} Risk Detected`,
    `Subject: ${emailData.subject || 'No Subject'} • Risk Score: ${riskRes.risk_score ?? 0}/100`,
    finalRiskLevel
  );

  return {
    phishing: phishingRes,
    risk: riskRes,
  };
}

/**
 * Handle complete scan from binary file upload.
 */
async function handleCompleteScan(fileData) {
  const res = await executeCompleteScan(fileData);
  const riskLevel = res.risk_level || 'Low';
  updateBadge(riskLevel);

  showNotification(
    `scan_${Date.now()}`,
    `Scan Complete (${riskLevel.toUpperCase()})`,
    `Subject: ${res.subject || 'File Upload'} • Score: ${res.risk_score ?? 0}/100`,
    riskLevel
  );

  return res;
}

// ─── Auto-Analyze Gmail / Outlook Tab Listener ────────────────────────────────

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab || !tab.url) return;

  const isWebmail =
    tab.url.includes('mail.google.com') ||
    tab.url.includes('outlook.office.com') ||
    tab.url.includes('outlook.live.com');

  if (!isWebmail) return;

  const settings = await getSettings();
  if (!settings.autoAnalyze) return;

  // Send message to content script to extract visible email content
  chrome.tabs.sendMessage(tabId, { action: 'EXTRACT_EMAIL' }, async (response) => {
    if (chrome.runtime.lastError || !response || !response.success || !response.data) return;

    try {
      await handleEmailAnalysis(response.data);
    } catch (e) {
      console.warn('[TEAM_TECH ServiceWorker] Auto-analyze failed:', e.message);
    }
  });
});
