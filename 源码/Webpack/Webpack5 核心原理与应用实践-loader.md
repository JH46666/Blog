# Webpack5 核心原理与应用实践-loader

为什么需要 Loader？

提示：Webpack5 之后增加了 Parser 对象，事实上已经内置支持图片、JSON 等格式的内容，不过这并不影响我们对 Loader 这一概念的理解。

实现上，Loader 通常是一种 mapping 函数形式，接收原始代码内容，返回翻译结果，如：

```js
module.exports = function (source) {
  // 执行各种代码计算
  return modifySource;
};
```

在 Webpack 进入构建阶段后，首先会通过 IO 接口读取文件内容，之后调用 [LoaderRunner](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fwebpack%2Floader-runner) 并将文件内容以 source 参数形式传递到 Loader 数组，source 数据在 Loader 数组内可能会经过若干次形态转换，最终以标准 JavaScript 代码提交给 Webpack 主流程，以此实现内容翻译功能。

```js
module.exports = function (source, sourceMap?, data?) {
  return source;
};
```

Loader 接收三个参数，分别为：

- source：资源输入，对于第一个执行的 Loader 为资源文件的内容；后续执行的 Loader 则为前一个 Loader 的执行结果，可能是字符串，也可能是代码的 AST 结构；
- sourceMap: 可选参数，代码的 [sourcemap](https://link.juejin.cn/?target=https%3A%2F%2Fsourcemap.com%2F) 结构；
- data: 可选参数，其它需要在 Loader 链中传递的信息，比如 [posthtml/posthtml-loader](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fposthtml%2Fposthtml-loader) 就会通过这个参数传递额外的 AST 对象。

Loader 中执行的各种资源内容转译操作通常都是 CPU 密集型 —— 这放在 JavaScript 单线程架构下可能导致性能问题；又或者异步 Loader 会挂起后续的加载器队列直到异步 Loader 触发回调，稍微不注意就可能导致整个加载器链条的执行时间过长。

在 Loader 返回异步结果

```js
import less from "less";

async function lessLoader(source) {
  // 1. 获取异步回调函数
  const callback = this.async();
  // ...

  let result;

  try {
    // 2. 调用less 将模块内容转译为 css
    result = await (options.implementation || less).render(data, lessOptions);
  } catch (error) {
    // ...
  }

  const { css, imports } = result;

  // ...

  // 3. 转译结束，返回结果
  callback(null, css, map);
}

export default lessLoader;
```

在 less-loader 中，包含三个重要逻辑：

- 调用 this.async 获取异步回调函数，此时 Webpack 会将该 Loader 标记为异步加载器，会挂起当前执行队列直到 callback 被触发；
- 调用 less 库将 less 资源转译为标准 css；
- 调用异步回调 callback 返回处理结果。
- this.async 返回的异步回调函数签名与上一节介绍的 this.callback 相同，此处不再赘述。

在 Loader 中添加额外依赖

代码中首先调用 less 库编译文件内容，之后遍历所有 @import 语句(result.imports 数组)，调用 this.addDependency 函数将 import 到的文件都注册为依赖，此后这些资源文件发生变化时都会触发重新编译。

所以，addDependency 接口适用于那些 Webpack 无法理解隐式文件依赖的场景。除上例 less-loader，babel-loader 也是一个特别经典的案例。在 babel-loader 内部会添加对 Babel 配置文件如 .babelrc 的依赖，当 .babelrc 内容发生变化时，也会触发 babel-loader 重新运行

此外，Loader Context 还提供了下面几个与依赖处理相关的接口：

addContextDependency(directory: String)：添加文件目录依赖，目录下内容变更时会触发文件变更；addMissingDependency(file: String)：用于添加文件依赖，效果与 addDependency 类似；clearDependencies()：清除所有文件依赖。

链式调用模型详解

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.less$/i,
        use: ["style-loader", "css-loader", "less-loader"],
      },
    ],
  },
};
```

示例针对 .less 后缀的文件设定了 less、css、style 三个 Loader，Webpack 启动后会以一种所谓“链式调用”的方式按 use 数组顺序从后到前调用 Loader：

- 首先调用 less-loader 将 Less 代码转译为 CSS 代码；
- 将 less-loader 结果传入 css-loader，进一步将 CSS 内容包装成类似 module.exports = “${css}” 的 JavaScript 代码片段；
- 将 css-loader 结果传入 style-loader，在运行时调用 injectStyle 等函数，将内容注入到页面的 <style> 标签。

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/b30799fe744941f1b66aeb43f5df49c4_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

webpack 在 loader 基础上叠加了 pitch 的概念

什么是 pitch？

Webpack 允许在 Loader 函数上挂载名为 pitch 的函数，运行时 pitch 会比 Loader 本身更早执行

```js
const loader = function (source) {
  console.log("后执行");
  return source;
};

loader.pitch = function (requestString) {
  console.log("先执行");
};

module.exports = loader;
```

Pitch 函数的完整签名：

```js
function pitch(
  remainingRequest: string,
  previousRequest: string,
  data = {}
): void {}
```

包含三个参数：

- remainingRequest : 当前 loader 之后的资源请求字符串；
- previousRequest : 在执行当前 loader 之前经历过的 loader 列表；
- data : 与 Loader 函数的 data 相同，用于传递需要在 Loader 传播的信息

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.less$/i,
        use: ["style-loader", "css-loader", "less-loader"],
      },
    ],
  },
};
```

css-loader.pitch# 中拿到的参数依次为：

```js
// css-loader 之后的 loader 列表及资源路径
remainingRequest = less-loader!./xxx.less
// css-loader 之前的 loader 列表
previousRequest = style-loader
// 默认值
data = {}
```

Loader 链条执行过程分三个阶段：pitch、解析资源、执行，设计上与 DOM 的事件模型非常相似，pitch 对应到捕获阶段；执行对应到冒泡阶段；

而两个阶段之间 Webpack 会执行资源内容的读取、解析操作，对应 DOM 事件模型的 AT_TARGET 阶段：
![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/55d6c8006a4243d687f044aab0bd1b86_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

pitch 阶段按配置顺序从左到右逐个执行 loader.pitch 函数(如果有的话)，开发者可以在 pitch 返回任意值中断后续的链路的执行：

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/06f0126b303644449fce1cb8970001a6_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)
