import { useSyncExternalStore } from 'react';
import { get, set } from 'idb-keyval';
import type { ScriptItem, Scene, Actor, ProjectState } from '../types';

const STORAGE_KEY = 'skit-screenplay-data';

// --- Data Helpers ---

const createDefaultScene = (items: ScriptItem[] = []): Scene => ({
  id: crypto.randomUUID(),
  title: 'Default Scene',
  description: 'Main scene',
  items: items,
  isExpanded: true
});

// --- Store Implementation ---

// 1. The Global State
let currentState: ProjectState = {
    scenes: [],
    actors: [],
    projectName: 'My Skit'
};
let isLoading = true;
let listeners = new Set<() => void>();

const emitChange = () => {
    for (const listener of listeners) {
        listener();
    }
    // Persist
    set(STORAGE_KEY, currentState);
};

// 2. Load Logic (Run once outside or via init?)
// We can lazy load on first usage or just kick it off.
// Let's lazily kick it off but ensure we handle loading state.
// let loadPromise: Promise<void> | null = null;

const loadData = async () => {
    if (!isLoading) return;
    try {
        const data = await get(STORAGE_KEY);
        if (data) {
             // Migration logic
             let loadedState: ProjectState;
             
             if (Array.isArray(data)) {
                 const oldItems = data as ScriptItem[];
                 oldItems.forEach(item => {
                    if (item.audioBlob) item.audioUrl = URL.createObjectURL(item.audioBlob);
                 });
                 loadedState = {
                     scenes: [createDefaultScene(oldItems)],
                     actors: [],
                     projectName: 'My Skit'
                 };
             } else {
                 const state = data as Partial<ProjectState>;
                 const scenes = state.scenes || [createDefaultScene([])];
                 scenes.forEach(scene => {
                     scene.items.forEach(item => {
                         if (item.audioBlob) item.audioUrl = URL.createObjectURL(item.audioBlob);
                     });
                 });
                 
                 loadedState = {
                     scenes,
                     actors: state.actors || [],
                     projectName: state.projectName || 'My Skit',
                     nextDialogueId: state.nextDialogueId
                 };
             }
             
             // --- ID MIGRATION ---
             // Ensure all dialogues have a displayId
             let maxId = loadedState.nextDialogueId || 1;
             let assignedCount = 0;
             
             const migratedScenes = loadedState.scenes.map(scene => ({
                 ...scene,
                 items: scene.items.map(item => {
                     if (item.type === 'dialogue' && typeof item.displayId === 'undefined') {
                         assignedCount++;
                         return { ...item, displayId: maxId++ };
                     }
                     return item;
                 })
             }));

             // If we didn't have nextDialogueId, or we assigned new ones, update max
             // If state already had IDs, maxId should ideally be (highest + 1). 
             // Let's recalculate maxId from all items just to be safe and consistent
             if (!loadedState.nextDialogueId || assignedCount > 0) {
                 let currentMax = 0;
                 migratedScenes.forEach(s => s.items.forEach(i => {
                     if (typeof i.displayId === 'number' && i.displayId > currentMax) {
                         currentMax = i.displayId;
                     }
                 }));
                 maxId = currentMax + 1;
             }

             currentState = {
                 ...loadedState,
                 scenes: migratedScenes,
                 nextDialogueId: maxId
             };

        } else {
            currentState = { scenes: [createDefaultScene([])], actors: [], projectName: 'My Skit', nextDialogueId: 1 };
        }
    } catch (e) {
        console.error("Failed to load state", e);
        currentState = { scenes: [createDefaultScene([])], actors: [], projectName: 'My Skit', nextDialogueId: 1 };
    } finally {
        isLoading = false;
        emitChange();
    }
};

// Kickoff load immediately
if (typeof window !== 'undefined') {
    loadData();
}

