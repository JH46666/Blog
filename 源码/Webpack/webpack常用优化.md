# webpack 打包优化

1. 优化 resolve.extensions 配置;

1. 配置时尽可能减小后缀尝试列表，不要把项目中不可能存在的情况写到列表中;

1. 频率最高的文件后缀要优先放在最前面，以做到最快推出;

1. 在源码中写导入语句时，要尽可能的带上后缀，从而可以避免寻找过程。例如在你确定的情况下把 require('./data') 写成 require('./data.json')

1. 优化 resolve.modules 配置
   resolve.modules 用于配置 Webpack 去哪些目录下寻找第三方模块。

resolve.modules 的默认值是 ['node_modules']，会采用向上递归搜索的方式查找

1. 优化 resolve.alias 配置

resolve.alias 配置项通过别名来把原导入路径映射成一个新的导入路径。

1. cache-loader
   在一些性能开销较大的 loader 之前添加 cache-loader, 将结果缓存在磁盘中,cache-loader 的配置很简单，放在其他 loader 之前即可.

1. 缩小文件匹配范围

Include：需要处理的文件的位置

Exclude：排除掉不需要处理的文件的位置

exclude 的优先级高于 include，在 include 和 exclude 中使用绝对路径数组，尽量避免 exclude，更倾向于使用 include。

1. 设置 noParse
   如果一些第三方模块没有 AMD/CommonJS 规范版本，可以使用 noParse 来标识这个模块，防止 webpack 解析那些任何与给定正则表达式相匹配的文件。忽略的文件中不应该含有 import, require, define 的调用，或任何其他导入机制。忽略大型的 library 可以提高构建性能。比如 jquery、elementUi

```js
module: {
  noParse: /jquery|lodash/;
}
```

1. 给 babel-loader 设置缓存
   babel-loader 提供了 cacheDirectory 特定选项（默认 false）：设置时，给定的目录将用于缓存加载器的结果。

1. HappyPack 的基本原理：

在 webpack 构建过程中，我们需要使用 Loader 对 js，css，图片，字体等文件做转换操作，并且转换的文件数据量也是非常大的，且这些转换操作不能并发处理文件，而是需要一个个文件进行处理，HappyPack 的基本原理是将这部分任务分解到多个子进程中去并行处理，子进程处理完成后把结果发送到主进程中，从而减少总的构建时间。

1. 异步加载 css

运行时代码通过 <link> 或者<style> 标签检测已经添加的 CSS。

```js
function recursiveIssuer(m) {
  if (m.issuer) {
    return recursiveIssuer(m.issuer);
  } else if (m.name) {
    return m.name;
  } else {
    return false;
  }
}
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
  optimization: {
    splitChunks: {
      cacheGroups: {
        fooStyles: {
          name: 'foo',
          test: (m,c,entry = 'foo') => m.constructor.name === 'CssModule' && recursiveIssuer(m) === entry,
          chunks: 'all',
          enforce: true
        },
        barStyles: {
          name: 'bar',
          test: (m,c,entry = 'bar') => m.constructor.name === 'CssModule' && recursiveIssuer(m) === entry,
          chunks: 'all',
          enforce: true
        }
      }
    }


```

1. 生产模式压缩

```js
  const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

  optimization: {
    minimizer: [
      // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
      // `...`
      new CssMinimizerPlugin(),
    ],
  },
```

1. ignorePlugin

```js
//webpack.config.js
module.exports = {
  //...
  plugins: [
    //忽略 moment 下的 ./locale 目录
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ],
};

import moment from "moment";
import "moment/locale/zh-cn"; // 手动引入
```

复制代码 index.js 中只引入 moment，打包出来的 bundle.js 大小为 263KB，如果配置了 IgnorePlugin，单独引入 moment/locale/zh-cn，构建出来的包大小为 55KB。

1. DllPlugin

用专门用于编译动态链接库, 可以将 react 和 react-dom 单独打包成一个动态链接库

1. 利用 babel 完成代码转换，并生成单个文件的依赖 2.从入口开始递归分析，并生成依赖图谱 3.将各个引用模块打包成为一个立即执行函数 4.将最终的 bundle 文件写入 bundle.js 中

## webpack 打包后输出什么

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

首先 webpack bundle 分析包的大小，接着抽出一些不太会变的 例如 react.min.js 这种，走 cdn 的形式， 将 chunk 将包拆分成公共包和业务包，进行分包加载。减少重复打包。 接着我会用 gzip 压缩包的大小，配合 webp 压缩图片大小。

```js

- loader cache
- split chunk
- 指定 exclude
- 配置 alias
- 提取 vender
```
