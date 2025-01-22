# electron 应用发布流程

1. 配置 package.json

```js
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "package": "electron-builder"
  },
  "build": {
    "appId": "com.example.myapp",
    "productName": "My Electron App",
    "mac": {
      "target": "dmg"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  },
  "devDependencies": {
    "electron": "^34.0.0",
    "electron-builder": "^24.13.3"
  }
}

```

main：指定主进程入口文件。
build：配置打包目标（如 .dmg、.exe、.AppImage）。
scripts：定义启动和打包命令。

(3) 主进程代码
确保 main.js 创建窗口并加载页面：

```js
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  win.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
```

2. 打包阶段
   打包是将 Electron 应用转化为可执行文件的过程，常用工具是 electron-builder 或 electron-forge。

使用 electron-builder
安装依赖：

```bash
npm install --save-dev electron-builder
```

配置打包选项：
在 package.json 的 build 字段中指定目标平台和文件类型。
可选：添加图标、证书签名等配置。
执行打包：

```bash
npm run package
输出目录：dist/，生成如 My Electron App-1.0.0.dmg（macOS）、My Electron App-1.0.0.exe（Windows）等文件。
```

3. 发布阶段
   打包完成后，需要将应用分发给用户，常见方式包括网站下载、应用商店或 GitHub Releases。

(1) 手动发布
将 dist/ 目录中的文件上传到服务器或云存储（如 AWS S3）。
提供下载链接：https://myapp.com/downloads/MyElectronApp-1.0.0.dmg。

(2) 使用 GitHub Releases
创建发布：
在 GitHub 仓库中创建新 Release，标记版本（如 v1.0.0）。
上传打包文件。

配置 electron-builder 自动发布：

```json
"build": {
  "publish": [
    {
      "provider": "github",
      "owner": "your-username",
      "repo": "my-electron-app"
    }
  ]
}
```

设置 GitHub Token：

```bash
export GH_TOKEN="your-personal-access-token"
npm run package -- --publish release
```

(3) 应用商店
macOS：提交到 Mac App Store，需符合 Apple 指南并签名。
Windows：提交到 Microsoft Store，需转换为 MSIX 格式。

4. 自动更新
   Electron 支持通过 autoUpdater 模块实现应用自动更新。
   使用 update.electronjs.org
   安装依赖：
   ```bash
   npm install update-electron-app
   ```
   在主进程配置：
   ```javascript
   const updateElectronApp = require("update-electron-app");
   updateElectronApp({
     repo: "your-username/my-electron-app", // GitHub 仓库
     updateInterval: "10 minutes",
   });
   ```

发布新版本到 GitHub Releases，应用自动检测并下载。
自定义更新服务器
设置更新服务器（如 AWS S3）：
上传新版本文件和 latest.yml（由 electron-builder 生成）。
配置 autoUpdater：

```javascript
const { autoUpdater } = require("electron-updater");
autoUpdater.setFeedURL({
  provider: "generic",
  url: "https://my-server.com/updates",
});
autoUpdater.on("update-downloaded", () => {
  autoUpdater.quitAndInstall();
});
app.whenReady().then(() => autoUpdater.checkForUpdates());
```

如果需要更多控制，手动实现

```js
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

// 配置日志
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

// 手动检查更新
function checkForUpdates() {
  autoUpdater.checkForUpdates();
}

// 监听更新事件
autoUpdater.on("checking-for-update", () => {
  log.info("Checking for update...");
  // 可以在 UI 中显示“正在检查更新”的提示
});

autoUpdater.on("update-available", (info) => {
  log.info("Update available:", info);
  // 可以在 UI 中提示用户有新版本，并询问是否下载
});

autoUpdater.on("update-not-available", (info) => {
  log.info("Update not available:", info);
  // 可以在 UI 中提示用户当前已是最新版本
});

autoUpdater.on("download-progress", (progressObj) => {
  log.info("Download progress:", progressObj);
  // 可以在 UI 中显示下载进度
});

autoUpdater.on("update-downloaded", (info) => {
  log.info("Update downloaded; ready to install");
  // 可以在 UI 中提示用户更新已下载完成，并询问是否立即安装
  // 例如：
  // dialog.showMessageBox({
  //   type: 'info',
  //   title: 'Update Ready',
  //   message: 'A new version has been downloaded. Restart the application to apply the updates.',
  //   buttons: ['Restart', 'Later']
  // }).then((result) => {
  //   if (result.response === 0) {
  //     autoUpdater.quitAndInstall();
  //   }
  // });
});

autoUpdater.on("error", (err) => {
  log.error("Error in auto-updater:", err);
  // 可以在 UI 中提示用户更新失败
});

// 在应用启动时检查更新
app.on("ready", () => {
  checkForUpdates();
});
```
