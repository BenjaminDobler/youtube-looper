import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { Loop } from '../../models/loop.model';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'video-card',
  imports: [IconComponent],
  templateUrl: './video-card.component.html',
  styleUrls: ['./video-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoCardComponent {
  videoId = input.required<string>();
  title = input.required<string>();
  thumbnail = input.required<string>();
  loops = input.required<Loop[]>();
  
  videoClick = output<string>();
  delete = output<string>();

  // Computed derived state
  protected loopCountText = computed(() => {
    const count = this.loops().length;
    return `${count} ${count === 1 ? 'loop' : 'loops'}`;
  });

  protected visibleLoops = computed(() => this.loops().slice(0, 3));
  protected additionalLoopsCount = computed(() => {
    const total = this.loops().length;
    return total > 3 ? total - 3 : 0;
  });

  onClick() {
    this.videoClick.emit(this.videoId());
  }

  onDelete(event: MouseEvent) {
    event.stopPropagation();
    this.delete.emit(this.videoId());
  }
}
