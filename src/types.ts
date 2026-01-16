export type ScriptItemType = 'dialogue' | 'pause' | 'insight';

export interface Actor {
  id: string;
  name: string;
  color: string;
}

export interface AudioMetadata {
  fileName: string;
  fileSize: number;
  duration: number;
  mimeType: string;
}

export interface ScriptItem {
  id: string;
  type: ScriptItemType;
  character?: string; // Kept for backward compat or manual override
  actorId?: string; // Link to Actor
  text?: string; // For dialogue
  duration?: number; // For pause (in seconds)
  audioBlob?: Blob; // The actual audio data
  audioUrl?: string; // URL for playback
  audioMetadata?: AudioMetadata;
  isRecording?: boolean;
  displayId?: number; // Persistent unique ID for dialogues (e.g. 1, 2, 3...)
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  background?: string;
  items: ScriptItem[];
  isExpanded?: boolean; // For UI state
}

export interface ProjectState {
  scenes: Scene[];
  actors: Actor[];
  projectName: string;
  nextDialogueId?: number; // Global counter for dialogue IDs
}
