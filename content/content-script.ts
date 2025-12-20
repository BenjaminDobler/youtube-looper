// Inline types to avoid module issues
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

console.log('YouTube Looper: Content script loaded');

class YouTubeLooperApp {
  private playerService: YouTubePlayerService;
  private loopManager: LoopManagerService;
  private storageService: StorageService;
  
  private timelineElement: HTMLElement | null = null;
  private sidebarElement: HTMLElement | null = null;
  
  private currentVideoId: string | null = null;
  
  // Loop creation mode state
  private isCreatingLoop: boolean = false;
  private tempLoopId: string | null = null;
  private creationStartTime: number = 0;

  constructor() {
    this.playerService = new YouTubePlayerService();
    this.storageService = new StorageService();
    this.loopManager = new LoopManagerService(this.playerService, this.storageService);
    
    this.init();
  }

  private async init() {
    console.log('Initializing YouTube Looper...');
    
    // Wait for YouTube page to be ready
    await this.waitForYouTubeReady();
    
    // Load Angular Web Components
    await this.loadAngularComponents();
    
    // Inject UI elements
    this.injectUI();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load loops for current video
    await this.handleVideoChange();
    
    console.log('YouTube Looper: Initialized successfully');
  }

  private async waitForYouTubeReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        const player = document.getElementById('movie_player');
        const ytdApp = document.querySelector('ytd-app');
        
        if (player && ytdApp) {
          console.log('YouTube player ready');
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }

