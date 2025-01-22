# electron 面试

## 通信

主进程 (main.js)

创建一个窗口并加载 index.html。
使用 ipcMain.on 监听来自渲染进程的消息，并使用 event.sender.send 向渲染进程发送消息。
预加载脚本 (preload.js)

使用 contextBridge.exposeInMainWorld 将 IPC 方法暴露给渲染进程。
提供 sendMessage 和 onMessage 方法，分别用于发送和接收消息。
渲染进程 (index.html)

使用暴露的 API 与主进程通信。
在按钮点击时发送消息，并在接收到主进程的响应时更新页面内容。
通过这种方式，您可以在主进程和渲染进程之间进行双向通信，实现更复杂的应用逻辑。
