import { Loop } from '../shared/types';
import { YouTubePlayerService } from './youtube-player.service';
import { StorageService } from './storage.service';

export class LoopManagerService {
  private loops: Loop[] = [];
  private activeLoop: Loop | null = null;
  
  constructor(
    private playerService: YouTubePlayerService,
    private storageService: StorageService
  ) {}

  public createLoop(startTime: number, endTime: number, name: string): Loop {
    const loop: Loop = {
      id: this.generateId(),
      name,
      startTime,
      endTime,
      color: this.generateRandomColor(),
      createdAt: Date.now()
    };

    this.loops.push(loop);
    return loop;
  }

  public updateLoop(updatedLoop: Loop): void {
    const index = this.loops.findIndex(l => l.id === updatedLoop.id);
    if (index !== -1) {
      this.loops[index] = updatedLoop;
      
      // If this was the active loop, update reference
      if (this.activeLoop?.id === updatedLoop.id) {
        this.activeLoop = updatedLoop;
      }
    }
  }

  public deleteLoop(loopId: string): void {
    const index = this.loops.findIndex(l => l.id === loopId);
    if (index !== -1) {
      const loop = this.loops[index];
      this.loops.splice(index, 1);
      
      // If this was the active loop, deactivate
      if (this.activeLoop?.id === loopId) {
        this.activeLoop = null;
      }
    }
  }

  public activateLoop(loopId: string): void {
    const loop = this.loops.find(l => l.id === loopId);
    if (loop) {
      this.activeLoop = loop;
      // Seek to start of loop
      this.playerService.seekTo(loop.startTime);
    }
  }

  public deactivateLoop(): void {
    this.activeLoop = null;
  }

  public checkLoop(currentTime: number): void {
    if (!this.activeLoop) return;

    // Check if we've reached the end of the loop
    if (currentTime >= this.activeLoop.endTime) {
      this.playerService.seekTo(this.activeLoop.startTime);
    }

    // Safety check: if we're somehow before the loop start, seek to start
    if (currentTime < this.activeLoop.startTime - 0.5) {
      this.playerService.seekTo(this.activeLoop.startTime);
    }
  }

  public getLoops(): Loop[] {
    return [...this.loops];
  }

  public setLoops(loops: Loop[]): void {
    this.loops = loops;
    
    // If active loop is no longer in list, deactivate
    if (this.activeLoop && !loops.find(l => l.id === this.activeLoop!.id)) {
      this.activeLoop = null;
    }
  }

  public getActiveLoopId(): string | null {
    return this.activeLoop?.id ?? null;
  }

  private generateId(): string {
    return `loop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B739', '#52B788', '#E63946', '#457B9D'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
