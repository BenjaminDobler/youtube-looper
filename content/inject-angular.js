// This script runs in ISOLATED world and has access to chrome APIs
// It injects the Angular bundle into the MAIN world
(async function() {
  'use strict';
  
  try {
    // Fetch the manifest to get the bundle name
    const manifestResponse = await fetch(chrome.runtime.getURL('angular-manifest.json'));
    const manifest = await manifestResponse.json();
    
    const bundleUrl = chrome.runtime.getURL(manifest.mainBundle);
    
    // Dispatch event to MAIN world with the bundle URL
    window.dispatchEvent(new CustomEvent('youtube-looper-load-angular', {
      detail: { bundleUrl }
    }));
  } catch (error) {
    // Silently fail
  }
})();
