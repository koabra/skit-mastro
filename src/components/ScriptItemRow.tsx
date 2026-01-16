import { useRef, useState } from 'react';
import type { ScriptItem, AudioMetadata } from '../types';
import { Trash2, Upload, Mic, Clock, GripVertical, FileText, ChevronDown, ChevronRight, Music, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { DragControls } from 'framer-motion';
import { useScriptStore } from '../stores/scriptStore';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { AudioPlayer } from './AudioPlayer';

interface ScriptItemRowProps {
  item: ScriptItem;
  isActive: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<ScriptItem>) => void;
  onDelete: (id: string) => void;
  onInsertAfter: (type: ScriptItem['type']) => void;
  dragControls: DragControls;
}

export function ScriptItemRow({ item, isActive, isSelected, onSelect, onUpdate, onDelete, onInsertAfter, dragControls }: ScriptItemRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { actors } = useScriptStore();
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      // Create temporary audio element to get duration
      const tempAudio = new Audio(url);
      tempAudio.addEventListener('loadedmetadata', () => {
        const metadata: AudioMetadata = {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          duration: tempAudio.duration
        };
        
        onUpdate(item.id, { 
          audioBlob: file, 
          audioUrl: url,
          audioMetadata: metadata 
        });
        setIsPlayerExpanded(true);
      });
    }
  };

  const handleDeleteAudio = () => {
    if (item.audioUrl) {
        URL.revokeObjectURL(item.audioUrl);
    }
    onUpdate(item.id, { 
        audioBlob: undefined, 
        audioUrl: undefined,
        audioMetadata: undefined 
    });
  };

  const hasAudio = !!item.audioUrl;

  return (
    <div 
      onClick={onSelect}
      className={clsx(
        "group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-300",
        isActive 
          ? "bg-brand-500/20 border-brand-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-[1.02] z-20 ring-1 ring-brand-500" 
          : isSelected
            ? "bg-slate-800 border-brand-500/50 shadow-lg scale-[1.01] z-10"
            : "bg-slate-900/50 border-white/10 hover:border-white/20 hover:bg-slate-800/50"
      )}
    >
      {/* Drag Handle */}
      <div 
        onPointerDown={(e) => {
             e.preventDefault();
             e.stopPropagation();
             dragControls.start(e);
        }}
        className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 touch-none mt-2"
      >
        <GripVertical size={18} />
      </div>
      {/* Status Light */}
      {item.type === 'dialogue' && (
        <div className="flex-shrink-0 mt-3">
          <div className={clsx(
            "w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-500",
            hasAudio ? "bg-green-500 text-green-500" : "bg-red-500 text-red-500 animate-pulse"
          )} />
        </div>
      )}

      {/* Type Icon & ID */}
      <div className="flex flex-col items-center gap-1 mt-2">
        {item.type === 'dialogue' && item.displayId && (
            <span className="text-[10px] font-mono font-bold text-slate-600 select-none">
                #{item.displayId}
            </span>
        )}
        <div className="text-slate-400">
            {item.type === 'dialogue' && <Mic size={20} />}
            {item.type === 'pause' && <Clock size={20} />}
            {item.type === 'insight' && <FileText size={20} />}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 grid grid-cols-[auto_1fr] gap-4 items-start">
        {item.type === 'dialogue' && (
          <>
            <div className="relative pt-1">
                <select 
                    value={item.character || ''} 
                    onChange={(e) => onUpdate(item.id, { character: e.target.value })}
                    className={clsx(
                        "bg-transparent border-b outline-none font-medium w-32 py-1 appearance-none cursor-pointer transition-colors",
                         !item.character 
                            ? "border-red-500 text-red-400 placeholder-red-500/50 animate-pulse bg-red-500/10 rounded px-1" 
                            : "border-white/10 text-slate-300 focus:border-brand-500"
                    )}
                >
                    <option value="" disabled className="bg-slate-900 text-slate-500">Select Character</option>
                    {actors.map(actor => (
                        <option key={actor.id} value={actor.name} className="bg-slate-900 text-slate-300">
                            {actor.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="w-full space-y-2">
                <AutoResizeTextarea 
                value={item.text || ''} 
                onChange={(e) => onUpdate(item.id, { text: e.target.value })}
                placeholder="Dialogue text..."
                className="bg-transparent border-b border-white/10 focus:border-brand-500 outline-none text-white py-1 w-full min-h-[2.5rem] leading-relaxed"
                />
                
                {hasAudio && (
                    <div className="mt-2" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setIsPlayerExpanded(!isPlayerExpanded)}
                                className="flex items-center gap-2 text-xs font-medium text-brand-300 hover:text-brand-200"
                            >
                                {isPlayerExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                {isPlayerExpanded ? 'Hide Audio' : 'Show Audio'}
                            </button>
                            {!isPlayerExpanded && (
                                <div className="flex items-center gap-2 ml-2 text-xs text-slate-500">
                                    <Music size={12} />
                                    <span className="truncate max-w-[150px]">{item.audioMetadata?.fileName || 'Audio File'}</span>
                                </div>
                            )}
                        </div>
                        {isPlayerExpanded && (
                            <AudioPlayer 
                                src={item.audioUrl!} 
                                metadata={item.audioMetadata}
                                onDelete={handleDeleteAudio}
                            />
                        )}
                    </div>
                )}
            </div>
          </>
        )}
        
        {item.type === 'pause' && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-slate-400">Delay (seconds):</span>
            <input 
              type="number" 
              value={item.duration || 0} 
              onChange={(e) => onUpdate(item.id, { duration: parseFloat(e.target.value) })}
              className="bg-slate-950 border border-white/10 rounded px-2 py-1 w-20 text-center"
            />
          </div>
        )}

        {item.type === 'insight' && (
             <AutoResizeTextarea 
                value={item.text || ''}
                onChange={(e) => onUpdate(item.id, { text: e.target.value })}
                placeholder="Describe the scene or add a note..."
                className="bg-transparent border-b border-white/10 focus:border-cyan-500 outline-none text-cyan-200/80 italic py-1 w-full pt-1"
            />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity mt-2">
        {item.type === 'dialogue' && !hasAudio && (
          <>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Upload Audio"
            >
              <Upload size={18} />
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="audio/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </>
        )}
        
        <button 
          onClick={() => onDelete(item.id)}
          className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-slate-500 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

       {/* Insert Buttons (Visible on Hover) */}
       <div className="absolute -bottom-3 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30 translate-y-2 group-hover:translate-y-0">
            <button 
                onClick={(e) => { e.stopPropagation(); onInsertAfter('dialogue'); }}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-[10px] shadow-lg font-bold"
                title="Add Dialogue Below"
            >
                <Plus size={10} />
                Dialogue
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onInsertAfter('insight'); }}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] shadow-lg font-bold"
                title="Add Insight Below"
            >
                <Plus size={10} />
                Insight
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onInsertAfter('pause'); }}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] shadow-lg font-bold"
                title="Add Pause Below"
            >
                <Plus size={10} />
                Pause
            </button>
       </div>
    </div>
  );
}
