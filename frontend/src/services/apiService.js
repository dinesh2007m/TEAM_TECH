/**
 * apiService.js
 * -------------
 * Centralised API client for the TEAM_TECH backend.
 * Every call goes through the helpers here — no raw fetch() or mock data anywhere else.
 *
 * Backend base: http://127.0.0.1:8000
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

// ─── Generic HTTP helpers ─────────────────────────────────────────────────────

async function _handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server returned an unreadable response (HTTP ${response.status}).`);
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
      : response.status === 422 ? detail || 'Validation failed. Check your input.'
      : response.status >= 500 ? 'Server error. Please try again later.'
      : detail || `Unexpected error (HTTP ${response.status}).`;

    throw new Error(msg);
  }

  return data;
}

async function _get(path) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`);
  } catch {
    throw new Error('Cannot reach the backend. Make sure it is running at http://127.0.0.1:8000.');
  }
  return _handleResponse(response);
}

async function _post(path, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the backend. Make sure it is running at http://127.0.0.1:8000.');
  }
  return _handleResponse(response);
}

async function _postForm(path, formData) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error('Cannot reach the backend. Make sure it is running at http://127.0.0.1:8000.');
  }
  return _handleResponse(response);
}

async function _delete(path) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method: 'DELETE' });
  } catch {
    throw new Error('Cannot reach the backend. Make sure it is running at http://127.0.0.1:8000.');
  }
  return _handleResponse(response);
}

// ─── Phase 2: Email Upload ────────────────────────────────────────────────────
/**
 * Upload an .eml file to the parser.
 * @param {File} file
 * @returns {Promise<{ status: string, email_id: string, parsed_email: object }>}
 */
export async function uploadEmailFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  console.log('[apiService] uploadEmailFile:', file.name);
  return _postForm('/api/v1/upload/email', formData);
}

// ─── Phase 3: Phishing Analysis ───────────────────────────────────────────────
/**
 * Analyze parsed email for phishing indicators.
 * @param {object} parsedEmail
 * @param {string} [scanId] - Pre-assigned scan/email ID for synchronization
 * @returns {Promise<{ status: string, scan_id: string, indicator_count: number, risk_level: string, indicators: Array }>}
 */
export async function analyzePhishing(parsedEmail, scanId = null) {
  console.log('[apiService] analyzePhishing for scan_id:', scanId);
  const payload = scanId
    ? { ...parsedEmail, scan_id: scanId, email_id: scanId }
    : parsedEmail;
  return _post('/api/v1/phishing/analyze', payload);
}

// ─── Phase 4: Sandbox / Static Analysis ──────────────────────────────────────
/**
 * Run static analysis on a file (attachment or .eml).
 * @param {File} file
 * @returns {Promise<{ status: string, filename: string, risk_score: number, risk_level: string, analysis: object, indicators: Array }>}
 */
export async function analyzeSandbox(file) {
  const formData = new FormData();
  formData.append('file', file);
  console.log('[apiService] analyzeSandbox:', file.name);
  return _postForm('/api/v1/sandbox/analyze', formData);
}

export const analyzeAttachment = analyzeSandbox;

// ─── Risk Analysis ────────────────────────────────────────────────────────────
/**
 * Calculate risk score, summary, and attack path.
 */
export async function analyzeRisk(riskPayload) {
  console.log('[apiService] analyzeRisk');
  return _post('/api/v1/risk/analyze', riskPayload);
}

// ─── Unified Complete Scan ───────────────────────────────────────────────────
/**
 * Execute 1-click complete scan (.eml upload -> parse -> phishing -> sandbox -> auto-save SQLite).
 * @param {File} file
 */
export async function executeCompleteScan(file) {
  const formData = new FormData();
  formData.append('file', file);
  console.log('[apiService] executeCompleteScan:', file.name);
  return _postForm('/api/v1/scan', formData);
}

// ─── History API ──────────────────────────────────────────────────────────────
/**
 * List all scan history records (newest first).
 */
export async function listHistory({ page = 1, page_size = 100 } = {}) {
  console.log('[apiService] listHistory page=', page);
  return _get(`/api/v1/history?page=${page}&page_size=${page_size}`);
}

/**
 * Get full details for a single scan.
 */
export async function getHistoryDetail(scanId) {
  console.log('[apiService] getHistoryDetail', scanId);
  return _get(`/api/v1/history/${scanId}`);
}

/**
 * Delete a scan and all its associated records.
 */
export async function deleteHistoryScan(scanId) {
  console.log('[apiService] deleteHistoryScan', scanId);
  return _delete(`/api/v1/history/${scanId}`);
}

// ─── Reports & Direct Downloads ───────────────────────────────────────────────
/**
 * Fetch report data from SQLite backend.
 */
export async function getReportData(scanId) {
  console.log('[apiService] getReportData', scanId);
  return _get(`/api/v1/report/${scanId}`);
}

/**
 * Download analysis.json directly from SQLite backend.
 */
export async function downloadScanJSON(scanId) {
  console.log('[apiService] downloadScanJSON for scan_id:', scanId);
  const url = `${API_BASE_URL}/api/v1/report/${scanId}/json`;
  window.open(url, '_blank');
}

/**
 * Download report.pdf directly from SQLite backend.
 */
export async function downloadScanPDF(scanId) {
  console.log('[apiService] downloadScanPDF for scan_id:', scanId);
  const url = `${API_BASE_URL}/api/v1/report/${scanId}/pdf`;
  window.open(url, '_blank');
}
