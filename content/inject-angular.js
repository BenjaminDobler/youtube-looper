// This script runs in ISOLATED world and has access to chrome APIs
// It injects the Angular bundle into the MAIN world
(async function() {
  'use strict';
  
  console.log('YouTube Looper: Injector script running in ISOLATED world');
  
  try {
    // Fetch the manifest to get the bundle name
    const manifestResponse = await fetch(chrome.runtime.getURL('angular-manifest.json'));
    const manifest = await manifestResponse.json();
    
    const bundleUrl = chrome.runtime.getURL(manifest.mainBundle);
    console.log('YouTube Looper: Bundle URL:', bundleUrl);
    
    // Dispatch event to MAIN world with the bundle URL
    window.dispatchEvent(new CustomEvent('youtube-looper-load-angular', {
      detail: { bundleUrl }
    }));
    
    console.log('YouTube Looper: Bundle URL dispatched to MAIN world');
  } catch (error) {
    console.error('YouTube Looper: Failed to inject Angular bundle', error);
  }
})();
