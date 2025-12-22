import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { Loop } from '../../models/loop.model';
import { IconComponent } from '../../shared/icon.component';
import { VideoCardComponent } from '../video-card/video-card.component';

interface VideoMetadata {
  videoId: string;
  title: string;
  thumbnail: string;
}

interface VideoData {
  metadata: VideoMetadata;
  loops: Loop[];
}

interface VideoWithLoops {
  videoId: string;
  title: string;
  loops: Loop[];
  thumbnail: string;
}

@Component({
  selector: 'library-tab',
  imports: [IconComponent, VideoCardComponent],
  templateUrl: './library-tab.component.html',
  styleUrls: ['./library-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryTabComponent implements OnInit {
  protected allVideos = signal<VideoWithLoops[]>([]);
  protected isLoadingVideos = signal<boolean>(false);

  ngOnInit() {
    this.loadVideoLibrary();
  }

  async loadVideoLibrary() {
    this.isLoadingVideos.set(true);
    
    try {
      const videoIds = await this.getAllVideoIdsFromStorage();
      
      const videos: VideoWithLoops[] = [];
      for (const videoId of videoIds) {
        const videoData = await this.getVideoDataFromStorage(videoId);
        if (videoData.loops.length > 0) {
          videos.push({
            videoId,
            title: videoData.metadata.title,
            loops: videoData.loops,
            thumbnail: videoData.metadata.thumbnail
          });
        }
      }
      
      this.allVideos.set(videos);
    } catch (error) {
      console.error('Error loading video library:', error);
    } finally {
      this.isLoadingVideos.set(false);
    }
  }

  onVideoClick(videoId: string) {
    window.location.href = `https://www.youtube.com/watch?v=${videoId}`;
  }

  async onDeleteVideoLoops(videoId: string) {
    const video = this.allVideos().find(v => v.videoId === videoId);
    if (!video) return;
    
    if (confirm(`Delete all ${video.loops.length} loops for this video?`)) {
      try {
        await this.deleteLoopsFromStorage(videoId);
        await this.loadVideoLibrary();
      } catch (error) {
        console.error('Error deleting video loops:', error);
      }
    }
  }

  private getAllVideoIdsFromStorage(): Promise<string[]> {
    return new Promise((resolve) => {
      const videoIds: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('loops_')) {
          videoIds.push(key.replace('loops_', ''));
        }
      }
      resolve(videoIds);
    });
  }
  
  private getVideoDataFromStorage(videoId: string): Promise<VideoData> {
    return new Promise((resolve) => {
      const key = `loops_${videoId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (Array.isArray(data)) {
            resolve({
              metadata: {
                videoId,
                title: `Video: ${videoId}`,
                thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
              },
              loops: data
            });
          } else {
            resolve(data);
          }
        } catch (error) {
          resolve({
            metadata: {
              videoId,
              title: `Video: ${videoId}`,
              thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
            },
            loops: []
          });
        }
      } else {
        resolve({
          metadata: {
            videoId,
            title: `Video: ${videoId}`,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
          },
          loops: []
        });
      }
    });
  }
  
  private deleteLoopsFromStorage(videoId: string): Promise<void> {
    return new Promise((resolve) => {
      const key = `loops_${videoId}`;
      localStorage.removeItem(key);
      resolve();
    });
  }
}
