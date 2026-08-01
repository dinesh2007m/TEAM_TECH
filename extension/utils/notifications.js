/**
 * utils/notifications.js
 * ----------------------
 * Chrome desktop notifications & extension badge manager for TEAM_TECH.
 */

import { getSettings } from './storage.js';

const BADGE_COLORS = {
  Safe: '#10B981',
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#EF4444',
  Critical: '#DC2626',
  Offline: '#6B7280',
  Error: '#EF4444',
};

const BADGE_TEXTS = {
  Safe: 'SAFE',
  Low: 'LOW',
  Medium: 'MED',
  High: 'HIGH',
  Critical: 'CRIT',
  Offline: 'OFF',
  Error: 'ERR',
};

/**
 * Update Chrome extension badge text and color based on risk assessment.
 * @param {'Safe' | 'Low' | 'Medium' | 'High' | 'Critical' | 'Offline' | 'Error'} riskLevel
 */
export function updateBadge(riskLevel) {
  if (typeof chrome === 'undefined' || !chrome.action) return;

  const text = BADGE_TEXTS[riskLevel] || BADGE_TEXTS.Safe;
  const color = BADGE_COLORS[riskLevel] || BADGE_COLORS.Safe;

  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

/**
 * Trigger Chrome desktop notification if notifications are enabled in settings.
 * @param {string} notificationId
 * @param {string} title
 * @param {string} message
 * @param {'Safe' | 'Medium' | 'High' | 'Critical' | 'Offline' | 'Error'} [type='Safe']
 */
export async function showNotification(notificationId, title, message, type = 'Safe') {
  const settings = await getSettings();
  if (!settings.enableNotifications) return;

  if (typeof chrome === 'undefined' || !chrome.notifications) return;

  const options = {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: `TEAM_TECH: ${title}`,
    message: message,
    priority: type === 'High' || type === 'Critical' ? 2 : 1,
  };

  chrome.notifications.create(notificationId || `teamtech_${Date.now()}`, options);
}
