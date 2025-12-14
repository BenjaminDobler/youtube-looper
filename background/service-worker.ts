// Wrap in IIFE to avoid global scope conflicts
(function() {
  // Inline types to avoid module import issues in service worker
  const MessageType = {
    LOOP_CREATED: 'LOOP_CREATED',
    LOOP_UPDATED: 'LOOP_UPDATED',
    LOOP_DELETED: 'LOOP_DELETED',
    LOOP_ACTIVATED: 'LOOP_ACTIVATED',
    LOOP_DEACTIVATED: 'LOOP_DEACTIVATED',
    LOOPS_SYNCED: 'LOOPS_SYNCED',
    GET_LOOPS: 'GET_LOOPS',
    VIDEO_TIME_UPDATE: 'VIDEO_TIME_UPDATE',
    VIDEO_CHANGED: 'VIDEO_CHANGED'
  } as const;

  interface ChromeMessage {
    type: string;
    payload?: any;
  }

  console.log('YouTube Looper: Background service worker started');

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  console.log('Background received message:', message.type);

  switch (message.type) {
    case MessageType.LOOP_CREATED:
    case MessageType.LOOP_UPDATED:
    case MessageType.LOOP_DELETED:
    case MessageType.LOOP_ACTIVATED:
      // Broadcast to all tabs with the same video
      broadcastToYouTubeTabs(message);
      break;

    case MessageType.GET_LOOPS:
      // Handle request for loops
      chrome.storage.local.get([message.payload.videoId], (result) => {
        sendResponse({ loops: result[message.payload.videoId] || [] });
      });
      return true; // Keep channel open for async response

    default:
      console.warn('Unknown message type:', message.type);
  }

  return false;
});

// Broadcast message to all YouTube tabs
async function broadcastToYouTubeTabs(message: ChromeMessage) {
  const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });
  
  tabs.forEach((tab) => {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, message).catch((error) => {
        // Tab might not have content script loaded yet
        console.log('Could not send message to tab:', error);
      });
    }
  });
}

// Listen for storage changes and sync across tabs
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    console.log('Storage changed:', Object.keys(changes));
    
    // Notify all tabs about storage changes
    Object.keys(changes).forEach((videoId) => {
      broadcastToYouTubeTabs({
        type: MessageType.LOOPS_SYNCED,
        payload: {
          videoId,
          loops: changes[videoId].newValue || []
        }
      });
    });
  }
});

})(); // End of IIFE
