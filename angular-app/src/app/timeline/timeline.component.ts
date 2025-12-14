import { Component, ViewEncapsulation, signal, computed, Input, Output, EventEmitter, effect } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Loop } from '../models/loop.model';

@Component({
  selector: 'youtube-loop-timeline',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class TimelineComponent {
  // Traditional inputs for Angular Elements compatibility
  @Input() set loops(value: Loop[]) { this._loops.set(value); }
  get loops() { return this._loops(); }
  
  @Input() set currentTime(value: number) { this._currentTime.set(value); }
  get currentTime() { return this._currentTime(); }
  @Input() set duration(value: number) { this._duration.set(value); }
  get duration() { return this._duration(); }
  
  @Input() set activeLoopId(value: string | null) { this._activeLoopId.set(value); }
  get activeLoopId() { return this._activeLoopId(); }

  // Internal signals
  private _loops = signal<Loop[]>([]);
  private _currentTime = signal<number>(0);
  private _duration = signal<number>(0);
  private _activeLoopId = signal<string | null>(null);

  // Traditional outputs
  @Output() loopCreated = new EventEmitter<{ startTime: number; endTime: number; name: string }>();
  @Output() loopActivated = new EventEmitter<{ loopId: string }>();
  @Output() loopDeactivated = new EventEmitter<void>();
  @Output() seekTo = new EventEmitter<{ time: number }>();

  // Internal state
  
  // UI state
  protected isCreatingLoop = signal<boolean>(false);
  protected creationStartTime = signal<number | null>(null);
  protected creationEndTime = signal<number | null>(null);
  protected isDraggingProgress = signal<boolean>(false);
  protected dragPosition = signal<number | null>(null);
  private timelineTrackElement: HTMLElement | null = null;
  private justFinishedDragging = false;

  // Computed values
  protected progressPercent = computed(() => {
    // Use drag position if actively dragging
    if (this.isDraggingProgress() && this.dragPosition() !== null) {
      return this.dragPosition()!;
    }
    const dur = this._duration();
    return dur > 0 ? (this._currentTime() / dur) * 100 : 0;
  });

  protected currentTimeFormatted = computed(() => {
    return this.formatTime(this._currentTime());
  });

  protected durationFormatted = computed(() => {
    return this.formatTime(this._duration());
  });

  constructor() {
  }


  // Handle timeline click to start loop creation
  onTimelineClick(event: MouseEvent) {
    if (this.isDraggingProgress() || this.justFinishedDragging) {
      return; // Ignore clicks while dragging or just after dragging
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percent = x / rect.width;
    const time = percent * this.duration;

    if (!this.isCreatingLoop()) {
      // Start creating loop
      this.isCreatingLoop.set(true);
      this.creationStartTime.set(time);
      this.creationEndTime.set(time);
    } else {
      // Finish creating loop
      const startTime = Math.min(this.creationStartTime()!, time);
      const endTime = Math.max(this.creationStartTime()!, time);
      
      if (endTime - startTime > 0.5) { // Minimum 0.5 second loop
        this.loopCreated.emit({
          startTime,
          endTime,
          name: `Loop ${this.loops.length + 1}`
        });
      }
      
      this.isCreatingLoop.set(false);
      this.creationStartTime.set(null);
      this.creationEndTime.set(null);
    }
  }

  // Handle mouse move during loop creation
  onTimelineMouseMove(event: MouseEvent) {
    if (this.isCreatingLoop() && this.creationStartTime() !== null) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const x = event.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const time = percent * this.duration;
      this.creationEndTime.set(time);
    }
  }

  // Cancel loop creation
  onTimelineRightClick(event: MouseEvent) {
    event.preventDefault();
    this.isCreatingLoop.set(false);
    this.creationStartTime.set(null);
    this.creationEndTime.set(null);
  }

  // Click on existing loop to activate/deactivate
  onLoopClick(loop: Loop, event: MouseEvent) {
    event.stopPropagation();
    
    if (this.activeLoopId === loop.id) {
      this.loopDeactivated.emit();
    } else {
      this.loopActivated.emit({ loopId: loop.id });
    }
  }

  // Calculate loop position and width
  getLoopStyle(loop: Loop) {
    const dur = this.duration;
    if (dur === 0) return {};

    const left = (loop.startTime / dur) * 100;
    const width = ((loop.endTime - loop.startTime) / dur) * 100;
    const isActive = this.activeLoopId === loop.id;

    return {
      left: `${left}%`,
      width: `${width}%`,
      backgroundColor: loop.color,
      opacity: isActive ? '0.9' : '0.6',
      border: isActive ? '2px solid white' : 'none'
    };
  }

  // Get creation preview style
  getCreationPreviewStyle() {
    if (!this.isCreatingLoop() || this.creationStartTime() === null || this.creationEndTime() === null) {
      return {};
    }

    const dur = this.duration;
    if (dur === 0) return {};

    const startTime = Math.min(this.creationStartTime()!, this.creationEndTime()!);
    const endTime = Math.max(this.creationStartTime()!, this.creationEndTime()!);

    const left = (startTime / dur) * 100;
    const width = ((endTime - startTime) / dur) * 100;

    return {
      left: `${left}%`,
      width: `${width}%`
    };
  }

  // Format time as MM:SS
  protected formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Get loop time label
  getLoopTimeLabel(loop: Loop): string {
    return `${this.formatTime(loop.startTime)} - ${this.formatTime(loop.endTime)}`;
  }

  // Start dragging progress indicator
  onProgressMouseDown(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    
    // Store the timeline element reference
    this.timelineTrackElement = (event.currentTarget as HTMLElement).closest('.timeline-track') as HTMLElement;
    
    this.isDraggingProgress.set(true);
    this.handleProgressDrag(event);
    
    // Add document-level listeners for smooth dragging outside the element
    document.addEventListener('mousemove', this.onDocumentMouseMove);
    document.addEventListener('mouseup', this.onDocumentMouseUp);
  }

  // Handle dragging progress indicator
  onProgressDrag(event: MouseEvent) {
    if (this.isDraggingProgress()) {
      event.preventDefault();
      this.handleProgressDrag(event);
    }
  }

  // Stop dragging progress indicator
  onProgressMouseUp(event: MouseEvent) {
    if (this.isDraggingProgress()) {
      event.preventDefault();
      this.isDraggingProgress.set(false);
      this.dragPosition.set(null);
    }
  }

  // Document-level mousemove handler (bound to this)
  private onDocumentMouseMove = (event: MouseEvent) => {
    if (this.isDraggingProgress()) {
      event.preventDefault();
      this.handleProgressDrag(event);
    }
  };

  // Document-level mouseup handler (bound to this)
  private onDocumentMouseUp = (event: MouseEvent) => {
    if (this.isDraggingProgress()) {
      event.preventDefault();
      this.isDraggingProgress.set(false);
      this.dragPosition.set(null);
      this.timelineTrackElement = null;
      
      // Set flag to prevent immediate click after drag
      this.justFinishedDragging = true;
      setTimeout(() => {
        this.justFinishedDragging = false;
      }, 100);
      
      // Remove document-level listeners
      document.removeEventListener('mousemove', this.onDocumentMouseMove);
      document.removeEventListener('mouseup', this.onDocumentMouseUp);
    }
  };

  // Calculate time from mouse position and emit seek event
  private handleProgressDrag(event: MouseEvent) {
    if (!this.timelineTrackElement) return;

    const rect = this.timelineTrackElement.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const time = percent * this.duration;
    
    // Update drag position for visual feedback
    this.dragPosition.set(percent * 100);
    
    this.seekTo.emit({ time });
  }
}
