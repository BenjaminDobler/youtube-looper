// ============================================================================
// YouTube Looper - Content Script (Bundled)
// All dependencies inlined to avoid module import issues
// ============================================================================

(function() {
  'use strict';


// ============================================================================
// Types and Constants
// ============================================================================

interface Loop {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  color: string;
  createdAt: number;
}

const MessageType = {
  LOOP_CREATED: 'LOOP_CREATED',
  LOOP_UPDATED: 'LOOP_UPDATED',
  LOOP_DELETED: 'LOOP_DELETED',
  LOOP_ACTIVATED: 'LOOP_ACTIVATED',
  LOOP_DEACTIVATED: 'LOOP_DEACTIVATED',
  LOOPS_SYNCED: 'LOOPS_SYNCED',
  GET_LOOPS: 'GET_LOOPS',
  VIDEO_TIME_UPDATE: 'VIDEO_TIME_UPDATE',
  VIDEO_CHANGED: 'VIDEO_CHANGED'
} as const;

const LOOP_EVENTS = {
  CREATED: 'loop-created',
  UPDATED: 'loop-updated',
  DELETED: 'loop-deleted',
  ACTIVATED: 'loop-activated',
  DEACTIVATED: 'loop-deactivated',
  EDIT_REQUESTED: 'loop-edit-requested'
} as const;

interface ChromeMessage {
  type: string;
  payload?: any;
}

// ============================================================================
// YouTube Player Service
// ============================================================================

class YouTubePlayerService {
  private video: HTMLVideoElement | null = null;
  private timeUpdateCallbacks: Array<(time: number) => void> = [];

  constructor() {
    this.initPlayer();
  }

  private initPlayer() {
    // Get the actual HTML5 video element
    this.video = document.querySelector('video.video-stream.html5-main-video');
    
    if (!this.video) {
      console.error('YouTube video element not found');
      console.log('Available videos:', document.querySelectorAll('video'));
      return;
    }

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.video) {
      console.error('Cannot setup event listeners - video is null');
      return;
    }

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
    return this.video?.currentTime ?? null;
  }

  public getDuration(): number | null {
    return this.video?.duration ?? null;
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
    return !this.video.paused;
  }

  public onTimeUpdate(callback: (time: number) => void): void {
    this.timeUpdateCallbacks.push(callback);
  }

  public destroy(): void {
    // No interval to clear anymore since we use event listeners
  }
}

// ============================================================================
// Storage Service
// ============================================================================

class StorageService {
  
  public async getLoops(videoId: string): Promise<Loop[]> {
    try {
      const key = `loops_${videoId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting loops from localStorage:', error);
      return [];
    }
  }

  public async saveLoops(videoId: string, loops: Loop[]): Promise<void> {
    try {
      const key = `loops_${videoId}`;
      localStorage.setItem(key, JSON.stringify(loops));
    } catch (error) {
      console.error('Error saving loops to localStorage:', error);
    }
  }

  public async deleteLoops(videoId: string): Promise<void> {
    try {
      const key = `loops_${videoId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error deleting loops from localStorage:', error);
    }
  }

  public async getAllVideoIds(): Promise<string[]> {
    try {
      const videoIds: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('loops_')) {
          videoIds.push(key.replace('loops_', ''));
        }
      }
      return videoIds;
    } catch (error) {
      console.error('Error getting video IDs from localStorage:', error);
      return [];
    }
  }
}

// ============================================================================
// Loop Manager Service
// ============================================================================

class LoopManagerService {
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
      
