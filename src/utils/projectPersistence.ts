import JSZip from 'jszip';
import type { ProjectState, ScriptItem, Scene } from '../types';

/**
 * Exports the current project state to a .skit (zip) file.
 * It separates binary audio data from the JSON structure for efficiency.
 */
export const exportProjectToZip = async (state: ProjectState): Promise<Blob> => {
    const zip = new JSZip();
    const assetsFolder = zip.folder("assets");

    // 1. Prepare a clean copy of the state for JSON serialization
    // We need to strip out runtime Blobs/URLs and replace them with file references
    const cleanScenes = state.scenes.map(scene => ({
        ...scene,
        items: scene.items.map(item => {
            // Clone item to avoid mutating original state
            const cleanItem: any = { ...item };

            // If we have audio data, start the extraction process
            if (item.audioBlob) {
                // Generate a unique filename for the asset
                const extension = item.audioMetadata?.mimeType?.split('/')[1] || 'webm';
                const filename = `${item.id}.${extension}`;

                // Add the file to the zip assets folder
                if (assetsFolder) {
                    assetsFolder.file(filename, item.audioBlob);
                }

                // Add reference to the JSON
                cleanItem.audioFileName = filename;

                // Remove runtime-only properties from the JSON export
                delete cleanItem.audioBlob;
                delete cleanItem.audioUrl;
                delete cleanItem.isRecording;
            }

            return cleanItem;
        })
    }));

    const exportState = {
        ...state,
        scenes: cleanScenes
    };

    // 2. Add the main project file
    zip.file("project.json", JSON.stringify(exportState, null, 2));

    // 3. Generate the ZIP blob
    return await zip.generateAsync({ type: "blob" });
};


/**
 * Imports a project from a .skit (zip) file.
 * It rehydrates the binary audio data back into Blobs and ObjectURLs.
 */
export const importProjectFromZip = async (file: File): Promise<ProjectState> => {
    const zip = await JSZip.loadAsync(file);

    // 1. Read the project.json
    const projectFile = zip.file("project.json");
    if (!projectFile) {
        throw new Error("Invalid project file: missing project.json");
    }

    const projectJson = await projectFile.async("string");
    const rawState = JSON.parse(projectJson);

    // 2. Rehydrate scenes and items (restore audio blobs)
    const rehydratedScenes = await Promise.all(rawState.scenes.map(async (scene: any) => {
        const rehydratedItems = await Promise.all(scene.items.map(async (item: any) => {
            
            // Checks if this item had a saved audio file
            if (item.audioFileName) {
                const assetFile = zip.file(`assets/${item.audioFileName}`);
                if (assetFile) {
                    const blob = await assetFile.async("blob");
                    const url = URL.createObjectURL(blob);

                    return {
                        ...item,
                        audioBlob: blob,
                        audioUrl: url
                    } as ScriptItem;
                }
            }

            return item as ScriptItem;
        }));

        return {
            ...scene,
            items: rehydratedItems
        } as Scene;
    }));

    return {
        ...rawState,
        scenes: rehydratedScenes
    };
};
