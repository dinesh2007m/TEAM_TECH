/**
 * utils/api.js
 * ------------
 * API Layer for TEAM_TECH Chrome Extension.
 * Communicates strictly with the existing FastAPI backend contract at configurable URL.
 */

import { getBackendUrl } from './storage.js';

async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Backend returned unreadable response (HTTP ${response.status}).`);
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
      : response.status === 404 ? detail || 'Resource not found in database.'
      : response.status === 422 ? detail || 'Validation failed. Check payload.'
      : response.status >= 500 ? 'Server error on backend.'
      : detail || `Error (HTTP ${response.status}).`;

    throw new Error(msg);
  }

  return data;
}

async function requestGet(path) {
  const baseUrl = await getBackendUrl();
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`);
  } catch (err) {
    throw new Error(`Cannot connect to TEAM_TECH backend at ${baseUrl}. Ensure FastAPI is running.`);
  }
  return handleResponse(response);
}

async function requestPostJson(path, body) {
  const baseUrl = await getBackendUrl();
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(`Cannot connect to TEAM_TECH backend at ${baseUrl}. Ensure FastAPI is running.`);
  }
  return handleResponse(response);
}

async function requestPostForm(path, formData) {
  const baseUrl = await getBackendUrl();
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    throw new Error(`Cannot connect to TEAM_TECH backend at ${baseUrl}. Ensure FastAPI is running.`);
  }
  return handleResponse(response);
}

// ─── API Methods ───────────────────────────────────────────────────────────────

/**
 * Upload .eml file to POST /api/v1/upload/email
 */
export async function uploadEmail(file) {
  const formData = new FormData();
  formData.append('file', file);
  return requestPostForm('/api/v1/upload/email', formData);
}

/**
 * Send parsed email data to POST /api/v1/phishing/analyze
 */
export async function analyzePhishing(parsedEmail, scanId = null) {
  const payload = scanId
    ? { ...parsedEmail, scan_id: scanId, email_id: scanId }
    : parsedEmail;
  return requestPostJson('/api/v1/phishing/analyze', payload);
}

/**
 * Upload attachment to POST /api/v1/sandbox/analyze
 */
export async function analyzeAttachment(file) {
  const formData = new FormData();
  formData.append('file', file);
  return requestPostForm('/api/v1/sandbox/analyze', formData);
}

/**
 * Send combined findings to POST /api/v1/risk/analyze
 */
export async function analyzeRisk(riskPayload) {
  return requestPostJson('/api/v1/risk/analyze', riskPayload);
}

/**
 * Execute 1-click complete scan via POST /api/v1/scan
 */
export async function executeCompleteScan(file) {
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
  return requestGet(`/api/v1/report/${scanId}`);
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
