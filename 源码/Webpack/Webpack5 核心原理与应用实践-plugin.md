# Webpack5 核心原理与应用实践-plugin

Webpack 在启动时会调用插件对象的 apply 函数，并以参数方式传递核心对象 compiler ，以此为起点，插件内可以注册 compiler 对象及其子对象的钩子( [Hook](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fapi%2Fplugins%2F) )回调，

```js
class SomePlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap("SomePlugin", (compilation) => {
      compilation.addModule(/* ... */);
    });
  }
}
```

compiler# 为 Hook 挂载的对象；thisCompilation# 为 Hook 名称；后面调用的 tap# 为调用方式，支持 tap/tapAsync/tapPromise# 等

Compiler：全局构建管理器，webpack 启动后会首先创建 compiler 对象，负责管理配置信息、loader、plugin。从启动构建到结束，compiler 大致上会触发如下钩子：

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/407f8596a5b24203b091a51b5fca6726_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

Compilation：单次构建过程的管理器，负责遍历模块，执行编译操作；当 watch = true 时，每次文件变更触发重新编译，都会创建一个新的 compilation 对象；compilation 生命周期中主要触发如下钩子：

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/08c337e97f664f3da4d301a3a5404f7d_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

Webpack Hook 有两个重点，一是上面介绍的触发时机；二是触发时传递的上下文参数。例如：

- compiler.hooks.compilation## ：
  _ ## 时机：Webpack 刚启动完，创建出
  compilation## 对象后触发；
  _ ## 参数：当前编译的
  compilation## 对象。
- compiler.hooks.make## ：
  _ ## 时机：正式开始构建时触发；
  _ ## 参数：同样是当前编译的
  compilation## 对象。
- compilation.hooks.optimizeChunks## ：
  _ ## 时机：
  seal## 函数中，
  chunk ## 集合构建完毕后触发；
  _ ## 参数：
  chunks ## 集合与
  chunkGroups## 集合。
- compiler.hooks.done## ：
  _ ## 时机：编译完成后触发；
  _ ## 参数：
  stats ## 对象，包含编译过程中的各类统计信息。

每个钩子传递的上下文参数不同，但主要包含如下几种类型

[complation](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FCompilation.js) 对象：构建管理器，使用率非常高，主要提供了一系列与单次构建相关的接口，包括：

- addModule：用于添加模块，例如 Module 遍历出依赖之后，就会调用该接口将新模块添加到构建需求中；
- addEntry：添加新的入口模块，效果与直接定义 entry 配置相似；
- emitAsset：用于添加产物文件，效果与 Loader Context 的 emitAsset 相同；
- getDependencyReference：从给定模块返回对依赖项的引用，常用于计算模块引用关系；

[compiler](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FCompiler.js) 对象：全局构建管理器，提供如下接口：

- createChildCompiler## ：创建子
  compiler## 对象，子对象将继承原始 Compiler 对象的所有配置数据；
- createCompilation## ：创建
  compilation## 对象，可以借此实现并行编译；
- close## ：结束编译；
- getCache## ：获取缓存接口，可借此复用 Webpack5 的缓存功能；
- getInfrastructureLogger## ：获取 日志对象 ；

[日志对象](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fconfiguration%2Fother-options%2F%23infrastructurelogging)

[module](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FNormalModule.js) 对象：资源模块，有诸如 NormalModule/RawModule/ContextModule 等子类型，其中 NormalModule 使用频率较高，提供如下接口：

- identifier：读取模块的唯一标识符；
- getCurrentLoader：获取当前正在执行的 Loader 对象；
- originalSource：读取模块原始内容；
- serialize/deserialize：模块序列化与反序列化函数，用于实现持久化缓存，一般不需要调用；
- issuer：模块的引用者；
- isEntryModule：用于判断该模块是否为入口文件；

[chunk](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FChunk.js) 对象：模块封装容器，提供如下接口：

- addModule：添加模块，之后该模块会与 Chunk 中其它模块一起打包，生成最终产物；
- removeModule：删除模块；
- containsModule：判断是否包含某个特定模块；
- size：推断最终构建出的产物大小；
- hasRuntime：判断 Chunk 中是

- [stats](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fapi%2Fstats%2F) 对象：构建过程收集到的统计信息，包括模块构建耗时、模块依赖关系、产物文件列表等。

webpack 基于 tapable 实现了:

1. 编译过程的特定节点以钩子形式，通知插件此刻正在发生什么事情；
2. 通过 tapable 提供的回调机制，以参数方式传递上下文信息；
3. 在上下文参数对象中附带了很多存在 Side Effect 的交互接口，插件可以通过这些接口改变

总结：
综上，Webpack 插件在代码形态上是一个带 apply 方法的对象，我们可以在 apply 函数中注册各式各样的 Hook 回调，监听对应事件，之后在回调中修改上下文状态，达到干预 Webpack 构建逻辑的效果。

Tapable 全解析

订阅模式是一种松耦合架构，发布器只是在特定时机发布事件消息，订阅者并不或者很少与事件直接发生交互，举例来说，我们平常在使用 HTML 事件的时候很多时候只是在这个时机触发业务逻辑，很少调用上下文操作。

而 Webpack 的插件体系是一种基于 [Tapable](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fwebpack%2Ftapable) 实现的强耦合架构，它在特定时机触发钩子时会附带上足够的上下文信息，插件定义的钩子回调中，能也只能与这些上下文背后的数据结构、接口交互产生 side effect，进而影响到编译状态和后续流程。

[Tapable](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fwebpack%2Ftapable) 是 Webpack 插件架构的核心支架，但它的代码量其实很少，本质上就是围绕着 订阅/发布 模式叠加各种特化逻辑，适配 Webpack 体系下复杂的事件源-处理器之间交互需求，比如：

- 有些场景需要支持将前一个处理器的结果传入下一个回调处理器；
- 有些场景需要支持异步并行调用这些回调处理器。

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/1584EED4-8D29-49BE-8143-DAAD1D58215F%202.png>)

类型虽多，但整体遵循两种分类规则：

- 按回调逻辑，分为：
  - 基本类型，名称不带 Waterfall/Bail/Loop 关键字：与通常 订阅/回调 模式相似，按钩子注册顺序，逐次调用回调；
  - waterfall 类型：前一个回调的返回值会被带入下一个回调；
  - bail 类型：逐次调用回调，若有任何一个回调返回非 undefined 值，则终止后续调用；
  - loop 类型：逐次、循环调用，直到所有回调函数都返回 undefined 。
- 按执行回调的并行方式，分为：
  - sync ：同步执行，启动后会按次序逐个执行回调，支持 call/tap 调用语句；
  - async ：异步执行，支持传入 callback 或 promise 风格的异步回调函数，支持 callAsync/tapAsync 、promise/tapPromise 两种调用语句。
