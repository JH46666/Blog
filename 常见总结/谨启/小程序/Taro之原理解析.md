## 结合 mobx 在跳转前预请求

比如详情页, 展示类的页面, 我们一般都是通过 Id 去拿到具体的详情, 再来展示.
常规做法都是进到页面后在 componentDidMount 去触发请求, 然后把结果集渲染到页面,
但这样一进去就会展示默认数据再替换, 有点突兀; 我们肯定想改善用户体验, 那就把数据预请求
我们可以根据实际场景在跳转之前的生命周期入手, 比如 redirectTo 可以在 componentDidHide 内调用函数 dispatch.

reLuanch 可以在 componentWillUnmount 内触发; 跳转过去的页面, 可以直接从 props 拿到渲染, 不会那么突兀

```js
config = {
  navigationBarTitleText: "首页",
  usingComponents: {
    navbar: "../../components/Navbar/index", // 书写第三方组件的相对路径
  },
};
```

mobx：

computed(function)  创建的函数只有当它有自己的观察者时才会重新计算，否则它的值会被认为是不相关的。经验法则：如果你有一个函数应该自动运行，但不会产生一个新的值，请使用 autorun。

入口文件：
componentwillmount 对应 onlaunch 监听程序初始化，初始化完成时触发（全局只触发一次）在此生命周期中通过  this.$router.params，可以访问到程序初始化参数

componentDidMount()
onLaunch，在  componentWillMount  后执行
监听程序初始化，初始化完成时触发（全局只触发一次）
在此生命周期中通过  this.$router.params，可以访问到程序初始化参数

componentDidShow()对应  onShow，在 H5/RN 中同步实现

componentDidHide()对应 onHide

历史栈变动触发 router 的回调

对于历史栈来说，无非就是三种操作：push,  pop，还有 replace。

```js
var document = {
  createElement: function (tagName) {
    tagName = tagName.toLowerCase();
    if (tagName === "canvas") {
      return wx.createCanvas();
    }
  },
};
```

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gdvjlbsz6wj31220gajt5.jpg)

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gdvjlahbrhj314y0hgabj.jpg)

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gdvjl8ruusj310e092t9o.jpg)

所谓编译原理，就是一个对输入的源代码进行语法分析，语法树构建，随后对语法树进行转换操作再解析生成目标代码的过程。

ML 类有个明显的特点是关注点分离（Separation of Concerns），即语义层（XML）、视觉层（CSS）、交互层（JavaScript）三者分离的松耦合形式，JSX 类则要把三者混为一体，用脚本来包揽三者的工作。

样式处理：
h5 端使用官方提供的 weui 进行适配，react native 端则在组件内添加样式，并通过脚本来控制一些状态类的样式框架核心在编译的时候把源代码的  class  所指向的样式通过  css-to-react-native  进行转译，所得 StyleSheet 样式传入组件的  style  参数，组件内部会对样式进行二次处理，得到最终的样式。

把 react 代码想象成一颗抽象语法树，根据这棵树生成小程序支持的模版代码，在做一个小程序运行时框架处理事件和生命周期与之兼容。

浏览器端不能识别 require 关键字，require 是 node.js 环境下的，在 node_modules 文件夹里面的模块下面常见 require.

解决方法：
通过工具 browserify 或者是 webpack 把 js 文件编译一下，转成浏览器端可识别的。

```js
//安装browserify ,我这里是全局安装
npm install - g browserify
```

```js
// 编译
browserify. / source / module.js - o. / dist / dist.js
```

babel-traverse 
可以遍历由 Babylon 生成的抽象语法树，并把抽象语法树的各个节点从拓扑数据结构转化成一颗路径（Path）树，Path 表示两个节点之间连接的响应式（Reactive）对象，它拥有添加、删除、替换节点等方法。当你调用这些修改树的方法之后，路径信息也会被更新。

position: relative; 只是在视觉上显示出有偏差这时候我们再看文档中:
设置为相对定位的元素框会偏移某个距离。元素仍然保持其未定位前的形状，它原本所占的空间仍保留。
就是说标签其实在 DOM 中还占据着原始的位置，只是在视觉上给人偏移的错觉。这样就可以合理解释为何第二个往后设置 relative 的元素没有跟着往下排列。很自然的，既然还占着原来的位置，那就手动设置 margin-bottom: 15px; 就可以实现真正意义上的 DOM 位置偏移。

