const keys = [
  'hideRelated', 'hideShorts',
  'hideExplore', 'hideChat', 'hideNotifs', 'disableAutoplay',
  'hideComments', 'hideDescription', 'hideMetadata',
  'hideNavbar', 'hideLogo', 'darkVideoPage'
];

// Load saved settings
chrome.storage.sync.get(keys, (data) => {
  keys.forEach(key => {
    document.getElementById(key).checked = data[key] || false;
  });
});

// Save on change
keys.forEach(key => {
  document.getElementById(key).addEventListener('change', (e) => {
    chrome.storage.sync.set({ [key]: e.target.checked });
  });
});