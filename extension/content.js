/**
 * content.js
 * ----------
 * DOM Extraction Content Script for Gmail and Outlook.
 * Reads ONLY visible email content currently displayed on the page.
 * Safe, read-only extraction — zero credentials, cookies, or auth tokens accessed.
 */

console.log('[TEAM_TECH ContentScript] Content script loaded on:', window.location.hostname);

// ─── Message Listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTRACT_EMAIL') {
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
  }
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
  const subjectEl = document.querySelector('h2.hP') || document.querySelector('div.ha h2');
  const subject = subjectEl ? subjectEl.innerText.trim() : 'No Subject';

  // Active expanded message view container
  const messageContainer =
    document.querySelector('div.gE.iv') ||
    document.querySelector('div.gs') ||
    document.querySelector('div.a3s.aiL');

  if (!messageContainer && !subjectEl) {
    return null;
  }

  // Sender
  const senderEl =
    document.querySelector('span.gD') ||
    document.querySelector('span[email]') ||
    document.querySelector('span.go');
  const senderEmail = senderEl ? senderEl.getAttribute('email') || senderEl.innerText.trim() : '';

  // Receiver
  const receiverEl = document.querySelector('span.g2') || document.querySelector('span.hb');
  const receiver = receiverEl ? receiverEl.innerText.trim() : '';

  // Body Content
  const bodyEl = document.querySelector('div.a3s.aiL') || document.querySelector('div[dir="ltr"]');
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

  // Attachment names
  const attachment_names = [];
  document.querySelectorAll('div.aZo, span.aV3, div.aqN').forEach((att) => {
    const text = att.innerText.trim();
    if (text) attachment_names.push(text);
  });

  return {
    sender: senderEmail,
    receiver: receiver,
    subject: subject,
    body: bodyText,
    urls: Array.from(new Set(links)),
    attachments: attachment_names,
  };
}

// ─── Outlook DOM Extractor ────────────────────────────────────────────────────

function extractOutlookEmail() {
  // Subject
  const subjectEl =
    document.querySelector('div[role="heading"][aria-level="2"]') ||
    document.querySelector('span.x_subject') ||
    document.querySelector('div._1x_z3');
  const subject = subjectEl ? subjectEl.innerText.trim() : 'No Subject';

  // Sender
  const senderEl =
    document.querySelector('div[data-app-section="ItemHeader"] span[title*="@"]') ||
    document.querySelector('div._3f5X4 span') ||
    document.querySelector('span[title*="@"]');
  const sender = senderEl ? senderEl.getAttribute('title') || senderEl.innerText.trim() : '';

  // Body
  const bodyEl =
    document.querySelector('div[aria-label="Message body"]') ||
    document.querySelector('div.ItemBody') ||
    document.querySelector('div._2z995');
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
  const attachment_names = [];
  document.querySelectorAll('div[aria-label*="attachment"], span[title*="."]').forEach((att) => {
    const text = att.getAttribute('title') || att.innerText.trim();
    if (text && text.includes('.')) attachment_names.push(text);
  });

  if (!sender && !bodyText && subject === 'No Subject') {
    return null;
  }

  return {
    sender: sender,
    receiver: '',
    subject: subject,
    body: bodyText,
    urls: Array.from(new Set(links)),
    attachments: attachment_names,
  };
}