// 3. Actions (Mutate Global State)
const addScene = (title: string = 'New Scene', description: string = '', items: ScriptItem[] = []) => {
    let nextId = currentState.nextDialogueId || 1;
    const itemsWithIds = items.map(item => {
        if (item.type === 'dialogue' && typeof item.displayId === 'undefined') {
            const newItem = { ...item, displayId: nextId };
            nextId++;
            return newItem;
        }
        return item;
    });

    const newScene: Scene = {
        id: crypto.randomUUID(),
        title,
        description,
        items: itemsWithIds,
        isExpanded: true
    };
    currentState = { 
        ...currentState, 
        scenes: [...currentState.scenes, newScene],
        nextDialogueId: nextId 
    };
    emitChange();
};

const deleteScene = (sceneId: string) => {
    currentState = { ...currentState, scenes: currentState.scenes.filter(s => s.id !== sceneId) };
    emitChange();
};

const updateScene = (sceneId: string, updates: Partial<Scene>) => {
    currentState = { 
        ...currentState, 
        scenes: currentState.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s)
    };
    emitChange();
};

const reorderScenes = (newScenes: Scene[]) => {
    currentState = { ...currentState, scenes: newScenes };
    emitChange();
};

// Actors
const addActor = (name: string, color: string = '#3b82f6') => {
    const newActor: Actor = { id: crypto.randomUUID(), name, color };
    currentState = { ...currentState, actors: [...currentState.actors, newActor] };
    emitChange();
};

const updateActor = (id: string, updates: Partial<Actor>) => {
    const oldActor = currentState.actors.find(a => a.id === id);
    if (!oldActor) return;

    if (updates.name && updates.name !== oldActor.name) {
        const targetName = updates.name.trim();
        const existingActor = currentState.actors.find(a => a.name.toLowerCase() === targetName.toLowerCase() && a.id !== id);

        if (existingActor) {
            // MERGE CASE
            // 1. Update all items using the old name to use the target name
            const newScenes = currentState.scenes.map(camera => ({
                ...camera,
                items: camera.items.map(item => {
                    if (item.character === oldActor.name) {
                        return { ...item, character: existingActor.name };
                    }
                    return item;
                })
            }));

            // 2. Remove the actor being updated (merged into existing)
            currentState = {
                ...currentState,
                scenes: newScenes,
                actors: currentState.actors.filter(a => a.id !== id)
            };
        } else {
            // RENAME CASE
            // 1. Update all items using the old name to the new name
            const newScenes = currentState.scenes.map(camera => ({
                ...camera,
                items: camera.items.map(item => {
                    if (item.character === oldActor.name) {
                        return { ...item, character: targetName };
                    }
                    return item;
                })
            }));

            // 2. Update the actor record
            currentState = { 
                ...currentState, 
                scenes: newScenes,
                actors: currentState.actors.map(a => a.id === id ? { ...a, ...updates, name: targetName } : a)
            };
        }
    } else {
        // NORMAL UPDATE (Color, etc.)
        currentState = { 
            ...currentState, 
            actors: currentState.actors.map(a => a.id === id ? { ...a, ...updates } : a)
        };
    }
    emitChange();
};

const deleteActor = (id: string) => {
    const actorToDelete = currentState.actors.find(a => a.id === id);
    if (!actorToDelete) return;

    // Unassign character from all items
    const newScenes = currentState.scenes.map(scene => ({
        ...scene,
        items: scene.items.map(item => {
            if (item.character === actorToDelete.name) {
                return { ...item, character: '' };
            }
            return item;
        })
    }));

    currentState = { 
        ...currentState, 
        scenes: newScenes,
        actors: currentState.actors.filter(a => a.id !== id) 
    };
    emitChange();
};

// Items
const addItemToScene = (sceneId: string, item: ScriptItem) => {
    let newItem = { ...item };
    let nextId = currentState.nextDialogueId || 1;

    if (item.type === 'dialogue') {
        newItem.displayId = nextId;
        nextId++;
    }

    currentState = {
        ...currentState,
        nextDialogueId: nextId,
        scenes: currentState.scenes.map(s => {
            if (s.id === sceneId) return { ...s, items: [...s.items, newItem] };
            return s;
        })
    };
    emitChange();
};

