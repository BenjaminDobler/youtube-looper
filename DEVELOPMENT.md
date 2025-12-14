# YouTube Looper - Development Guide

## Quick Start

### Building the Extension

```bash
# Full build (Angular + Extension + Package)
npm run build

# The extension will be available in ./build directory
```

### Loading in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `build` directory from this project

### Development Workflow

For development, you'll need to rebuild after changes:

```bash
# After changing Angular components
npm run build:angular

# After changing extension files (content script, background, etc.)
npm run build:extension

# Full rebuild
npm run build
```

After rebuilding, go to `chrome://extensions/` and click the reload icon on the YouTube Looper extension.

## Project Components

### 1. Background Service Worker (`background/service-worker.ts`)
- Manages extension lifecycle
- Coordinates cross-tab communication
- Handles Chrome storage synchronization

### 2. Content Script (`content/content-script.ts`)
- Main orchestrator injected into YouTube pages
- Manages YouTube player integration
- Injects and communicates with Web Components
- Handles loop playback logic

### 3. Services
- **`youtube-player.service.ts`** - Interfaces with YouTube's video player
- **`loop-manager.service.ts`** - Manages loop state and playback
- **`storage.service.ts`** - Handles Chrome storage operations

### 4. Angular Web Components

#### Timeline Component (`angular-app/src/app/timeline/`)
- Displays visual timeline below video player
- Allows click-and-drag loop creation
- Shows all loops as colored segments
- Highlights active loop

#### Sidebar Component (`angular-app/src/app/sidebar/`)
- Lists all loops for current video
- Provides loop management UI (edit, delete, activate)
- Shows active loop status

## Communication Architecture

```
┌─────────────────────────────────────┐
│     Background Service Worker       │
│  - Cross-tab coordination           │
│  - Storage sync                     │
└────────────┬────────────────────────┘
             │ Chrome Runtime Messages
┌────────────┴────────────────────────┐
│       Content Script (Hub)          │
│  - YouTube Player Service           │
│  - Loop Manager                     │
│  - Storage Service                  │
└─────┬──────────────────────┬────────┘
      │ Properties/Attrs     │ CustomEvents
┌─────▼─────────┐      ┌─────▼─────────┐
│   Timeline    │      │    Sidebar    │
│ Web Component │      │ Web Component │
│ (Shadow DOM)  │      │ (Shadow DOM)  │
└───────────────┘      └───────────────┘
```

### Message Flow Examples

**Creating a Loop:**
1. User clicks timeline → Timeline component emits `loop-created` event
2. Content script receives event → Creates loop → Saves to storage
3. Content script updates component properties with new loop data
4. Background script syncs to other tabs (if same video open)

**Activating a Loop:**
1. User clicks loop card → Sidebar emits `loop-activated` event
2. Content script receives event → Activates loop → Seeks to start time
3. Content script monitors video time → Loops back when end reached
4. Component properties updated to show active state

## Key Technologies

### Angular 20 Features Used
- **Standalone Components** - No NgModule required
- **Signals** - Reactive state management
- **Zoneless** - Better performance without Zone.js
- **@angular/elements** - Web Components support
- **Shadow DOM** - Style encapsulation

### Chrome Extension APIs
- **Manifest V3** - Latest extension format
- **Service Worker** - Background script
- **Content Scripts** - Page injection
- **Storage API** - Persistent data
- **Runtime Messaging** - Cross-context communication

## Debugging

### Content Script Debugging
1. Open YouTube in Chrome
2. Open DevTools (F12)
3. Check Console for logs prefixed with "YouTube Looper:"
4. Use Sources tab to debug `content-script.js`

### Web Component Debugging
1. Open YouTube with extension loaded
2. Open DevTools
3. Find `<youtube-loop-timeline>` or `<youtube-loop-sidebar>` in Elements tab
4. Expand shadow root to see component internals
5. Console logs from components appear in main console

### Background Script Debugging
1. Go to `chrome://extensions/`
2. Find YouTube Looper
3. Click "service worker" link
4. Opens DevTools for background script

## Common Issues

### Components Not Appearing
- Check that Angular build completed successfully
- Verify `angular-app/dist/main.js` exists
- Check Console for Web Component registration logs
- Ensure YouTube page fully loaded before injection

### Loops Not Persisting
- Check Chrome storage in DevTools → Application → Storage → Extension Storage
- Verify video ID is being extracted correctly (URL param `?v=...`)
- Check background script logs for storage operations

### Player Control Issues
- YouTube's player API is unofficial and may change
- Check that `document.getElementById('movie_player')` exists
- Verify player methods (`getCurrentTime`, `seekTo`, etc.) are available

## Testing Checklist

- [ ] Create loop by clicking timeline
- [ ] Edit loop name in sidebar
- [ ] Delete loop
- [ ] Activate/deactivate loop
- [ ] Verify loop playback (seeks back at end)
- [ ] Switch to different video (loops should clear)
- [ ] Reload page (loops should persist)
- [ ] Open same video in new tab (loops should sync)
- [ ] Test in theater mode
- [ ] Test with different video lengths
- [ ] Verify no style conflicts with YouTube

## Future Enhancements

Potential features to add:
- Export/import loops as JSON
- Keyboard shortcuts
- Loop names with timestamps in suggestions
- Multiple simultaneous loops (playlist mode)
- Share loops via URL
- Loop presets for common use cases
- Visual waveform on timeline
- Drag handles to adjust loop boundaries
- Loop fade in/out
- Speed control per loop

## File Structure Reference

```
looper/
├── manifest.json                 # Extension configuration
├── package.json                  # Build scripts
├── tsconfig.extension.json       # TypeScript config
├── build.sh                      # Build packaging script
├── README.md                     # User documentation
├── DEVELOPMENT.md                # This file
│
├── background/
│   └── service-worker.ts        # Background script
│
├── content/
│   ├── content-script.ts        # Main content script
│   ├── youtube-player.service.ts
│   ├── loop-manager.service.ts
│   └── storage.service.ts
│
├── shared/
│   ├── types.ts                 # Shared interfaces
│   └── events.ts                # Event utilities
│
├── angular-app/                 # Angular project
│   ├── package.json
│   ├── angular.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts              # Web Component registration
│       └── app/
│           ├── models/
│           │   └── loop.model.ts
│           ├── timeline/
│           │   ├── timeline.component.ts
│           │   ├── timeline.component.html
│           │   └── timeline.component.scss
│           └── sidebar/
│               ├── sidebar.component.ts
│               ├── sidebar.component.html
│               └── sidebar.component.scss
│
├── icons/                       # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
├── dist/                        # Compiled extension files
└── build/                       # Packaged extension (load this in Chrome)
```