Taro 的结构主要分两个方面：运行时和编译时。运行时负责把编译后到代码运行在本不能运行的对应环境中，你可以把 Taro 运行时理解为前端开发当中  polyfill。

举例来说，小程序新建一个页面是使用  Page  方法传入一个字面量对象，并不支持使用类。如果全部依赖编译时的话，那么我们要做到事情大概就是把类转化成对象，把  state  变为  data，把生命周期例如  componentDidMount  转化成  onReady，把事件由可能的类函数（Class method）和类属性函数(Class property function) 转化成字面量对象方法（Object property function）等等。

Page(createPage(componentName))

实现一个  createPage  方法，接受一个类作为参数，返回一个小程序  Page  方法所需要的字面量对象。这样不仅简化了编译时的工作，我们还可以在  createPage  对编译时产出的类做各种操作和优化。通过运行时把工作分离了之后，再编译时我们只需要在文件底部加上一行代码  Page(createPage(componentName))  即可。

编译时做的处理：
类属性  config，config  是一个对象表达式（Object Expression），这个对象表达式只接受键值为标识符（Identifier）或字符串，而键名只能是基本类型。这样简单的情况我们只需要把这个对象表达式转换为 JSON 即可。另外一个类属性  state  在  Page  当中有点像是小程序的  data，但它在多数情况不是完整的  data（下文会继续讨论 data）。这里我们不用做过多的操作，babel 的插件  transform-class-proerties  会把它编译到类的构造器中。函数  handleClick  我们交给运行时处理，

再来看我们的  render()  函数，它的第一行代码通过  filter  把数字数组的所有偶数项都过滤掉，真正用来循环的是  oddNumbers，而  oddNumbers  并没有在  this.state  中，所以我们必须手动把它加入到  this.state。

taro 的 render 会被重新命名为\_createData，它是一个创建数据的方法： 在 jsx 使用过的数据都将被创建最后放到小程序 Page 或者 Component 工厂方法中的 data。
\_createData() {
this.**state = arguments[0] || this.state || {};
this.**props = arguments[1] || this.props || {};

const oddNumbers = this.**state.numbers.filter(number => number & 2);
Object.assign(this.**state, {

    oddNumbers: oddNumbers

});
return this.\_\_state;
}

render 里面的所有 jsx 元素将在变成 wxml。每个 wxml 元素和 html 元素一样，我们可以把它定义为三种类型：element、text、commet。Element  类型有它的名字（tagName）、children、属性（attributes），其中  children  可能是任意  WXML  类型，属性是一个对象，键值和键名都是字符串。我们将把重点放在如何转换成为  WXML  的  Element  类型。

Text  只有一个属性: 内容（content），它对应的 AST 类型是  JSXText，我们只需要将前文源码中对应字符串的奇数和偶数转换成  Text  即可。

看  <View className='home'>，它在 AST 中是一个  JSXElement，它的结构和我们定义  Element  类型差不多。我们先将  JSXElement  的  ScrollView  从驼峰式的 JSX 命名转化为短横线（kebab case）风格，className  和  scrollTop  的值分别代表了  JSXAttribute  值的两种类型：StringLiteral  和  JSXExpressionContainer，className  是简单的  StringLiteral  处理起来很方便，scrollTop  处理起来稍微麻烦点，我们需要用两个花括号  {}  把内容包起来。

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gdvjmkg9x3j312u0ry0uf.jpg)

我们知道  expr1 && expr2  意味着如果  expr1  能转换成  true  则返回  expr2，也就是说我们只要把  number % 2 === 0  作为值生成一个键名  wx:if  的  JSXAttribute  即可。但由于  wx:if  和  wx:for  同时作用于一个元素可能会出现问题，所以我们应该生成一个  block  元素，把  wx:if  挂载到  block  元素.

这里我们可以思考一下  this.props.text || this.props.children  的解决方案。当用户在 JSX 中使用  ||  作为逻辑表达式时很可能是  this.props.text  和  this.props.children  都有可能作为结果返回。这里 Taro 将它编译成了  this.props.text ? this.props.text: this.props.children，按照条件表达式（三元表达式）的逻辑，也就是说会生成两个  block，一个  wx:if  和一个  wx:else：

```js
< block wx: if = "{{text}}" > {
        {
            text
        }
    } < /block> <
block wx:
    else >
        <
        slot > < /slot> <
        /block>
```

运行时提供了两个方法 createApp 和 createComponent 来分别创建程序和组件
createComponent 方法主要做了这样几件事情：

