import { CONFIG } from '../config.js';

/**
 * Initializes the social media links in the page footer.
 */
export function initSocialFooter() {
  const igHandle = document.getElementById('ig-handle');
  const igBtn = document.getElementById('ig-btn');

  if (igHandle && CONFIG.INSTAGRAM_HANDLE) {
    igHandle.textContent = `Instagram ${CONFIG.INSTAGRAM_HANDLE}`;
  }
  if (igBtn && CONFIG.INSTAGRAM_URL) {
    igBtn.href = CONFIG.INSTAGRAM_URL;
  }
}
