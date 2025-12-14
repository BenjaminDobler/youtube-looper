# YouTube Looper

A Chrome extension that adds loop functionality to YouTube videos with an intuitive timeline interface.

## Features

- 🎯 **Visual Timeline**: Create loops by clicking on a timeline below the video player
- 📋 **Loop Management**: View and manage all your loops in a sidebar
- 🔄 **Active Looping**: Automatically loops selected segments of videos
- 💾 **Persistent Storage**: Your loops are saved per video and synced across tabs
- 🎨 **Modern UI**: Built with Angular 20 Web Components with Shadow DOM isolation

## Architecture

### Web Components
- `<youtube-loop-timeline>` - Timeline interface below the video player
- `<youtube-loop-sidebar>` - Loop management sidebar in the recommendations area

### Communication Flow
```
Background Script (Service Worker)
    ↕️ Chrome Runtime Messages
Content Script (Main Hub)
    ├─ YouTube Player Integration
    ├─ Loop Playback Engine
    └─ Storage Service
    ↕️ CustomEvents + Properties
Web Components (Angular 20)
    ├─ Timeline Component
    └─ Sidebar Component
```

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Chrome browser

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   cd angular-app && npm install && cd ..
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

3. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `build` directory

### Development Workflow

- **Build everything:** `npm run build`
- **Build Angular only:** `npm run build:angular`
- **Build extension only:** `npm run build:extension`
- **Watch mode:** `npm run watch` (for extension files)

## Project Structure

```
looper/
├── manifest.json              # Chrome extension manifest
├── background/
│   └── service-worker.ts     # Background service worker
├── content/
│   ├── content-script.ts     # Main content script
│   ├── youtube-player.service.ts
│   ├── loop-manager.service.ts
│   └── storage.service.ts
├── shared/
│   ├── types.ts              # Shared TypeScript interfaces
│   └── events.ts             # Event helpers
└── angular-app/
    └── src/app/
        ├── timeline/         # Timeline Web Component
        ├── sidebar/          # Sidebar Web Component
        └── models/           # Data models
```

## Usage

1. **Navigate to any YouTube video**
2. **Create a loop:**
   - Click on the timeline below the video to start
   - Click again to set the end point
   - Right-click to cancel
3. **Manage loops:**
   - View all loops in the sidebar on the right
   - Click a loop to activate/deactivate it
   - Edit loop names with the edit button
   - Delete loops with the delete button
4. **Loop playback:**
   - Activated loops will automatically repeat
   - Only one loop can be active at a time

## Technical Details

### Technologies
- **Angular 20** with standalone components
- **@angular/elements** for Web Components
- **Shadow DOM** for style isolation
- **Chrome Extension Manifest V3**
- **TypeScript** throughout

### Key Features
- Zoneless Angular application for better performance
- Shadow DOM prevents style conflicts with YouTube
- Custom events for component communication
- Chrome Storage API for persistence
- Cross-tab synchronization

## Permissions

The extension requires:
- `storage` - To save loops per video
- `activeTab` - To interact with YouTube pages
- `scripting` - To inject content scripts
- Host permission for `https://www.youtube.com/*`

## License

MIT

## Contributing

Contributions welcome! Please ensure:
- TypeScript code passes compilation
- Angular components follow standalone pattern
- Web Components use Shadow DOM encapsulation
- All features work across YouTube's different view modes