1. 将组件的 state 转换成小程序组件配置对象的 data
2. 将组件的生命周期对应到小程序组件的生命周期
3. 将组件的事件处理函数对应到小程序的事件处理函数

对于静态的 state 我们跟 wxml 一一对应 ，涉及到动态的东西，可能会创建一个\_createData 的方法，里面会生成  $anonymousCallee__1 这个变量， $anonymousCallee**1  是由编译器生成的，对  this.state.list  进行相关操作后的变量。 $anonymousCallee**1  最终会被放到组件的 data 中给模板调用：

```js
var $anonymousCallee__1 = this.state.list.map(function (item) {
  return ++item;
});
```

render 里 return 之前的所有定义变量或者对 props、state 计算产生新变量的操作，都会被编译到  _createData  方法里执行。每当 Taro 调用  this.setState API  来更新数据时，都会调用生成的  _createData  来获取最新数据。

生命周期的对应工作主要包含两个部分：初始化过程和状态更新过程。

初始化过程： 在小程序的生命周期回调函数里调用 Taro 组件里对应的生命周期函数即可。

小程序的页面除了渲染过程的生命周期外，还有一些类似于 onPullDownRefresh 、 onReachBottom 等功能性的回调方法也放到了生命周期回调函数里。这些功能性的回调函数，Taro 未做处理，直接保留了下来。

在页面 attached 的时候从全局对象里取到，这样就不用等到 onload 即可获取到路由参数，触发 componentwillmount 生命周期。

taro 实现的在小程序中 nextTick 是这么实现的：

```js
const nextTick = (fn, ...args) => {
  fn = typeof fn === "function" ? fn.bind(null, ...args) : fn;
  const timerFunc = wx.nextTick ? wx.nextTick : setTimeout;
  timerFunc(fn);
};
```

这里用到了小程序组件的 properties 的 observer 特性，给子组件传入一个 prop 并在子组件里监听 prop 的更改，这个 prop 更新就会触发子组件的状态更新逻辑。编译后的代码里会给每个自定义的组件传入一个  \_\_triggerObserer  的值，它的作用正是用于触发子组件的更新逻辑。

为了保证性能，将模版里面用到的字段找出并存储到组件的$usedState字段中。
在计算完小程序的data之后，在遍历$usedState 字段，将多余的内容过滤掉，只保留模版用到的数据。
其次在 setData 之前进行了一次数据 Diff，找到数据的最小更新路径，然后在使用此路径来进行更新。

```js
// 初始 state
this.state = {
  a: [0],
  b: {
    x: {
      y: 1,
    },
  },
};

// 调用 this.setState

this.setState({
  a: [1, 2],
  b: {
    x: {
      y: 10,
    },
  },
});
```

在优化之前，会直接将 this.setState 的数据传给 setData，即:

```js
this.$scope.setData({
  a: [1, 2],
  b: {
    x: {
      y: 10,
    },
  },
});
```

而在优化之后的数据更新则变成了:

```js
this.$scope.setData({
  "a[0]": 1,
  "a[1]": 2,
  "b.x.y": 10,
});
```

同理事件处理函数： 在编译过程中，会提取模板中绑定过的方法，并存到组件的 $events 字段里，这样在运行时就可以只将用到的事件响应函数配置到小程序组件的 methods 字段中。

在运行时通过 processEvent 这个方法来处理事件的对应，省略掉处理过程，就是这样的：

```js
function processEvent (eventHandlerName, obj) {
  obj[eventHandlerName] = function (event) {
	scope[eventHandlerName].apply(callScope, realArgs)
  }
}

Taro['getStorage'] = options => {
  let obj = Object.assign({}, options)
  const p = new Promise((resolve, reject) => {

	['fail', 'success', 'complete'].forEach((k) => {
	  obj[k] = (res) => {
	    options[k] && options[k](res)
	    if (k === 'success') {
		  resolve(res)
	    } else if (k === 'fail') {
		  reject(res)
	    }
	  }
	})
	wx['getStorage'](obj)

  })
  return p
}

// 小程序的调用方式
Taro.getStorage({
  key: 'test',
  success() {

  }
})
// 在 Taro 里也可以这样调用
Taro.getStorage({
  key: 'test'
}).then(() => {
  // success
})

// 示例代码
render() {
  const {

    hoverStartTime = 50,
    onTouchStart

  } = this.props;

  const _onTouchStart = e => {

    setTimeout(() => {
      // @TODO 触发touch样式改变
    }, hoverStartTime);
    onTouchStart && onTouchStart(e);

  }
  return (

    <div onTouchStart={_onTouchStart}>
      {this.props.children}
    </div>

  );
}
```

