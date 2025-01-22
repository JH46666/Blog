# 玩转 webpack

![](./picture/2022-03-04-22-19-51.png)

常见的 loader 有 babel-loader css-loader less-loader ts-loader file-loader

plugin 就是任何 loader 没办法做的事情都可以通过 plugin 去完成

用于 bundle 文件的优化，资源管理和环境变量注入

作用于整个构建过程

## 解析 ECMAScript 和 React jsx

babel-loader 去解析

plugin 是一个 plugin 对应一个功能

preset 是集合

文件监听的原理分析

轮询判断文件的最后编辑时间是否变化

某个文件发生了变化，并不会立刻告诉监听者，而是先缓存起来，等 aggregateTimeout

```js
watchOptions: {
  aggregateTimeout: 300, 监听到变化发生后会等 300ms 再去执行，默认 300ms
  poll: 1000 判断文件是否发生变化是通过不停询问系统指定文件有没有变化实现的，默认每秒问 1000 次
}
```

热更新： 使用 webpack-dev-middleware

![](./picture/2022-03-14-23-36-18.png)
