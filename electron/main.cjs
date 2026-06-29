const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 480,
    minHeight: 400,
    backgroundColor: '#0b0a10', 
    title: 'mdvu',
    icon: path.join(__dirname, '../public/mdvu-icon.ico'),
    webPreferences: {
      nodeIntegration: false,      // dont expose node APIs to renderer (web content)
      contextIsolation: true,      // keep renderer sandbox'd
    },
  });

  // __dirname is the electron/ folder, so we go up one to reach dist-electron/
  win.loadFile(path.join(__dirname, '../dist-electron/index.html'));
}

app.whenReady().then(createWindow);

// on win/linux, closing all windows quits the app
// on macos (darwin), keep app running with dock icon stayin
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// macos: re-create the window if user clicks the dock icon while app is open but no windows exist
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});