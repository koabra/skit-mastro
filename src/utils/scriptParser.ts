import type { ScriptItem } from '../types';

export function parseScriptText(text: string): { items: ScriptItem[], actors: Set<string> } {
    const lines = text.split('\n');
    const newItems: ScriptItem[] = [];
    const newActors = new Set<string>();

    lines.forEach(line => {
        if (!line.trim()) return;
        
        // Simple regex for "Character: Dialogue"
        const match = line.match(/^([^:]+):\s*(.+)$/);
        
        if (match) {
            const charName = match[1].trim();
            const dialogue = match[2].trim();
            
            newActors.add(charName);
            
            newItems.push({
                id: crypto.randomUUID(),
                type: 'dialogue',
                character: charName, 
                text: dialogue
            });
        }
    });

    return { items: newItems, actors: newActors };
}
