# webpack 工作原理

![打包流程](./0081Kckwgy1gkc0kd9koyj316w0r678f.webp)

webpack 的工作步骤如下：

从入口文件开始递归地建立一个依赖关系图。

把所有文件都转化成模块函数。

根据依赖关系，按照配置文件把模块函数分组打包成若干个 bundle。

通过 script 标签把打包的 bundle 注入到 html 中，通过 manifest 文件来管理 bundle 文件的运行和加载。

## 打包要解决的问题

1. 文件之间的依赖管理 梳理文件之间的依赖关系
2. 资源加载管理 处理文件的加载顺序先后世纪 和文件的加载数量（合并、潜入、拆分）
3. 效率与优化管理 提高开发效率，完成页面优化

它采用 tool+ plugins 的结构，tools 提供基础能力，即文件依赖管理和资源加载管理，基础上通过一系列的 plugins 来丰富打包工具的功能。

在 webpack 里， 所有的文件都是模块。但是 webpack 只认识 js 模块，所以要通过 loader 插件把 css、图片等文件转化成 webpack 认识的模块

在 webpack 打包的文件中，模块是以模块函数来表示的，通过吧文件转换成模块函数就可以控制模块的运行时间。即加载完成后不会立即执行，等到调用模块函数的时候才会执行。

webpack 的工作步骤如下：

![工作流程](./007S8ZIlgy1gj6gphjv86j319d0u0do0.webp)

1. 从入口文件开始递归地建立一个依赖关系图。
2. 把所有文件都转化成模块函数。
3. 根据依赖关系，按照配置文件把模块函数分组打包成若干个 bundle。
4. 通过 script 标签把打包的 bundle 注入到 html 中，通过 manifest 文件来管理 bundle 文件的运行和加载。

打包的规则为：一个入口文件对应一个 bundle。该 bundle 包括入口文件模块和其依赖的模块。按需加载的模块或需单独加载的模块则分开打包成其他的 bundle。

除了这些 bundle 外，还有一个特别重要的 bundle，就是 manifest.bundle.js 文件，即 webpackBootstrap。这个 manifest 文件是最先加载的，负责解析 webpack 打包的其他 bundle 文件，使其按要求进行加载和执行。

打包代码解析

首先分析一下 manifest 文件。

它包含三个主要变量，modules、installedModules 和 installedChunks。

modules 对象保存的是所有的模块函数。模块函数是 webpack 处理的基本单位，对应打包前的一个文件，形式为 function(module, webpack_exports, webpack_require) {…}。所有的模块函数的索引值是连续编码的，如果第一个 bundle 里的模块函数的索引是 0-7，第二个 bundle 里的模块函数的索引就从 8 开始，从而保证索引和模块函数一一对应。

installedModules 对象保存的是模块对象。模块对象是运行模块函数得到的对象，是标准的 Commonjs 对象，其属性主要有模块 id 和 exports 对象。webpack 的运行就是指执行模块函数得到模块对象的过程。

installedChunks 保存的是异步加载对象的 promise 信息，结构为[resolve, reject, promise]。主要是用来标记异步加载模块。用 promise 便于异步加载模块的全局管理，如果加载超时就可以抛出 js 异常。

包括三个主要函数 webpackJsonpCallback，webpack_require 和 webpack_require.e

webpackJsonpCallback(chunkIds, moreModules, executeModules){…}是 bundle 文件的包裹函数。bundle 文件被加载后就会运行这个函数。函数的三个参数分别对应三种模块。chunkIds 指的是需要单独加载的模块的 id，对应 installedChunks；executeModules 指的是需要立即执行的模块函数的 id，对应 modules，一般是入口文件对应的模块函数的 id；moreModules 包括该 bundle 打包的所有模块函数。webpackJsonpCallback 先把模块函数存到 modules 对象中；然后处理 chunkIds，调用 resolve 来改变 promise 的状态；最后处理 executeModules，把对应的模块函数转化成模块对象。

webpack_require(moduleId)通过运行 modules 里的模块函数来得到模块对象，并保存到 installedModules 对象中。

webpack_require.e(chunkId)通过建立 promise 对象来跟踪按需加载模块的加载状态，并设置超时阙值，如果加载超时就抛出 js 异常。如果不需要处理加载超时异常的话，就不需要这个函数和 installedChunks 对象，可以把按需加载模块当作普通模块来处理。

