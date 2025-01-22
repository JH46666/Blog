# webpack 按需加载原理

懒加载或者按需加载，是一种很好的优化网页或应用的方式。

## 使用

```js
// print.js
console.log('The print.js module has loaded! See the network tab in dev tools...');

export default () => {
  console.log('Button Clicked: Here\'s "some text"!');
};

// index.js

button.onclick = e => import(/* webpackChunkName: "print" */ './print').then(module => {
  const print = module.default;

  print();
});

注意当调用 ES6 模块的 import() 方法（引入模块）时，必须指向模块的 .default 值，因为它才是 promise 被处理后返回的实际的 module 对象。

```

## 流程与原理

![webpack 按需加载流程](./007S8ZIlgy1gjusbi6hjoj30qy0me3zj.webp)

1. 定义一个 promise 数组，用来存储 promise.
1. 判断是否已经加载过，如果加载过，返回一个空数组的 promise.all().
1. 如果正在加载中，则返回存储过的此文件对应的 promise.
1. 如果没加载过，先定义一个 promise，然后创建 script 标签，加载此 js，并定义成功和失败的回调
1. 返回一个 promise

创建 promise，这个很好理解因为这里必须是要变成 promise 给后面调用的，另外一个是创建 script 标签,导入 js 文件.

在**0.main.js**中

```js
(window["webpackJsonp"] = window["webpackJsonp"] || []).push([
  [0],
  {
    /***/ "./src/a.js": function (module, exports, __webpack_require__) {
      "use strict";
      eval("...");

      /***/
    },
  },
]);
```

webpack_require(moduleId) 通过运行 modules 里的模块函数来得到模块对象，并保存到 installedModules 对象中。

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

a.js 不仅有自己模块的代码，还会去往 window["webpackJsonp"]里面把增加一个数组，chunkid 和 chunk 模块的代码

所以说这个 push 方法其实是被劫持了的，也就是等价于运行了 webpackJsonpCallback 方法。webpackJsonpCallback 则会去运行 installedChunks[chunkId][0]，也就是 promise 的 resolve。到此整个 webpack 的代码分割也就梳理的非常清楚了

只看这个函数，我们可能还有一下疑问：

判断有无加载过是通过判断 installedChunks[chunkId]的值是否为 0，但在 script.onerror/script.onload 回调函数中并没有把 installedChunks[chunkId]的值置为 0
promise 把 resolve 和 reject 全部存入了 installedChunks 中， 并没有在获取异步 chunk 成功的 onload 回调中执行 resolve，那么，resolve 是什么时候被执行的呢?
