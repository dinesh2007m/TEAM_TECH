/**
 * background.js
 * -------------
 * TEAM_TECH Manifest V3 Service Worker.
 * Handles API orchestration, Chrome notifications, badge updates, and message passing.
 * Standardized logging with [Background] tag and stack trace logging on errors.
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

console.log('[Background] TEAM_TECH Manifest V3 Service Worker initialized.');

// ─── Service Worker Setup & Message Dispatcher ────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object' || !message.action) {
    console.warn('[Background] Received invalid message structure:', message);
    sendResponse({ success: false, error: 'Invalid message structure.' });
    return false;
  }

  const { action, payload } = message;
  console.log(`[Background] Message received: action='${action}'`, payload);

  if (action === 'CHECK_STATUS') {
    getSystemStatus()
      .then((status) => {
        console.log('[Background] Backend system status retrieved:', status);
        updateBadge('Safe');
        sendResponse({ success: true, data: status });
      })
      .catch((err) => {
        console.error('[Background] System status check failed:', err);
        updateBadge('Offline');
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep channel open for async response
  }

  if (action === 'ANALYZE_PARSED_EMAIL') {
    console.log('[Background] Initiating email analysis pipeline...');
    handleEmailAnalysis(payload)
      .then((result) => {
        console.log('[Background] Email analysis completed successfully:', result);
        sendResponse({ success: true, data: result });
      })
      .catch((err) => {
        console.error('[Background] Email analysis failed with error:', err);
        showNotification('err_scan', 'Analysis Failed', err.message, 'Error');
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (action === 'EXECUTE_COMPLETE_SCAN') {
    console.log('[Background] Initiating complete scan pipeline...');
    handleCompleteScan(payload)
      .then((result) => {
        console.log('[Background] Complete scan finished successfully:', result);
        sendResponse({ success: true, data: result });
      })
      .catch((err) => {
        console.error('[Background] Complete scan failed:', err);
        showNotification('err_scan', 'Scan Failed', err.message, 'Error');
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (action === 'UPDATE_BADGE') {
    if (payload && payload.riskLevel) {
      console.log(`[Background] Updating badge to '${payload.riskLevel}'`);
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

  console.log('[Background] Step 1: Calling Phishing API...');
  const phishingRes = await analyzePhishing(emailData);

  console.log('[Background] Step 2: Calling Risk Engine API...');
  const riskRes = await analyzeRisk(emailData, phishingRes, null);

  const finalRiskLevel = riskRes.risk_level || phishingRes.risk_level || 'Low';
  console.log(`[Background] Analysis complete. Final risk level: '${finalRiskLevel}', score: ${riskRes.risk_score}`);

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
  const riskLevel = res.risk_analysis?.risk_level || res.risk_level || 'Low';
  const riskScore = res.risk_analysis?.risk_score ?? res.risk_score ?? 0;

  console.log(`[Background] Complete scan response processed. Risk level: '${riskLevel}', Score: ${riskScore}`);
  updateBadge(riskLevel);

  showNotification(
    `scan_${Date.now()}`,
    `Scan Complete (${riskLevel.toUpperCase()})`,
    `Subject: ${res.subject || 'File Upload'} • Score: ${riskScore}/100`,
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

  console.log('[Background] Webmail navigation detected with autoAnalyze enabled. Triggering DOM extraction...');

  chrome.tabs.sendMessage(tabId, { action: 'EXTRACT_EMAIL' }, async (response) => {
    if (chrome.runtime.lastError || !response || !response.success || !response.data) {
      console.log('[Background] Auto-analyze DOM extraction did not yield active email message.');
      return;
    }

    try {
      await handleEmailAnalysis(response.data);
    } catch (e) {
      console.warn('[Background] Auto-analyze background processing warning:', e.message);
    }
  });
});
