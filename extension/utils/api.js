/**
 * utils/api.js
 * ------------
 * API Layer for TEAM_TECH Chrome Extension.
 * Schema-aligned API client with structured [API] logging and error boundaries.
 */

import { getBackendUrl } from './storage.js';

// ─── Response Parser & Error Formatter ───────────────────────────────────────

async function handleResponse(response, endpointName = '') {
  let data;
  try {
    data = await response.json();
  } catch (err) {
    console.error(`[API] Unreadable JSON response from ${endpointName}:`, err);
    throw new Error(`Server returned unreadable response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    const detail =
      typeof data?.detail === 'string'
        ? data.detail
        : Array.isArray(data?.detail)
        ? data.detail.map((e) => e.msg).join(', ')
        : null;

    const msg =
      response.status === 400 ? detail || 'Bad request.'
      : response.status === 404 ? detail || 'Resource not found on server.'
      : response.status === 422 ? detail || 'Payload validation failed. Check input fields.'
      : response.status >= 500 ? 'Server error. Please verify backend state.'
      : detail || `Error (HTTP ${response.status}).`;

    console.error(`[API] Endpoint ${endpointName} failed with HTTP ${response.status}:`, msg);
    throw new Error(msg);
  }

  console.log(`[API] Response 200 from ${endpointName}:`, data);
  return data;
}

async function requestGet(path) {
  const baseUrl = await getBackendUrl();
  const fullUrl = `${baseUrl}${path}`;
  console.log(`[API] GET Request -> ${fullUrl}`);
  let response;
  try {
    response = await fetch(fullUrl);
  } catch (err) {
    console.error(`[API] Network failure fetching ${fullUrl}:`, err);
    throw new Error(`Cannot connect to TEAM_TECH backend at ${baseUrl}. Ensure FastAPI is running.`);
  }
  return handleResponse(response, path);
}

async function requestPostJson(path, body) {
  const baseUrl = await getBackendUrl();
  const fullUrl = `${baseUrl}${path}`;
  console.log(`[API] POST JSON Request -> ${fullUrl}:`, body);
  let response;
  try {
    response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`[API] Network failure posting to ${fullUrl}:`, err);
    throw new Error(`Cannot connect to TEAM_TECH backend at ${baseUrl}. Ensure FastAPI is running.`);
  }
  return handleResponse(response, path);
}

async function requestPostForm(path, formData) {
  const baseUrl = await getBackendUrl();
  const fullUrl = `${baseUrl}${path}`;
  console.log(`[API] POST Multipart Form Request -> ${fullUrl}`);
  let response;
  try {
    response = await fetch(fullUrl, {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    console.error(`[API] Network failure uploading to ${fullUrl}:`, err);
    throw new Error(`Cannot connect to TEAM_TECH backend at ${baseUrl}. Ensure FastAPI is running.`);
  }
  return handleResponse(response, path);
}

// ─── Payload Normalizers matching FastAPI Pydantic Schemas ─────────────────────

/**
 * Normalizes email data into PhishingAnalyzeRequest schema for POST /api/v1/phishing/analyze
 */
export function normalizePhishingPayload(emailData = {}) {
  const bodyText = emailData.body_text || emailData.body || '';
  const urls = Array.isArray(emailData.urls) ? emailData.urls : [];

  const rawAttachments = Array.isArray(emailData.attachments) ? emailData.attachments : [];
  const attachments = rawAttachments.map((att) => {
    if (typeof att === 'string') {
      const ext = att.includes('.') ? `.${att.split('.').pop()}` : undefined;
      return {
        filename: att,
        content_type: 'application/octet-stream',
        extension: ext,
        size: 0,
        inline: false,
      };
    }
    return {
      filename: att.filename || att.name || 'attachment',
      content_type: att.content_type || att.mime_type || 'application/octet-stream',
      extension: att.extension || (att.filename && att.filename.includes('.') ? `.${att.filename.split('.').pop()}` : undefined),
      size: typeof att.size === 'number' ? att.size : 0,
      inline: Boolean(att.inline),
    };
  });

  return {
    scan_id: emailData.scan_id || emailData.email_id || null,
    email_id: emailData.email_id || emailData.scan_id || null,
    sender: emailData.sender || null,
    receiver: emailData.receiver || null,
    subject: emailData.subject || null,
    date: emailData.date || null,
    reply_to: emailData.reply_to || null,
    return_path: emailData.return_path || null,
    message_id: emailData.message_id || null,
    mime_version: emailData.mime_version || null,
    headers: typeof emailData.headers === 'object' && emailData.headers !== null ? emailData.headers : {},
    body_text: bodyText,
    body_html: emailData.body_html || '',
    urls: urls,
    attachments: attachments,
  };
}

/**
 * Normalizes risk data into RiskAnalysisRequest schema for POST /api/v1/risk/analyze
 */
export function normalizeRiskPayload(parsedEmail = {}, phishingResult = {}, sandboxResult = null) {
  const pInds = (phishingResult?.indicators || []).map((i) => ({
    name: i.name || 'Indicator',
    severity: i.severity || 'Low',
    reason: i.reason || '',
  }));

  const sInds = (sandboxResult?.indicators || []).map((i) => ({
    name: i.name || 'Sandbox Indicator',
    severity: i.severity || 'Low',
    reason: i.reason || '',
  }));

  return {
    sender: parsedEmail.sender || null,
    receiver: parsedEmail.receiver || null,
    subject: parsedEmail.subject || null,
    phishing_indicators: pInds,
    sandbox_indicators: sInds,
  };
}

// ─── API Client Methods ────────────────────────────────────────────────────────

/**
 * Upload .eml file to POST /api/v1/upload/email
 */
export async function uploadEmail(file) {
  if (!file || !(file instanceof File || file instanceof Blob)) {
    throw new Error('Invalid file object provided for upload.');
  }
  const formData = new FormData();
  formData.append('file', file);
  return requestPostForm('/api/v1/upload/email', formData);
}

/**
 * Send parsed email data to POST /api/v1/phishing/analyze
 */
export async function analyzePhishing(parsedEmail, scanId = null) {
  const payload = normalizePhishingPayload(parsedEmail);
  if (scanId) {
    payload.scan_id = scanId;
    payload.email_id = scanId;
  }
  return requestPostJson('/api/v1/phishing/analyze', payload);
}

/**
 * Upload attachment to POST /api/v1/sandbox/analyze
 */
export async function analyzeAttachment(file) {
  if (!file || !(file instanceof File || file instanceof Blob)) {
    throw new Error('Invalid attachment file object provided for sandbox analysis.');
  }
  const formData = new FormData();
  formData.append('file', file);
  return requestPostForm('/api/v1/sandbox/analyze', formData);
}

/**
 * Send combined findings to POST /api/v1/risk/analyze
 */
export async function analyzeRisk(parsedEmail, phishingResult, sandboxResult = null) {
  const payload = normalizeRiskPayload(parsedEmail, phishingResult, sandboxResult);
  return requestPostJson('/api/v1/risk/analyze', payload);
}

/**
 * Execute 1-click complete scan via POST /api/v1/scan
 */
export async function executeCompleteScan(file) {
  if (!file || !(file instanceof File || file instanceof Blob)) {
    throw new Error('Invalid file provided for complete scan.');
  }
  const formData = new FormData();
  formData.append('file', file);
  return requestPostForm('/api/v1/scan', formData);
}

/**
 * Fetch scan history from GET /api/v1/history
 */
export async function getHistory(page = 1, pageSize = 50) {
  return requestGet(`/api/v1/history?page=${page}&page_size=${pageSize}`);
}

/**
 * Fetch scan report detail from GET /api/v1/report/{scanId}
 */
export async function getReport(scanId) {
  if (!scanId) throw new Error('scanId is required.');
  return requestGet(`/api/v1/report/${scanId}`);
}

/**
 * Delete scan record from DELETE /api/v1/history/{scanId}
 */
export async function deleteScan(scanId) {
  if (!scanId) throw new Error('scanId is required.');
  const baseUrl = await getBackendUrl();
  let response;
  try {
    response = await fetch(`${baseUrl}/api/v1/history/${scanId}`, { method: 'DELETE' });
  } catch (err) {
    throw new Error(`Cannot connect to backend to delete scan ${scanId}.`);
  }
  return handleResponse(response, `/api/v1/history/${scanId}`);
}

/**
 * Fetch system status from GET /api/v1/system/status
 */
export async function getSystemStatus() {
  return requestGet('/api/v1/system/status');
}

/**
 * Get direct download URL for PDF report
 */
export async function getPDFUrl(scanId) {
  const baseUrl = await getBackendUrl();
  return `${baseUrl}/api/v1/report/${scanId}/pdf`;
}

/**
 * Get direct download URL for JSON report
 */
export async function getJSONUrl(scanId) {
  const baseUrl = await getBackendUrl();
  return `${baseUrl}/api/v1/report/${scanId}/json`;
}
