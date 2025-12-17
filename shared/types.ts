export interface Loop {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  color: string;
  createdAt: number;
  pauseDuration?: number;
  playbackSpeed?: number;
  pitchShift?: number;
}

export enum MessageType {
  // Loop CRUD operations
  LOOP_CREATED = 'LOOP_CREATED',
  LOOP_UPDATED = 'LOOP_UPDATED',
  LOOP_DELETED = 'LOOP_DELETED',
  
  // Playback control
  LOOP_ACTIVATED = 'LOOP_ACTIVATED',
  LOOP_DEACTIVATED = 'LOOP_DEACTIVATED',
  
  // Sync
  LOOPS_SYNCED = 'LOOPS_SYNCED',
  GET_LOOPS = 'GET_LOOPS',
  
  // Player state
  VIDEO_TIME_UPDATE = 'VIDEO_TIME_UPDATE',
  VIDEO_CHANGED = 'VIDEO_CHANGED'
}

export interface ChromeMessage {
  type: MessageType;
  payload?: any;
}

export interface LoopEventDetail {
  loop?: Loop;
  loopId?: string;
  startTime?: number;
  endTime?: number;
  name?: string;
}

// Custom events from Web Components
export const LOOP_EVENTS = {
  CREATED: 'loop-created',
  UPDATED: 'loop-updated',
  DELETED: 'loop-deleted',
  ACTIVATED: 'loop-activated',
  DEACTIVATED: 'loop-deactivated',
  EDIT_REQUESTED: 'loop-edit-requested'
} as const;
