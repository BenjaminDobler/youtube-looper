import { Component, signal, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { Loop } from '../../models/loop.model';
import { IconComponent } from '../../shared/icon.component';
import { LoopCardComponent } from '../loop-card/loop-card.component';

@Component({
  selector: 'loops-tab',
  imports: [IconComponent, LoopCardComponent],
  templateUrl: './loops-tab.component.html',
  styleUrls: ['./loops-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoopsTabComponent {
  loops = input.required<Loop[]>();
  activeLoopId = input<string | null>(null);
  pitchShift = input<number>(0);
  
  loopActivated = output<{ loopId: string }>();
  loopDeactivated = output<void>();
  loopDeleted = output<{ loopId: string }>();
  loopUpdated = output<{ loop: Loop }>();
  getCurrentTime = output<{ callback: (time: number) => void }>();
  pitchChanged = output<{ semitones: number }>();

  protected shareSuccess = signal<boolean>(false);

  onToggleLoop(loop: Loop) {
    if (this.activeLoopId() === loop.id) {
      this.loopDeactivated.emit();
    } else {
      this.loopActivated.emit({ loopId: loop.id });
    }
  }

  onDeleteLoop(loopId: string) {
    this.loopDeleted.emit({ loopId });
  }

  onUpdateLoop(loop: Loop) {
    this.loopUpdated.emit({ loop });
  }

  onShareLoops() {
    const loops = this.loops();
    if (loops.length === 0) return;

    const loopsData = loops.map(loop => ({
      n: loop.name,
      s: loop.startTime,
      e: loop.endTime,
      c: loop.color,
      ...(loop.pauseDuration && { p: loop.pauseDuration }),
      ...(loop.playbackSpeed && loop.playbackSpeed !== 1.0 && { r: loop.playbackSpeed })
    }));

    const jsonStr = JSON.stringify(loopsData);
    const base64 = btoa(jsonStr)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const currentUrl = new URL(window.location.href);
    currentUrl.hash = `loops=${base64}`;

    navigator.clipboard.writeText(currentUrl.toString()).then(() => {
      this.shareSuccess.set(true);
      setTimeout(() => this.shareSuccess.set(false), 2000);
    });
  }

  onPitchUp() {
    const newPitch = this.pitchShift() + 1;
    this.pitchChanged.emit({ semitones: newPitch });
  }

  onPitchDown() {
    const newPitch = this.pitchShift() - 1;
    this.pitchChanged.emit({ semitones: newPitch });
  }

  onPitchReset() {
    this.pitchChanged.emit({ semitones: 0 });
  }
}
