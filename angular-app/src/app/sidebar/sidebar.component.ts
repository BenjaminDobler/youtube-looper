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
  }

  // Save edited loop name
  onSaveEdit(loop: Loop) {
    const newName = this.editingName().trim();
    if (newName && newName !== loop.name) {
      this.loopUpdated.emit({
        loop: { ...loop, name: newName }
      });
    }
    this.editingLoopId.set(null);
  }

  // Cancel editing
  onCancelEdit() {
    this.editingLoopId.set(null);
    this.editingName.set('');
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
}
