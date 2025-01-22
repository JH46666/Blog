# Webpack5 核心原理与应用实践

## 重新认识下 webpack

webpack 的设计优点：

1.所有资源都是 Module，所以可以用同一套代码实现诸多特性，包括：代码压缩、Hot Module Replacement、缓存； 2.打包时,资源与资源之间非常容易实现信息互换，例如可以轻易在 HTML 插入 Base64 格式的图片； 3.借助 Loader，Webpack 几乎可以用任意方式处理任意类型的资源，例如可以用 Less、Stylus、Sass 等预编译 CSS 代码。

基于 Module Federation 的微前端方案；
基于 webpack-dev-server 的 Hot Module Replacement；
基于 Terser、Tree-shaking、SplitChunks 等工具的 JavaScript 代码压缩、优化、混淆方案；
基于 lazyCompilation 的延迟编译功能；
有利于提升应用性能的异步模块加载能力；
有利于提升构建性能的持久化缓存能力；
内置 JavaScript、JSON、二进制资源解析、生成能力；

学习目标：

1、通过各种应用场景摸清使用规律，结构化地理解各基础配置项与常见组件的用法
2、初步理解底层构建流程，学会分析性能卡点并据此做出正确性能优化
3、深入 Webpack 扩展规则，理解 Loader 与 Plugin 能做什么，怎么做
4、深挖源码，理解 Webpack 底层工作原理，加强应用与扩展能力。

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/2022-09-06-12-22-43%202.png>)

webpack 的打包过程
输入->模块处理->后处理->输出

输入：从文件系统读入代码文件；

模块递归处理：调用 Loader 转译 Module 内容，并将结果转换为 AST，从中分析出模块依赖关系，进一步递归调用模块处理过程，直到所有依赖文件都处理完毕；

后处理：所有模块递归处理完毕后开始执行后处理，包括模块合并、注入运行时、产物优化等，最终输出 Chunk 集合；

输出： 将 Chunk 写出到外部文件系统；

从打包流程角度，webpack 配置项大体上可分为两类：

- 流程类： 作用于打包流程某个或若干个环节，直接影响编译打包效果的配置项
- 工具类： 打包主流程之外，提供更多工程化的配置项
  与打包流程强相关的配置项有：
  _ 输入、输出
  entry：用于定义项目入口文件，Webpack 会从这些入口文件开始按图索骥找出所有项目文件；
  context：项目执行上下文路径；
  output：配置产物输出路径、名称等
  _ 模块处理
  resolve：用于配置模块路径解析规则，可用于帮助 Webpack 更精确、高效地找到指定模块
  module：用于配置模块加载规则，例如针对什么类型的资源需要使用哪些 Loader 进行处理
  externals: 用于声明外部资源，Webpack 会直接忽略这部分资源，跳过这些资源的解析、打包操作 \* 后处理
  optimization：用于控制如何优化产物包体积，内置 Dead Code Elimination、Scope Hoisting、代码混淆、代码压缩等功能
  target：用于配置编译产物的目标运行环境，支持 web、node、electron 等值，不同值最终产物会有所差异
  mode：编译模式短语，支持 development、production 等值，可以理解为一种声明环境的短语

这里的重点是，Webpack **首先**需要根据输入配置(entry/context) 找到项目入口文件；**之后**根据按模块处理(module/resolve/externals 等) 所配置的规则逐一处理模块文件，处理过程包括转译、依赖分析等；模块处理完毕后，最后**再根据**后处理相关配置项(optimization/target 等)合并模块资源、注入运行时依赖、优化产物结构等。

webpack 还提供了一系列用于提升研发效率的工具：

开发效率类：
_ watch：用于配置持续监听文件变化，持续构建
_ devtool：用于配置产物 Sourcemap 生成规则
_ devServer：用于配置与 HMR 强相关的开发服务器功能
性能优化类：
_ cache：Webpack 5 之后，该项用于控制如何缓存编译过程信息与编译结果 \* performance：用于配置当产物大小超过阈值时，如何通知开发者

日志类：
_ stats：用于精确地控制编译过程的日志内容，在做比较细致的性能调试时非常有用
_ infrastructureLogging：用于控制日志输出方式，例如可以通过该配置将日志输出到磁盘文件

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/E20B721E-52B1-4638-A369-81288EB3ABAC%202.png>)

处理 vue 文件

```js
// vue.config.js
module.exports = {
  chainWebpack: (config) => {
    config.module
      .rule("vue")
      .use("vue-loader")
      .tap((options) => {
        // modify the options...
        return options;
      });
  },
};
```

原生 Webpack 并不能识别 CSS 语法，假如不做额外配置直接导入 .css 文件，会导致编译失败：处理 css 文件

- [css-loader](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Floaders%2Fcss-loader%2F)：该 Loader 会将 CSS 等价翻译为形如 module.exports = “${css}” 的 JavaScript 代码，使得 Webpack 能够如同处理 JS 代码一样解析 CSS 内容与资源依赖；
- [style-loader](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Floaders%2Fstyle-loader%2F) ：该 Loader 将在产物中注入一系列 runtime 代码，这些代码会将 CSS 内容注入到页面的 <style> 标签，使得样式生效；
- [mini-css-extract-plugin](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fplugins%2Fmini-css-extract-plugin) ：该插件会将 CSS 代码抽离到单独的 .css 文件，并将文件通过 <link> 标签方式插入到页面中。

