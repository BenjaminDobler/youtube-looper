export class YouTubePlayerService {
  private video: HTMLVideoElement | null = null;
  private timeUpdateCallbacks: Array<(time: number) => void> = [];
  
  // Web Audio API for pitch shifting
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private currentPitchShift: number = 0; // in semitones

  constructor() {
    this.initPlayer();
  }

  private initPlayer() {
    // Get the actual HTML5 video element
    this.video = document.querySelector('video.video-stream.html5-main-video');
    
    if (!this.video) {
      return;
    }

    this.setupEventListeners();
    this.setupWebAudio();
  }
  
  private setupWebAudio() {
    if (!this.video || this.audioContext) {
      return; // Already set up
    }
    
    try {
      // Create audio context
      this.audioContext = new AudioContext();
      
      // Create source from video element
      this.sourceNode = this.audioContext.createMediaElementSource(this.video);
      
      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      
      // Connect: source -> gain -> destination
      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
    } catch (error) {
      // Silently fail - audio will still work without pitch shifting
    }
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
  
  /**
   * Set pitch shift in semitones (e.g., +2 for two semitones up, -3 for three semitones down)
   * Uses preservesPitch to change pitch without affecting playback speed
   */
  public setPitchShift(semitones: number): void {
    if (!this.video) return;
    
    this.currentPitchShift = semitones;
    
    // Calculate playback rate from semitones
    // Formula: rate = 2^(semitones/12)
    const rate = Math.pow(2, semitones / 12);
    
    // Set playback rate but preserve pitch is OFF by default
    // We want to change pitch, so we explicitly set preservesPitch to false
    this.video.playbackRate = rate;
    (this.video as any).preservesPitch = false;
    (this.video as any).mozPreservesPitch = false;
    (this.video as any).webkitPreservesPitch = false;
  }
  
  /**
   * Get current pitch shift in semitones
   */
  public getPitchShift(): number {
    return this.currentPitchShift;
  }
  
  /**
   * Reset pitch to normal
   */
  public resetPitch(): void {
    this.setPitchShift(0);
  }

  public destroy(): void {
    // Clean up Web Audio API
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
