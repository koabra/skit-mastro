import { useState, useEffect } from 'react';
import { Reorder, useDragControls, DragControls } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical, FileText, User, X, Check, Edit2, FileDown } from 'lucide-react';
import type { Scene, ScriptItem } from '../types';
import { ScriptItemRow } from './ScriptItemRow';
import { useScriptStore } from '../stores/scriptStore';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { parseScriptText } from '../utils/scriptParser';
import { generateReportHtml } from '../utils/reportGenerator';
import { getSceneDuration, formatDuration } from '../utils/timeUtils';

interface SceneControllerProps {
  scene: Scene;
  isActiveContext: (itemId: string) => boolean;
  isSelectedContext: (itemId: string) => boolean;
  onSelectItem: (itemId: string | null) => void;
  dragControls: DragControls;
}

function SceneCast({ items }: { items: ScriptItem[] }) {
    const { actors, addActor, updateActor, deleteActor } = useScriptStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [tempName, setTempName] = useState('');

    const involvedNames = new Set(items.map(i => i.character).filter(Boolean));
    const involvedActors = actors.filter(a => involvedNames.has(a.name));
    const otherActors = actors.filter(a => !involvedNames.has(a.name));

    const handleAdd = () => {
        if (newName.trim()) {
            addActor(newName.trim());
            setNewName('');
            setIsAdding(false);
        }
    };

    const handleSaveEdit = (id: string) => {
        if (tempName.trim()) {
            updateActor(id, { name: tempName.trim() });
            setEditingId(null);
        }
    };

    return (
        <div className="mb-4 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <User size={12} /> 
                Cast
            </div>
            
            <div className="flex flex-wrap gap-2">
                {involvedActors.map(actor => (
                    <div key={actor.id} className="relative group/actor">
                        {editingId === actor.id ? (
                             <div className="flex items-center gap-1 bg-brand-900/50 border border-brand-500 rounded-lg px-2 py-1">
                                <input 
                                    autoFocus
                                    value={tempName}
                                    onChange={e => setTempName(e.target.value)}
                                    className="bg-transparent text-xs text-brand-100 outline-none w-20"
                                />
                                <button onClick={() => handleSaveEdit(actor.id)} className="text-green-400 hover:text-green-300"><Check size={12} /></button>
                                <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white"><X size={12} /></button>
                             </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-200 px-3 py-1.5 rounded-full text-xs font-medium cursor-default">
                                {actor.name}
                                <div className="flex items-center gap-1 pl-2 border-l border-brand-500/20 opacity-0 group-hover/actor:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => { setEditingId(actor.id); setTempName(actor.name); }}
                                        className="hover:text-white"
                                    >
                                        <Edit2 size={10} />
                                    </button>
                                    <button 
                                        onClick={() => deleteActor(actor.id)}
                                        className="hover:text-red-400"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                 {otherActors.map(actor => (
                    <div key={actor.id} className="relative group/actor">
                        {editingId === actor.id ? (
                             <div className="flex items-center gap-1 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1">
                                <input 
                                    autoFocus
                                    value={tempName}
                                    onChange={e => setTempName(e.target.value)}
                                    className="bg-transparent text-xs text-white outline-none w-20"
                                />
                                <button onClick={() => handleSaveEdit(actor.id)} className="text-green-400 hover:text-green-300"><Check size={12} /></button>
                                <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white"><X size={12} /></button>
                             </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-slate-800/50 border border-white/5 text-slate-400 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-slate-800 transition-colors">
                                {actor.name}
                                <div className="flex items-center gap-1 pl-2 border-l border-white/10 opacity-0 group-hover/actor:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => { setEditingId(actor.id); setTempName(actor.name); }}
                                        className="hover:text-white"
                                    >
                                        <Edit2 size={10} />
                                    </button>
                                    <button 
                                        onClick={() => deleteActor(actor.id)}
                                        className="hover:text-red-400"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isAdding ? (
                    <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1">
                        <input 
                            autoFocus
                            placeholder="Name"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            className="bg-transparent text-xs text-white outline-none w-20 placeholder-white/30"
                        />
                        <button onClick={handleAdd} className="text-green-400 hover:text-green-300"><Check size={12} /></button>
                        <button onClick={() => { setIsAdding(false); setNewName(''); }} className="text-slate-400 hover:text-white"><X size={12} /></button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs border border-dashed border-white/10 transition-colors"
                    >
                        <Plus size={12} />
                        Add Actor
                    </button>
                )}
            </div>
        </div>
    );
}

// Wrapper component to handle drag controls for each item
function SortableItem({ item, isActive, isSelected, onSelect, onUpdate, onDelete, onInsertAfter }: { 
    item: ScriptItem, 
    isActive: boolean, 
    isSelected: boolean,
    onSelect: () => void,
    onUpdate: (id: string, updates: Partial<ScriptItem>) => void, 
    onDelete: (id: string) => void,
    onInsertAfter: (type: ScriptItem['type']) => void
}) {
    const dragControls = useDragControls();
    
    return (
        <Reorder.Item 
            value={item} 
            key={item.id}
            dragListener={false} 
            dragControls={dragControls}
            className="relative"
        >
             <ScriptItemRow 
                item={item}
                isActive={isActive}
                isSelected={isSelected}
                onSelect={onSelect}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onInsertAfter={onInsertAfter}
                dragControls={dragControls}
             />
        </Reorder.Item>
    );
}

export function SceneController({ scene, isActiveContext, isSelectedContext, onSelectItem, dragControls }: SceneControllerProps) {
  const { updateScene, deleteScene, addItemToScene, addItemsToScene, insertItemAt, reorderItemsInScene, updateItem, deleteItem, addActor, actors } = useScriptStore();
  const [items, setItems] = useState(scene.items);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  // Sync local state when prop changes, but only if IDs mismatch (avoid disrupting active drag if possible)
  // Actually, simplest is to just sync. But if store update is delayed, we don't want to revert.
  // Framer Motion usually handles "value" updates fine if they match the optimistic state.
  useEffect(() => {
      setItems(scene.items);
  }, [scene.items]);

  const sceneDuration = getSceneDuration(scene);
  
  const handleReorder = (newItems: ScriptItem[]) => {
    setItems(newItems); // Optimistic update
    reorderItemsInScene(scene.id, newItems);
  };

  const handleMassImport = () => {
      if (!importText.trim()) return;
      const { items: newItems, actors: newActorNames } = parseScriptText(importText);
      
      if (newItems.length === 0) return;

      // Add new actors
      newActorNames.forEach(name => {
          if (!actors.find(a => a.name.toLowerCase() === name.toLowerCase())) {
              addActor(name);
          }
      });

      // Add items to scene one by one (or could batch if we added batch support to store)
      // Since our store is now improved, batching is ideal but iteratively is fine for now or we create a batch action?
      // Actually, we can just append to local items and call reorder/update or add them.
      // Let's use a batch update to scene items to be efficient.
      // Let's use a batch update to scene items to be efficient.
      addItemsToScene(scene.id, newItems);
      
      setImportText('');
      setShowImport(false);
  };

  const toggleExpand = () => {
    updateScene(scene.id, { isExpanded: !scene.isExpanded });
  };
  
  const handleDragStart = (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragControls.start(e);
  };

  return (
    <div className="space-y-4">
      {/* Scene Header */}
      <div className="group flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
        {/* Drag Handle */}
        <div 
            onPointerDown={handleDragStart}
            className="mt-1 cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 touch-none"
        >
            <GripVertical size={20} />
        </div>

        <button 
            onClick={toggleExpand}
            className="mt-1 p-1 hover:bg-white/10 rounded transition-colors text-slate-400"
        >
            {scene.isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
                <input 
                    value={scene.title}
                    onChange={(e) => updateScene(scene.id, { title: e.target.value })}
                    className="bg-transparent text-xl font-bold text-white placeholder-white/20 outline-none w-full"
                    placeholder="Scene Title"
                />
                <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-1 rounded-md">
                    {formatDuration(sceneDuration)}
                </span>
            </div>
            <AutoResizeTextarea 
                value={scene.description}
                onChange={(e) => updateScene(scene.id, { description: e.target.value })}
                className="bg-transparent text-slate-400 text-sm w-full outline-none"
                placeholder="Scene description..."
            />
        </div>

        <button 
           onClick={() => deleteScene(scene.id)}
           className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all hover:bg-red-500/10 rounded-lg"
           title="Delete Scene"
        >
            <Trash2 size={18} />
        </button>
      </div>

      {scene.isExpanded && (
        <div className="pl-4 md:pl-8 space-y-4 border-l border-white/5 ml-4">
            <SceneCast items={items} />
            <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-3">
                {items.map((localItem) => {
                   // Use the latest item data from props to ensure text inputs don't lose focus/cursor position
                   // due to the delay in useEffect syncing the local state.
                   const item = scene.items.find(i => i.id === localItem.id) || localItem;
                   
                   return (
                   <SortableItem 
                      key={item.id}
                      item={item}
                      isActive={isActiveContext(item.id)}
                      isSelected={isSelectedContext(item.id)}
                      onSelect={() => onSelectItem(item.id)}
                      onUpdate={(id, updates) => updateItem(scene.id, id, updates)}
                      onDelete={(id) => deleteItem(scene.id, id)}
                      onInsertAfter={(type) => {
                          const index = items.findIndex(i => i.id === item.id);
                          if (index !== -1) {
                              insertItemAt(scene.id, index + 1, { 
                                  id: crypto.randomUUID(), 
                                  type, 
                                  character: type === 'dialogue' ? '' : undefined,
                                  text: '',
                                  duration: type === 'pause' ? 2 : undefined
                              });
                          }
                      }}
                   />
                   );
                })}
            </Reorder.Group>

            {/* Mass Import Area */}
            {showImport && (
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                    <AutoResizeTextarea 
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder="Paste script here (Character: Dialogue)..."
                        className="w-full bg-black/20 p-3 rounded-lg text-sm text-slate-300 outline-none border border-white/5 focus:border-brand-500/50"
                    />
                    <div className="flex justify-end gap-2">
                         <button 
                            onClick={() => setShowImport(false)}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleMassImport}
                            disabled={!importText.trim()}
                            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                            Import Items
                        </button>
                    </div>
                </div>
            )}

            {/* Scene Actions */}
            {!showImport && (
                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={() => addItemToScene(scene.id, { id: crypto.randomUUID(), type: 'dialogue', character: '', text: '' })}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors border border-dashed border-white/10"
                    >
                        <Plus size={14} />
                        Add Dialogue
                    </button>
                    <button 
                        onClick={() => addItemToScene(scene.id, { id: crypto.randomUUID(), type: 'insight', text: '' })}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors border border-dashed border-white/10"
                    >
                        <FileText size={14} />
                        Add Insight
                    </button>
                    <button 
                        onClick={() => addItemToScene(scene.id, { id: crypto.randomUUID(), type: 'pause', duration: 2 })}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors border border-dashed border-white/10"
                    >
                        <Plus size={14} />
                        Add Pause
                    </button>
                     <button 
                        onClick={() => setShowImport(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-brand-300 text-sm transition-colors border border-dashed border-brand-500/20"
                    >
                        <FileText size={14} />
                        Import Script
                    </button>
                    <button 
                        onClick={() => {
                            const html = generateReportHtml([scene], actors, scene.title);
                            const blob = new Blob([html], { type: 'text/html' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${scene.title.replace(/\s+/g, '_')}_Report.html`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-300 text-sm transition-colors border border-dashed border-emerald-500/20"
                    >
                        <FileDown size={14} />
                        Export Scene
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
