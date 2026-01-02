// Map settings keys to CSS classes
const features = {
  hideRelated: 'ft-hide-related',
  hideExplore: 'ft-hide-explore',
  hideShorts: 'ft-hide-shorts',
  hideChat: 'ft-hide-chat',
  hideNotifs: 'ft-hide-notifs',
  hideComments: 'ft-hide-comments',
  hideDescription: 'ft-hide-description',
  hideMetadata: 'ft-hide-metadata',
  hideNavbar: 'ft-hide-navbar',
  hideLogo: 'ft-hide-logo',
  darkVideoPage: 'ft-dark-video-page'
};

// Store settings globally so navigation events can access them
let currentSettings = {}

// NEW: Check if we are on a watch page to scope Clean Mode & Theme Color
function checkPageType() {
  const isWatchPage = window.location.pathname === '/watch';
  const root = document.documentElement;

  if (isWatchPage) {
    root.classList.add('ft-is-watch-page');
  } else {
    root.classList.remove('ft-is-watch-page');
  }

  applyThemeColor(isWatchPage);
}

// Attempt to color the browser interface (works on Mobile/PWA, some Desktop configs)
function applyThemeColor(isWatchPage) {
  // Find or create the meta tag
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }

  // If Dark Video Page is enabled AND we are on a watch page -> True Black
  if (currentSettings.darkVideoPage && isWatchPage) {
    meta.setAttribute('content', '#000000');
  } else {
    // Otherwise revert to YouTube's default dark gray (approximate)
    // We only touch this if we previously set it, or just let YT handle it.
    // Setting it to #0f0f0f matches default Dark Mode.
    meta.setAttribute('content', '#0f0f0f');
  }
}

// 1. Sync Storage to HTML Classes
function updateClasses(settings) {
  currentSettings = settings; // Update global store

  // Use documentElement (<html>) because body might not exist at document_start
  const root = document.documentElement;
  if (!root) return;

  for (const [key, className] of Object.entries(features)) {
    if (settings[key]) {
      root.classList.add(className);
    } else {
      root.classList.remove(className);
    }
  }

  // Re-run page checks to apply theme color immediately
  checkPageType();
}

// 2. Handle Autoplay Logic (JS required)
let autoplayInterval = null;

function handleAutoplay(disableAutoplay) {
  // Always clear existing interval to prevent duplicates
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
  }

  if (!disableAutoplay) return;

  // We run this periodically because the player loads dynamically
  autoplayInterval = setInterval(() => {
    const toggle = document.querySelector('.ytp-autonav-toggle-button');
    if (toggle) {
      // If aria-checked is "true", it means it's ON. Click to turn OFF.
      if (toggle.getAttribute('aria-checked') === 'true') {
        toggle.click();
        console.log("Focus Tube: Autoplay disabled.");
      }
    }
  }, 2000);
}

// 3. Initialize
chrome.storage.sync.get(null, (settings) => {
  updateClasses(settings);
  handleAutoplay(settings.disableAutoplay);
  // checkPageType is called inside updateClasses
});

// 4. Listen for changes (Live updates without refresh)
chrome.storage.onChanged.addListener((changes) => {
  const root = document.documentElement;

  // Update global settings object with new values
  for (const [key, change] of Object.entries(changes)) {
    currentSettings[key] = change.newValue;

    if (features[key]) {
      if (change.newValue) {
        root.classList.add(features[key]);
      } else {
        root.classList.remove(features[key]);
      }
    }
  }

  // Re-apply theme color in case 'darkVideoPage' setting changed
  checkPageType();

  // Re-run autoplay check if changed
  if (changes.disableAutoplay) {
    handleAutoplay(changes.disableAutoplay.newValue);
  }
});

// 5. Listen for YouTube navigation events (SPA)
document.addEventListener('yt-navigate-finish', checkPageType);