/**
 * emailService.js
 * ---------------
 * API service layer for the Email Upload endpoint.
 * All communication with the FastAPI backend is centralised here.
 *
 * Backend: POST http://127.0.0.1:8000/api/v1/upload/email
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Uploads an .eml file to the backend for parsing.
 *
 * @param {File} file  - The .eml File object selected by the user.
 * @returns {Promise<{ status: string, email_id: string, parsed_email: object }>}
 * @throws {Error} with a user-friendly message on any failure.
 */
export async function uploadEmailFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  console.log('[emailService] Uploading file:', file.name, `(${file.size} bytes)`);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/upload/email`, {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type header — the browser sets it automatically
      // including the correct multipart boundary.
    });
  } catch (networkError) {
    console.error('[emailService] Network error:', networkError);
    throw new Error(
      'Cannot reach the server. Make sure the backend is running at http://127.0.0.1:8000.'
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Server returned an unreadable response. Please try again.');
  }

  console.log('[emailService] Response:', response.status, data);

  if (!response.ok) {
    // FastAPI validation errors (422) have a different shape
    const detail =
      data?.detail ||
      (Array.isArray(data?.detail)
        ? data.detail.map((e) => e.msg).join(', ')
        : null);

    if (response.status === 400) {
      throw new Error(detail || 'Bad request. The file may be invalid or malformed.');
    }
    if (response.status === 422) {
      throw new Error(detail || 'Validation failed. Check file type and size.');
    }
    if (response.status >= 500) {
      throw new Error('Server error. The backend encountered an unexpected problem.');
    }
    throw new Error(detail || `Unexpected error (HTTP ${response.status}).`);
  }

  return data;
}

/**
 * Sends a parsed email object to the phishing detection engine.
 *
 * @param {object} parsedEmail - The parsed_email object returned by uploadEmailFile.
 * @returns {Promise<{ status: string, indicator_count: number, risk_level: string, indicators: Array }>}
 * @throws {Error} with a user-friendly message on any failure.
 */
export async function analyzePhishing(parsedEmail) {
  console.log('[emailService] Sending to phishing analyzer…');

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/phishing/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedEmail),
    });
  } catch (networkError) {
    console.error('[emailService] Phishing API network error:', networkError);
    throw new Error(
      'Cannot reach the phishing analysis server. Make sure the backend is running.'
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Phishing analysis returned an unreadable response. Please try again.');
  }

  console.log('[emailService] Phishing response:', response.status, data);

  if (!response.ok) {
    const detail =
      typeof data?.detail === 'string'
        ? data.detail
        : Array.isArray(data?.detail)
        ? data.detail.map((e) => e.msg).join(', ')
        : `HTTP ${response.status}`;

    throw new Error(detail || 'Phishing analysis failed. Please try again.');
  }

  return data;
}

/**
 * Uploads any file to the Phase 4 Sandbox Static Analysis Engine.
 *
 * @param {File} file  - Any file object selected by the user.
 * @returns {Promise<{
 *   status: string,
 *   filename: string,
 *   risk_score: number,
 *   risk_level: string,
 *   analysis: object,
 *   indicators: Array
 * }>}
 * @throws {Error} with a user-friendly message on any failure.
 */
export async function analyzeAttachment(file) {
  const formData = new FormData();
  formData.append('file', file);

  console.log('[emailService] Sandbox analyzing file:', file.name, `(${file.size} bytes)`);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/sandbox/analyze`, {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type header — browser sets it with the correct
      // multipart boundary automatically.
    });
  } catch (networkError) {
    console.error('[emailService] Sandbox API network error:', networkError);
    throw new Error(
      'Cannot reach the sandbox analysis server. Make sure the backend is running at http://127.0.0.1:8000.'
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Sandbox analysis returned an unreadable response. Please try again.');
  }

  console.log('[emailService] Sandbox response:', response.status, data);

  if (!response.ok) {
    const detail =
      typeof data?.detail === 'string'
        ? data.detail
        : Array.isArray(data?.detail)
        ? data.detail.map((e) => e.msg).join(', ')
        : `HTTP ${response.status}`;

    if (response.status === 400) {
      throw new Error(detail || 'Bad request. The file may be empty or unreadable.');
    }
    if (response.status === 413) {
      throw new Error('File is too large. Maximum allowed size is 25 MB.');
    }
    if (response.status === 422) {
      throw new Error(detail || 'Validation failed. Please check the file and try again.');
    }
    if (response.status >= 500) {
      throw new Error('Server error. The sandbox engine encountered an unexpected problem.');
    }
    throw new Error(detail || `Unexpected error (HTTP ${response.status}).`);
  }

  return data;
}

/**
 * Sends combined parsed email, phishing analysis, and sandbox analysis data
 * to the Phase 5 Explainable Risk Scoring Engine API.
 *
 * @param {{ parsed_email?: object, phishing_result?: object, sandbox_result?: object }} payload
 * @returns {Promise<{
 *   status: string,
 *   risk_score: number,
 *   risk_level: string,
 *   reasons: Array<string>,
 *   recommendations: Array<string>,
 *   attack_path: Array<{ stage: string, reason: string }>,
 *   summary: string
 * }>}
 * @throws {Error} with a user-friendly message on any failure.
 */
export async function analyzeRisk(payload) {
  console.log('[emailService] Sending combined data to Explainable Risk Engine...');

  const pInds = (payload?.phishing_result?.indicators || payload?.phishing_indicators || []).map((i) => ({
    name: i.name || 'Indicator',
    severity: i.severity || 'Low',
    reason: i.reason || '',
  }));

  const sInds = (payload?.sandbox_result?.indicators || payload?.sandbox_indicators || []).map((i) => ({
    name: i.name || 'Sandbox Indicator',
    severity: i.severity || 'Low',
    reason: i.reason || '',
  }));

  const riskPayload = {
    sender: payload?.parsed_email?.sender || payload?.sender || null,
    receiver: payload?.parsed_email?.receiver || payload?.receiver || null,
    subject: payload?.parsed_email?.subject || payload?.subject || null,
    phishing_indicators: pInds,
    sandbox_indicators: sInds,
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/risk/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(riskPayload),
    });
  } catch (networkError) {
    console.error('[emailService] Risk Engine network error:', networkError);
    throw new Error(
      'Cannot reach the Risk Analysis server. Make sure the backend is running at http://127.0.0.1:8000.'
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Risk analysis returned an unreadable response. Please try again.');
  }

  console.log('[emailService] Risk response:', response.status, data);

  if (!response.ok) {
    const detail =
      typeof data?.detail === 'string'
        ? data.detail
        : Array.isArray(data?.detail)
        ? data.detail.map((e) => e.msg).join(', ')
        : `HTTP ${response.status}`;

    throw new Error(detail || 'Risk analysis failed. Please try again.');
  }

  return data;
}

