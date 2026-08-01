/**
 * services/gmailApi.js
 * --------------------
 * Official Gmail API Client Service for TEAM_TECH Chrome Extension.
 * Uses chrome.identity.getAuthToken() for OAuth 2.0 authentication.
 * Standardized logging with [GmailAPI] tag. Zero DOM scraping used for Gmail.
 */

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

// ─── OAuth Token Management ───────────────────────────────────────────────────

/**
 * Obtain Google OAuth 2.0 Access Token using chrome.identity.getAuthToken().
 * @param {boolean} [interactive=true]
 * @returns {Promise<string>}
 */
export async function getAuthToken(interactive = true) {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.identity) {
      return reject(new Error('chrome.identity API is unavailable in this environment.'));
    }

    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        console.error('[GmailAPI] getAuthToken error:', chrome.runtime.lastError.message);
        return reject(new Error(`Google OAuth error: ${chrome.runtime.lastError.message}`));
      }
      if (!token) {
        return reject(new Error('No access token returned from Google OAuth.'));
      }
      console.log('[GmailAPI] Access token obtained successfully.');
      resolve(token);
    });
  });
}

/**
 * Remove cached OAuth token and revoke permissions on Google accounts.
 * @returns {Promise<void>}
 */
export async function logout() {
  console.log('[GmailAPI] Logging out and revoking OAuth token...');
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.identity) return resolve();

    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        chrome.identity.removeCachedAuthToken({ token }, async () => {
          try {
            await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
            console.log('[GmailAPI] OAuth token revoked at Google.');
          } catch (e) {
            console.warn('[GmailAPI] Revoke fetch warning:', e.message);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

/**
 * Authenticate with Google OAuth and retrieve user profile.
 * @param {boolean} [interactive=true]
 * @returns {Promise<{ emailAddress: string, profile: object }>}
 */
export async function login(interactive = true) {
  console.log('[GmailAPI] Login initiated (interactive=' + interactive + ')...');
  const token = await getAuthToken(interactive);
  const profile = await getProfile(token);
  console.log('[GmailAPI] Logged in as:', profile.emailAddress);
  return { token, profile };
}

// ─── Core HTTP Request Helper ─────────────────────────────────────────────────

async function gmailFetch(endpoint, options = {}, token = null) {
  if (!token) {
    token = await getAuthToken(false).catch(() => getAuthToken(true));
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${GMAIL_API_BASE}${endpoint}`;
  console.log(`[GmailAPI] GET -> ${url}`);

  let response = await fetch(url, { ...options, headers });

  // Handle 401 Unauthorized (expired token)
  if (response.status === 401) {
    console.warn('[GmailAPI] HTTP 401 Unauthorized. Clearing cached token and retrying...');
    if (typeof chrome !== 'undefined' && chrome.identity) {
      await new Promise((res) => chrome.identity.removeCachedAuthToken({ token }, res));
    }
    const newToken = await getAuthToken(true);
    headers.Authorization = `Bearer ${newToken}`;
    response = await fetch(url, { ...options, headers });
  }

  if (!response.ok) {
    let errBody;
    try {
      errBody = await response.json();
    } catch {
      errBody = { message: response.statusText };
    }
    const msg = errBody?.error?.message || errBody?.message || `Gmail API HTTP ${response.status}`;
    console.error(`[GmailAPI] API error on ${url}:`, msg);
    throw new Error(`Gmail API Error: ${msg}`);
  }

  return response.json();
}

// ─── Gmail API Methods ─────────────────────────────────────────────────────────

/**
 * Fetch user profile details.
 * @param {string} [token]
 * @returns {Promise<{ emailAddress: string, messagesTotal: int, threadsTotal: int, historyId: string }>}
 */
export async function getProfile(token = null) {
  return gmailFetch('/profile', {}, token);
}

/**
 * Search or list messages.
 * @param {string} [query='']
 * @param {number} [maxResults=10]
 * @returns {Promise<{ messages: Array<{ id: string, threadId: string }>, resultSizeEstimate: number }>}
 */
export async function listMessages(query = '', maxResults = 10) {
  const q = encodeURIComponent(query);
  return gmailFetch(`/messages?q=${q}&maxResults=${maxResults}`);
}

/**
 * Alias for searchMessages.
 */
export async function searchMessages(query = '') {
  return listMessages(query);
}

/**
 * Fetch full message details by message ID.
 * @param {string} messageId
 * @param {string} [format='full']
 * @returns {Promise<object>}
 */
export async function getMessage(messageId, format = 'full') {
  if (!messageId) throw new Error('Message ID is required for getMessage.');
  return gmailFetch(`/messages/${messageId}?format=${format}`);
}

/**
 * Fetch attachment bytes by attachment ID.
 * @param {string} messageId
 * @param {string} attachmentId
 * @returns {Promise<{ size: number, data: string }>}
 */
export async function downloadAttachment(messageId, attachmentId) {
  if (!messageId || !attachmentId) {
    throw new Error('messageId and attachmentId are required for downloadAttachment.');
  }
  return gmailFetch(`/messages/${messageId}/attachments/${attachmentId}`);
}

/**
 * Fetch raw message in RFC822 format.
 * @param {string} messageId
 * @returns {Promise<object>}
 */
export async function downloadRawMessage(messageId) {
  return getMessage(messageId, 'raw');
}

/**
 * List user Gmail labels.
 * @returns {Promise<{ labels: Array<object> }>}
 */
export async function listLabels() {
  return gmailFetch('/labels');
}

// ─── Helpers: Base64URL Decoding & MIME Parsing ───────────────────────────────

/**
 * Base64URL string decoder.
 * Converts URL-safe Base64 (with '-' and '_') into plain decoded string or Uint8Array.
 * @param {string} base64UrlStr
 * @returns {Uint8Array}
 */
export function base64UrlToUint8Array(base64UrlStr) {
  let base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decode Base64URL string to UTF-8 text string.
 * @param {string} base64UrlStr
 * @returns {string}
 */
export function decodeBase64UrlText(base64UrlStr) {
  try {
    const bytes = base64UrlToUint8Array(base64UrlStr);
    return new TextDecoder('utf-8').decode(bytes);
  } catch (err) {
    console.warn('[GmailAPI] UTF-8 text decode warning:', err);
    return '';
  }
}

/**
 * Recursively parse MIME structure of a Gmail API message payload.
 * @param {object} payload
 * @returns {{ body_text: string, body_html: string, attachments: Array<object> }}
 */
function parsePayloadParts(payload) {
  let body_text = '';
  let body_html = '';
  const attachments = [];

  function traverse(part) {
    if (!part) return;

    const mimeType = (part.mimeType || '').toLowerCase();
    const filename = part.filename || '';
    const bodyData = part.body?.data;
    const attachmentId = part.body?.attachmentId;

    if (filename || attachmentId) {
      attachments.push({
        attachmentId: attachmentId,
        filename: filename || 'attachment',
        mimeType: mimeType || 'application/octet-stream',
        size: part.body?.size || 0,
      });
    } else if (mimeType === 'text/plain' && bodyData && !body_text) {
      body_text = decodeBase64UrlText(bodyData);
    } else if (mimeType === 'text/html' && bodyData && !body_html) {
      body_html = decodeBase64UrlText(bodyData);
    }

    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(traverse);
    }
  }

  traverse(payload);
  return { body_text, body_html, attachments };
}

/**
 * Extract headers from Gmail header array into key-value map and specific auth results.
 * @param {Array<{ name: string, value: string }>} headersArray
 * @returns {{ headersMap: object, authResults: object }}
 */
function parseHeaders(headersArray = []) {
  const headersMap = {};
  let spfStatus = 'neutral';
  let dkimStatus = 'neutral';
  let dmarcStatus = 'neutral';

  headersArray.forEach((h) => {
    const key = h.name;
    const val = h.value;
    headersMap[key] = val;

    const lowerKey = key.toLowerCase();
    if (lowerKey === 'received-spf') {
      if (val.toLowerCase().includes('pass')) spfStatus = 'pass';
      else if (val.toLowerCase().includes('fail')) spfStatus = 'fail';
    }
    if (lowerKey === 'authentication-results') {
      const lowerVal = val.toLowerCase();
      if (lowerVal.includes('spf=pass')) spfStatus = 'pass';
      else if (lowerVal.includes('spf=fail') || lowerVal.includes('spf=softfail')) spfStatus = 'fail';

      if (lowerVal.includes('dkim=pass')) dkimStatus = 'pass';
      else if (lowerVal.includes('dkim=fail')) dkimStatus = 'fail';

      if (lowerVal.includes('dmarc=pass')) dmarcStatus = 'pass';
      else if (lowerVal.includes('dmarc=fail')) dmarcStatus = 'fail';
    }
  });

  return {
    headersMap,
    authResults: { spf: spfStatus, dkim: dkimStatus, dmarc: dmarcStatus },
  };
}

/**
 * Extract deduplicated URLs from text and HTML content.
 * @param {string} text
 * @param {string} html
 * @returns {Array<string>}
 */
function extractUrls(text = '', html = '') {
  const urls = new Set();
  const urlRegex = /(https?:\/\/[^\s<>"'\(\)]+)/gi;

  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    urls.add(match[1]);
  }
  while ((match = urlRegex.exec(html)) !== null) {
    urls.add(match[1]);
  }

  return Array.from(urls);
}

// ─── High-Level Extraction Workflow ──────────────────────────────────────────

/**
 * Complete message extraction & attachment download workflow via official Gmail API.
 * NO DOM SCRAPING USED.
 * @param {string} messageId
 * @returns {Promise<{ parsedEmail: object, attachmentFiles: Array<File>, authResults: object }>}
 */
export async function fetchAndProcessMessage(messageId) {
  console.log(`[GmailAPI] Starting fetchAndProcessMessage for ID '${messageId}'...`);
  const msgObj = await getMessage(messageId, 'full');

  const { headersMap, authResults } = parseHeaders(msgObj.payload?.headers || []);
  const { body_text, body_html, attachments } = parsePayloadParts(msgObj.payload);

  const urls = extractUrls(body_text, body_html);

  const sender = headersMap['From'] || headersMap['from'] || '';
  const receiver = headersMap['To'] || headersMap['to'] || '';
  const cc = headersMap['Cc'] || headersMap['cc'] || '';
  const bcc = headersMap['Bcc'] || headersMap['bcc'] || '';
  const subject = headersMap['Subject'] || headersMap['subject'] || 'No Subject';
  const date = headersMap['Date'] || headersMap['date'] || '';
  const replyTo = headersMap['Reply-To'] || headersMap['reply-to'] || '';
  const returnPath = headersMap['Return-Path'] || headersMap['return-path'] || '';
  const messageIdHeader = headersMap['Message-ID'] || headersMap['message-id'] || '';

  // Download all attachment binaries via Gmail API users.messages.attachments.get
  const attachmentFiles = [];
  const attachmentInputs = [];

  for (const att of attachments) {
    if (att.attachmentId) {
      console.log(`[GmailAPI] Downloading attachment '${att.filename}' (ID: ${att.attachmentId})...`);
      try {
        const attData = await downloadAttachment(messageId, att.attachmentId);
        if (attData && attData.data) {
          const u8arr = base64UrlToUint8Array(attData.data);
          const fileObj = new File([u8arr], att.filename, { type: att.mimeType });
          attachmentFiles.push(fileObj);

          const ext = att.filename.includes('.') ? `.${att.filename.split('.').pop()}` : undefined;
          attachmentInputs.push({
            filename: att.filename,
            content_type: att.mimeType,
            extension: ext,
            size: attData.size || u8arr.byteLength,
            inline: false,
          });
        }
      } catch (err) {
        console.error(`[GmailAPI] Error downloading attachment '${att.filename}':`, err.message);
      }
    } else {
      const ext = att.filename.includes('.') ? `.${att.filename.split('.').pop()}` : undefined;
      attachmentInputs.push({
        filename: att.filename,
        content_type: att.mimeType,
        extension: ext,
        size: att.size || 0,
        inline: false,
      });
    }
  }

  const parsedEmail = {
    scan_id: messageId,
    email_id: messageId,
    sender,
    receiver,
    cc,
    bcc,
    subject,
    date,
    reply_to: replyTo,
    return_path: returnPath,
    message_id: messageIdHeader,
    headers: headersMap,
    body_text,
    body_html,
    urls,
    attachments: attachmentInputs,
  };

  console.log(`[GmailAPI] Message ID '${messageId}' processed successfully. Attachments downloaded: ${attachmentFiles.length}`);

  return {
    parsedEmail,
    attachmentFiles,
    authResults,
  };
}
