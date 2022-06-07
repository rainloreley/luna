import { app, ipcMain, dialog, nativeTheme } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import {ReadlineParser, SerialPort} from "serialport";

const isProd: boolean = process.env.NODE_ENV === 'production';

//const BOARD_DEV_INTERFACE = "/dev/tty.usbserial-A50603C4"
const BOARD_DEV_INTERFACE = "/dev/ttyUSB0"
var lunaSerial: SerialPort;

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

  lunaSerial = new SerialPort({ path: BOARD_DEV_INTERFACE, baudRate: 9600 });
  const lunaParser = lunaSerial.pipe(new ReadlineParser());
  lunaParser.on("data", function (data) {
    mainWindow.webContents.send("board::incoming-data", data);
  })

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

  ipcMain.on("board::sli1-value-relay", (event, args) => {
    mainWindow.webContents.send("board::sli1-value-listener", args);
  })

  ipcMain.on("board::re1-pos-relay", (event, args) => {
    mainWindow.webContents.send("board::re1-pos-listener", args);
  })

  ipcMain.on("board::re1-btn-relay", (event, args) => {
    mainWindow.webContents.send("board::re1-btn-listener", args);
  })
})();

app.on('window-all-closed', () => {
  app.quit();
});
