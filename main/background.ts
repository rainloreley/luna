import { app, ipcMain, dialog, nativeTheme } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';

const isProd: boolean = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();


  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      webSecurity: false
    }
  });

  if (isProd) {
    await mainWindow.loadURL('app://./home.html');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }

  const theme = await mainWindow.webContents.executeJavaScript('localStorage.getItem("theme")');
  if (theme == null) {
    await mainWindow.webContents.executeJavaScript(`localStorage.setItem("theme", "light");`);
    nativeTheme.themeSource = "light";
  }
  else {
    nativeTheme.themeSource = theme == "dark" ? "dark" : "light";
  }

  ipcMain.on("app::import-music", () => {
    dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [{name: "Music", extensions: ["mp3", "wav", "ogg"]}]
    }).then((result) => {
      if (!result.canceled) {
        mainWindow.webContents.send("app::import-music-paths-ready", result.filePaths)
      }
    })
  });
  ipcMain.on("app::reload-catalogue-to-main", (event, args) => {
    mainWindow.webContents.send("app::reload-catalogue", args);
  })

  ipcMain.on("app::get-color-scheme", (event, args) => {
    mainWindow.webContents.send("app::color-scheme", nativeTheme.themeSource);
  });

  ipcMain.on("app::set-color-scheme", async (event, args) => {
    nativeTheme.themeSource = args == "dark" ? "dark" : "light";
    await mainWindow.webContents.executeJavaScript(`localStorage.setItem("theme", "${args}");`);
  });
})();

app.on('window-all-closed', () => {
  app.quit();
});
