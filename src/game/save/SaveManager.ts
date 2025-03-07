/**
 * Handles saving and loading game data
 */
export class SaveManager {
    // Save version for compatibility checking
    private static readonly SAVE_VERSION = '0.1.0';

    // Save game data
    static async saveGame(gameData: object): Promise<boolean> {
        try {
            // Add save version and timestamp
            const saveObject = {
                version: SaveManager.SAVE_VERSION,
                timestamp: Date.now(),
                data: gameData
            };

            // Convert to JSON
            const saveJson = JSON.stringify(saveObject);

            // In an Electron environment
            if (typeof window !== 'undefined' && window.require) {
                try {
                    const { ipcRenderer } = window.require('electron');
                    const result = await ipcRenderer.invoke('save-game', saveJson);
                    return result && result.success;
                } catch (err) {
                    console.warn('Unable to use Electron IPC, falling back to localStorage');
                }
            }

            // Fallback to localStorage
            localStorage.setItem('deepSeasSaveData', saveJson);
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    // Load game data
    static async loadGame(): Promise<object | null> {
        try {
            // Try to load with Electron IPC first
            if (typeof window !== 'undefined' && window.require) {
                try {
                    const { ipcRenderer } = window.require('electron');
                    const result = await ipcRenderer.invoke('load-game');

                    if (result && result.success && result.data) {
                        // Parse JSON
                        const saveObject = JSON.parse(result.data);

                        // Check version compatibility
                        if (saveObject.version === SaveManager.SAVE_VERSION) {
                            return saveObject.data;
                        }
                    }
                } catch (err) {
                    console.warn('Unable to use Electron IPC, falling back to localStorage');
                }
            }

            // Fallback to localStorage
            const savedData = localStorage.getItem('deepSeasSaveData');

            if (savedData) {
                // Parse JSON
                const saveObject = JSON.parse(savedData);

                // Check version compatibility
                if (saveObject.version === SaveManager.SAVE_VERSION) {
                    return saveObject.data;
                } else {
                    console.warn(`Save version mismatch: ${saveObject.version} vs ${SaveManager.SAVE_VERSION}`);
                    return null;
                }
            }

            return null;
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }

    static async deleteSaveData(): Promise<boolean> {
        try {
            // Try to delete with Electron IPC first
            if (typeof window !== 'undefined' && window.require) {
                try {
                    const { ipcRenderer } = window.require('electron');
                    const result = await ipcRenderer.invoke('delete-save');
                    if (result && result.success) {
                        // Also clear localStorage just to be safe
                        localStorage.removeItem('deepSeasSaveData');
                        return true;
                    }
                } catch (err) {
                    console.warn('Unable to use Electron IPC, falling back to localStorage');
                }
            }

            // Fallback to localStorage
            localStorage.removeItem('deepSeasSaveData');

            // Also clear any other game-related data that might be in localStorage
            // List all keys that might contain game data
            const keysToRemove = ['deepSeasSaveData'];
            keysToRemove.forEach(key => localStorage.removeItem(key));

            return true;
        } catch (error) {
            console.error('Failed to delete save data:', error);
            return false;
        }
    }

    // Auto-save interval handler
    private static autoSaveInterval: number | null = null;

    // Start auto-save
    static startAutoSave(saveFunction: () => void, interval: number = 60000): void {
        // Clear existing interval if any
        SaveManager.stopAutoSave();

        // Set new interval
        SaveManager.autoSaveInterval = window.setInterval(saveFunction, interval) as unknown as number;
    }

    // Stop auto-save
    static stopAutoSave(): void {
        if (SaveManager.autoSaveInterval !== null) {
            window.clearInterval(SaveManager.autoSaveInterval);
            SaveManager.autoSaveInterval = null;
        }
    }
}