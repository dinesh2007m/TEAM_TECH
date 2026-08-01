/**
 * content.js
 * ----------
 * DOM Content Script for Gmail and Outlook.
 * For Gmail: Reads ONLY the message ID from the URL/DOM so the extension can fetch via official Gmail API.
 * For Outlook: Reads visible email content currently displayed on the page.
 * Safe, read-only extraction — zero credentials, cookies, or auth tokens accessed.
 */

console.log('[Content] TEAM_TECH Content Script loaded on hostname:', window.location.hostname);

// ─── Message Listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Content] Message received from extension:', request);

  if (!request || typeof request !== 'object' || request.action !== 'EXTRACT_EMAIL') {
    return false;
  }

  try {
    const provider = detectProvider();
    console.log(`[Content] Executing extraction router for provider '${provider}'...`);

    if (provider === 'gmail') {
      const gmailInfo = extractGmailMessageId();
      if (!gmailInfo || !gmailInfo.messageId) {
        sendResponse({
          success: false,
          error: 'No open Gmail email message detected. Please open an email first.',
        });
      } else {
        console.log('[Content] Extracted Gmail Message ID:', gmailInfo.messageId);
        sendResponse({
          success: true,
          provider: 'gmail',
          useGmailApi: true,
          messageId: gmailInfo.messageId,
          data: null,
        });
      }
    } else if (provider === 'outlook') {
      const emailData = extractOutlookEmail();
      if (!emailData) {
        sendResponse({
          success: false,
          error: 'No active Outlook email message detected in the DOM. Please open an email first.',
        });
      } else {
        sendResponse({
          success: true,
          provider: 'outlook',
          useGmailApi: false,
          data: emailData,
        });
      }
    } else {
      sendResponse({
        success: false,
        error: 'Unsupported webmail provider. Navigate to Gmail or Outlook.',
      });
    }
  } catch (err) {
    console.error('[Content] Error during extraction:', err);
    sendResponse({ success: false, error: err.message });
  }
  return true;
});

// ─── Provider Detection ───────────────────────────────────────────────────────

function detectProvider() {
  const host = window.location.hostname;
  if (host.includes('mail.google.com')) return 'gmail';
  if (host.includes('outlook.')) return 'outlook';
  return 'unknown';
}

// ─── Gmail Message ID Extractor ───────────────────────────────────────────────

/**
 * Extracts ONLY the active Gmail Message ID from URL hash or DOM attribute.
 * Zero email content scraping.
 * @returns {{ messageId: string | null }}
 */
function extractGmailMessageId() {
  // Method 1: Check DOM attributes on expanded message view
  const msgEl =
    document.querySelector('div.gE.iv[data-message-id]') ||
    document.querySelector('div[data-legacy-message-id]') ||
    document.querySelector('div.gs[data-message-id]');

  if (msgEl) {
    const id = msgEl.getAttribute('data-legacy-message-id') || msgEl.getAttribute('data-message-id');
    if (id) return { messageId: id };
  }

  // Method 2: Extract ID from URL Hash (e.g. #inbox/FMfcgzGv... or #all/FMfcgzGv...)
  const hash = window.location.hash || '';
  const hashParts = hash.split('/');
  if (hashParts.length >= 2) {
    const lastPart = hashParts[hashParts.length - 1];
    if (lastPart && lastPart.length > 5 && !lastPart.includes('?')) {
      return { messageId: lastPart };
    }
  }

  // Method 3: Fallback selector for span.bog or data-thread-id
  const threadEl = document.querySelector('div.nH.hx[role="main"]');
  if (threadEl) {
    const id = threadEl.getAttribute('data-thread-id');
    if (id) return { messageId: id };
  }

  return { messageId: null };
}

// ─── Outlook DOM Extractor ────────────────────────────────────────────────────

function extractOutlookEmail() {
  // Subject selectors chain
  const subjectEl =
    document.querySelector('div[role="heading"][aria-level="2"]') ||
    document.querySelector('span.x_subject') ||
    document.querySelector('div._1x_z3') ||
    document.querySelector('div[data-app-section="ItemHeader"] h2');

  const subject = subjectEl ? subjectEl.innerText.trim() : 'No Subject';

  // Sender selectors chain
  const senderEl =
    document.querySelector('div[data-app-section="ItemHeader"] span[title*="@"]') ||
    document.querySelector('div._3f5X4 span') ||
    document.querySelector('span[title*="@"]') ||
    document.querySelector('div.PersonaPane span');

  const sender = senderEl
    ? senderEl.getAttribute('title') || senderEl.innerText.trim()
    : '';

  // Receiver selectors chain
  const receiverEl =
    document.querySelector('div[aria-label*="To"]') ||
    document.querySelector('span[aria-label*="To"]');

  const receiver = receiverEl ? receiverEl.innerText.trim() : '';

  // Body selectors chain
  const bodyEl =
    document.querySelector('div[aria-label="Message body"]') ||
    document.querySelector('div.ItemBody') ||
    document.querySelector('div._2z995') ||
    document.querySelector('div[role="document"]');

  const bodyText = bodyEl ? bodyEl.innerText.trim() : '';

  // Links extraction
  const links = [];
  if (bodyEl) {
    bodyEl.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('#')) {
        links.push(href);
      }
    });
  }

  // Attachments extraction
  const attachments = [];
  document.querySelectorAll('div[aria-label*="attachment"], span[title*="."], div._2xYyP').forEach((att) => {
    const text = att.getAttribute('title') || att.getAttribute('aria-label') || att.innerText.trim();
    if (text && text.includes('.')) {
      const ext = `.${text.split('.').pop()}`;
      attachments.push({
        filename: text,
        content_type: 'application/octet-stream',
        extension: ext,
        size: 0,
        inline: false,
      });
    }
  });

  if (!sender && !bodyText && subject === 'No Subject') {
    console.warn('[Content] Outlook active message elements not found.');
    return null;
  }

  console.log(`[Content] Outlook extraction results -> Sender: '${sender}', Subject: '${subject}', Links: ${links.length}`);

  return {
    sender: sender,
    receiver: receiver,
    subject: subject,
    body_text: bodyText,
    body_html: bodyEl ? bodyEl.innerHTML : '',
    urls: Array.from(new Set(links)),
    attachments: attachments,
  };
}
