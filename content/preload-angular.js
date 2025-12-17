// This script runs at document_start in MAIN world
// Since we're in MAIN world, we don't have access to chrome.runtime.getURL
// The Angular bundle URL will be injected as a data attribute by the manifest
(function() {
  'use strict';
  
  // Prevent YouTube's ES5 adapter from interfering with our custom elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'SCRIPT' && 
            node.src && 
            node.src.includes('custom-elements-es5-adapter')) {
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
    
    (document.head || document.documentElement).appendChild(script);
  });
})();
