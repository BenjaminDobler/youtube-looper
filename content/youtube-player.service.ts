export class YouTubePlayerService {
  private video: HTMLVideoElement | null = null;
  private timeUpdateCallbacks: Array<(time: number) => void> = [];

  constructor() {
    this.initPlayer();
  }

  private initPlayer() {
    // Get the actual HTML5 video element
    this.video = document.querySelector('video.video-stream.html5-main-video');
    
    if (!this.video) {
      return;
    }

    console.log('YouTube video element initialized');
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.video) return;

    // Listen to native timeupdate event instead of polling
    this.video.addEventListener('timeupdate', () => {
      const currentTime = this.getCurrentTime();
      if (currentTime !== null) {
        this.timeUpdateCallbacks.forEach(callback => callback(currentTime));
      }
    });
  }

  public reinitialize() {
    console.log('Reinitializing YouTube player service');
    this.initPlayer();
  }

  public getCurrentTime(): number | null {
    if (!this.video) return null;
    return this.video.currentTime;
  }

  public getDuration(): number | null {
    if (!this.video) return null;
    return this.video.duration;
  }

  public seekTo(time: number): void {
    if (!this.video) return;
    this.video.currentTime = time;
  }

  public play(): void {
    if (!this.video) return;
    this.video.play();
  }

  public pause(): void {
    if (!this.video) return;
    this.video.pause();
  }

  public isPlaying(): boolean {
    if (!this.video) return false;
    return !this.video.paused && !this.video.ended && this.video.readyState > 2;
  }

  public onTimeUpdate(callback: (time: number) => void): void {
    this.timeUpdateCallbacks.push(callback);
  }

  public destroy(): void {
    // No interval to clear anymore - using native events
  }
}
