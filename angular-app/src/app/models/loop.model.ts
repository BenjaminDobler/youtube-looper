export interface Loop {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  color: string;
  createdAt: number;
  pauseDuration?: number; // Optional pause in seconds between loop repeats
  playbackSpeed?: number; // Optional playback speed (default 1.0, range 0.25-2.0)
  pitchShift?: number; // Optional pitch shift in semitones (e.g., +2, -3)
}