三种组件各司其职：css-loader 让 Webpack 能够正确理解 CSS 代码、分析资源依赖；style-loader、mini-css-extract-plugin 则通过适当方式将 CSS 插入到页面，对页面样式产生影响：
![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/5be680b877f44414a4349b62bc0143ba_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

css-loader 转译代码：

```css
.main-hd {
  font-size: 10px;
}
```

```js
//...

var ___CSS_LOADER_EXPORT___ =
  _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()(
    _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()
  );

// Module

___CSS_LOADER_EXPORT___.push([
  module.id,

  ".main-hd {\n    font-size: 10px;\n}",
  "",
]);

// Exports

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ =
  ___CSS_LOADER_EXPORT___;

//...
```

这段字符串只是被当作普通 JS 模块处理，并不会实际影响到页面样式，后续还需要：

- **开发环境**：使用 style-loader 将样式代码注入到页面 <style> 标签；
- **生产环境**：使用 mini-css-extract-plugin 将样式代码抽离到单独产物文件，并以 <link> 标签方式引入到页面中。

经过 **css-loader** 处理后，CSS 代码会被转译为等价 JS 字符串，但这些字符串还不会对页面样式产生影响，需要继续接入 style-loader 加载器。

与其它 Loader 不同，**style-loader** 并不会对代码内容做任何修改，而是简单注入一系列运行时代码，用于将 css-loader 转译出的 JS 字符串插入到页面的 style 标签

经过 **style-loader + css-loader** 处理后，样式代码最终会被写入 **Bundle** 文件，并在运行时通过 style 标签注入到页面。这种将 JS、CSS 代码合并进同一个产物文件的方式有几个问题：

Post-css

两者主要区别在于预处理器通常定义了一套 CSS 之上的超集语言；PostCSS 并没有定义一门新的语言，而是与 @babel/core 类似，只是实现了一套将 CSS 源码解析为 AST 结构，并传入 PostCSS 插件做处理的流程框架，具体功能都由插件实现。

::预处理器之于 CSS，就像 TypeScript 与 JavaScript 的关系；而 PostCSS 之于 CSS，则更像 Babel 与 JavaScript。::

**<link>是并行加载资源，加载完后构建 stylesheet**

- 编译时，将同一组件构建为适合在客户端、服务器运行的两份副本；
- 服务端接收到请求时，调用 Render 工具将组件渲染为 HTML 字符串，并返回给客户端；
- 客户端运行 HTML，并再次执行组件代码，“激活(Hydrate)” 组件。

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/06c7576bbb6b4ee596baa2bf4f2192ed_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

### 服务端渲染流程

1. 需要为客户端、服务端环境分别准备项目 Entry 文件，即上述目录中的 entry-client.js 与 entry-server.js

entry-client.js

```js
import { createSSRApp } from "vue";

import App from "./App.vue";

createSSRApp(App).mount("#app");
```

entry-server.js

```js
import { createSSRApp } from "vue";

import App from "./App.vue";

export default () => {
  return createSSRApp(App);
};
```

两者区别在于：客户端版本会立即调用 mount 接口，将组件挂载到页面上；而服务端版本只是 export 一个创建应用的工厂函数。

2. 分别为客户端、服务端版本编写 Webpack 配置文件，即上述目录中的三个\***_webpack._.js**## 文件

3. 服务端的 webpack 配置

```json
  entry: {
    server: path.join(__dirname, "src/entry-server.js"),
  },
  target: "node",
  output: {
    // 打包后的结果会在 node 环境使用
    // 因此此处将模块化语句转译为 commonjs 形式
    libraryTarget: "commonjs2",
  },
```

4. 编写 Node 应用代码\***\*server.js**，简单起见，此处仅实现基础功能：

```js
// server.js
const express = require("express");
const path = require("path");
const { renderToString } = require("@vue/server-renderer");

// 通过 manifest 文件，找到正确的产物路径
const clientManifest = require("./dist/manifest-client.json");
const serverManifest = require("./dist/manifest-server.json");
const serverBundle = path.join(
  __dirname,
  "./dist",
  serverManifest["server.js"]
);
// 这里就对标到 `entry-server.js` 导出的工厂函数
const createApp = require(serverBundle).default;

const server = express();

server.get("/", async (req, res) => {
  const app = createApp();

  const html = await renderToString(app);
  const clientBundle = clientManifest["client.js"];
  res.send(`
<!DOCTYPE html>
<html>
    <head>
      <title>Vue SSR Example</title>
    </head>
    <body>
      <!-- 注入组件运行结果 -->
      <div id="app">${html}</div>
      <!-- 注入客户端代码产物路径 -->
      <!-- 实现 Hydrate 效果 -->
      <script src="${clientBundle}"></script>
    </body>
</html>
    `);
});

server.use(express.static("./dist"));

server.listen(3000, () => {
  console.log("ready");
});
```

可以看出，Node 服务的核心逻辑在于：

- 调用 entry-server.js 导出的工厂函数渲染出 Vue 组件结构；
- 调用 @vue/server-renderer 将组件渲染为 HTML 字符串；
- 拼接 HTML 内容，将组件 HTML 字符串与 entry-client.js 产物路径注入到 HTML 中，并返回给客户端。

构建第三方包时要注意的

- 正确导出模块内容；
- 不要将第三方包打包进产物中，以免与业务方环境发生冲突；
- 将 CSS 抽离为独立文件，以方便用户自行决定实际用法；
- 始终生成 Sourcemap 文件，方便用户调试。

```js
// webpack.config.js
module.exports = {
  // ...
+  externals: {
+   lodash: {
+     commonjs: "lodash",
+     commonjs2: "lodash",
+     amd: "lodash",
+     root: "_",
+   },
+ },
  // ...
};

```

Webpack 编译过程会跳过 [externals](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fconfiguration%2Fexternals%2F) 所声明的库，并假定消费场景已经安装了相关依赖，常用于 NPM 库开发场景；在 Web 应用场景下则常被用于优化性能。

至此，Webpack 不再打包 lodash 代码，我们可以顺手将 lodash 声明为 peerDependencies：

```json
{
  "name": "6-1_test-lib",
  // ...
+ "peerDependencies": {
+   "lodash": "^4.17.21"
+ }
}

```

模块联邦
Module Federation 通常译作“**模块联邦**”，是 Webpack 5 新引入的一种远程模块动态加载、运行技术。MF 允许我们将原本单个巨大应用按我们理想的方式拆分成多个体积更小、职责更内聚的小应用形式，理想情况下各个应用能够实现独立部署、独立开发(不同应用甚至允许使用不同技术栈)、团队自治，从而降低系统与团队协作的复杂度 —— 没错，这正是所谓的微前端架构。

优点：

- 应用可按需导出若干模块，这些模块最终会被单独打成模块包，功能上有点像 NPM 模块；
- 应用可在运行时基于 HTTP(S) 协议动态加载其它应用暴露的模块，且用法与动态加载普通 NPM 模块一样简单；
- 与其它微前端方案不同，MF 的应用之间关系平等，没有主应用/子应用之分，每个应用都能导出/导入任意模块

在 Webpack4 中导入图像
file-loader: 将图像引用转换为 url 语句并生成相应图片文件.

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/f6384383d6df4060b973bd3ad8f261eb_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)
url-loader:
raw-loader:

配置结构详解：

- **单个配置对象**：比较常用的一种方式，逻辑简单，适合大多数业务项目；
- **配置对象数组**：每个数组项都是一个完整的配置对象，每个对象都会触发一次单独的构建，通常用于需要为同一份代码构建多种产物的场景，如 Library；
- **函数**：Webpack 启动时会执行该函数获取配置，我们可以在函数中根据环境参数(如 NODE_ENV)动态调整配置对象。

使用配置数组：

```js
// webpack.config.js
module.exports = [
  {
    entry: "./src/index.js",
    // 其它配置...
  },
  {
    entry: "./src/index.js",
    // 其它配置...
  },
];
```

使用数组方式时，Webpack 会在启动后创建多个 **Compilation** 实例，并行执行构建工作，但需要注意**，Compilation** 实例间基本上不作通讯，这意味着这种并行构建对运行性能并没有任何正向收益，例如某个 Module 在 Compilation 实例 A 中完成解析、构建后，在其它 Compilation 中依然需要完整经历构建流程，无法直接复用结果。

数组方式主要用于应对“同一份代码打包出多种产物”的场景，例如在构建 Library 时，我们通常需要同时构建出 ESM/CMD/UMD 等模块方案的产物，如：

```js
// webpack.config.js
module.exports = [
  {
    output: {
      filename: "./dist-amd.js",
      libraryTarget: "amd",
    },
    name: "amd",
    entry: "./app.js",
    mode: "production",
  },
  {
    output: {
      filename: "./dist-commonjs.js",
      libraryTarget: "commonjs",
    },
    name: "commonjs",
    entry: "./app.js",
    mode: "production",
  },
];
```

**配置函数**”这种方式的意义在于，允许用户根据命令行参数动态创建配置对象，可用于实现简单的多环境治理策略，例如：

```js
// npx webpack --env app.type=miniapp --mode=production
module.exports = function (env, argv) {
  return {
    mode: argv.mode ? "production" : "development",
    devtool: argv.mode ? "source-map" : "eval",
    output: {
      path: path.join(__dirname, `./dist/${env.app.type}`,
      filename: '[name].js'
    },
    plugins: [
      new TerserPlugin({
        terserOptions: {
          compress: argv.mode === "production",
        },
      }),
    ],
  };
};
```

**核心配置项汇总**

- entry：声明项目入口文件，Webpack 会从这个文件开始递归找出所有文件依赖；
- output：声明构建结果的存放位置；
- target：用于配置编译产物的目标运行环境，支持 web、node、electron 等值，不同值最终产物会有所差异；
- mode：编译模式短语，支持 development、production 等值，Webpack 会根据该属性推断默认配置；
- optimization：用于控制如何优化产物包体积，内置 Dead Code ::Elimination::、Scope Hoisting、代码混淆、代码压缩等功能；
- module：用于声明模块加载规则，例如针对什么类型的资源需要使用哪些 Loader 进行处理；
- plugin：Webpack 插件列表。

entry 配置详解：

- 字符串：指定入口文件路径；
- 对象：对象形态功能比较完备，除了可以指定入口文件列表外，还可以指定入口依赖、Runtime 打包方式等；
- 函数：动态生成 Entry 配置信息，函数中可返回字符串、对象或数组；
- 数组：指明多个入口文件，数组项可以为上述介绍的文件路径字符串、对象、函数形式，Webpack 会将数组指明的入口全部打包成一个 Bundle。

```js
module.exports = {
  //...
  entry: {
    // 字符串形态
    home: './home.js',
    // 数组形态
    shared: ['react', 'react-dom', 'redux', 'react-redux'],
    // 对象形态
    personal: {
      import: './personal.js',
      filename: 'pages/personal.js',
      dependOn: 'shared',
      chunkLoading: 'jsonp',
      asyncChunks: true
    },
    // 函数形态
    admin: function() {
      return './admin.js';
    }
  },
```

- import：声明入口文件，支持路径字符串或路径数组(多入口)；
- dependOn：声明该入口的前置依赖 Bundle；
- runtime：设置该入口的 Runtime Chunk，若该属性不为空，Webpack 会将该入口的运行时代码抽离成单独的 Bundle；
- filename：效果与 [output.filename](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fconfiguration%2Foutput%2F%23outputfilename) 类同，用于声明该模块构建产物路径；
- library：声明该入口的 [output.library](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fconfiguration%2Foutput%2F%23outputlibrary) 配置，一般在构建 NPM Library 时使用；
- publicPath：效果与 [output.publicPath](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fconfiguration%2Foutput%2F%23outputpublicpath) 相同，用于声明该入口文件的发布 URL；
- chunkLoading：效果与 [output.chunkLoading](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fconfiguration%2Foutput%2F%23outputchunkloading) 相同，用于声明异步模块加载的技术方案，支持 false/jsonp/require/import 等值；
- asyncChunks：效果与 [output.asyncChunks](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fconfiguration%2Foutput%2F%23outputasyncchunks) 相同，用于声明是否支持异步模块加载，默认值为 true。

