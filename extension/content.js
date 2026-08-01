/**
 * content.js
 * ----------
 * DOM Extraction Content Script for Gmail and Outlook.
 * Reads ONLY visible email content currently displayed on the page.
 * Safe, read-only extraction — zero credentials, cookies, or auth tokens accessed.
 */

console.log('[TEAM_TECH ContentScript] Extension content script active on:', window.location.hostname);

// ─── Message Listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request || typeof request !== 'object' || request.action !== 'EXTRACT_EMAIL') {
    return false;
  }

  try {
    const emailData = extractVisibleEmail();
    if (!emailData) {
      sendResponse({
        success: false,
        error: 'No active email message detected in the DOM. Please open an email first.',
      });
    } else {
      sendResponse({
        success: true,
        provider: detectProvider(),
        data: emailData,
      });
    }
  } catch (err) {
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

// ─── Main Extraction Router ───────────────────────────────────────────────────

function extractVisibleEmail() {
  const provider = detectProvider();
  if (provider === 'gmail') {
    return extractGmailEmail();
  } else if (provider === 'outlook') {
    return extractOutlookEmail();
  }
  return null;
}

// ─── Gmail DOM Extractor ──────────────────────────────────────────────────────

function extractGmailEmail() {
  // Subject
  const subjectEl =
    document.querySelector('h2.hP') ||
    document.querySelector('div.ha h2') ||
    document.querySelector('span.bog');
  const subject = subjectEl ? subjectEl.innerText.trim() : 'No Subject';

  // Active expanded message view container
  const messageContainer =
    document.querySelector('div.gE.iv') ||
    document.querySelector('div.gs') ||
    document.querySelector('div.a3s.aiL') ||
    document.querySelector('div[role="main"]');

  if (!messageContainer && !subjectEl) {
    return null;
  }

  // Sender
  const senderEl =
    document.querySelector('span.gD') ||
    document.querySelector('span[email]') ||
    document.querySelector('span.go') ||
    document.querySelector('div.gE.iv span[email]');
  const senderEmail = senderEl
    ? senderEl.getAttribute('email') || senderEl.innerText.trim()
    : '';

  // Receiver
  const receiverEl =
    document.querySelector('span.g2') ||
    document.querySelector('span.hb') ||
    document.querySelector('td.gL span[email]');
  const receiver = receiverEl
    ? receiverEl.getAttribute('email') || receiverEl.innerText.trim()
    : '';

  // Body Content
  const bodyEl =
    document.querySelector('div.a3s.aiL') ||
    document.querySelector('div[dir="ltr"]') ||
    document.querySelector('div.ii.gt');
  const bodyText = bodyEl ? bodyEl.innerText.trim() : '';

  // Links
  const links = [];
  if (bodyEl) {
    bodyEl.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        links.push(href);
      }
    });
  }

  // Attachments
  const attachments = [];
  document.querySelectorAll('div.aZo, span.aV3, div.aqN, div[role="button"][aria-label*="Attachment"]').forEach((att) => {
    const text = att.getAttribute('aria-label') || att.innerText.trim();
    if (text) {
      const ext = text.includes('.') ? `.${text.split('.').pop()}` : undefined;
      attachments.push({
        filename: text,
        content_type: 'application/octet-stream',
        extension: ext,
        size: 0,
        inline: false,
      });
    }
  });

  return {
    sender: senderEmail,
    receiver: receiver,
    subject: subject,
    body_text: bodyText,
    body_html: bodyEl ? bodyEl.innerHTML : '',
    urls: Array.from(new Set(links)),
    attachments: attachments,
  };
}

// ─── Outlook DOM Extractor ────────────────────────────────────────────────────

function extractOutlookEmail() {
  // Subject
  const subjectEl =
    document.querySelector('div[role="heading"][aria-level="2"]') ||
    document.querySelector('span.x_subject') ||
    document.querySelector('div._1x_z3') ||
    document.querySelector('div[data-app-section="ItemHeader"] h2');
  const subject = subjectEl ? subjectEl.innerText.trim() : 'No Subject';

  // Sender
  const senderEl =
    document.querySelector('div[data-app-section="ItemHeader"] span[title*="@"]') ||
    document.querySelector('div._3f5X4 span') ||
    document.querySelector('span[title*="@"]') ||
    document.querySelector('div.PersonaPane span');
  const sender = senderEl
    ? senderEl.getAttribute('title') || senderEl.innerText.trim()
    : '';

  // Body
  const bodyEl =
    document.querySelector('div[aria-label="Message body"]') ||
    document.querySelector('div.ItemBody') ||
    document.querySelector('div._2z995') ||
    document.querySelector('div[role="document"]');
  const bodyText = bodyEl ? bodyEl.innerText.trim() : '';

  // Links
  const links = [];
  if (bodyEl) {
    bodyEl.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('#')) {
        links.push(href);
      }
    });
  }

  // Attachments
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
    return null;
  }

  return {
    sender: sender,
    receiver: '',
    subject: subject,
    body_text: bodyText,
    body_html: bodyEl ? bodyEl.innerHTML : '',
    urls: Array.from(new Set(links)),
    attachments: attachments,
  };
}
