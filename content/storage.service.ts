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
        resolve();
      });
    });
  }

  public async deleteLoops(videoId: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove([videoId], () => {
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