webpack 底层的工作流程：

1. 初始化阶段：

- **初始化参数**：从配置文件、 配置对象、Shell 参数中读取，与默认配置结合得出最终的参数；
- **创建编译器对象**：用上一步得到的参数创建 Compiler 对象；
- **初始化编译环境**：包括注入内置插件、注册各种模块工厂、初始化 RuleSet 集合、加载配置的插件等；
- **开始编译**：执行 compiler 对象的 run 方法，创建 Compilation 对象；
- **确定入口**：根据配置中的 entry 找出所有的入口文件，调用 compilation.addEntry 将入口文件转换为 dependence 对象。

2. 构建阶段：

- **编译模块(make)**：从 entry 文件开始，调用 loader 将模块转译为标准 JS 内容，调用 JS 解析器将内容转换为 AST 对象，从中找出该模块依赖的模块，再 **递归** 处理这些依赖模块，直到所有入口依赖的文件都经过了本步骤的处理；
- **完成模块编译**：上一步递归处理所有能触达到的模块后，得到了每个模块被翻译后的内容以及它们之间的依赖关系图。

3. 封装阶段：

- **合并(seal)**：根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 Chunk；
- **优化(optimization)**：对上述 Chunk 施加一系列优化操作，包括：tree-shaking、terser、scope-hoisting、压缩、Code Split 等；
- **写入文件系统(emitAssets)**：在确定好输出内容后，根据配置确定输出的路径和文件名，把文件内容写入到文件系统。

性能问题的地方

构建阶段：

- 首先需要将文件的相对引用路径转换为绝对路径，这个过程可能涉及多次 IO 操作，执行效率取决于 **文件层次深度**；
- 找到具体文件后，需要读入文件内容并调用 [loader-runner](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Floader-runner%2Fblob%2FHEAD%2Flib%2FLoaderRunner.js) 遍历 Loader 数组完成内容转译，这个过程需要执行较密集的 CPU 操作，执行效率取决于 **Loader 的数量与复杂度**；
- 需要将模块内容解析为 AST 结构，并遍历 AST 找出模块的依赖资源，这个过程同样需要较密集的 CPU 操作，执行效率取决于 **代码复杂度**；
- 递归处理依赖资源，执行效率取决于 **模块数量**。

封装阶段：

- 根据 splitChunks 配置、entry 配置、动态模块引用语句等，确定模块与 Chunk 的映射关系，其中 splitChunks 相关的分包算法非常复杂，涉及大量 CPU 计算；
- 根据 optimization 配置执行一系列产物优化操作，特别是 [Terser](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fwebpack-contrib%2Fterser-webpack-plugin) 插件需要执行大量 AST 相关的运算，执行效率取决于 **产物代码量**；

性能分析：
收集数据的方法很简单 —— Webpack 内置了 [stats](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fapi%2Fstats%2F) 接口，专门用于统计模块构建耗时、模块依赖关系等信息，推荐用法：

1. 添加 profile = true 配置：
2. 运行编译命令，并添加 —json 参数，参数值为最终生成的统计文件名，如：

```js
npx webpack --json=stats.json
```

stats 对象收集了 Webpack 运行过程中许多值得关注的信息，包括：

- modules：本次打包处理的所有模块列表，内容包含模块的大小、所属 chunk、构建原因、依赖模块等，特别是 modules.profile 属性，包含了构建该模块时，解析路径、编译、打包、子模块打包等各个环节所花费的时间，非常有用；
- chunks：构建过程生成的 chunks 列表，数组内容包含 chunk 名称、大小、包含了哪些模块等；
- assets：编译后最终输出的产物列表、文件路径、文件大小等；
- entrypoints：entry 列表，包括动态引入所生产的 entry 项也会包含在这里面；
- children：子 Compiler 对象的性能数据，例如 extract-css-chunk-plugin 插件内部就会调用 [compilation.createChildCompiler](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Ffaceyspacey%2Fextract-css-chunks-webpack-plugin%2Fblob%2FHEAD%2Fsrc%2Floader.js%23L82) 函数创建出子 Compiler 来做 CSS 抽取的工作。

**Webpack5 中的持久化缓存**
[持久化缓存](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fconfiguration%2Fcache%2F%23cache) 算得上是 Webpack 5 最令人振奋的特性之一，它能够将首次构建的过程与结果数据持久化保存到本地文件系统，在下次执行构建时跳过解析、链接、编译等一系列非常消耗性能的操作，直接复用上次的 Module/ModuleGraph/Chunk 对象数据，迅速构建出最终产物。

cache 还提供了若干用于配置缓存效果、缓存周期的配置项，包括：

- cache.type## ：缓存类型，支持
  ‘memory’ | ‘filesystem’## ，需要设置为
  filesystem## 才能开启持久缓存；
- cache.cacheDirectory## ：缓存文件路径，默认为
  node_modules/.cache/webpack## ；
- cache.buildDependencies## ：额外的依赖文件，当这些文件内容发生变化时，缓存会完全失效而执行完整的编译构建，通常可设置为各种配置文件，如：

```js
module.exports = {
  cache: {
    type: "filesystem",
    buildDependencies: {
      config: [
        path.join(__dirname, "webpack.dll_config.js"),
        path.join(__dirname, ".babelrc"),
      ],
    },
  },
};
```

- cache.managedPaths：受控目录，Webpack 构建时会跳过新旧代码哈希值与时间戳的对比，直接使用缓存副本，默认值为 [‘./node_modules’]；
- cache.profile：是否输出缓存处理过程的详细日志，默认为 false；
- cache.maxAge：缓存失效时间，默认值为 5184000000 。

### 缓存原理：