```js
(function (modules) {
  // webpackBootstrap
  // modules存储的是模块函数
  // The module cache，存储的是模块对象
  var installedModules = {};
  // objects to store loaded and loading chunks
  // 按需加载的模块的promise
  var installedChunks = { 2: 0 };
  // The require function
  // require的功能是把modules对象里的模块函数转化成模块对象，
  // 即运行模块函数，模块函数会把模块的export赋值给模块对象，供其他模块调用。
  function __webpack_require__(moduleId) {
    // Check if module is in cache
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }
    // 下面开始把一个模块的代码转化成一个模块对象
    // Create a new module (and put it into the cache)
    var module = (installedModules[moduleId] = {
      i: moduleId,
      l: false, //是否已经加载完成
      exports: {}, //模块输出，几乎代表模块本身
    });
    // Execute the module function,即运行模块函数，打包后的每个模块都是一个函数
    modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack_require__
    );
    // Flag the module as loaded
    module.l = true;
    // Return the exports of the module
    return module.exports;
  }
  // install a JSONP callback for chunk loading
  var parentJsonpFunction = window["webpackJsonp"];
  window["webpackJsonp"] = function webpackJsonpCallback(
    chunkIds,
    moreModules,
    executeModules
  ) {
    var moduleId,
      chunkId,
      i = 0,
      resolves = [],
      result;
    // 遍历chunkIds，如果对应的模块是按需加载的模块，就把其resolve函数存起来。
    for (; i < chunkIds.length; i++) {
      chunkId = chunkIds[i];
      if (installedChunks[chunkId]) {
        // 是按需加载的模块，取出其resolve函数
        resolves.push(installedChunks[chunkId][0]);
      }
      installedChunks[chunkId] = 0; //该chunk已经被处理了
    }
    //遍历moreModules把模块函数存到modules中
    for (moduleId in moreModules) {
      if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
        modules[moduleId] = moreModules[moduleId];
      }
    }
    // 执行resolve函数，一般是__webpack_require__函数
    while (resolves.length) {
      resolves.shift()();
    }
    //遍历moreModules把模块函数转化成模块对象
    if (executeModules) {
      for (i = 0; i < executeModules.length; i++) {
        result = __webpack_require__(
          (__webpack_require__.s = executeModules[i])
        );
      }
    }
    return result;
  };
  __webpack_require__.e = function requireEnsure(chunkId) {
    var installedChunkData = installedChunks[chunkId];
    // 模块已经被处理过（加载了模块函数并转换成了模块对象），就返回promise，调用resolve
    if (installedChunkData === 0) {
      return new Promise(function (resolve) {
        resolve();
      });
    }
    // 模块正在被加载，返回原来的promise
    // 加载完后会运行模块函数，模块函数会调用resolve改变promise的状态
    if (installedChunkData) {
      return installedChunkData[2];
    }
    // 新建promise，并把resolve，reject函数和promise都赋值给installedChunks[chunkId]，以便全局访问
    var promise = new Promise(function (resolve, reject) {
      installedChunkData = installedChunks[chunkId] = [resolve, reject];
    });
    installedChunkData[2] = promise;
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.src = __webpack_require__.p + "" + chunkId + ".bundle.js";
    var timeout = setTimeout(onScriptComplete, 120000);
    script.onerror = script.onload = onScriptComplete;
    function onScriptComplete() {
      script.onerror = script.onload = null;
      clearTimeout(timeout);
      var chunk = installedChunks[chunkId];
      if (chunk !== 0) {
        //没有被处理
        if (chunk) {
          // 是按需加载模块，即请求超时了
          chunk[1](new Error("Loading chunk " + chunkId + " failed."));
        }
        installedChunks[chunkId] = undefined;
      }
    }
  };
})([]);
```

1. 编译一个入口文件(代码文件)
1. 解析并改造代码如将 import、require 转换成 webpack_require
1. 收集依赖的模块并重复 2
1. 生成文件并导出上面的模版。

```js
class KWebpack {
  constructor() {
    // 读取webpack.config.js 且初始化
  }

  // 构建模块
  buildModules() {}

  // 生成打包文件
  writeFile() {}

  // 读取本地文件
  readFile() {}

  // 解析模块 将源代码解析成 ast语法树并处理
  parse() {}

  // 运行模块
  start() {}
}
```

初始化(编译一个入口文件)

```js
let path = require('path')
let _config = require(path.resolve('webpack.config.js'))

// 初始化配置
let defaultConfig = {
  entry:'./src/main.js',
  output:{
    fileName:'build.js'
  }
}

class KWebpack {
  constructor(config){
    // 读取webpack.config.js 且初始化
    this.config = {...defaultConfig,...config}
    this.root = process.pwd()
    // 所有模块依赖
    this.modules = {}
    this.entry = this.config.entry
  }

```

构建

