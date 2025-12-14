export interface Loop {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  color: string;
  createdAt: number;
  pauseDuration?: number; // Optional pause in seconds between loop repeats
}
