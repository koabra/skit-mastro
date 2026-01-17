import { useState, useRef, useMemo } from 'react';
import { useScriptStore } from './stores/scriptStore';
import { SceneController } from './components/SceneController';
import { MassImport } from './components/MassImport';
import { AudioSequencer } from './utils/audioSequencer';
import { Play, Square, Music, Clapperboard, Layers, FileDown } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import type { Scene } from './types';
import { generateReportHtml } from './utils/reportGenerator';
import { exportProjectToZip, importProjectFromZip } from './utils/projectPersistence';
import { getTotalDuration, formatDuration } from './utils/timeUtils';

// Wrapper for Scene Dragging
function SortableScene({ scene, isActiveContext, isSelectedContext, onSelectItem }: { 
    scene: Scene, 
    isActiveContext: (id: string) => boolean,
    isSelectedContext: (id: string) => boolean,
    onSelectItem: (id: string | null) => void
}) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item 
            value={scene} 
            dragListener={false} 
            dragControls={dragControls}
            className="relative"
        >
            <SceneController 
                scene={scene}
                isActiveContext={isActiveContext}
                isSelectedContext={isSelectedContext}
                onSelectItem={onSelectItem}
                dragControls={dragControls}
            />
        </Reorder.Item>
    );
}

function App() {
  const { scenes, addScene, reorderScenes, actors, projectName, loadProjectState } = useScriptStore();
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const sequencerRef = useRef<AudioSequencer | null>(null);
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden file input

  const flattenItems = useMemo(() => scenes.flatMap(s => s.items), [scenes]);
  const totalDuration = useMemo(() => getTotalDuration(scenes), [scenes]);

  const handleMasterPlay = () => {
    if (playingItemId) {
      sequencerRef.current?.stop();
      setPlayingItemId(null);
      return;
    }

    // Determine start index based on selection
    let startIndex = 0;
    if (selectedItemId) {
        const index = flattenItems.findIndex(i => i.id === selectedItemId);
        if (index !== -1) startIndex = index;
    }

    // Play all items from all scenes starting from selection
    const sequencer = new AudioSequencer(
      flattenItems.slice(startIndex),
      (index) => {
        // Adjust index because we sliced the array
        const item = flattenItems[startIndex + index];
        if (item) setPlayingItemId(item.id);
      },
      () => setPlayingItemId(null)
    );
    sequencerRef.current = sequencer;
    sequencer.play();
  };

  const handleStop = () => {
      sequencerRef.current?.stop();
      setPlayingItemId(null);
  }

  const handleExport = () => {
      const html = generateReportHtml(scenes, actors, projectName);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, '_')}_Report.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleSaveProject = async () => {
      const blob = await exportProjectToZip({ scenes, actors, projectName });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, '_')}.skit`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleLoadProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
          const newState = await importProjectFromZip(file);
          loadProjectState(newState);
          // Optional: Reset file input value so same file can be loaded again if needed
          if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
          console.error("Failed to load project:", error);
          alert("Failed to load project. Please ensure it is a valid .skit file.");
      }
  };

  const triggerLoad = () => fileInputRef.current?.click();

  // Helper to find if an item is active
  const isItemActive = (id: string) => playingItemId === id;
  const isItemSelected = (id: string) => selectedItemId === id;
  const handleSelectItem = (id: string | null) => setSelectedItemId(id);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white p-4 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row gap-4 items-center justify-between backdrop-blur-xl bg-white/5 p-6 rounded-2xl border border-white/10 sticky top-4 z-50 shadow-2xl">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                    <Music className="text-white" size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        SkitMastro
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span>{scenes.length} Scenes</span>
                        <span>•</span>
                        <span>{flattenItems.length} Blocks</span>
                        <span>•</span>
                        <span>{actors.length} Actors</span>
                        <span>•</span>
                        <span className="text-brand-400 font-bold">{formatDuration(totalDuration)}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
                    <button 
                        onClick={handleSaveProject}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700 transition-all rounded-lg font-medium text-xs text-slate-300"
                        title="Save Project (Backup)"
                    >
                        <FileDown size={14} />
                        Save Project
                    </button>
                    <div className="w-px bg-slate-700 my-1"></div>
                    <button 
                        onClick={triggerLoad}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700 transition-all rounded-lg font-medium text-xs text-slate-300"
                        title="Load Project"
                    >
                        <Layers size={14} />
                        Load Project
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleLoadProject} 
                        accept=".skit,.zip" 
                        className="hidden" 
                    />
                </div>

                 <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 transition-all rounded-xl font-medium text-sm text-slate-300"
                    title="Export Status Report"
                >
                    <FileDown size={18} />
                    Report
                </button>

                 <button 
                    onClick={() => setShowImport(!showImport)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 transition-all rounded-xl font-medium text-sm text-slate-300"
                >
                    <Layers size={18} />
                    {showImport ? 'Hide Import' : 'Mass Import'}
                </button>

                {playingItemId === null ? (
                    <button 
                        onClick={handleMasterPlay}
                        disabled={flattenItems.length === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xl font-bold shadow-lg shadow-brand-600/20"
                    >
                        <Play size={20} fill="currentColor" />
                        Master Play
                    </button>
                ) : (
                    <button 
                         onClick={handleStop}
                         className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition-all rounded-xl font-bold animate-pulse"
                    >
                        <Square size={20} fill="currentColor" />
                        Stop
                    </button>
                )}
            </div>
        </header>

        {/* Mass Import Section */}
        {showImport && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <MassImport />
            </div>
        )}

        {/* Scenes List */}
        <div className="space-y-6">
            <Reorder.Group axis="y" values={scenes} onReorder={reorderScenes} className="space-y-6">
                {scenes.map((scene) => (
                    <SortableScene 
                        key={scene.id} 
                        scene={scene}
                        isActiveContext={isItemActive}
                        isSelectedContext={isItemSelected}
                        onSelectItem={handleSelectItem}
                    />
                ))}
            </Reorder.Group>

            {scenes.length === 0 && !showImport && (
                <div className="text-center py-20 text-slate-500 border-2 border-dashed border-white/5 rounded-2xl">
                    <p>No scenes yet. Add a scene or use Mass Import!</p>
                </div>
            )}
        </div>

        {/* Add Scene Button (Floating or Bottom) */}
        <div className="flex justify-center pt-8">
            <button 
                onClick={() => addScene()}
                className="flex items-center gap-2 px-8 py-4 rounded-full bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 border border-white/10"
            >
                <Clapperboard size={20} />
                <span className="font-bold">Add New Scene</span>
            </button>
        </div>

      </div>
    </div>
  );
}

export default App;
