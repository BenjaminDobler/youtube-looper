// This script runs at document_start in MAIN world
// Since we're in MAIN world, we don't have access to chrome.runtime.getURL
// The Angular bundle URL will be injected as a data attribute by the manifest
(function() {
  'use strict';
  
  console.log('YouTube Looper: Preload script starting in MAIN world');
  
  // Prevent YouTube's ES5 adapter from interfering with our custom elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'SCRIPT' && 
            node.src && 
            node.src.includes('custom-elements-es5-adapter')) {
          console.log('Blocking ES5 adapter script');
          node.remove();
        }
      });
    });
  });
  
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  // Wait for the Angular bundle URL to be passed from isolated world
  window.addEventListener('youtube-looper-load-angular', (event) => {
    const bundleUrl = event.detail.bundleUrl;
    console.log('YouTube Looper: Loading Angular bundle from:', bundleUrl);
    
    const script = document.createElement('script');
    
    // YouTube requires Trusted Types - create a trusted script URL
    if (window.trustedTypes && trustedTypes.createPolicy) {
      const policy = trustedTypes.createPolicy('youtube-looper-policy', {
        createScriptURL: (url) => url
      });
      script.src = policy.createScriptURL(bundleUrl);
    } else {
      script.src = bundleUrl;
    }
    
    script.crossOrigin = 'anonymous';
    script.onload = () => console.log('YouTube Looper: Angular bundle loaded');
    script.onerror = (err) => console.error('YouTube Looper: Failed to load Angular bundle', err);
    
    (document.head || document.documentElement).appendChild(script);
  });
  
  console.log('YouTube Looper: Waiting for Angular bundle URL...');
})();
