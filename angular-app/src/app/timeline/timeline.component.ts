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
  @Output() loopUpdated = new EventEmitter<{ loop: Loop }>();
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
  
  // Loop dragging state
  private isDraggingLoop = false;
  private draggedLoop: Loop | null = null;
  private dragMode: 'move' | 'resize-start' | 'resize-end' | null = null;
  private dragStartX = 0;
  private dragStartTime = 0;
  private originalLoopStart = 0;
  private originalLoopEnd = 0;

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

  // Handle mousedown on loop for dragging/resizing
  onLoopMouseDown(loop: Loop, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    
    const loopElement = event.currentTarget as HTMLElement;
    const rect = loopElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const edgeThreshold = 10; // 10px from edge
    
    // Determine drag mode based on click position
    if (x <= edgeThreshold) {
      this.dragMode = 'resize-start';
    } else if (x >= rect.width - edgeThreshold) {
      this.dragMode = 'resize-end';
    } else {
      this.dragMode = 'move';
    }
    
    // Store the timeline element reference
    this.timelineTrackElement = loopElement.closest('.timeline-track') as HTMLElement;
    
    // Store drag state
    this.isDraggingLoop = true;
    this.draggedLoop = loop;
    this.dragStartX = event.clientX;
    this.dragStartTime = this.getTimeFromPosition(event.clientX);
    this.originalLoopStart = loop.startTime;
    this.originalLoopEnd = loop.endTime;
    
    // Add document-level listeners
    document.addEventListener('mousemove', this.onLoopDocumentMouseMove);
    document.addEventListener('mouseup', this.onLoopDocumentMouseUp);
  }
  
  // Click on existing loop to activate/deactivate (when not dragging)
  onLoopClick(loop: Loop, event: MouseEvent) {
    event.stopPropagation();
    
    // Only handle click if we didn't just finish dragging
    if (!this.justFinishedDragging) {
      if (this.activeLoopId === loop.id) {
        this.loopDeactivated.emit();
      } else {
        this.loopActivated.emit({ loopId: loop.id });
      }
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
  
  // Document-level mousemove handler for loop dragging
  private onLoopDocumentMouseMove = (event: MouseEvent) => {
    if (!this.isDraggingLoop || !this.draggedLoop || !this.timelineTrackElement) return;
    
    event.preventDefault();
    const currentTime = this.getTimeFromPosition(event.clientX);
    const timeDelta = currentTime - this.dragStartTime;
    
    let newStartTime = this.originalLoopStart;
    let newEndTime = this.originalLoopEnd;
    
    if (this.dragMode === 'move') {
      // Move entire loop
      newStartTime = Math.max(0, this.originalLoopStart + timeDelta);
      newEndTime = Math.min(this.duration, this.originalLoopEnd + timeDelta);
      
      // Keep loop duration constant
      const loopDuration = this.originalLoopEnd - this.originalLoopStart;
      if (newStartTime === 0) {
        newEndTime = loopDuration;
      } else if (newEndTime === this.duration) {
        newStartTime = this.duration - loopDuration;
      }
    } else if (this.dragMode === 'resize-start') {
      // Resize start time
      newStartTime = Math.max(0, Math.min(this.originalLoopStart + timeDelta, this.originalLoopEnd - 0.5));
    } else if (this.dragMode === 'resize-end') {
      // Resize end time
      newEndTime = Math.min(this.duration, Math.max(this.originalLoopEnd + timeDelta, this.originalLoopStart + 0.5));
    }
    
    // Update loop immediately for visual feedback
    const updatedLoop = {
      ...this.draggedLoop,
      startTime: newStartTime,
      endTime: newEndTime
    };
    
    // Update the loop in the array for visual feedback
    const index = this._loops().findIndex(l => l.id === this.draggedLoop!.id);
    if (index !== -1) {
      const newLoops = [...this._loops()];
      newLoops[index] = updatedLoop;
      this._loops.set(newLoops);
    }
  };
  
  // Document-level mouseup handler for loop dragging
  private onLoopDocumentMouseUp = (event: MouseEvent) => {
    if (!this.isDraggingLoop || !this.draggedLoop) return;
    
    event.preventDefault();
    
    // Emit the updated loop
    const updatedLoop = this._loops().find(l => l.id === this.draggedLoop!.id);
    if (updatedLoop) {
      this.loopUpdated.emit({ loop: updatedLoop });
    }
    
    // Reset drag state
    this.isDraggingLoop = false;
    this.draggedLoop = null;
    this.dragMode = null;
    this.timelineTrackElement = null;
    
    // Set flag to prevent immediate click after drag
    this.justFinishedDragging = true;
    setTimeout(() => {
      this.justFinishedDragging = false;
    }, 100);
    
    // Remove document-level listeners
    document.removeEventListener('mousemove', this.onLoopDocumentMouseMove);
    document.removeEventListener('mouseup', this.onLoopDocumentMouseUp);
  };
  
  // Get time from mouse X position
  private getTimeFromPosition(clientX: number): number {
    if (!this.timelineTrackElement) return 0;
    
    const rect = this.timelineTrackElement.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = x / rect.width;
    return percent * this.duration;
  }
  
  // Get cursor style for loop element
  getLoopCursorClass(event: MouseEvent): string {
    const loopElement = event.currentTarget as HTMLElement;
    const rect = loopElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const edgeThreshold = 10;
    
    if (x <= edgeThreshold) {
      return 'ew-resize';
    } else if (x >= rect.width - edgeThreshold) {
      return 'ew-resize';
    } else {
      return 'move';
    }
  }
}
