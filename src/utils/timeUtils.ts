import type { Scene, ScriptItem } from '../types';

export const getItemDuration = (item: ScriptItem): number => {
  if (item.type === 'pause') {
    return item.duration || 0;
  }
  if (item.type === 'dialogue') {
    return item.audioMetadata?.duration || 0;
  }
  return 0;
};

export const getSceneDuration = (scene: Scene): number => {
  return scene.items.reduce((total, item) => total + getItemDuration(item), 0);
};

export const getTotalDuration = (scenes: Scene[]): number => {
  return scenes.reduce((total, scene) => total + getSceneDuration(scene), 0);
};

export const formatDuration = (seconds: number): string => {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};
