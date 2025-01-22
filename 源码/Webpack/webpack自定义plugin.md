# webpack 自定义 plugin

Webpack 在编译过程中，会广播很多事件，例如 run、compile、done、fail 等等
Webpack 的事件流机制应用了观察者模式，我们编写的插件可以监听 Webpack 事件来触发对应的处理逻辑；
插件中可以使用很多 Webpack 提供的 API，例如读取输出资源、代码块、模块及依赖等；

1、编写插件
在根目录下，新建目录 my-plugin 作为我们编写插件的名称，执行 npm init -y 命令，新建一个模块化项目，然后新建 index.js 文件，相关源码如下：

```JS
class MyPlugin {
  constructor(doneCallback, failCallback) {
    // 保存在创建插件实例时传入的回调函数
    this.doneCallback = doneCallback
    this.failCallback = failCallback
  }
  apply(compiler) {
    // 成功完成一次完整的编译和输出流程时，会触发 done 事件
    compiler.plugin('done', stats => {
      this.doneCallback(stats)
    })
    // 在编译和输出的流程中遇到异常时，会触发 failed 事件
    compiler.plugin('failed', err => {
      this.failCallback(err)
    })
  }
}
module.exports = MyPlugin
```

2、注册模块
按照以上的方法，我们在 my-plugin 目录底下使用 npm link 做到在不发布模块的情况下，将本地的一个正在开发的模块的源码链接到项目的 node_modules 目录下，让项目可以直接使用本地的 npm 模块。
npm link

然后在项目根目录执行以下命令，将注册到全局的本地 npm 模块链接到项目的 node_modules 下

3、配置插件
在 webpack.base.conf.js 加上如下配置

```JS
plugins: [
  new MyPlugin(
    stats => {
      console.info('编译成功!')
    },
    err => {
      console.error('编译失败!')
    }
  )
]
```

```BASH
npm link my-plugin
```

注册成功后，我们可以在 node_modules 目录下能查找到对应的插件了。
