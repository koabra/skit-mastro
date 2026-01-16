import { useState } from 'react';
import { useScriptStore } from '../stores/scriptStore';
import { FileText, Plus } from 'lucide-react';


import { parseScriptText } from '../utils/scriptParser';

export function MassImport() {
  const [text, setText] = useState('');
  const { addScene, actors, addActor } = useScriptStore();

  const handleImport = () => {
    if (!text.trim()) return;

    const { items: newItems, actors: newActors } = parseScriptText(text);

    if (newItems.length === 0) return;

    // Process Actors
    newActors.forEach(charName => {
        const existing = actors.find(a => a.name.toLowerCase() === charName.toLowerCase());
        if (!existing) {
             addActor(charName);
        }
    });

    addScene('Imported Scene', 'Created from mass import', newItems);
    setText('');
    alert('Scene imported successfully!');
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <FileText size={20} />
            </div>
             <h3 className="text-xl font-bold">Import Script</h3>
        </div>
      
      <textarea
        className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono text-slate-300 focus:border-brand-500 outline-none resize-none"
        placeholder={`Paste your script here...\n\nBatman: Where is she?\nJoker: You have nothing to threaten me with.`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      
      <button 
        onClick={handleImport}
        disabled={!text.trim()}
        className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition-all w-full justify-center"
      >
        <Plus size={20} />
        Process & Create Scene
      </button>

      <p className="text-xs text-slate-500 text-center">
        Automatically detects characters and creates a new scene.
      </p>
    </div>
  );
}
