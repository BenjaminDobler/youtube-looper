# YouTube Looper - Installation & Usage Guide

## 🚀 Installation

### Step 1: Build the Extension

```bash
cd /Users/benjamindobler/workspace/looper
npm install
cd angular-app && npm install && cd ..
npm run build
```

This will create a `build` directory with the complete extension.

### Step 2: Load into Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle switch in top-right corner)
4. Click **"Load unpacked"**
5. Navigate to and select the `build` directory in this project
6. The YouTube Looper extension should now appear in your extensions list

### Step 3: Verify Installation

1. Go to any YouTube video (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
2. You should see:
   - A timeline interface below the video player
   - A "Loops" panel in the right sidebar (above recommendations)

## 📖 How to Use

### Creating a Loop

1. **Click on the timeline** below the video to set the loop **start point**
2. **Click again** on a different position to set the loop **end point**
3. The loop is automatically created and appears:
   - As a colored segment on the timeline
   - As a card in the sidebar
4. To cancel while creating: **Right-click** on the timeline

### Managing Loops

#### Activate a Loop
- **Click on a loop** in either the timeline or sidebar
- The video will seek to the loop's start time
- The video will automatically loop back to the start when it reaches the end

#### Deactivate a Loop
- **Click on the active loop** again to stop looping
- The video will continue playing normally

#### Edit Loop Name
1. Click the **✏️ (edit)** button on a loop card in the sidebar
2. Type a new name
3. Press **Enter** or click the **✓** button to save
4. Press **Escape** or click the **✕** button to cancel

#### Delete a Loop
1. Click the **🗑️ (delete)** button on a loop card
2. Confirm the deletion in the popup dialog

### Loop Display

- **Timeline**: Shows all loops as colored segments
- **Sidebar**: Lists all loops with details:
  - Loop name
  - Time range (MM:SS - MM:SS)
  - Duration
  - Active indicator (if playing)

### Persistence

- Loops are **saved automatically** per video
- Loops **persist across browser sessions**
- Loops **sync across tabs** for the same video
- Each video has its own independent set of loops

## 🎯 Use Cases

### Language Learning
Create loops of difficult pronunciations or phrases to practice repeatedly.

### Music Practice
Loop specific sections of music tutorials or performances to learn instruments.

### Study & Research
Isolate and repeat important segments of educational videos.

### Content Creation
Preview and perfect specific segments while editing or referencing videos.

### Entertainment
Rewatch favorite moments from videos, streams, or performances.

## 🛠️ Troubleshooting

### Extension Not Visible
- Refresh the YouTube page (F5)
- Check that extension is enabled in `chrome://extensions/`
- Try disabling and re-enabling the extension

### Loops Not Saving
- Check Chrome storage: DevTools → Application → Storage → Extension Storage
- Ensure you're on a YouTube video page (not homepage or search)
- Verify video ID exists in URL (`?v=...`)

### Player Not Responding
- Ensure video is fully loaded
- Refresh the page
- Check browser console (F12) for error messages

### Visual Issues
- The extension uses Shadow DOM for style isolation
- If UI looks broken, try refreshing the page
- Test in different YouTube view modes (default, theater, fullscreen)

## 🎨 Visual Guide

```
┌─────────────────────────────────────────────────────┐
│  YouTube Video Player                               │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  🎬 Video Loops                    0:45 / 3:22      │ ← Timeline
│  ╔═══════════════╗                                  │   Header
│  ║ █████░░█████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ║      │
│  ║  Loop1  Loop2  ▶                         ║      │ ← Timeline
│  ╚═══════════════╝                                  │   Track
└─────────────────────────────────────────────────────┘

Sidebar (Right side):
┌─────────────────┐
│  Loops        2 │ ← Header
├─────────────────┤
│ ┃ Intro        │ ← Loop Card
│ ┃ 0:00 - 0:15  │   (colored bar on left)
│ ┃ 15s long     │
│ ┃ ✏️ 🗑️        │ ← Actions
├─────────────────┤
│ ┃ Chorus       │
│ ┃ 0:45 - 1:30  │
│ ┃ 45s long     │
│ ┃ 🔄 Playing   │ ← Active indicator
│ ┃ ✏️ 🗑️        │
└─────────────────┘
```

## 🔐 Privacy & Permissions

The extension requires:
- **storage**: Save loops locally in your browser
- **activeTab**: Interact with YouTube pages you visit
- **scripting**: Inject loop functionality into YouTube
- **host_permissions**: Only works on `youtube.com`

**Privacy Guarantee:**
- No data is sent to external servers
- All loops are stored locally in your Chrome browser
- No tracking or analytics
- No access to other websites

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review `DEVELOPMENT.md` for technical details
3. Check browser console for error messages (F12)
4. Try disabling other YouTube extensions temporarily

## 🔄 Updates

After updating the extension code:
1. Run `npm run build`
2. Go to `chrome://extensions/`
3. Click the reload icon (🔄) on the YouTube Looper extension
4. Refresh any open YouTube tabs

## ⚡ Tips & Tricks

1. **Precise Loop Creation**: Pause the video at exact moments before creating loop points
2. **Multiple Loops**: Create multiple loops for different sections of the same video
3. **Descriptive Names**: Rename loops with meaningful names for easy identification
4. **Visual Scanning**: Use the timeline to quickly see all loops at a glance
5. **Quick Access**: Keep the sidebar visible to quickly switch between loops

---

**Built with:** Angular 20, TypeScript, Chrome Extension Manifest V3, Web Components