  private async loadAngularComponents(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Load the Angular manifest to get the current bundle filename
        const manifestResponse = await fetch(chrome.runtime.getURL('angular-manifest.json'));
        const manifest = await manifestResponse.json();
        
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(manifest.mainBundle);
        script.type = 'module';
        script.onload = () => {
          console.log('Angular components loaded');
          resolve();
        };
        script.onerror = () => {
          console.error('Failed to load Angular components');
          reject();
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Angular components:', error);
        reject(error);
      }
    });
  }

  private injectUI() {
    // Inject timeline below video player
    this.injectTimeline();
    
    // Inject sidebar in secondary column
    this.injectSidebar();
  }

  private injectTimeline() {
    const player = document.querySelector('#movie_player');
    const belowPlayer = document.querySelector('#below');
    
    if (!player || !belowPlayer) {
      console.warn('Could not find player or below element');
      return;
    }

    // Create container for timeline
    const container = document.createElement('div');
    container.id = 'yt-looper-timeline-container';
    container.style.cssText = 'width: 100%; margin: 12px 0;';
    
    // Create timeline web component
    this.timelineElement = document.createElement('youtube-loop-timeline');
    container.appendChild(this.timelineElement);
    
    // Insert after player, before other content
    belowPlayer.parentNode?.insertBefore(container, belowPlayer);
    
    console.log('Timeline injected');
  }

  private injectSidebar() {
    const secondary = document.querySelector('#secondary');
    
    if (!secondary) {
      console.warn('Could not find secondary column');
      return;
    }

    // Create container for sidebar
    const container = document.createElement('div');
    container.id = 'yt-looper-sidebar-container';
    container.style.cssText = 'width: 100%; margin-bottom: 12px;';
    
    // Create sidebar web component
    this.sidebarElement = document.createElement('youtube-loop-sidebar');
    container.appendChild(this.sidebarElement);
    
    // Insert at top of secondary column
    secondary.insertBefore(container, secondary.firstChild);
    
    console.log('Sidebar injected');
  }

  private setupEventListeners() {
    // Listen to player time updates
    this.playerService.onTimeUpdate((currentTime) => {
      this.updateComponentsTime(currentTime);
      this.loopManager.checkLoop(currentTime);
      this.updateCreationMode(currentTime);
    });

    // Listen to video changes (YouTube SPA navigation)
    this.watchForVideoChanges();

    // Listen to events from Web Components
    this.listenToComponentEvents();

    // Listen to messages from background script
    this.listenToChromeMessages();
    
    // Listen to keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  private updateComponentsTime(currentTime: number) {
    if (this.timelineElement) {
      (this.timelineElement as any).currentTime = currentTime;
      (this.timelineElement as any).duration = this.playerService.getDuration();
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
    this.currentVideoId = this.getVideoId();
    
    if (!this.currentVideoId) return;
    
    console.log('Video changed to:', this.currentVideoId);
    
    // Load loops for this video
    const loops = await this.storageService.getLoops(this.currentVideoId);
    this.loopManager.setLoops(loops);
    
    // Update components
    this.syncComponentsWithLoops();
    
    // Notify background
    chrome.runtime.sendMessage({
      type: MessageType.VIDEO_CHANGED,
      payload: { videoId: this.currentVideoId }
    });
  }

  private getVideoId(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  private listenToComponentEvents() {
    // Timeline events
    if (this.timelineElement) {
      this.timelineElement.addEventListener(LOOP_EVENTS.CREATED, (e: Event) => {
        const detail = (e as CustomEvent).detail;
        this.handleLoopCreated(detail);
      });

      this.timelineElement.addEventListener(LOOP_EVENTS.ACTIVATED, (e: Event) => {
        const detail = (e as CustomEvent).detail;
        this.handleLoopActivated(detail.loopId);
      });
    }

    // Sidebar events
    if (this.sidebarElement) {
      this.sidebarElement.addEventListener(LOOP_EVENTS.ACTIVATED, (e: Event) => {
        const detail = (e as CustomEvent).detail;
        this.handleLoopActivated(detail.loopId);
      });

      this.sidebarElement.addEventListener(LOOP_EVENTS.DEACTIVATED, (e: Event) => {
        this.handleLoopDeactivated();
      });

      this.sidebarElement.addEventListener(LOOP_EVENTS.DELETED, (e: Event) => {
        const detail = (e as CustomEvent).detail;
        this.handleLoopDeleted(detail.loopId);
      });

      this.sidebarElement.addEventListener(LOOP_EVENTS.UPDATED, (e: Event) => {
        const detail = (e as CustomEvent).detail;
        this.handleLoopUpdated(detail.loop);
      });
    }
  }

  private async handleLoopCreated(detail: any) {
    if (!this.currentVideoId) return;

    const loop = this.loopManager.createLoop(
      detail.startTime,
      detail.endTime,
      detail.name || `Loop ${this.loopManager.getLoops().length + 1}`
    );

    await this.storageService.saveLoops(this.currentVideoId, this.loopManager.getLoops());
    this.syncComponentsWithLoops();

    // Notify background
    chrome.runtime.sendMessage({
      type: MessageType.LOOP_CREATED,
      payload: { videoId: this.currentVideoId, loop }
    });
  }

  private handleLoopActivated(loopId: string) {
    this.loopManager.activateLoop(loopId);
    this.syncComponentsWithLoops();

    // Notify background
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

    // Notify background
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

    // Notify background
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

    // Notify background
    chrome.runtime.sendMessage({
      type: MessageType.LOOP_UPDATED,
      payload: { videoId: this.currentVideoId, loop }
    });
  }

  private syncComponentsWithLoops() {
    const loops = this.loopManager.getLoops();
    const activeLoopId = this.loopManager.getActiveLoopId();

    if (this.timelineElement) {
      (this.timelineElement as any).loops = loops;
      (this.timelineElement as any).activeLoopId = activeLoopId;
    }

    if (this.sidebarElement) {
      (this.sidebarElement as any).loops = loops;
  private listenToChromeMessages() {
    chrome.runtime.onMessage.addListener((message: ChromeMessage) => {
      if (message.type === MessageType.LOOPS_SYNCED) {
        if (message.payload.videoId === this.currentVideoId) {
          this.loopManager.setLoops(message.payload.loops);
          this.syncComponentsWithLoops();
        }
      }
    });
  }
  
  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd + L
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        this.handleLoopCreationShortcut();
        return;
      }
      
      // Check for Escape to cancel loop creation
      if (e.key === 'Escape' && this.isCreatingLoop) {
        e.preventDefault();
        this.cancelLoopCreation();
        return;
      }
    });
  }
  
  private handleLoopCreationShortcut() {
    if (!this.isCreatingLoop) {
      // Start creation mode
      this.startLoopCreation();
    } else {
      // Finish creation mode
      this.finishLoopCreation();
    }
  }
  
  private startLoopCreation() {
    const currentTime = this.playerService.getCurrentTime();
    if (currentTime === null) return;
    
    this.isCreatingLoop = true;
    this.creationStartTime = currentTime;
    
    // Create a temporary loop
    const tempLoop = this.loopManager.createLoop(
      currentTime,
      currentTime + 1, // Initial 1 second duration
      'Creating...'
    );
    
    this.tempLoopId = tempLoop.id;
    this.syncComponentsWithLoops();
    
    console.log('Loop creation started at', currentTime);
  }
  
  private async finishLoopCreation() {
    if (!this.tempLoopId || !this.currentVideoId) return;
    
    const currentTime = this.playerService.getCurrentTime();
    if (currentTime === null) return;
    
    // Update the temporary loop with final end time and proper name
    const tempLoop = this.loopManager.getLoops().find(l => l.id === this.tempLoopId);
    if (tempLoop) {
      const loopNumber = this.loopManager.getLoops().length;
      tempLoop.name = `Loop ${loopNumber}`;
      tempLoop.endTime = currentTime;
      
      this.loopManager.updateLoop(tempLoop);
      await this.storageService.saveLoops(this.currentVideoId, this.loopManager.getLoops());
      
      // Notify background
      chrome.runtime.sendMessage({
        type: MessageType.LOOP_CREATED,
        payload: { videoId: this.currentVideoId, loop: tempLoop }
      });
    }
    
    this.isCreatingLoop = false;
    this.tempLoopId = null;
    this.syncComponentsWithLoops();
    
    console.log('Loop creation finished at', currentTime);
  }
  
  private async cancelLoopCreation() {
    if (!this.tempLoopId || !this.currentVideoId) return;
    
    // Delete the temporary loop
    this.loopManager.deleteLoop(this.tempLoopId);
    await this.storageService.saveLoops(this.currentVideoId, this.loopManager.getLoops());
    
    this.isCreatingLoop = false;
    this.tempLoopId = null;
    this.syncComponentsWithLoops();
    
    console.log('Loop creation cancelled');
  }
  
  private updateCreationMode(currentTime: number) {
    if (!this.isCreatingLoop || !this.tempLoopId) return;
    
    // Update the temporary loop's end time as video plays
    const tempLoop = this.loopManager.getLoops().find(l => l.id === this.tempLoopId);
    if (tempLoop && currentTime > this.creationStartTime) {
      tempLoop.endTime = currentTime;
      this.loopManager.updateLoop(tempLoop);
      this.syncComponentsWithLoops();
    }
  }
}

// Initialize the app
const app = new YouTubeLooperApp();
}

// Initialize the app
const app = new YouTubeLooperApp();