针对小程序特有的 api。在 web 端实现方式是自己造轮子，只关心出参和入参

webpack 插件是一个具有 apply 属性的 JavaScript 对象。apply 属性会被 webpack compiler 调用，并且 compiler 对象可在整个编译生命周期访问。

```js
HtmlResWebpackPlugin.prototype.apply = function (compiler, callback) {
  // some code here
  compiler.plugin("make", function (compilation, callback) {
    // some code here
    callback(); // 异步回调，跟gulp类似
  });

  compiler.plugin("emit", function (compilation, callback) {
    // 对即将生成的文件进行处理
    _this.options.basename = _this.addFileToWebpackAsset(
      compilation,
      _this.options.template,
      true
    );

    if (_this.options.favicon) {
      _this.options.faviconBaseName = _this.addFileToWebpackAsset(
        compilation,
        _this.options.favicon
      );
    }

    _this.findAssets(compilation);

    if (!_this.options.isWatch) {
      _this.processHashFormat();
    }

    _this.addAssets(compilation);

    // other codes
    callback();
  });
};
```

loader 一般是用来处理文件语言的编译，例如 sass -> css, babel 转 es6->es5。plugin 的功能则强大的得多，能调用许多 webpack 提供的能力，如果处理构建流程中的事件，例如丑化代码、去重、code splitting 都是通过 plugin 去处理。

外部扩展 externals 的定义：
提供了「从输出的 bundle 中排除依赖」的方法。相反，所创建的 bundle 依赖于那些存在于用户环境(consumer's environment)中的依赖
所有 node 模块将不再被绑定，但是，将被保留为 require('module') 。

options.modulesDir (='node_modules')
要在其中搜索 node 模块的文件夹。
所以我们所有的 base 要写成相对路径 ，不然他只会进去 node\_\_module 里面查找

h5 端

```js
/* 示例代码 */
function setStorage({ key, value }) {
  localStorage.setItem(key, value);
}

/* 示例代码 */
function setStorage({ key, value }) {
  localStorage.setItem(key, value);
  return Promise.resolve({
    errMsg: "setStorage:ok",
  });
}
```

下面是进行多余的参数校验：

```js
/* 示例代码 */
function setStorage({ key, value, success, fail, complete }) {
  let res = {
    errMsg: "setStorage:ok",
  };
  if (typeof key === "string") {
    localStorage.setItem(key, value);
    success && success(res);
  } else {
    fail && fail(res);
    return Promise.reject(res);
  }
  complete && complete(res);
  return Promise.resolve({
    errMsg: "setStorage:ok",
  });
}
```

可以说，react-router 的路由方案是组件级别的。

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gdvjnitne5j30jh09u3yw.jpg)

页面级别的：

componentWillMount()
页面加载时触发，一个页面只会调用一次，此时页面 DOM 尚未准备好，还不能和视图层进行交互

componentDidMount()
页面初次渲染完成时触发，一个页面只会调用一次，代表页面已经准备妥当，可以和视图层进行交互

shouldComponentUpdate(nextProps, nextState)
页面是否需要更新，返回 false 不继续更新，否则继续走更新流程

componentWillUpdate(nextProps, nextState)
页面即将更新

componentDidUpdate(prevProps, prevState)
页面更新完毕

componentWillUnmount()
页面卸载时触发，如 redirectTo 或 navigateBack 到其他页面时

componentDidShow()
页面显示/切入前台时触发

componentDidHide()
页面隐藏/切入后台时触发， 如 navigateTo 或底部 tab 切换到其他页面，小程序切入后台等
在以上所有的生命周期方法中，都可以通过  this.$router.params  获取打开当前页面路径中的参数。

usingComponents

组件
componentWillMount()
组件加载时触发，一个组件只会调用一次，此时组件 DOM 尚未准备好，还不能和视图层进行交互

componentDidMount()
组件初次渲染完成时触发，一个组件只会调用一次，代表组件已经准备妥当，可以和视图层进行交互

componentWillReceiveProps(nextProps)
已经装载的组件接收到新属性前调用

shouldComponentUpdate(nextProps, nextState)
组件是否需要更新，返回 false 不继续更新，否则继续走更新流程

componentWillUpdate(nextProps, nextState)
组件即将更新

componentDidUpdate(prevProps, prevState)
组件更新完毕

componentWillUnmount()
组件卸载时触发