```js
  // 1.读取本地文件
  readFile(path){
    return fs.readFileSync(path,'utf-8')
  }



  // 2.构建模块
  buildModules(modulePath){
    let fileContent = this.readFile(modulePath)
    // 获取解析过后的内容和依赖的模块
    let {resrouce,deps}= this.parse(fileContent)
    this.modules['./'+path.relative(this.root,modulePath)] = resrouce
    deps.forEach(dep => {
      this.buildModules(path.join(path.dirname(modulePath),dep))
    })

  }

  // 3.解析模块 将源代码解析成 ast语法树并处理
  parse(data){
    let deps = []
    let ast = babylon.parse(data)
    let root = this.root
    // @babel/traverse遍历ast节点
    traverse(ast, {
      CallExpression(p) {
          let node = p.node
          if (node.callee.name === 'require') {
              node.callee.name = '__webpack_require__'
              // 构建新的模块路径(模块名)

              let moduleName = node.arguments[0].value

              // 这里作了简化处理，可能引用的还有其他模块 。
              moduleName = moduleName + (path.extname(moduleName) ? '' : '.js') // ./a.js
              moduleName = path.join(moduleName) // ./src/a.js
              deps.push(moduleName)
          }
      }
    })
    let resrouce = generator(ast).code
    return { resrouce, deps}

  }

  // 4.生成打包文件
  writeFile(){
    let templateContent = this.readFile(__dirname + '/template.js')
    // 把this.moudles数组转成字符串，为了拼接到template里面。
    let modulesStr = ''
    Object.keys(this.modules).forEach((item)=>{
      modulesStr+= `"${item}":${this.modules[item]},`
    })
    templateContent = templateContent.replace('__entry__',this.entry).replace('__modules_content__',modulesStr)

    fs.writeFileSync(`./dist/${this.config.output.fileName}`,templateContent)
  }

  // 5.template.js
  (function(modules) {
    var installedModules = {};

    function __webpack_require__(moduleId) {
      if (installedModules[moduleId]) {
        return installedModules[moduleId].exports;
      }
      var module = (installedModules[moduleId] = {
        i: moduleId,
        l: false,
        exports: {}
      });
      modules[moduleId].call(
        module.exports,
        module,
        module.exports,
        __webpack_require__
      );

      return module.exports;
    }
    // return 入口
    return __webpack_require__("__entry__");
  })({__modules_content__})


    // 扩展 loader

  // 6.修改过后的readFile方法

  // 读取本地文件并且加入loader处理
  readFile(path){
    let _file = fs.readFileSync(path,'utf-8')
    return this.handleLoader(path,_file)
  }

  // 7. loader 函数处理
  handleLoader(path,content){
    let rules = this.config.module.rules
    rules.forEach((rule)=>{
      let length = rule.use.length - 1;
      let test = rule.test
      if(test.test(path)){
        do{
          let lo = rule.use[length].loader || rule.use[length]
          let loader = require(lo)
          content = loader(content) // 这里如果引用正常的loader会报错，因为官方loader里面封装了很多方法。这里没写，所以这里代码封装了一个简单添加文字的loader。来演示
          length--
        }while(length > 0)
      }

    })
    return content
  }

  // 8.// loaderText.js

  function loader (source) {
    source += '// 我是添加的loader文案'
    return source
  }

  module.exports = loader


  // 9. plugin
  // 只要在constructor的时候添初始化钩子，然后在合适的地方调用即可。

  // 这里简单说下 tapable 钩子，类似于 node 的 Events, 也是注册类似于事件，然后通过不同的钩子调用，来触发一个个事件。（实现事件流机制的 “钩子” 大方向可以分为两个类别，“同步” 和 “异步”，“异步” 又分为两个类别，“并行” 和 “串行”，而 “同步” 的钩子都是串行的）
  class Compiler {
    // 配置钩子
    initHooks() {
      // 配置钩子
      this.hooks = {
          entryOption: new SyncHook(),
          compile: new SyncHook(),
          afterCompile: new SyncHook(),
          afterPlugins: new SyncHook(),
          run: new SyncHook(),
          emit: new SyncHook(),
          done: new SyncHook()
      }
    }

    // 注册一个调用 plugin 的方法
    hanldePlugins() {
      // 处理插件
      let { plugins } = this.config
      if (Array.isArray(plugins)) {

          plugins.forEach((plugin) => {
              plugin.apply(this) // 每个插件里面都会有一个apply方法来调用
          })
          this.hooks.afterPlugins.call(this)
      }
    }


    // 继续修改启动项 运行模块
    start(){
      this.hooks.run.call(this)
      this.hooks.compile.call(this)

      this.buildModules(path.resolve(this.root, this.entry),this.entry)

      this.hooks.afterCompile.call(this)

      this.writeFile()

      this.hooks.emit.call(this)
      this.hooks.done.call(this)
    }
  }


  // plugin 例子
  class PluginTest{
    apply(compiler) {
      compiler.hooks.emit.tap('emit', function() {
          console.log('现在是emit钩子触发')
        })
    }
  }
  module.exports = PluginTest

```

Compiler 和 Compilation 这两个对象时 webpack 核心原理中最重要的概念。

- Compiler 对象： 它的实例包含了完整的 webpack 配置， 且全局只有一个 compile 实例， 当插件被实例化的时候，会收到一个 Compiler 对象， 通过这个对象可以访问 webpack 的内部环境

- Compilation 对象：当 webpack 以开发模式运行时， 每当检测到文件变化时， 一个新的 compilation 对象就会被创建。 这个对象包含了当前的模块资源、编译生成资源、变化的文件等信息。 所有构建过程中产生的构建数据都会被存储在该对象上，它也掌握着构建过程中的每一个环节

并通过脚本加载的 JavaScript 代码
webpack 本身仅能识别 js、json 代码，而 Loader 的作用就是将 CSS、img、字体资源翻译成为 webpack 可以识别的资源，可以识别后才可以进行打包处理！loader 通过 npm 安装依赖之后就可以配置，不用需要引入。
