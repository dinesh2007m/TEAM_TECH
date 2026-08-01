/**
 * background.js
 * -------------
 * TEAM_TECH Manifest V3 Service Worker.
 * Handles API orchestration, Google OAuth 2.0 / Gmail API, Chrome notifications, badge updates, and message passing.
 * Standardized logging with [Background] tag.
 */

import {
  getSystemStatus,
  analyzePhishing,
  analyzeAttachment,
  analyzeRisk,
  executeCompleteScan,
} from './utils/api.js';
import {
  login as gmailLogin,
  logout as gmailLogout,
  getProfile as getGmailProfile,
  fetchAndProcessMessage,
} from './services/gmailApi.js';
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

  // System status check
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
    return true;
  }

  // Google OAuth Login
  if (action === 'GMAIL_LOGIN') {
    gmailLogin(payload?.interactive ?? true)
      .then((res) => sendResponse({ success: true, data: res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // Google OAuth Logout
  if (action === 'GMAIL_LOGOUT') {
    gmailLogout()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // Get Gmail User Profile
  if (action === 'GET_GMAIL_PROFILE') {
    getGmailProfile()
      .then((profile) => sendResponse({ success: true, data: profile }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // Process Gmail Message via Official Gmail API (No DOM scraping)
  if (action === 'PROCESS_GMAIL_MESSAGE') {
    console.log(`[Background] Processing Gmail Message ID '${payload.messageId}' via official Gmail API...`);
    handleGmailApiAnalysis(payload.messageId)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => {
        console.error('[Background] Gmail API analysis failed:', err);
        showNotification('err_scan', 'Gmail API Scan Failed', err.message, 'Error');
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // Handle Outlook / Manual parsed email analysis
  if (action === 'ANALYZE_PARSED_EMAIL') {
    console.log('[Background] Initiating parsed email analysis pipeline...');
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

  // Handle complete scan pipeline
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

  // Update extension badge
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
 * Handle complete analysis for Gmail message via official Gmail API + FastAPI backend.
 * Step 1: Fetch message and download attachments via Gmail API.
 * Step 2: Run phishing analysis on parsed email.
 * Step 3: Run static sandbox analysis on EVERY downloaded attachment File.
 * Step 4: Run risk engine analysis on combined signals.
 * Step 5: Save scan to SQLite & update badge + desktop notification.
 */
async function handleGmailApiAnalysis(messageId) {
  console.log(`[Background] Gmail API Step 1: Fetching message & attachments for ID '${messageId}'...`);
  const { parsedEmail, attachmentFiles, authResults } = await fetchAndProcessMessage(messageId);

  console.log('[Background] Gmail API Step 2: Calling Phishing Detection API...');
  const phishingRes = await analyzePhishing(parsedEmail);

  console.log(`[Background] Gmail API Step 3: Running Sandbox Analysis on ${attachmentFiles.length} attachments...`);
  const sandboxResults = [];
  const sandboxIndicators = [];

  for (const attFile of attachmentFiles) {
    try {
      console.log(`[Background] Sending attachment '${attFile.name}' to /api/v1/sandbox/analyze...`);
      const sbRes = await analyzeAttachment(attFile);
      sandboxResults.push(sbRes);
      if (Array.isArray(sbRes.indicators)) {
        sandboxIndicators.push(...sbRes.indicators);
      }
    } catch (e) {
      console.error(`[Background] Sandbox analysis failed for attachment '${attFile.name}':`, e.message);
    }
  }

  console.log('[Background] Gmail API Step 4: Calling Risk Engine API...');
  const combinedSandboxObj = sandboxResults.length > 0 ? {
    status: 'success',
    filename: attachmentFiles.map(a => a.name).join(', '),
    risk_score: Math.max(...sandboxResults.map(s => s.risk_score || 0), 0),
    risk_level: sandboxResults.some(s => s.risk_level === 'High') ? 'High' : 'Low',
    indicators: sandboxIndicators,
  } : null;

  const riskRes = await analyzeRisk(parsedEmail, phishingRes, combinedSandboxObj);

  const finalRiskLevel = riskRes.risk_level || phishingRes.risk_level || 'Low';
  const finalRiskScore = riskRes.risk_score ?? 0;

  console.log(`[Background] Gmail API Scan Complete. Risk Level: '${finalRiskLevel}', Score: ${finalRiskScore}`);
  updateBadge(finalRiskLevel);

  // Construct synthetic .eml file to auto-save scan into backend SQLite database history
  const emlContent = [
    `From: ${parsedEmail.sender || ''}`,
    `To: ${parsedEmail.receiver || ''}`,
    `Subject: ${parsedEmail.subject || 'No Subject'}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    parsedEmail.body_text || ''
  ].join('\n');

  const emlBlob = new Blob([emlContent], { type: 'message/rfc822' });
  const emlFile = new File([emlBlob], 'gmail_api_scan.eml', { type: 'message/rfc822' });

  let scanId = messageId;
  try {
    const scanRes = await executeCompleteScan(emlFile);
    if (scanRes && scanRes.scan_id) {
      scanId = scanRes.scan_id;
    }
  } catch (e) {
    console.warn('[Background] SQLite history auto-save warning:', e.message);
  }

  showNotification(
    `scan_${Date.now()}`,
    `Gmail API: ${finalRiskLevel.toUpperCase()} Risk Detected`,
    `Subject: ${parsedEmail.subject || 'No Subject'} • Score: ${finalRiskScore}/100`,
    finalRiskLevel
  );

  return {
    scan_id: scanId,
    parsed_email: parsedEmail,
    phishing_analysis: phishingRes,
    sandbox_analysis: combinedSandboxObj,
    risk_analysis: riskRes,
    auth_results: authResults,
    attachments_count: attachmentFiles.length,
  };
}

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

  console.log('[Background] Webmail navigation detected with autoAnalyze enabled. Triggering content script...');

  chrome.tabs.sendMessage(tabId, { action: 'EXTRACT_EMAIL' }, async (response) => {
    if (chrome.runtime.lastError || !response || !response.success) {
      console.log('[Background] Auto-analyze: content script returned no email.');
      return;
    }

    try {
      if (response.useGmailApi && response.messageId) {
        console.log(`[Background] Auto-analyze: Triggering Gmail API analysis for ID '${response.messageId}'...`);
        await handleGmailApiAnalysis(response.messageId);
      } else if (response.data) {
        console.log('[Background] Auto-analyze: Triggering DOM analysis for Outlook email...');
        await handleEmailAnalysis(response.data);
      }
    } catch (e) {
      console.warn('[Background] Auto-analyze background processing warning:', e.message);
    }
  });
});