Webpack5 会将首次构建出的 Module、Chunk、ModuleGraph 等对象序列化后保存到硬盘中，后面再运行的时候，就可以跳过许多耗时的编译动作，直接复用缓存数据。
![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/58feafdeed084eefa40f12f98b627262_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

- 初始化，主要是根据配置信息设置内置的各类插件。
- Make - 构建阶段，从 entry 模块开始，执行：
  - 读入文件内容；
  - 调用 Loader 转译文件内容；
  - 调用 [acorn](https://link.juejin.cn/?target=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Facorn) 生成 AST 结构；
  - 分析 AST，确定模块依赖列表；
  - 遍历模块依赖列表，对每一个依赖模块重新执行上述流程，直到生成完整的模块依赖图 —— ModuleGraph 对象。
- Seal - 生成阶段，过程：
  - 遍历模块依赖图，对每一个模块执行：
    - 代码转译，如 import 转换为 require 调用；
    - 分析运行时依赖。
  - 合并模块代码与运行时代码，生成 chunk；
  - 执行产物优化操作，如 Tree-shaking；
  - 将最终结果写出到产物文件。

过程中存在许多 CPU 密集型操作，例如调用 Loader 链加载文件时，遇到 babel-loader、eslint-loader、ts-loader 等工具时可能需要重复生成 AST；分析模块依赖时则需要遍历 AST，执行大量运算；Seal 阶段也同样存在大量 AST 遍历，以及代码转换、优化操作，等等。假设业务项目中有 1000 个文件，则每次执行 npx webpack 命令时，都需要从 0 开始执行 1000 次构建、生成逻辑

Webpack 在首次构建完毕后将 Module、Chunk、ModuleGraph 三类对象的状态序列化并记录到缓存文件中；在下次构建开始时，尝试读入并恢复这些对象的状态，从而跳过执行 Loader 链、解析 AST、解析依赖等耗时操作，提升编译性能。

### Webpack4：使用 **cache-loader**

1. cache-loader
   先从 cache-loader 说起，cache-loader 能够将 Loader 处理结果保存到硬盘，下次运行时若文件内容没有发生变化则直接返回缓存结果，用法：

cache-loader 只缓存了 Loader 执行结果，缓存范围与精度不如 Webpack5 内置的缓存功能，所以性能效果相对较低

2. hard-source-webpack-plugin
3. babel-loader# 时，只需设置 cacheDirectory = true

```js
module.exports = {
    *// …*
    module: {
        rules: [{
            test: /\.m?js$/,
            loader: ‘babel-loader’,
            options: {
                cacheDirectory: true,
            },
        }]
    },
    *// …*
};
```

## webpack 并行构建

- [HappyPack](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Famireh%2Fhappypack) ：多进程方式运行资源加载(Loader)逻辑；
  [Thread-loader](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Floaders%2Fthread-loader%2F) ：Webpack 官方出品，同样以多进程方式运行资源加载逻辑

这些方案的核心设计都很类似：
针对某种计算任务创建子进程，之后将运行所需参数通过 IPC 传递到子进程并启动计算操作，计算完毕后子进程再将结果通过 IPC 传递回主进程，寄宿在主进程的组件实例，再将结果提交给 Webpack。

### HappyPack

能够将耗时的文件加载（Loader）操作拆散到多个子进程中并发执行，子进程执行完毕再将结果合并回传到 Webpack 进程，从而提升构建性能。不过，HappyPack 的用法稍微有点难以理解，需要同时：

- 使用 happypack/loader 代替原本的 Loader 序列；
- 使用 HappyPack 插件注入代理执行 Loader 序列的逻辑。

HappyPack 提供了一套简单易用的共享进程池接口，只需要创建 HappyPack.ThreadPool 对象，并通过 size 参数限定进程总量，之后将该例配置到各个 HappyPack 插件的 threadPool 属性上即可，例如：

### Thread-loader

Thread-loader 会在加载文件时创建新的进程，在子进程中使用 loader-runner 库运行 thread-loader 之后的 Loader 组件，执行完毕后再将结果回传到 Webpack 主进程，从而实现性能更佳的文件加载转译效果。

thread-loader 还提供了一系列用于控制并发逻辑的配置项，包括：

- workers：子进程总数，默认值为 require(‘os’).cpus() - 1；
- workerParallelJobs：单个进程中并发执行的任务数；
- poolTimeout：子进程如果一直保持空闲状态，超过这个时间后会被关闭；
- poolRespawn：是否允许在子进程关闭后重新创建新的子进程，一般设置为 false 即可；
- workerNodeArgs：用于设置启动子进程时，额外附加的参数。

## 并行压缩

Webpack4 默认使用 [Uglify-js](https://link.juejin.cn/?target=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Fuglifyjs-webpack-plugin) 实现代码压缩，Webpack5 之后则升级为 [Terser](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fplugins%2Fterser-webpack-plugin%2F) —— 一种 [性能](https://link.juejin.cn/?target=https%3A%2F%2Fblog.logrocket.com%2Fterser-vs-uglify-vs-babel-minify-comparing-javascript-minifiers%2F) 与兼容性更好的 JavaScript 代码压缩混淆工具，两种组件都原生实现了多进程并行压缩能力

受限于 JavaScript 的单线程架构，Webpack 构建时并不能充分使用现代计算机的多核 CPU 能力，为此社区提供了若干基于多进程实现的并行构建组件，包括文中介绍的 HappyPack、Thread-loader、Parallel-Webpack、Terser。

- 对于 Webpack4 之前的项目，可以使用 HappyPack 实现并行文件加载；
- Webpack4 之后则建议使用 Thread-loader；
- 多实例并行构建场景建议使用 Parallel-Webpack 实现并行；
- 生产环境下还可配合 terser-webpack-plugin 的并行压缩功能，提升整体效率。

## 哪些值得学习的构建性能极致优化技巧

### 使用**lazyCompilation**

```js
// webpack.config.js
module.exports = {
  // ...
  experiments: {
    lazyCompilation: true,
  },
};
```

启动 lazyCompilation 后，代码中通过异步引用语句如 import(‘./xxx’) 导入的模块（以及未被访问到的 entry）都不会被立即编译，而是直到页面正式请求该模块资源（例如切换到该路由）时才开始构建，效果与 Vite 相似，能够极大提升冷启速度。

此外，lazyCompilation 支持如下参数：

- backend： 设置后端服务信息，一般保持默认值即可；
- entries：设置是否对 entry 启动按需编译特性；
- imports：设置是否对异步模块启动按需编译特性；
- test：支持正则表达式，用于声明对那些异步模块启动按需编译特性。

### **约束 Loader 执行范围**

module.rules.include# 、module.rules.exclude

### 开发模式禁用产物优化

Webpack 提供了许多产物优化功能，例如：Tree-Shaking、SplitChunks、Minimizer 等，这些能力能够有效减少最终产物的尺寸，提升生产环境下的运行性能，但这些优化在开发环境中意义不大，反而会增加构建器的负担(都是性能大户)。

因此，开发模式下建议关闭这一类优化功能，具体措施：

- 确保 mode=‘development’ 或 mode = ‘none’，关闭默认优化策略；
- optimization.minimize 保持默认值或 false，关闭代码压缩；
- optimization.concatenateModules 保持默认值或 false，关闭模块合并；
- optimization.splitChunks 保持默认值或 false，关闭代码分包；
- optimization.usedExports 保持默认值或 false，关闭 Tree-shaking 功能；

### **最小化\*\***watch\***\*监控范围**

在 watch 模式下（通过 npx webpack —watch 命令启动），Webpack 会持续监听项目目录中所有代码文件，发生变化时执行 rebuild 命令。

不过，通常情况下前端项目中部分资源并不会频繁更新，例如 node_modules ，此时可以设置 watchOptions.ignored 属性忽略这些文件，例如：

```js
// webpack.config.js
module.exports = {
  //...
  watchOptions: {
    ignored: /node_modules/,
  },
};
```

### 优化 ESlint 性能

#### 慎用**source-map**

针对 source-map 功能，Webpack 提供了 devtool 选项，可以配置 eval、source-map、cheap-source-map 等值，不考虑其它因素的情况下，最佳实践：

- 开发环境使用 eval ，确保最佳编译速度；
- 生产环境使用 source-map，获取最高质量

#### **设置\*\***resolve\***\*缩小搜索范围**

## 1.**resolve.extensions**## 配置：

- ## 修改 resolve.extensions## 配置项，减少匹配次数；
- ## 代码中尽量补齐文件后缀名；
- ## 设置 resolve.enforceExtension = true

  2.**resolve.modules**## 配置：

```js
// webpack.config.js
const path = require("path");

module.exports = {
  //...
  resolve: {
    modules: [path.resolve(__dirname, "node_modules")],
  },
};
```

## 3.**resolve.mainFiles**## 配置：

与 resolve.extensions 类似，resolve.mainFiles 配置项用于定义文件夹默认文件名，例如对于 import ‘./dir’## 请求，假设 resolve.mainFiles = [‘index’, ‘home’] ，Webpack 会按依次测试./dir/index## 与./dir/home## 文件是否存在。

### 深入理解 chunk

1.  Webpack 首先根据 entry 配置创建若干 Chunk 对象；
2.  遍历构建(Make)阶段找到的所有 Module 对象，同一 Entry 下的模块分配到 Entry 对应的 Chunk 中；
3.  遇到异步模块则创建新的 Chunk 对象，并将异步模块放入该 Chunk；
4.  分配完毕后，根据 SplitChunksPlugin 的启发式算法进一步对这些 Chunk 执行**裁剪、拆分、合并、代码调优**，最终调整成运行性能(可能)更优的形态；
5.  最后，将这些 Chunk 一个个输出成最终的产物(Asset)文件，编译工作到此结束。

Chunk 在构建流程中起着承上启下的关键作用 —— 一方面作为 Module 容器，根据一系列默认 **分包策略** 决定哪些模块应该合并在一起打包；另一方面根据 splitChunks 设定的 **策略** 优化分包，决定最终输出多少产物文件。

**Chunk 分包结果的好坏直接影响了最终应用性能**，Webpack 默认会将以下三种模块做分包处理：

- Initial Chunk：entry 模块及相应子模块打包成 Initial Chunk；
- Async Chunk：通过 import(‘./xx’) 等语句导入的异步模块及相应子模块组成的 Async Chunk；
- Runtime Chunk：运行时代码抽离成 Runtime Chunk，可通过 [entry.runtime](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fconfiguration%2Fentry-context%2F%23dependencies) 配置项实现。

1. 模块重复打包：
   假如多个 Chunk 同时依赖同一个 Module，那么这个 Module 会被不受限制地重复打包进这些 Chunk
   ![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/1481f62edb484224aefd7498bb9b871a_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

示例中 main/index 入口(entry)同时依赖于 c 模块，默认情况下 Webpack 不会对此做任何优化处理，只是单纯地将 c 模块同时打包进 main/index 两个 Chunk：
![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/ae729e4dd408433ea242733ae9913d89_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

2. 资源冗余 & 低效缓存：

- 将被多个 Chunk 依赖的包分离成独立 Chunk，防止资源重复；
- node_modules 中的资源通常变动较少，可以抽成一个独立的包，业务代码的频繁变动不会导致这部分第三方库资源缓存失效，被无意义地重复加载

**SplitChunksPlugin 简介**

- SplitChunksPlugin 支持根据 Module 路径、Module 被引用次数、Chunk 大小、Chunk 请求数等决定是否对 Chunk 做进一步拆解，这些决策都可以通过 optimization.splitChunks 相应配置项调整定制，基于这些能力我们可以实现：

  - 单独打包某些特定路径的内容，例如 node_modules 打包为 vendors；
  - 单独打包使用频率较高的文件；

- SplitChunksPlugin 还提供了**optimization.splitChunks.cacheGroup** 概念，用于对不同特点的资源做分组处理，并为这些分组设置更有针对性的分包规则；

- SplitChunksPlugin 还内置了 default 与 defaultVendors 两个 cacheGroup，提供一些开箱即用的分包特性：
  - node_modules 资源会命中 defaultVendors 规则，并被单独打包；
  - 只有包体超过 20kb 的 Chunk 才会被单独打包；
  - 加载 Async Chunk 所需请求数不得超过 30；
  - 加载 Initial Chunk 所需请求数不得超过 30。

splitChunks 主要有两种类型的配置：

- minChunks/minSize/maxInitialRequest 等分包条件，满足这些条件的模块都会被执行分包；
- cacheGroup ：用于为特定资源声明特定分包条件，例如可以为
  node_modules 包设定更宽松的分包条件。

## 设置分包范围

首先，SplitChunksPlugin 默认情况下只对 Async Chunk 生效，我们可以通过 splitChunks.chunks 调整作用范围，该配置项支持如下值：

- 字符串 ‘all’ ：对 Initial Chunk 与 Async Chunk 都生效，建议优先使用该值；
- 字符串 ‘initial’ ：只对 Initial Chunk 生效；
- 字符串 ‘async’ ：只对 Async Chunk 生效；
- 函数 (chunk) => boolean ：该函数返回 true 时生效；

```js
module.exports = {
  //...
  optimization: {
    splitChunks: {
      chunks: "all",
    },
  },
};
```

设置为 all 效果最佳，此时 Initial Chunk、Async Chunk 都会被 SplitChunksPlugin 插件优化。

### **根据 Module 使用频率分包**

- **限制分包数量**
- **限制分包体积**

SplitChunksPlugin# 的主体流程如下：

1. SplitChunksPlugin 尝试将命中 minChunks 规则的 Module 统一抽到一个额外的 Chunk 对象；
2. 判断该 Chunk 是否满足 maxInitialRequests 阈值，若满足则进行下一步；
3. 判断该 Chunk 资源的体积是否大于上述配置项 minSize 声明的下限阈值；
   - 如果体积**小于** minSize 则取消这次分包，对应的 Module 依然会被合并入原来的 Chunk
   - 如果 Chunk 体积**大于** minSize 则判断是否超过 maxSize、maxAsyncSize、maxInitialSize 声明的上限阈值，如果超过则尝试将该 Chunk 继续分割成更小的部分

Chunk 是 Webpack 实现模块打包的关键设计，Webpack 会首先为 Entry 模块、异步模块、Runtime 模块(取决于配置) 创建 Chunk 容器，之后按照 splitChunks 配置进一步优化、裁剪分包内容。
splitChunks 规则比较复杂，大致上可以分类为：

- 规则类：如 minSize/minChunks 等，匹配这些条件的 Module 都会被单独分包；
- cacheGroup：可以理解为针对特定资源的次级规则集合。

## 配置项与最佳实践

最后，我们再回顾一下 SplitChunksPlugin 支持的配置项：

- minChunks：用于设置引用阈值，被引用次数超过该阈值的 Module 才会进行分包处理；
- maxInitialRequest/maxAsyncRequests：用于限制 Initial Chunk(或 Async Chunk) 最大并行请求数，本质上是在限制最终产生的分包数量；
- minSize： 超过这个尺寸的 Chunk 才会正式被分包；
- maxSize： 超过这个尺寸的 Chunk 会尝试继续做分包；
- maxAsyncSize： 与 maxSize 功能类似，但只对异步引入的模块生效；
- maxInitialSize： 与 maxSize 类似，但只对 entry 配置的入口模块生效；
- enforceSizeThreshold： 超过这个尺寸的 Chunk 会被强制分包，忽略上述其它 size 限制；
- cacheGroups：用于设置缓存组规则，为不同类型的资源设置更有针对性的分包策略。
  结合这些特性，业界已经总结了许多惯用的最佳分包策略，包括：
- 针对 node_modules 资源：
  - 可以将 node_modules 模块打包成单独文件(通过 cacheGroups 实现)，防止业务代码的变更影响 NPM 包缓存，同时建议通过 maxSize 设定阈值，防止 vendor 包体过大；
  - 更激进的，如果生产环境已经部署 HTTP2/3 一类高性能网络协议，甚至可以考虑将每一个 NPM 包都打包成单独文件，具体实现可查看小册 [示例](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2FTecvan-fe%2Fwebpack-book-samples%2Fblob%2F50c9a47ce3%2Fsplitchunks-seperate-npm%2Fwebpack.config.js%23L19-L20) ；
- 针对业务代码：
  - 设置 common 分组，通过 minChunks 配置项将使用率较高的资源合并为 Common 资源；
  - 首屏用不上的代码，尽量以异步方式引入；
  - 设置 optimization.runtimeChunk 为 true，将运行时代码拆分为独立资源。

实践中，分包策略的好坏直接影响应用的运行性能，常用策略一是单独打包 node_modules 代码(习惯称为 vendor)，二是单独打包被频繁使用的模块(习惯称为 common)。

### 代码压缩

## 优化方案

### 动态加载

import、require.ensure

- **一是过度使用会使产物变得过度细碎，产物文件过多，运行时 HTTP 通讯次数也会变多**，在 HTTP 1.x 环境下这可能反而会降低网络性能，得不偿失

- **二是使用时 Webpack 需要在客户端注入一大段用于支持动态加载特性的 Runtime**：

### HTTP 缓存优化

- [fullhash]：整个项目的内容 Hash 值，项目中任意模块变化都会产生新的 fullhash；
- [chunkhash]：产物对应 Chunk 的 Hash，Chunk 中任意模块变化都会产生新的 chunkhash；
- [contenthash]：产物内容 Hash 值，仅当产物内容发生变化时才会产生新的 contenthash，因此实用性较高。

异步 Chunk 变化会导致父 Chunk 也跟着变化， 此时可以用 optimization.runtimeChunk 将这部分代码抽取为单独的 Runtime Chunk

```js
module.exports = {
  entry: { index: "./src/index.js" },
  mode: "development",
  devtool: false,
  output: {
    filename: "[name]-[contenthash].js",
    path: path.resolve(__dirname, "dist"),
  },
  // 将运行时代码抽取到 `runtime` 文件中
  optimization: { runtimeChunk: { name: "runtime" } },
};
```

### 使用外置依赖

externals

```json
module.exports = {
  // ...
  externals: {
    lodash: "_",
  },
};
```

### **使用 Tree-Shaking 删除多余模块导出**

是一种基于 ES Module 规范的 Dead Code Elimination 技术，它会在运行过程中静态分析模块之间的导入导出，判断哪些模块导出值没有被其它模块使用 —— 相当于模块层面的 Dead Code，并将其删除。

### **使用 Scope Hoisting 合并模块**

Webpack 提供了 Scope Hoisting 功能，用于 **将符合条件的多个模块合并到同一个函数空间** 中，从而减少产物体积，优化性能。

### 监控产物体积

```js
module.exports = {
  // ...
  performance: {
    // 设置所有产物体积阈值
    maxAssetSize: 172 * 1024,
    // 设置 entry 产物体积阈值
    maxEntrypointSize: 244 * 1024,
    // 报错方式，支持 `error` | `warning` | false
    hints: "error",
    // 过滤需要监控的文件类型
    assetFilter: function (assetFilename) {
      return assetFilename.endsWith(".js");
    },
  },
};
```

一个比较好的 [经验法则](https://link.juejin.cn/?target=https%3A%2F%2Fweb.dev%2Fyour-first-performance-budget%2F%23budget-for-quantity-based-metrics) 是确保 [关键路径](https://link.juejin.cn/?target=https%3A%2F%2Fweb.dev%2Fcritical-rendering-path%2F) 资源体积始终小于 170KB，超过这个体积就应该使用上面介绍的若干方法做好裁剪优化。

一是 Loader —— 主要负责将资源内容翻译成 Webpack 能够理解、处理的 JavaScript 代码；
二是 Plugin —— 深度介入 Webpack 构建过程，**重塑** 构建逻辑。

## 从开源项目学习 Loader

[Webpack5 核心原理与应用实践-loader](./Webpack5%20核心原理与应用实践-loader.md)

### plugin

[Webpack5 核心原理与应用实践-plugin](./Webpack5%20核心原理与应用实践-plugin.md)

### SyncHook 钩子

```js
const { SyncHook } = require("tapable");

class Somebody {
  constructor() {
    this.hooks = {
      sleep: new SyncHook(),
    };
  }
  sleep() {
    //   触发回调
    this.hooks.sleep.call();
  }
}

const person = new Somebody();

// 注册回调
person.hooks.sleep.tap("test", () => {
  console.log("callback A");
});
person.hooks.sleep.tap("test", () => {
  console.log("callback B");
});
person.hooks.sleep.tap("test", () => {
  console.log("callback C");
});

person.sleep();
```

示例中，Somebody 初始化时声明了一个 sleep 钩子，并在后续调用 sleep.tap 函数连续注册三次回调，在调用 person.sleep() 语句触发 sleep.call 之后，tapable 会按照注册的先后按序执行三个回调。

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/b92ebab230e746caaa7a0ae4b90ae581_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

webpack 构建步骤：
![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/a26d60df160440adae904dcdeefb44d7_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

### 初始化阶段

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/3293ad8708e14a8db0567dac24fb8668_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)
**1** **初始化阶段**：修整配置参数，创建 Compiler、Compilation 等基础对象，并初始化插件及若干内置工厂、工具类，并最终根据 entry 配置，找到所有入口模块；
**2** **构建阶段**：从 entry 文件开始，调用 loader 将模块转译为 JavaScript 代码，调用 [Acorn](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Facornjs%2Facorn) 将代码转换为 AST 结构，遍历 AST 从中找出该模块依赖的模块；之后 **递归** 遍历所有依赖模块，找出依赖的依赖，直至遍历所有项目资源后，构建出完整的 [模块依赖关系图](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fconcepts%2Fdependency-graph%2F) ；
**3** **生成阶段**：根据 entry 配置，将模块组装为一个个 Chunk 对象，之后调用一系列 Template 工厂类翻译 Chunk 代码并封装为 Asset，最后写出到文件系统。

```js

```

初始化阶段主要完成三个功能：修整 & 校验配置对象、运行插件、调用 compiler.compile 方法开始执行构建操作，代码比较简单
![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/83d697220d324ed5a3ddba7e90d332ca_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

首先，校验用户参数，并合并默认配置对象：
1 启动时，首先将 process.args 参数与 webpack.config.js 文件合并成用户配置；
2 调用 [validateSchema](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FvalidateSchema.js%23L77-L78) 校验配置对象（validateSchema 底层依赖于 [schema-utils](https://link.juejin.cn/?target=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Fschema-utils) 库）；
3 调用 [getNormalizedWebpackOptions](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2Fconfig%2Fnormalization.js%23L116-L117) + [applyWebpackOptionsBaseDefaults](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2Fconfig%2Fdefaults.js%23L120-L121) 合并出最终配置。
之后，创建 Compiler 对象并开始启动插件：
1 调用 [createCompiler](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2Fwebpack.js%23L61-L62) 函数创建 compiler 对象。
2 [遍历](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2Fwebpack.js%23L68-L69) 配置中的 plugins 集合，执行插件的 apply 方法。
3 [调用](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2Fwebpack.js%23L80-L81) new WebpackOptionsApply().process 方法，根据配置内容动态注入相应插件，包括：
_ 调用 [EntryOptionPlugin](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FEntryOptionPlugin.js) 插件，该插件根据 entry 值注入 DynamicEntryPlugin 或 EntryPlugin 插件；
_ 根据 devtool 值注入 Sourcemap 插件，包括：SourceMapDevToolPlugin、EvalSourceMapDevToolPlugin 、EvalDevToolModulePlugin； \* 注入 RuntimePlugin ，用于根据代码内容动态注入 webpack 运行时。
**最后，调用\*\***compiler.compile\***\*方法开始执行构建**，这一步非常重要，源码：

虽然 [compile](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FCompiler.js%23L1159-L1160) 方法并没有任何实质的功能逻辑，但它搭建起了后续构建流程框架：
1 调用 newCompilation 方法创建 compilation 对象；
2 触发 **make** 钩子，紧接着 [EntryPlugin](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FEntryPlugin.js%23L47-L49) 在这个钩子中调用 compilation 对象的 addEntry 方法创建入口模块，主流程开始进入「**构建阶段**」；
3 make 执行完毕后，触发 finishMake 钩子；
4 执行 compilation.seal 函数，进入「**生成阶段**」，开始封装 Chunk，生成产物；
5 seal 函数结束后，触发 afterCompile 钩子，开始执行收尾逻辑。

---

调用 compile 函数触发 make 钩子后，初始化阶段就算是结束了，流程逻辑开始进入「**构建阶段**」。

compiler.compile 方法开始执行构建

### 构建阶段

「**构建阶段**」从 entry 模块开始递归解析模块内容、找出模块依赖，按图索骥逐步构建出项目整体 module 集合以及 module 之间的 [依赖关系图](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fconcepts%2Fdependency-graph%2F) ，这个阶段的主要作用就是读入并理解所有原始代码。

compiler.compile# 函数会触发 compiler.hook.make# 钩子。EntryPlugin# 监听该钩子并开始调用 compilation.addEntry# 添加入口：

### 生成阶段

「构建阶段」负责读入与分析源代码文件，将之一一转化为 Module、Dependency 对象，解决的是资源“输入”问题；

而「生成阶段」则负责根据一系列内置规则，将上一步构建出的所有 Module 对象拆分编排进若干 Chunk 对象中，之后以 Chunk 粒度将源码转译为适合在目标环境运行的产物形态，并写出为产物文件，解决的是资源“输出”问题。

「生成阶段」发生在 make 阶段执行完毕，compiler.compile 调用 [compilation.seal](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FCompilation.js%23L2780-L2781) 函数时：

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/2657e3ff33214d3aac023556d8858c77_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

1 创建本次构建的 [ChunkGraph](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FChunkGraph.js) 对象。
2 [遍历](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FCompilation.js%23L2815-L2816) 入口集合 compilation.entries：
1 调用 addChunk 方法为每一个入口 [创建](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FCompilation.js%23L2817-L2818) 对应的 Chunk 对象（EntryPoint Chunk）；
2 [遍历](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FCompilation.js%23L2832-L2833) 该入口对应的 Dependency 集合， [找到](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FCompilation.js%23L2835-L2836) 相应 Module 对象并 [关联](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FCompilation.js%23L2837-L2838) 到该 Chunk。
3 到这里可以得到若干 Chunk，之后调用 [buildChunkGraph](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FbuildChunkGraph.js%23L1347-L1348) 方法将这些 Chunk 处理成 Graph 结构，方便后续处理。
4 之后，触发 optimizeModules/optimizeChunks 等钩子，由插件（如 [SplitChunksPlugin](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fplugins%2Fsplit-chunks-plugin%2F) ）进一步修剪、优化 Chunk 结构。
5 一直到最后一个 Optimize 钩子 optimizeChunkModules 执行完毕后，开始调用 [compilation.codeGeneration](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FCompilation.js%23L3160-L3161) 方法生成 Chunk 代码，在 codeGeneration 方法内部：
1 遍历每一个 Chunk 的 Module 对象，调用 [\_codeGenerationModule](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FCompilation.js%23L3297-L3298) ；
2 \_codeGenerationModule 又会继续往下调用 [module.codeGeneration](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FModule.js%23L876-L877) 生成单个 Module 的代码，这里注意不同 Module 子类有不同 codeGeneration 实现，对应不同产物代码效果。
6 所有 Module 都执行完 codeGeneration，生成模块资产代码后，开始调用 [createChunkAssets](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FCompilation.js%23L4520-L4521) 函数，为每一个 Chunk 生成资产文件。
7 调用 [compilation.emitAssets](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FCompilation.js%23L4638-L4639) 函数“**提交**”资产文件，注意这里还只是记录资产文件信息，还未写出磁盘文件。
8 上述所有操作正常完成后，触发 callback 回调，控制流回到 compiler 函数。
9 最后， [调用](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FCompiler.js%23L466-L467) compiler 对象的 [emitAssets](https://link.juejin.cn/?target=https%3A%2F%2Fgithub1s.com%2Fwebpack%2Fwebpack%2Fblob%2FHEAD%2Flib%2FCompiler.js%23L592-L593) 方法，输出资产文件。

seal# 过程中会不断调用 compilation.emitAssets# 提交资产记录，而直 seal# 结束后则调用 compiler.emitAssets# 函数，函数内部调用 compiler.outputFileSystem.writeFile# 方法将 assets# 集合写入文件系统，Webpack 完成从源码到资产文件的转换，构建工作至此结束。

资源形态流转

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/defaaadcd2f04cf4ae950a746455a86d_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

- compiler.make 阶段：
  - entry 文件以 dependence 对象形式加入 compilation 的依赖列表，dependence 对象记录了 entry 的类型、路径等信息；
  - 根据 dependence 调用对应的工厂函数创建 module 对象，之后读入 module 对应的文件内容，调用 loader-runner 对内容做转化，转化结果若有其它依赖则继续读入依赖资源，重复此过程直到所有依赖均被转化为 module。
- compilation.seal 阶段：
  - 遍历 module 集合，根据 entry 配置及引入资源的方式，将 module 分配到不同的 Chunk；
  - Chunk 之间最终形成 ChunkGraph 结构；
  - 遍历 ChunkGraph，调用 compilation.emitAsset 方法标记 chunk 的输出规则，即转化为 assets 集合。
- compiler.emitAssets 阶段：
  - 将 assets 写入文件系统。

---

这个过程用到很多 Webpack 基础对象，包括：

- Entry：编译入口；
- Compiler：编译管理器，Webpack 启动后会创建 compiler 对象，该对象一直存活直到构建结束进程退出；
- Compilation：单次构建过程的管理器，比如 watch = true 时，运行过程中只有一个 compiler，但每次文件变更触发重新编译时，都会创建一个新的 compilation 对象；
- Dependence：依赖对象，记录模块间依赖关系；
- Module：Webpack 内部所有资源都会以 Module 对象形式存在，所有关于资源的操作、转译、合并都是以 Module 为单位进行的；
- Chunk：编译完成准备输出时，将 Module 按特定的规则组织成一个一个的 Chunk。

## 总结

综上，Webpack 底层源码非常复杂，但撇除所有分支逻辑后，构建主流程可以简单划分为三个阶段：

- **初始化阶段**：负责设置构建环境，初始化若干工厂类、注入内置插件等；
- **构建阶段**：读入并分析 Entry 模块，找到模块依赖，之后递归处理这些依赖、依赖的依赖，直到所有模块都处理完毕，这个过程解决资源“输入”问题；
- **生成阶段**：根据 Entry 配置将模块封装进不同 Chunk 对象，经过一系列优化后，再将模块代码翻译成产物形态，按 Chunk 合并成最终产物文件，这个过程解决资源“输出”问题。

### Dependency Graph ：管理模块间的依赖

会从开发者提供的 entry 开始递归地组建起包含所有模块的 **Dependency Graph**，之后再将这些 module 打包为 bundles

Dependency Graph 贯穿 Webpack 整个运行周期，从「**构建阶段**」的模块解析，到「**生成阶段**」的 Chunk 生成，以及 Tree-shaking 等功能都高度依赖于 Dependency Graph ，是 Webpack 资源构建流程中一个非常核心的数据结构。

## Chunk：三种产物的打包逻辑

**Chunk vs ChunkGroup vs ChunkGraph**

- Chunk：Module 用于读入模块内容，记录模块间依赖等；而 Chunk 则根据模块依赖关系合并多个 Module，输出成资产文件
  ![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/2bac3fb532bc406fb16331555c309f9b_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

- ChunkGroup## ：一个 ChunkGroup## 内包含一个或多个 Chunk## 对象；ChunkGroup## 与 ChunkGroup## 之间形成父子依赖关系：
  ![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/219d44ad9b4e4d2e9847761f83774d89_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

- ChunkGraph：最后，Webpack 会将 Chunk 之间、ChunkGroup 之间的依赖关系存储到 compilation.chunkGraph 对象中，形成如下类型关系：

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/424fe595633d41649a616f2f5076adb4_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

默认分包规则：

Entry Chunk：同一个 entry 下触达到的模块组织成一个 Chunk；
Async Chunk：异步模块单独组织为一个 Chunk；
Runtime Chunk：entry.runtime 不为空时，会将运行时模块单独组织成一个 Chunk。

Entry chunk：

```js
module.exports = {
  entry: {
    main: "./src/main",
    home: "./src/home",
  },
};
```

遍历 entry 对象属性并创建出 chunk[main] 、chunk[home] 两个对象，此时两个 Chunk 分别包含 main 、home 模块

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/1a40257760914ba08783bf2d6a3c1bef_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

初始化完毕后，Webpack 会根据 ModuleGraph 的依赖关系数据，将 entry 下所触及的所有 Module 塞入 Chunk （发生在 visitModules 方法），比如对于如下文件依赖：

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/9d7fbfc917b1416cb1ee86216c3131a0_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

main.js 以同步方式直接或间接引用了 a/b/c/d 四个文件，Webpack 会首先为 main.js 模块创建 Chunk 与 EntryPoint 对象，之后将 a/b/c/d 模块逐步添加到 chunk[main] 中，最终形成：
![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/83a4ebfe25b940d5adfb9d04a7507646_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

Webpack 会将每一个异步导入语句（import(xxx) 及 require.ensure）处理为一个单独的 Chunk 对象，并将其子模块都加入这个 Chunk 中 —— 我们称之为 Async Chunk。

```js
// index.js
import "./sync-a.js";
import "./sync-b.js";

import("./async-a.js");
// async-a.js

import "./sync-c.js";
```

在入口模块 index.js 中，以同步方式引入 sync-a、sync-b；以异步方式引入 async-a 模块；同时，在 async-a 中以同步方式引入 sync-c 模块，形成如下模块依赖关系图
![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/716dba615b424147ad4076ce0a735eb5_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

**Runtime Chunk:**
webpack5 还支持将 Runtime 代码单独抽取为 Chunk。这里说的 Runtime 代码是指一些为了确保打包产物能正常运行，而由 Webpack 注入的一系列基础框架代码，举个例子，常见的 Webpack 打包产物结构如

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/de9a9cbc02a9452baa1feddcd7c5ef71_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

- 需要 **webpack_require**.f、**webpack_require**.r 等功能实现最起码的模块化支持；
- 如果用到动态加载特性，则需要写入 **webpack_require**.e 函数；
- 如果用到 Module Federation 特性，则需要写入 **webpack_require**.o 函数

在多 entry 场景中，只要为每个 entry 都设定相同的 runtime 值，Webpack 运行时代码就会合并写入到同一个 Runtime Chunk 中，最终达成产物性能优化效果。例如对于如下配置：

```js
module.exports = {
  entry: {
    index: { import: "./src/index", runtime: "solid-runtime" },
    home: { import: "./src/home", runtime: "solid-runtime" },
  },
};
```

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/dcbe4fdd5f2d41d0af0b7fcf990a9bb7_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

### 总结：

综上，
「构建」阶段负责根据模块的引用关系构建 ModuleGraph；
「封装」阶段则负责根据 ModuleGraph 构建一系列 Chunk 对象，并将 Chunk 之间的依赖关系（异步引用、Runtime）组织为 ChunkGraph —— Chunk 依赖关系图对象。

与 ModuleGraph 类似，ChunkGraph 结构的引入也能解耦 Chunk 之间依赖关系的管理逻辑，整体架构逻辑更合理更容易扩展。

### Runtime：模块编译

- **webpack_modules** 对象，包含了除入口外的所有模块，如示例中的 a.js 模块；
- **webpack_module_cache** 对象，用于存储被引用过的模块；**webpack_require** 函数，实现模块引用(require) 逻辑；**webpack_require**.d ，工具函数，实现将模块导出的内容附加的模块对象上；
- **webpack_require**.o ，工具函数，判断对象属性用；**webpack_require**.r ，工具函数，在 ESM 模式下声明 ESM 模块标识；
- 最后的 IIFE，对应 entry 模块即上述示例的 index.js ，用于启动整个应用。

- Webpack 构建过程可以简单划分为 Init、Make、Seal 三个阶段；
- Init 阶段负责初始化 Webpack 内部若干插件与状态，逻辑比较简单；
- Make 阶段解决资源读入问题，这个阶段会从 Entry —— 入口模块开始，递归读入、解析所有模块内容，并根据模块之间的依赖关系构建 ModuleGraph —— 模块关系图对象；
- Seal 阶段更复杂：
  - 一方面，根据 ModuleGraph 构建 ChunkGraph；
  - 另一方面，开始遍历 ChunkGraph，转译每一个模块代码；
  - 最后，将所有模块与模块运行时依赖合并为最终输出的 Bundle —— 资产文件

### **Tree-Shaking 源码分析**

Tree-Shaking 的实现大致上可以分为三个步骤：

- 「**构建**」阶段，「**收集**」 模块导出变量并记录到模块依赖关系图 ModuleGraph 对象中；
- 「**封装**」阶段，遍历所有模块，「**标记**」 模块导出变量有没有被使用；
- 使用代码优化插件 —— 如 Terser，删除无效导出代码。

将模块的所有 ESM 导出语句转换为 Dependency 对象，并记录到 module 对象的 dependencies 集合，转换规则：具名导出转换为 HarmonyExportSpecifierDependency 对象；default 导出转换为 HarmonyExportExpressionDependency 对象。

webpack 中 Tree Shaking 的实现分为如下步骤：

- 在 FlagDependencyExportsPlugin 插件中根据模块的 dependencies 列表收集模块导出值，并记录到 ModuleGraph 体系的 exportsInfo 中；
- 在 FlagDependencyUsagePlugin 插件中收集模块的导出值的使用情况，并记录到 exportInfo.\_usedInRuntime 集合中；
- 在 HarmonyExportXXXDependency.Template.apply 方法中根据导出值的使用情况生成不同的导出语句；
- 使用 DCE 工具删除 Dead Code，实现完整的树摇效果。

最佳实践：
**始终使用 ESM**
**避免无意义的赋值**
**使用\*\***#pure\***\*标注纯函数调用**
**禁止 Babel 转译模块导入导出语句**
所以，在 Webpack 中使用 babel-loader 时，建议将 babel-preset-env 的 moduels 配置项设置为 false，关闭模块导入导出语句的转译。

**优化导出值的粒度**

**使用支持 Tree Shaking 的包**

如果可以的话，应尽量使用支持 Tree Shaking 的 npm 包，例如：

- 使用 lodash-es 替代 lodash ，或者使用 babel-plugin-lodash 实现类似效果。

**在异步模块中使用 Tree-Shaking**

```js
import(/* webpackExports: ["foo", "default"] */ "./foo").then((module) => {
  console.log(module.foo);
});
```

### source Map

原理：
在 Webpack 内部，这段生成 Sourcemap 映射数据的逻辑并不复杂，一句话总结：在 processAssets 钩子遍历产物文件 assets 数组，调用 webpack-sources 提供的 map 方法，最终计算出 asset 与源码 originSource 之间的映射关系。

### 热更新 Hot module reload

1 使用 webpack-dev-server （后面简称 WDS）托管静态资源，同时以 Runtime 方式注入一段处理 HMR 逻辑的客户端代码；
2 浏览器加载页面后，与 WDS 建立 WebSocket 连接；
3 Webpack 监听到文件变化后，增量构建发生变更的模块，并通过 WebSocket 发送 hash 事件；
4 浏览器接收到 hash 事件后，请求 manifest 资源文件，确认增量变更范围；
5 浏览器加载发生变更的增量模块；
6 Webpack 运行时触发变更模块的 module.hot.accept 回调，执行代码变更逻辑；
7 done。
![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/b16905bf7c1342e5aedc1647241f8c06_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

首先是 注入 HMR 客户端运行时：在 HMR 场景下，执行 npx webpack serve 命令后，webpack-dev-server 首先会调用 HotModuleReplacementPlugin 插件向应用的主 Chunk 注入一系列 HMR Runtime，包括：

- 用于建立 WebSocket 连接，处理 hash 等消息的运行时代码；
- 用于加载热更新资源的 RuntimeGlobals.hmrDownloadManifest 与 RuntimeGlobals.hmrDownloadUpdateHandlers 接口；
- 用于处理模块更新策略的 module.hot.accept 接口；

经过 HotModuleReplacementPlugin 处理后，构建产物中即包含了所有运行 HMR 所需的客户端运行时与接口。这些 HMR 运行时会在浏览器执行一套基于 WebSocket 消息的时序框架，如图：

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/f11ad665cc384facb7edade1e0390a7b_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

其次，实现增量构建：除注入客户端代码外，HotModuleReplacementPlugin 插件还会借助 Webpack 的 watch 能力，在代码文件发生变化后执行增量构建，生成：

- manifest 文件：JSON 格式文件，包含所有发生变更的模块列表，命名为 [hash].hot-update.json；
- 模块变更文件：js 格式，包含编译后的模块代码，命名为 [hash].hot-update.js。

增量构建完毕后，Webpack 将触发 compilation.hooks.done 钩子，并传递本次构建的统计信息对象 stats。WDS 则监听 done 钩子，在回调中通过 WebSocket 发送模块更新消息：

```js
{"type":"hash","data":"${stats.hash}"}
```

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/abda76328bdd45ce945e5c3626a33b21_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

**再次，加载更新**：客户端通过 WebSocket 接收到 hash 消息后，首先发出 manifest 请求获取本轮热更新涉及的 chunk，如：

![](<%5BWebpack5%20%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BA%94%E7%94%A8%E5%AE%9E%E8%B7%B5%5D(httpsjuejin.cnbook7115598540721618944)/788951089ec84360b17cc0bcefa23385_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0%202.webp>)

---

注意：在 Webpack 4 及之前，热更新文件以模块为单位，即所有发生变化的模块都会生成对应的热更新文件； Webpack 5 之后热更新文件以 chunk 为单位，如上例中，main chunk 下任意文件的变化都只会生成 main.[hash].hot-update.js 更新文件。

---

manifest 请求完成后，客户端 HMR 运行时开始下载发生变化的 chunk 文件，将最新模块代码加载到本地。

最后，执行 module.hot.accept 回调：经过上述步骤，浏览器加载完最新模块代码后，HMR 运行时会继续触发 module.hot.accept 回调，将最新代码替换到运行环境中。

module.hot.accept 是 HMR 运行时暴露给用户代码的重要接口之一，它在 Webpack HMR 体系中开了一个口子，让用户能够自定义模块热替换的逻辑，接口签名：

```js
module.hot.accept(path?: string, callback?: function);
```

它接受两个参数：

- path：指定需要拦截变更行为的模块路径；
- callback：模块更新后，将最新模块代码应用到运行环境的函数。

总结
综上，Webpack 的 HMR 特性底层有两个重点，一是监听文件变化并通过 WebSocket 发送变更消息；二是需要客户端配合，通过 module.hot.accept 接口定制特定模块的热替换规则。

```js
"./src/a.vue":
/*!*******************!*\
    !*** ./src/a.vue ***!
    \*******************/
/***/
((module, __webpack_exports__, __webpack_require__) => {
    // 模块代码
    // ...
    /* hot reload */
    if (true) {
    var api = __webpack_require__( /*! ../node_modules/vue-hot-reload-api/dist/index.js */ "../node_modules/vue-hot-reload-api/dist/index.js")
    api.install(__webpack_require__( /*! vue */ "../node_modules/vue/dist/vue.runtime.esm.js"))
    if (api.compatible) {
        module.hot.accept()
        if (!api.isRecorded('45c6ab58')) {
        api.createRecord('45c6ab58', component.options)
        } else {
        api.reload('45c6ab58', component.options)
        }
        module.hot.accept( /*! ./a.vue?vue&type=template&id=45c6ab58& */ "./src/a.vue?vue&type=template&id=45c6ab58&", __WEBPACK_OUTDATED_DEPENDENCIES__ => {
        /* harmony import */
        _a_vue_vue_type_template_id_45c6ab58___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__( /*! ./a.vue?vue&type=template&id=45c6ab58& */ "./src/a.vue?vue&type=template&id=45c6ab58&");
        (function () {
            api.rerender('45c6ab58', {
            render: _a_vue_vue_type_template_id_45c6ab58___WEBPACK_IMPORTED_MODULE_0__.render,
            staticRenderFns: _a_vue_vue_type_template_id_45c6ab58___WEBPACK_IMPORTED_MODULE_0__.staticRenderFns
            })
        })(__WEBPACK_OUTDATED_DEPENDENCIES__);
        })
    }
    }
    // ...

    /***/
}),
```

- 首次执行时，调用 api.createRecord 记录组件配置，api 为 vue-hot-reload-api 库暴露的接口；
- 执行 module.hot.accept() 语句，监听当前模块变更事件，当模块发生变化时调用 api.reload ；
- 执行 module.hot.accept(“xxx.vue?vue&type=template&xxxx”, fn) ，监听 Vue 文件 template 代码的变更事件，当 template 模块发生变更时调用 api.rerender 。