      if (this.activeLoop?.id === updatedLoop.id) {
        this.activeLoop = updatedLoop;
      }
    }
  }

  public deleteLoop(loopId: string): void {
    const index = this.loops.findIndex(l => l.id === loopId);
    if (index !== -1) {
      this.loops.splice(index, 1);
      
      if (this.activeLoop?.id === loopId) {
        this.activeLoop = null;
      }
    }
  }

  public activateLoop(loopId: string): void {
    const loop = this.loops.find(l => l.id === loopId);
    if (loop) {
      this.activeLoop = loop;
      this.playerService.seekTo(loop.startTime);
    }
  }

  public deactivateLoop(): void {
    this.activeLoop = null;
  }

  public checkLoop(currentTime: number): void {
    if (!this.activeLoop) return;

    if (currentTime >= this.activeLoop.endTime) {
      this.playerService.seekTo(this.activeLoop.startTime);
    }

    if (currentTime < this.activeLoop.startTime - 0.5) {
      this.playerService.seekTo(this.activeLoop.startTime);
    }
  }

  public getLoops(): Loop[] {
    return [...this.loops];
  }

  public setLoops(loops: Loop[]): void {
    this.loops = loops;
    
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

// ============================================================================
// Main Application
// ============================================================================

class YouTubeLooperApp {
  private playerService!: YouTubePlayerService;
  private loopManager!: LoopManagerService;
  private storageService!: StorageService;
  
  private timelineElement: HTMLElement | null = null;
  private sidebarElement: HTMLElement | null = null;
  
  private currentVideoId: string | null = null;

  constructor() {
    try {
      this.playerService = new YouTubePlayerService();
      this.storageService = new StorageService();
      this.loopManager = new LoopManagerService(this.playerService, this.storageService);
      
      this.init();
    } catch (error) {
      console.error('Error in YouTubeLooperApp constructor:', error);
    }
  }

  private async init() {
    
    await this.waitForYouTubeReady();
    await this.loadAngularComponents();
    await this.injectUI();
    this.setupEventListeners();
    await this.handleVideoChange();
    
  }

  private async waitForCustomElements(): Promise<void> {
    return new Promise((resolve) => {
      const checkCustomElements = () => {
        if (typeof customElements !== 'undefined' && customElements !== null) {
          resolve();
        } else {
          setTimeout(checkCustomElements, 50);
        }
      };
      checkCustomElements();
    });
  }

  private async waitForYouTubeReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        const player = document.getElementById('movie_player');
        const ytdApp = document.querySelector('ytd-app');
        
        if (player && ytdApp) {
          // Reinitialize the player service now that the player exists
          this.playerService.reinitialize();
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }

  private async loadAngularComponents(): Promise<void> {
    // First wait for customElements to be available
    await this.waitForCustomElements();
    
    return new Promise((resolve) => {
      // Angular components are already loaded by preload-angular.js
      // Just poll to check if custom elements are registered
      
      const checkInterval = setInterval(() => {
        const timelineDefined = customElements.get('youtube-loop-timeline');
        const sidebarDefined = customElements.get('youtube-loop-sidebar');
        
        
        if (timelineDefined && sidebarDefined) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (customElements) {
          console.log('Final check - timeline:', !!customElements.get('youtube-loop-timeline'), 
                      'sidebar:', !!customElements.get('youtube-loop-sidebar'));
        }
        resolve();
      }, 10000);
    });
  }

  private async injectUI() {
    await this.injectTimeline();
    await this.injectSidebar();
  }

  private async injectTimeline() {
    // Wait for the elements to be available
    const belowPlayer = await this.waitForElement('#below', 10000);
    
    if (!belowPlayer) {
      console.warn('Could not find below element after waiting');
      return;
    }

    // Check if already injected
    if (document.getElementById('yt-looper-timeline-container')) {
      return;
    }

    const container = document.createElement('div');
    container.id = 'yt-looper-timeline-container';
    container.style.cssText = 'width: 100%; margin: 12px 0;';
    
    this.timelineElement = document.createElement('youtube-loop-timeline');
    container.appendChild(this.timelineElement);
    
    belowPlayer.parentNode?.insertBefore(container, belowPlayer);
    
    
    // Wait for upgrade and set initial values (customElements is guaranteed to exist by now)
    if (customElements) {
      customElements.whenDefined('youtube-loop-timeline').then(() => {
      
      // Set initial values
      const currentTime = this.playerService.getCurrentTime();
      const duration = this.playerService.getDuration();
        (this.timelineElement as any).currentTime = currentTime ?? 0;
        (this.timelineElement as any).duration = duration ?? 0;
      }).catch(err => console.error('Failed to wait for timeline upgrade:', err));
    }
  }

  private async injectSidebar() {
    // Wait for the secondary column
    const secondary = await this.waitForElement('#secondary', 10000);
    
    if (!secondary) {
      console.warn('Could not find secondary column after waiting');
      return;
    }

    // Check if already injected
    if (document.getElementById('yt-looper-sidebar-container')) {
      return;
    }

    const container = document.createElement('div');
    container.id = 'yt-looper-sidebar-container';
    container.style.cssText = 'width: 100%; margin-bottom: 12px;';
    
    this.sidebarElement = document.createElement('youtube-loop-sidebar');
    container.appendChild(this.sidebarElement);
    
    secondary.insertBefore(container, secondary.firstChild);
    
    
    // Wait for upgrade
    if (customElements) {
      customElements.whenDefined('youtube-loop-sidebar').then(() => {
      }).catch(err => console.error('Failed to wait for sidebar upgrade:', err));
    }
  }

  private waitForElement(selector: string, timeout: number = 5000): Promise<Element | null> {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  private setupEventListeners() {
    this.playerService.onTimeUpdate((currentTime) => {
      this.updateComponentsTime(currentTime);
      this.loopManager.checkLoop(currentTime);
    });

    this.watchForVideoChanges();
    this.listenToComponentEvents();
    this.listenToChromeMessages();
  }

  private updateComponentsTime(currentTime: number) {
    if (this.timelineElement) {
      const duration = this.playerService.getDuration();
      // Only log occasionally to avoid spam
      if (Math.floor(currentTime) % 5 === 0) {
      }
      // Set properties directly - @Input setters will update internal signals
      (this.timelineElement as any).currentTime = currentTime;
      (this.timelineElement as any).duration = duration ?? 0;
      
      if (Math.floor(currentTime) % 5 === 0) {
        console.log('Properties set. Element currentTime:', (this.timelineElement as any).currentTime);
      }
    }
  }

  private watchForVideoChanges() {
    let lastVideoId = this.getVideoId();
    
    setInterval(() => {
      const currentVideoId = this.getVideoId();
      if (currentVideoId && currentVideoId !== lastVideoId) {
        lastVideoId = currentVideoId;
        this.handleVideoChange();
      }
    }, 1000);
  }

  private async handleVideoChange() {
    try {
      this.currentVideoId = this.getVideoId();
      
      if (!this.currentVideoId) {
        return;
      }
      
      
      const loops = await this.storageService.getLoops(this.currentVideoId);
      this.loopManager.setLoops(loops);
      
      this.syncComponentsWithLoops();
      
      // Chrome APIs don't work in MAIN world, skip this
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: MessageType.VIDEO_CHANGED,
          payload: { videoId: this.currentVideoId }
        }).catch(err => console.log('Could not send message (expected in MAIN world):', err));
      }
    } catch (error) {
      console.error('Error in handleVideoChange:', error);
    }
  }

  private getVideoId(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    console.log('getVideoId() - URL:', window.location.href);
    console.log('getVideoId() - Video ID:', videoId);
    return videoId;
  }

  private listenToComponentEvents() {
    if (this.timelineElement) {
      // Listen to Angular @Output events (they use the property name as event name)
      this.timelineElement.addEventListener('loopCreated', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        this.handleLoopCreated(detail);
      });

      this.timelineElement.addEventListener('loopActivated', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        this.handleLoopActivated(detail.loopId);
      });

      this.timelineElement.addEventListener('loopDeactivated', (e: Event) => {
        this.handleLoopDeactivated();
      });

      this.timelineElement.addEventListener('seekTo', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        this.handleSeek(detail.time);
      });
    }

    if (this.sidebarElement) {
      this.sidebarElement.addEventListener('loopActivated', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        this.handleLoopActivated(detail.loopId);
      });

      this.sidebarElement.addEventListener('loopDeactivated', (e: Event) => {
        this.handleLoopDeactivated();
      });

      this.sidebarElement.addEventListener('loopDeleted', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        this.handleLoopDeleted(detail.loopId);
      });

      this.sidebarElement.addEventListener('loopUpdated', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        this.handleLoopUpdated(detail.loop);
      });
    }
  }

  private async handleLoopCreated(detail: any) {
    
    if (!this.currentVideoId) {
      console.error('Cannot create loop: no video ID');
      return;
    }

    const loop = this.loopManager.createLoop(
      detail.startTime,
      detail.endTime,
      detail.name || `Loop ${this.loopManager.getLoops().length + 1}`
    );
    
    console.log('Total loops now:', this.loopManager.getLoops().length);

    await this.storageService.saveLoops(this.currentVideoId, this.loopManager.getLoops());
    
    this.syncComponentsWithLoops();

    chrome.runtime.sendMessage({
      type: MessageType.LOOP_CREATED,
      payload: { videoId: this.currentVideoId, loop }
    });
  }

  private handleLoopActivated(loopId: string) {
    this.loopManager.activateLoop(loopId);
    this.syncComponentsWithLoops();

    if (this.currentVideoId) {
      chrome.runtime.sendMessage({
        type: MessageType.LOOP_ACTIVATED,
        payload: { videoId: this.currentVideoId, loopId }
      });
    }
  }

  private handleLoopDeactivated() {
    this.loopManager.deactivateLoop();
    this.syncComponentsWithLoops();

    if (this.currentVideoId) {
      chrome.runtime.sendMessage({
        type: MessageType.LOOP_DEACTIVATED,
        payload: { videoId: this.currentVideoId }
      });
    }
  }

  private async handleLoopDeleted(loopId: string) {
    if (!this.currentVideoId) return;

    this.loopManager.deleteLoop(loopId);
    await this.storageService.saveLoops(this.currentVideoId, this.loopManager.getLoops());
    this.syncComponentsWithLoops();

    chrome.runtime.sendMessage({
      type: MessageType.LOOP_DELETED,
      payload: { videoId: this.currentVideoId, loopId }
    });
  }

  private async handleLoopUpdated(loop: Loop) {
    if (!this.currentVideoId) return;

    this.loopManager.updateLoop(loop);
    await this.storageService.saveLoops(this.currentVideoId, this.loopManager.getLoops());
    this.syncComponentsWithLoops();

    chrome.runtime.sendMessage({
      type: MessageType.LOOP_UPDATED,
      payload: { videoId: this.currentVideoId, loop }
    });
  }

  private handleSeek(time: number) {
    this.playerService.seekTo(time);
  }

  private syncComponentsWithLoops() {
    const loops = this.loopManager.getLoops();
    const activeLoopId = this.loopManager.getActiveLoopId();


    if (this.timelineElement) {
      const currentTime = this.playerService.getCurrentTime();
      const duration = this.playerService.getDuration();
      
      (this.timelineElement as any).loops = loops;
      (this.timelineElement as any).activeLoopId = activeLoopId;
      (this.timelineElement as any).currentTime = currentTime;
      (this.timelineElement as any).duration = duration;
      
      console.log('Timeline loops after setting:', (this.timelineElement as any).loops);
    }

    if (this.sidebarElement) {
      (this.sidebarElement as any).loops = loops;
      (this.sidebarElement as any).activeLoopId = activeLoopId;
    }
  }

  private listenToChromeMessages() {
    // Chrome APIs are not available in MAIN world
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) {
      console.log('Chrome runtime not available (running in MAIN world) - skipping message listener');
      return;
    }
    
    chrome.runtime.onMessage.addListener((message: ChromeMessage) => {
      if (message.type === MessageType.LOOPS_SYNCED) {
        if (message.payload.videoId === this.currentVideoId) {
          this.loopManager.setLoops(message.payload.loops);
          this.syncComponentsWithLoops();
        }
      }
    });
  }
}

  // Initialize the app
  new YouTubeLooperApp();

})(); // End of IIFE
