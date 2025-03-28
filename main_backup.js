const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 900,
    webPreferences: {
      nodeIntegration: true,  // ✅ Renderer 프로세스에서 Node.js 사용 가능
	contextIsolation: false,
	contentSecurityPolicy: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"]
	}	
    },
  });

  // ✅ index.html이 제대로 로드되는지 확인
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
