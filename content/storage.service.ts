import { Loop } from '../shared/types';

export class StorageService {
  
  public async getLoops(videoId: string): Promise<Loop[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get([videoId], (result) => {
        resolve(result[videoId] || []);
      });
    });
  }

  public async saveLoops(videoId: string, loops: Loop[]): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [videoId]: loops }, () => {
        console.log(`Saved ${loops.length} loops for video ${videoId}`);
        resolve();
      });
    });
  }

  public async deleteLoops(videoId: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove([videoId], () => {
        console.log(`Deleted loops for video ${videoId}`);
        resolve();
      });
    });
  }

  public async getAllVideoIds(): Promise<string[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (items) => {
        resolve(Object.keys(items));
      });
    });
  }
}
