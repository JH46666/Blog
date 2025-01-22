# 基础配置

## 入口(entry)

入口起点(entry point)指示 webpack 应该使用哪个模块，来作为构建其内部依赖图的开始。进入入口起点后，webpack 会找出有哪些模块和库是入口起点（直接和间接）依赖的。

## 出口(output)

output 属性告诉 webpack 在哪里输出它所创建的 bundles，以及如何命名这些文件，默认值为 ./dist。基本上，整个应用程序结构，都会被编译到你指定的输出路径的文件夹中。你可以通过在配置中指定一个 output 字段，来配置这些处理过程

## loader

loader 让 webpack 能够去处理那些非 JavaScript 文件（webpack 自身只理解 JavaScript）。loader 可以将所有类型的文件转换为 webpack 能够处理的有效模块，然后你就可以利用 webpack 的打包能力，对它们进行处理。

## 插件(plugins)

loader 被用于转换某些类型的模块，而插件则可以用于执行范围更广的任务。插件的范围包括，从打包优化和压缩，一直到重新定义环境中的变量。插件接口功能极其强大，可以用来处理各种各样的任务。

## 模式

通过选择 development 或 production 之中的一个，来设置 mode 参数，你可以启用相应模式下的 webpack 内置的优化

```js
module.exports = {
  mode: "production",
};
```

下面是 webpack 配置时的一些概念

Entry

入口文件是 webpack 建立依赖图的起点。

Output

Output 配置告诉 webpack 怎么处理打包的代码。

Hot Module Replacement

热模块替换功能可以在不刷新所有文件的情况下实现单独跟新某个模块。

Tree Shaking

去除无用代码，比如某个 js 文件里的函数并没有被使用，这段函数代码在打包时将会被去掉。

Code Splitting

代码拆分，实现的方式有三种

Entry Points 手动把代码分成多个入口
Prevent Duplication 使用插件 CommonsChunkPlugin 提取公共代码块
Dynamic Imports 用 import 函数动态动引入模块
Lazy Loading

懒加载或者按需加载，属于 Code Splitting 的一部分

Loaders

webpack 把所有文件都当成模块对待，但是它只理解 Javascript。Loaders 把这些 webpack 不认识的文件转化成模块，以便 webpack 进行处理。

plugins

插件一般用来处理打包模块的编译或代码块相关的工作。

The Manifest

webpack manifest 文件用来引导所有模块的交互。manifest 文件包含了加载和处理模块的逻辑。

当 webpack 编译器处理和映射应用代码时，它把模块的详细的信息都记录到了 manifest 文件中。当模块被打包并运输到浏览器上时，runtime 就会根据 manifest 文件来处理和加载模块。利用 manifest 就知道从哪里去获取模块代码。

在插件开发中最重要的两个资源就是 compiler 和 compilation 对象.
compiler 对象代表了完整的 webpack 环境配置. 这个对象在启动 webpack 时被一次性建立, 并配置好所有可操作的设置, 包括 options, loader 和 plugin.

compilation 对象代表了一次资源版本构建. 当运行 webpack 开发环境中间件时, 每当检测到一个文件变化, 就会创建一个新的 compilation, 从而生成一组新的编译资源. 一个 compilation 对象表现了当前的模块资源\编译生成资源\变化的文件\以及被跟踪依赖的状态信息.compilation 对象也提供了很多关键时间的回调, 以供插件做自定义处理试选择使用

同样的 compilation 钩子也是继承自 Tapable，那么它也具有 compiler 的同样的方法和特性。Compilation 模块会被 Compiler 用来创建新的编译（或新的构建）。Compiler 可以理解为整个 webpack 生命周期都存在的编译[构建]对象，但是 Compliation 只代表着某一次的编译[构建]对象

1. 利用 babel 完成代码转换，并生成单个文件的依赖 2.从入口开始递归分析，并生成依赖图谱 3.将各个引用模块打包成为一个立即执行函数 4.将最终的 bundle 文件写入 bundle.js 中

## webpack 有什么配置

entry：js 入口源文件
output：生成文件
loader：进行文件处理
plugins：插件，比 loader 更强大，能使用更多 webpack 的 api

专注处理 webpack 在编译过程中的某个特定的任务的功能模块，可以称为插件。

Plugin 的特点

是一个独立的模块

模块对外暴露一个 js 函数

函数的原型 (prototype) 上定义了一个注入 compiler 对象的 apply 方法 apply 函数中需要有通过 compiler 对象挂载的 webpack 事件钩子，钩子的回调中能拿到当前编译的 compilation 对象，如果是异步编译插件的话可以拿到回调 callback
完成自定义子编译流程并处理 complition 对象的内部数据

如果异步编译插件的话，数据处理完成后执行 callback 回调。

常用 Plugin

HotModuleReplacementPlugin 代码热替换。因为 Hot-Module-Replacement 的热更新是依赖于 webpack-dev-server，后者是在打包文件改变时更新打包文件或者 reload 刷新整个页面，HRM 是只更新修改的部分。

HtmlWebpackPlugin, 生成 html 文件。将 webpack 中 entry 配置的相关入口 chunk 和 extract-text-webpack-plugin 抽取的 css 样式 插入到该插件提供的 template 或者 templateContent 配置项指定的内容基础上生成一个 html 文件，具体插入方式是将样式 link 插入到 head 元素中，script 插入到 head 或者 body 中。

ExtractTextPlugin, 将 css 成生文件，而非内联 。该插件的主要是为了抽离 css 样式,防止将样式打包在 js 中引起页面样式加载错乱的现象。

NoErrorsPlugin 报错但不退出 webpack 进程

UglifyJsPlugin，代码丑化，开发过程中不建议打开。 uglifyJsPlugin 用来对 js 文件进行压缩，从而减小 js 文件的大小，加速 load 速度。uglifyJsPlugin 会拖慢 webpack 的编译速度，所有建议在开发简单将其关闭，部署的时候再将其打开。多个 html 共用一个 js 文件(chunk)，可用 CommonsChunkPlugin

purifycss-webpack 。打包编译时，可剔除页面和 js 中未被使用的 css，这样使用第三方的类库时，只加载被使用的类，大大减小 css 体积

optimize-css-assets-webpack-plugin 压缩 css，优化 css 结构，利于网页加载和渲染

webpack-parallel-uglify-plugin 可以并行运行 UglifyJS 插件，这可以有效减少构建时间
