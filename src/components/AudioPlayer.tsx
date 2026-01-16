import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Trash2, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import type { AudioMetadata } from '../types';


interface AudioPlayerProps {
  src: string;
  metadata?: AudioMetadata;
  onDelete: () => void;
}

export function AudioPlayer({ src, metadata, onDelete }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(metadata?.duration || 0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="mt-4 bg-slate-900/40 rounded-lg p-3 border border-white/5 space-y-3">
      <audio ref={audioRef} src={src} className="hidden" />
      
      {/* Metadata Header */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex gap-4">
            <span className="font-medium text-slate-300 truncate max-w-[200px]" title={metadata?.fileName || 'Unknown file'}>
              {metadata?.fileName || 'Unknown file'}
            </span>
            {metadata?.fileSize && (
                <span className="opacity-70">{formatFileSize(metadata.fileSize)}</span>
            )}
        </div>
        <button 
          onClick={onDelete}
          className="text-red-400/70 hover:text-red-400 transition-colors flex items-center gap-1"
        >
          <Trash2 size={12} />
          <span>Remove Audio</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="relative group">
         <div 
            className="absolute top-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full pointer-events-none"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
         />
        <input 
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-slate-700/50 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 transition-all"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
           <span>{formatTime(currentTime)}</span>
           <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
         <button 
            onClick={() => {
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    setCurrentTime(0);
                }
            }}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
         >
            <RotateCcw size={14} />
         </button>

         <button 
            onClick={togglePlay}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-900 hover:scale-105 active:scale-95 transition-all"
         >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5"/>}
         </button>

         <button 
            onClick={toggleMute}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
         >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
         </button>
      </div>
    </div>
  );
}
