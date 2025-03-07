import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        title: 'Deep Seas: An Incremental Fishing Adventure'
    });

    mainWindow.loadFile(path.join(__dirname, '../index.html'));

    // Open DevTools in development mode
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Save game data to file
ipcMain.on('save-game', (event, data: string) => {
    const savePath = path.join(app.getPath('userData'), 'saveData.json');
    fs.writeFileSync(savePath, data);
    event.reply('save-game-response', { success: true });
});

// Load game data from file
ipcMain.handle('load-game', async () => {
    const savePath = path.join(app.getPath('userData'), 'saveData.json');

    if (fs.existsSync(savePath)) {
        const data = fs.readFileSync(savePath, 'utf8');
        return { success: true, data };
    }

    return { success: false, data: null };
});

ipcMain.handle('delete-save', async () => {
    const savePath = path.join(app.getPath('userData'), 'saveData.json');

    if (fs.existsSync(savePath)) {
        try {
            fs.unlinkSync(savePath);
            return { success: true };
        } catch (error) {
            console.error('Error deleting save file:', error);
            return { success: false };
        }
    }

    return { success: true }; // No file to delete is still a success
});