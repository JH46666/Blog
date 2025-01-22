# 热更新 HMR(Hot Module Replacement)

热更新：文件改动后，以最小的代价改变被改变的区域。尽可能保留改动文件前的状态（修改js代码之后可以把页面输入的部分信息保留下来）

## 热更新的原理
1. 使用 webpack-dev-server （后面简称 WDS）托管静态资源，同时以 Runtime 方式注入一段处理 HMR 逻辑的客户端代码；
2. 浏览器加载页面后，与 WDS 建立 WebSocket 连接；
3. Webpack 监听到文件变化后，增量构建发生变更的模块，并通过 WebSocket 发送 hash 事件；
4. 浏览器接收到 hash 事件后，请求 manifest 资源文件，确认增量变更范围；
5. 浏览器加载发生变更的增量模块；
6. Webpack 运行时触发变更模块的 module.hot.accept 回调，执行代码变更逻辑；
done。

## 热更新使用 

```js
devServer: {
        contentBase: './dist',
        port: '7008',
        inline: true,
        host: '0.0.0.0',
        disableHostCheck: true,//不使用白名单的原因是多人开发，每个人都需要绑定Host不方便，因此关闭Host检查
        hot: true,  //开启热更新
},
plugins: [
        new MiniCssExtractPlugin({
            filename: "css/[name].css",
        }),
        new HtmlWebpackPlugin({
            title: 'Output Management'
        }),
        new webpack.HotModuleReplacementPlugin() //开启热更新
],
// 在webpack 入口js底部加上以下代码
if (module.hot) {
    module.hot.accept();
}

before: (app) => {
  app.use('*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST,GET");
    res.header("Access-Control-Allow-Headers", "Origin,Accept,Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    next();
  });
}



```

热更新代码用到的

```js
function reloadApp() {
  if (isUnloading || !hotReload) {
    return;
  }
  if (_hot) {
    log.info('[WDS] App hot update...');
    var hotEmitter = require('webpack/hot/emitter');
    hotEmitter.emit('webpackHotUpdate', currentHash);
    if (typeof self !== 'undefined' && self.window) {
      self.postMessage('webpackHotUpdate' + currentHash, '*');
    }
  } else {
    ...//非重要代码省略
  }  
}

```
