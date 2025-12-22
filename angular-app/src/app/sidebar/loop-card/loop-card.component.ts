import { Component, signal, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Loop } from '../../models/loop.model';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'loop-card',
  imports: [FormsModule, IconComponent],
  templateUrl: './loop-card.component.html',
  styleUrls: ['./loop-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoopCardComponent {
  loop = input.required<Loop>();
  isActive = input<boolean>(false);
  
  toggle = output<void>();
  delete = output<void>();
  update = output<Loop>();
  getCurrentTime = output<{ callback: (time: number) => void }>();

  protected isEditing = signal<boolean>(false);
  protected editingName = signal<string>('');
  protected editingStartTime = signal<number>(0);
  protected editingEndTime = signal<number>(0);
  protected editingPauseDuration = signal<number>(0);
  protected editingPlaybackSpeed = signal<number>(1.0);

  // Computed derived state
  protected loopTimeRange = computed(() => {
    const loop = this.loop();
    return `${this.formatTime(loop.startTime)} - ${this.formatTime(loop.endTime)}`;
  });

  protected loopDuration = computed(() => {
    const loop = this.loop();
    const duration = loop.endTime - loop.startTime;
    return `${this.formatTime(duration)} long`;
  });

  protected formattedStartTime = computed(() => this.formatTime(this.editingStartTime()));
  protected formattedEndTime = computed(() => this.formatTime(this.editingEndTime()));

  onToggle() {
    this.toggle.emit();
  }

  onEditLoop(event: MouseEvent) {
    event.stopPropagation();
    const loop = this.loop();
    this.isEditing.set(true);
    this.editingName.set(loop.name);
    this.editingStartTime.set(loop.startTime);
    this.editingEndTime.set(loop.endTime);
    this.editingPauseDuration.set(loop.pauseDuration || 0);
    this.editingPlaybackSpeed.set(loop.playbackSpeed || 1.0);
  }

  onSaveEdit() {
    const loop = this.loop();
    const newName = this.editingName().trim();
    const newStartTime = this.editingStartTime();
    const newEndTime = this.editingEndTime();
    const newPauseDuration = this.editingPauseDuration();
    const newPlaybackSpeed = this.editingPlaybackSpeed();
    
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
    
    if (newPlaybackSpeed < 0.25 || newPlaybackSpeed > 2.0) {
      alert('Playback speed must be between 0.25 and 2.0');
      return;
    }
    
    const hasChanges = newName !== loop.name || 
                      newStartTime !== loop.startTime || 
                      newEndTime !== loop.endTime ||
                      newPauseDuration !== (loop.pauseDuration || 0) ||
                      newPlaybackSpeed !== (loop.playbackSpeed || 1.0);
    
    if (newName && hasChanges) {
      this.update.emit({
        ...loop,
        name: newName,
        startTime: newStartTime,
        endTime: newEndTime,
        pauseDuration: newPauseDuration,
        playbackSpeed: newPlaybackSpeed
      });
    }
    this.isEditing.set(false);
  }

  onCancelEdit() {
    this.isEditing.set(false);
  }

  onDeleteLoop(event: MouseEvent) {
    event.stopPropagation();
    if (confirm(`Delete loop "${this.loop().name}"?`)) {
      this.delete.emit();
    }
  }

  onInputKeydown(event: KeyboardEvent) {
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  protected formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const wholeSecs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${mins}:${wholeSecs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  protected timeStringToSeconds(timeString: string): number {
    const parts = timeString.split(':');
    if (parts.length !== 2) return 0;
    const mins = parseInt(parts[0], 10) || 0;
    
    const secondsPart = parts[1];
    if (secondsPart.includes('.')) {
      const [secs, ms] = secondsPart.split('.');
      const seconds = parseInt(secs, 10) || 0;
      const milliseconds = parseInt(ms.padEnd(3, '0').substring(0, 3), 10) || 0;
      return mins * 60 + seconds + milliseconds / 1000;
    } else {
      const secs = parseInt(secondsPart, 10) || 0;
      return mins * 60 + secs;
    }
  }

  onStartTimeChange(value: string) {
    const seconds = this.timeStringToSeconds(value);
    this.editingStartTime.set(seconds);
  }

  onEndTimeChange(value: string) {
    const seconds = this.timeStringToSeconds(value);
    this.editingEndTime.set(seconds);
  }

  onSetStartToCurrent() {
    this.getCurrentTime.emit({
      callback: (time: number) => {
        const newStartTime = Math.round(time * 1000) / 1000;
        this.editingStartTime.set(newStartTime);
        
        this.update.emit({
          ...this.loop(),
          name: this.editingName(),
          startTime: newStartTime,
          endTime: this.editingEndTime(),
          pauseDuration: this.editingPauseDuration(),
          playbackSpeed: this.editingPlaybackSpeed()
        });
      }
    });
  }

  onSetEndToCurrent() {
    this.getCurrentTime.emit({
      callback: (time: number) => {
        const newEndTime = Math.round(time * 1000) / 1000;
        this.editingEndTime.set(newEndTime);
        
        this.update.emit({
          ...this.loop(),
          name: this.editingName(),
          startTime: this.editingStartTime(),
          endTime: newEndTime,
          pauseDuration: this.editingPauseDuration(),
          playbackSpeed: this.editingPlaybackSpeed()
        });
      }
    });
  }
}
