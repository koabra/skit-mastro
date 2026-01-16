import type { ScriptItem } from '../types';

export class AudioSequencer {
  private items: ScriptItem[];
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;
  private onProgress: (index: number) => void;
  private onComplete: () => void;
  private stopRequested: boolean = false;

  constructor(items: ScriptItem[], onProgress: (index: number) => void, onComplete: () => void) {
    this.items = items;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
  }

  public async play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.stopRequested = false;
    this.currentIndex = 0;
    this.processQueue();
  }

  public stop() {
    this.stopRequested = true;
    this.isPlaying = false;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  private async processQueue() {
    if (this.stopRequested) return;

    if (this.currentIndex >= this.items.length) {
      this.isPlaying = false;
      this.onComplete();
      return;
    }

    const item = this.items[this.currentIndex];
    this.onProgress(this.currentIndex);

    if (item.type === 'pause') {
      const duration = (item.duration || 0) * 1000;
      setTimeout(() => {
        this.next();
      }, duration);
    } else {
      // Dialogue
      if (item.audioUrl) {
        await this.playAudio(item.audioUrl);
      } else {
         // If no audio, skip immediately (or maybe add a small gap?)
         // Let's add a tiny gap to visualize it skipping
         setTimeout(() => {
             this.next();
         }, 500);
      }
    }
  }

  private playAudio(url: string): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      this.currentAudio = audio;
      audio.onended = () => {
        resolve();
        this.next();
      };
      // Handle errors (e.g. file not found) by skipping
      audio.onerror = () => {
          console.error("Audio error", url);
          resolve(); 
          this.next();
      }
      audio.play().catch(e => {
        console.error("Play error", e);
        resolve();
        this.next();
      });
    });
  }

  private next() {
    this.currentIndex++;
    this.processQueue();
  }
}
