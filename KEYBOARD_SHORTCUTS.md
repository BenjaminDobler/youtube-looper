# Keyboard Shortcuts

## Loop Creation Shortcut

### How to Use

1. **Start Loop Creation**: Press `Ctrl+L` (Windows/Linux) or `Cmd+L` (Mac)
   - A temporary loop will be created at the current video position
   - The loop name will show "Creating..." in the sidebar
   - The loop will appear on the timeline

2. **While in Creation Mode**:
   - The video continues playing
   - The loop's end time automatically updates to follow the current playback position
   - The loop grows on the timeline as the video plays

3. **Finish Loop Creation**: Press `Ctrl+L` (or `Cmd+L`) again
   - The loop is finalized with the current video position as the end time
   - The loop name is updated to "Loop N" (where N is the loop number)
   - The loop is saved to storage

4. **Cancel Loop Creation**: Press `Esc` while in creation mode
   - The temporary loop is deleted
   - Returns to normal mode without creating a loop

### Visual Feedback

- **Creating**: Loop appears with name "Creating..." and expands as video plays
- **Sidebar**: Loop appears in the sidebar list and updates in real-time
- **Timeline**: Loop bar grows on the timeline as the end time updates

### Tips

- You can pause the video at any point during creation to precisely set the end time
- The loop must have a duration greater than 0 (end time must be after start time)
- Press `Esc` at any time before finalizing to cancel and remove the temporary loop
- Once finalized, the loop can be edited like any other loop

### Technical Details

- The keyboard shortcut prevents YouTube's default behavior for `L` (forward 10 seconds)
- Works in both MAIN and ISOLATED worlds of the content script
- Updates are throttled to video timeupdate events for performance
- All loop data is stored locally in browser storage