const addItemsToScene = (sceneId: string, newItems: ScriptItem[]) => {
    let nextId = currentState.nextDialogueId || 1;
    const itemsWithIds = newItems.map(item => {
        if (item.type === 'dialogue' && typeof item.displayId === 'undefined') {
            const newItem = { ...item, displayId: nextId };
            nextId++;
            return newItem;
        }
        return item;
    });

    currentState = {
        ...currentState,
        nextDialogueId: nextId,
        scenes: currentState.scenes.map(s => {
            if (s.id === sceneId) return { ...s, items: [...s.items, ...itemsWithIds] };
            return s;
        })
    };
    emitChange();
};

const insertItemAt = (sceneId: string, index: number, item: ScriptItem) => {
    let newItem = { ...item };
    let nextId = currentState.nextDialogueId || 1;

    if (item.type === 'dialogue') {
        newItem.displayId = nextId;
        nextId++;
    }

    currentState = {
        ...currentState,
        nextDialogueId: nextId,
        scenes: currentState.scenes.map(s => {
            if (s.id === sceneId) {
                const newItems = [...s.items];
                newItems.splice(index, 0, newItem);
                return { ...s, items: newItems };
            }
            return s;
        })
    };
    emitChange();
};

const updateItem = (sceneId: string, itemId: string, updates: Partial<ScriptItem>) => {
    currentState = {
        ...currentState,
        scenes: currentState.scenes.map(s => {
            if (s.id === sceneId) {
                const newItems = s.items.map(i => i.id === itemId ? { ...i, ...updates } : i);
                return { ...s, items: newItems };
            }
            return s;
        })
    };
    emitChange();
};

const deleteItem = (sceneId: string, itemId: string) => {
    currentState = {
        ...currentState,
        scenes: currentState.scenes.map(s => {
            if (s.id === sceneId) return { ...s, items: s.items.filter(i => i.id !== itemId) };
            return s;
        })
    };
    emitChange();
};

const reorderItemsInScene = (sceneId: string, newItems: ScriptItem[]) => {
    currentState = {
        ...currentState,
        scenes: currentState.scenes.map(s => {
            if (s.id === sceneId) return { ...s, items: newItems };
            return s;
        })
    };
    emitChange();
};

const setProjectName = (name: string) => {
    currentState = { ...currentState, projectName: name };
    emitChange();
};

// --- Hook ---

const subscribe = (callback: () => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
};

const getSnapshot = () => currentState;

const loadProjectState = (newState: ProjectState) => {
    // 1. Clean up old URLs to avoid memory leaks
    currentState.scenes.forEach(scene => {
        scene.items.forEach(item => {
            if (item.audioUrl) URL.revokeObjectURL(item.audioUrl);
        });
    });

    // 2. Set new state
    currentState = newState;
    
    // 3. Persist and notify
    emitChange();
};

export function useScriptStore() {
    const state = useSyncExternalStore(subscribe, getSnapshot);
    // Force re-render on load completion is handled by emitChange in finally block
    // But we also want to expose loading state. 
    // Since `isLoading` relies on the same emitChange, a wrapper might be needed if strictly separating.
    // However, simplicity: return global vars.
    // Note: useSyncExternalStore checks reference equality using Object.is.
    // We update `currentState` reference on every change, so this works.

    return {
        scenes: state.scenes,
        actors: state.actors,
        projectName: state.projectName,
        loading: isLoading,
        addScene,
        deleteScene,
        updateScene,
        reorderScenes,
        addActor,
        updateActor,
        deleteActor,
        addItemToScene,
        addItemsToScene,
        insertItemAt,
        updateItem,
        deleteItem,
        reorderItemsInScene,
        setProjectName,
        loadProjectState
    };
}
