import { Component, ViewEncapsulation, signal, computed, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Loop } from '../models/loop.model';

@Component({
  selector: 'youtube-loop-sidebar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class SidebarComponent {
  // Traditional inputs for Angular Elements compatibility
  @Input() set loops(value: Loop[]) { this._loops.set(value); }
  get loops() { return this._loops(); }
  
  @Input() set activeLoopId(value: string | null) { this._activeLoopId.set(value); }
  get activeLoopId() { return this._activeLoopId(); }

  // Internal signals
  private _loops = signal<Loop[]>([]);
  private _activeLoopId = signal<string | null>(null);

  // Traditional outputs
  @Output() loopActivated = new EventEmitter<{ loopId: string }>();
  @Output() loopDeactivated = new EventEmitter<void>();
  @Output() loopDeleted = new EventEmitter<{ loopId: string }>();
  @Output() loopUpdated = new EventEmitter<{ loop: Loop }>();

  // Internal state
  protected editingLoopId = signal<string | null>(null);
  protected editingName = signal<string>('');
  protected editingStartTime = signal<number>(0);
  protected editingEndTime = signal<number>(0);
  protected editingPauseDuration = signal<number>(0);

  // Toggle loop activation
  onToggleLoop(loop: Loop) {
    if (this.activeLoopId === loop.id) {
      this.loopDeactivated.emit();
    } else {
      this.loopActivated.emit({ loopId: loop.id });
    }
  }

  // Start editing a loop name
  onEditLoop(loop: Loop, event: MouseEvent) {
    event.stopPropagation();
    this.editingLoopId.set(loop.id);
    this.editingName.set(loop.name);
    this.editingStartTime.set(loop.startTime);
    this.editingEndTime.set(loop.endTime);
    this.editingPauseDuration.set(loop.pauseDuration || 0);
  }

  // Save edited loop name and times
  onSaveEdit(loop: Loop) {
    const newName = this.editingName().trim();
    const newStartTime = this.editingStartTime();
    const newEndTime = this.editingEndTime();
    const newPauseDuration = this.editingPauseDuration();
    
    // Validate times
    if (newStartTime >= newEndTime) {
      alert('Start time must be before end time');
      return;
    }
    
    if (newStartTime < 0 || newEndTime < 0) {
      alert('Times must be positive');
      return;
    }
    
    if (newPauseDuration < 0) {
      alert('Pause duration must be positive');
      return;
    }
    
    const hasChanges = newName !== loop.name || 
                      newStartTime !== loop.startTime || 
                      newEndTime !== loop.endTime ||
                      newPauseDuration !== (loop.pauseDuration || 0);
    
    if (newName && hasChanges) {
      this.loopUpdated.emit({
        loop: { ...loop, name: newName, startTime: newStartTime, endTime: newEndTime, pauseDuration: newPauseDuration }
      });
    }
    this.editingLoopId.set(null);
  }

  // Cancel editing
  onCancelEdit() {
    this.editingLoopId.set(null);
    this.editingName.set('');
    this.editingStartTime.set(0);
    this.editingEndTime.set(0);
    this.editingPauseDuration.set(0);
  }

  // Delete a loop
  onDeleteLoop(loop: Loop, event: MouseEvent) {
    event.stopPropagation();
    
    if (confirm(`Delete loop "${loop.name}"?`)) {
      this.loopDeleted.emit({ loopId: loop.id });
    }
  }

  // Check if loop is being edited
  isEditing(loopId: string): boolean {
    return this.editingLoopId() === loopId;
  }

  // Check if loop is active
  isActive(loopId: string): boolean {
    return this.activeLoopId === loopId;
  }

  // Format time as MM:SS
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Get loop duration
  getLoopDuration(loop: Loop): string {
    const duration = loop.endTime - loop.startTime;
    return `${this.formatTime(duration)} long`;
  }

  // Get loop time range
  getLoopTimeRange(loop: Loop): string {
    return `${this.formatTime(loop.startTime)} - ${this.formatTime(loop.endTime)}`;
  }

  // Convert time string (MM:SS) to seconds
  timeStringToSeconds(timeString: string): number {
    const parts = timeString.split(':');
    if (parts.length !== 2) return 0;
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  }

  // Handle start time input change
  onStartTimeChange(value: string) {
    const seconds = this.timeStringToSeconds(value);
    this.editingStartTime.set(seconds);
  }

  // Handle end time input change
  onEndTimeChange(value: string) {
    const seconds = this.timeStringToSeconds(value);
    this.editingEndTime.set(seconds);
  }
}
