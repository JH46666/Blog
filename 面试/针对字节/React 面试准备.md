# React 面试准备

## 知识点梳理：

### React 基础模块：

- 操作 #jsx。
- 掌握 class 和 function Component。
- state 更新机制， #setState
  和 #useState
  的用法和区别。
- 理解 #props，React 中的 props 可以是什么？
- 类组件生命周期，函数组件生命周期替代方案， #useEffect
  和 #useLayoutEffect
- ### Refs 是什么，能做些什么？

  refs 是 React 提供的一种机制，用于访问和操作 DOM 元素或类组件实例。
  作用：

1. 直接访问 DOM：通过 refs，可以在 React 中直接访问和操作 DOM 元素，而不需要通过 state 或 props。

2. 触发 DOM 操作：可以用于获取 DOM 元素的值、焦点管理、动画操作等。

3. 获取组件实例：对于类组件，refs 可以获取组件的实例，进而访问该组件的方法和属性。

使用场景

- 聚焦输入框
- 动画控制
- 获取子组件的方法

- ### css in React。

### **React 优化手段**

- 渲染控制。
- 渲染调优。
- 处理海量数据。
- 细节处理。

### **React 生态**

- React-Router。
- React-Redux。
- React-Mobx
- 项目工程 umi | dva 等。

### **React 设计模式**

- 组合模式。
- render props 模式。
- HOC | 装饰器模式。
- 提供者模式。
- 自定义 hooks 模式。

### **React 核心原理**

- 事件原理。
- 调和原理。
- 调度原理。
- hooks 原理。
- diff 流程等等。

### **React 实战**

- 实现表单系统。
- 实现状态管理工具。
- 实现路由功能。
- 自定义 hooks 实践。

## JSX

---

老版本的 React 中，为什么写 jsx 的文件要默认引入 React?
如下：

```js
import React from "react";
function Index() {
  return <div>hello,world</div>;
}
```

答：因为 jsx 在被 babel 编译后，写的 jsx 会变成上述 React.createElement 形式，所以需要引入 React，防止找不到 React 引起报错。

---

React.createElement 和 React.cloneElement 到底有什么区别呢?

可以完全理解为，一个是用来创建 element 。另一个是用来修改 element，并返回一个新的 React.element 对象。

Babel 解析 JSX 流程

- @babel/plugin-syntax-jsx ： 使用这个插件，能够让 Babel 有效的解析 JSX 语法。
- @babel/plugin-transform-react-jsx ：这个插件内部调用了 @babel/plugin-syntax-jsx，可以把 React JSX 转化成 JS 能够识别的 createElement 格式。

---

新版本的 React 已经不需要引入 createElement，这种模式来源于
Automatic Runtime

```jsx
function Index() {
  return (
    <div>
      <h1>hello,world</h1>
      <span>let us learn React</span>
    </div>
  );
}
```

被编译后的文件：

```jsx
import { jsx as _jsx } from "react/jsx-runtime";
import { jsxs as _jsxs } from "react/jsx-runtime";
function Index() {
  return _jsxs("div", {
    children: [
      _jsx("h1", {
        children: "hello,world",
      }),
      _jsx("span", {
        children: "let us learn React",
      }),
    ],
  });
}
```

plugin-syntax-jsx 已经向文件中提前注入了 \_jsxRuntime api。不过这种模式下需要我们在 .babelrc 设置 runtime: automatic 。

```json
"presets": [
    ["@babel/preset-react",{
    "runtime": "automatic"
    }]
],
```

**Classic Runtime**

---

Class 组件

问：如果没有在 constructor 的 super 函数中传递 props，那么接下来 constructor 执行上下文中就获取不到 props ，这是为什么呢？

```js
/* 假设我们在 constructor 中这么写 */
constructor(){
    super()
    console.log(this.props) // 打印 undefined 为什么?
}
```

绑定 props 是在父类 Component 构造函数中，执行 super 等于执行 Component 函数，此时 props 没有作为第一个参数传给 super() ，在 Component 中就会找不到 props 参数，从而变成 undefined ，在接下来 constructor 代码中打印 props 为 undefined 。

```js
/* 解决问题 */
constructor(props){
    super(props)
}
```

上述绑定了两个 handleClick ，那么点击 div 之后会打印什么呢？

```js
class Index extends React.Component {
  constructor(...arg) {
    super(...arg); /* 执行 react 底层 Component 函数 */
  }
  state = {}; /* state */
  static number = 1; /* 内置静态属性 */
  handleClick = () =>
    console.log(111); /* 方法： 箭头函数方法直接绑定在this实例上 */
  componentDidMount() {
    /* 生命周期 */
    console.log(Index.number, Index.number1); // 打印 1 , 2
  }
  render() {
    /* 渲染函数 */
    return (
      <div style={{ marginTop: "50px" }} onClick={this.handerClick}>
        hello,React!
      </div>
    );
  }
}
Index.number1 = 2; /* 外置静态属性 */
Index.prototype.handleClick = () =>
  console.log(222); /* 方法: 绑定在 Index 原型链的 方法*/
```

结果是 111 。因为在 class 类内部，箭头函数是直接绑定在实例对象上的，而第二个 handleClick 是绑定在 prototype 原型链上的，它们的优先级是：实例对象上方法属性 > 原型链对象上方法属性。

---

类组件中的 setState 和函数组件中的 useState 有什么异同？

**相同点：**

- 首先从原理角度出发，setState 和 useState 更新视图，底层都调用了 scheduleUpdateOnFiber 方法，而且事件驱动情况下都有批量更新规则。

**不同点**

- 在不是 pureComponent 组件模式下， setState 不会浅比较两次 state 的值，只要调用 setState，在没有其他优化手段的前提下，就会执行更新。但是 useState 中的 dispatchAction 会默认比较两次 state 是否相同，然后决定是否更新组件。
- setState 有专门监听 state 变化的回调函数 callback，可以获取最新 state；但是在函数组件中，只能通过 useEffect 来执行 state 变化引起的副作用。
- setState 在底层处理逻辑上主要是和老 state 进行合并处理，而 useState 更倾向于重新赋值。

---

当 props 不变的前提下， PureComponent 组件能否阻止 componentWillReceiveProps 执行？

答案是否定的，componentWillReceiveProps 生命周期的执行，和纯组件没有关系，纯组件是在 componentWillReceiveProps 执行之后浅比较 props 是否发生变化。所以 PureComponent 下不会阻止该生命周期的执行。

---

React.useEffect 回调函数 和 componentDidMount / componentDidUpdate 执行时机有什么区别 ？

useEffect 对 React 执行栈来看是异步执行的，而 componentDidMount / componentDidUpdate 是同步执行的，useEffect 代码不会阻塞浏览器绘制。

在时机上 ，componentDidMount / componentDidUpdate 和 useLayoutEffect 更类似。

---

函数组件 useEffect 实现生命周期的替代方案

**componentDidMount 替代方案**

```js
React.useEffect(() => {
  /* 请求数据 ， 事件监听 ， 操纵dom */
}, []); /* 切记 dep = [] */
```

这里要记住 dep = [] ，这样当前 effect 没有任何依赖项，也就只有初始化执行一次。

---

**componentWillUnmount 替代方案**

```js
React.useEffect(() => {
  /* 请求数据 ， 事件监听 ， 操纵dom ， 增加定时器，延时器 */
  return function componentWillUnmount() {
    /* 解除事件监听器 ，清除定时器，延时器 */
  };
}, []); /* 切记 dep = [] */
```

在 componentDidMount 的前提下，useEffect 第一个函数的返回函数，可以作为 componentWillUnmount 使用。

---

在各个生命周期中的应用实例：scrollView

- constructor： 做数据初始化，将滑动处理函数，做防抖处理。
- getDerivedStateFromProps: 将 props 中的 list ，合并到 state 。
- componentDidMount: 绑定监听 scroll 事件。
- shouldComponentUpdate：性能优化，只有 list 改变，渲染视图。
- render: 渲染视图，渲染 Item 。
- getSnapshotBeforeUpdate：保存组件更新前的 scrollview 容器高度。
- componentDidUpdate：根据渲染前后容器高度，计算一次高度变化量。
- componentWillUnmount：解除 scroll 事件监听器。

---

首先明确一个问题是 **DOM 元素**和**组件实例** 必须用 ref 对象获取吗？

答案是否定的，React 类组件提供了多种方法获取 **DOM 元素**和**组件实例**，说白了就是 React 对标签里面 ref 属性的处理逻辑多样化。

---

问： 上面很多同学可能会产生疑问，为什么 ref=“node” 字符串，最后会按照函数方式处理呢。
答： 因为当 ref 属性是一个字符串的时候，React 会自动绑定一个函数，用来处理 ref 逻辑。

```js
const ref = function (value) {
  let refs = inst.refs;
  if (refs === emptyRefsObject) {
    refs = inst.refs = {};
  }
  if (value === null) {
    delete refs[stringRef];
  } else {
    refs[stringRef] = value;
  }
};
```

---

react 被 ref 标记的 fiber，那么每一次 fiber 更新都会调用 **commitDetachRef** 和 **commitAttachRef** 更新 Ref 吗 ？

**答案是否定的，只有在 ref 更新的时候，才会调用如上方法更新 ref ，究其原因还要从如上两个方法的执行时期说起**

---

context 与 props 和 react-redux 的对比？
**答**：
context 解决了：

- 解决了 props 需要每一层都手动添加 props 的缺陷。
- 解决了改变 value ，组件全部重新渲染的缺陷。
- react-redux 就是通过 Provider 模式把 redux 中的 store 注入到组件中的。

---

### 详细介绍一下 useMemo ？

```js
const cacheSomething = useMemo(create, deps);
```

- create：第一个参数为一个函数，函数的返回值作为缓存值，如上 demo 中把 Children 对应的 element 对象，缓存起来。
- deps： 第二个参数为一个数组，存放当前 useMemo 的依赖项，在函数组件下一次执行的时候，会对比 deps 依赖项里面的状态，是否有改变，如果有改变重新执行 create ，得到新的缓存值。
- cacheSomething：返回值，执行 create 的返回值。如果 deps 中有依赖项改变，返回的重新执行 create 产生的值，否则取上一次缓存值。

---

**useMemo 原理：**
useMemo 会记录上一次执行 create 的返回值，并把它绑定在函数组件对应的 fiber 对象上，只要组件不销毁，缓存值就一直存在，但是 deps 中如果有一项改变，就会重新执行 create ，返回值作为新的值记录到 fiber 对象上。

**useMemo 应用场景：**

- 可以缓存 element 对象，从而达到按条件渲染组件，优化性能的作用。
- 如果组件中不期望每次 render 都重新计算一些值,可以利用 useMemo 把它缓存起来。
- 可以把函数和属性缓存起来，作为 PureComponent 的绑定方法，或者配合其他 Hooks 一起使用。

---

useCallback# 和 useMemo# 有什么区别？

答：useCallback 第一个参数就是缓存的内容，useMemo 需要执行第一个函数，返回值为缓存的内容，比起 useCallback ， useMemo 更像是缓存了一段逻辑，或者说执行这段逻辑获取的结果。那么对于缓存 element 用 useCallback 可以吗，答案是当然可以了。

---

- React 为什么有自己的事件系统？

首先，对于不同的浏览器，对事件存在不同的兼容性，React 想实现一个兼容全浏览器的框架， 为了实现这个目标就需要创建一个兼容全浏览器的事件系统，以此抹平不同浏览器的差异

其次，v17 之前 React 事件都是绑定在 document 上，
v17 之后 React 把事件绑定在应用对应的容器 container 上，
将事件绑定在同一容器统一管理，防止很多事件直接绑定在原生的 DOM 元素上。
造成一些不可控的情况。由于不是绑定在真实的 DOM 上，所以 React 需要模拟一套事件流：事件捕获-> 事件源 -> 事件冒泡，也包括重写一下事件源对象 event 。

最后，这种事件系统，大部分处理逻辑都在底层处理了，这对后期的 ssr 和跨端支持度很高。

---

- 什么是事件合成 ？

React 事件合成的概念：React 应用中，元素绑定的事件并不是原生事件，而是 React 合成的事件，比如 onClick 是由 click 合成，onChange 是由 blur ，change ，focus 等多个事件合成。

例如：
发现了 onClick 事件，就会绑定 click 事件，比如发现 onChange 事件，会绑定 [blur，change ，focus ，keydown，keyup] 多个事件。

---

- 如何实现的批量更新？

- 事件系统如何模拟冒泡和捕获阶段？

- 如何通过 dom 元素找到与之匹配的 fiber？
-
- 为什么不能用 return false 来阻止事件的默认行为？
-
- 事件是绑定在真实的 dom 上吗？如何不是绑定在哪里？
-
- V17 对事件系统有哪些改变？

---

问：为什么要用不同的事件插件处理不同的 React 事件?

答：首先对于不同的事件，有不同的处理逻辑；对应的事件源对象也有所不同，React 的事件和事件源是自己合成的，所以对于不同事件需要不同的事件插件处理。

---

- 异步调度原理？
- React 为什么不用 settimeout ？
- 说一说 React 的时间分片？
- React 如何模拟 requestIdleCallback？
- 简述一下调度流程？

---

**为什么采用异步调度？**

v15 版本的 React 同样面临着如上的问题，由于对于大型的 React 应用，会存在一次更新，递归遍历大量的虚拟 DOM ，造成占用 js 线程，使得浏览器没有时间去做一些动画效果，伴随项目越来越大，项目会越来越卡。

如何解决以上的问题呢，首先对比一下 vue 框架，vue 有这 template 模版收集依赖的过程，轻松构建响应式，使得在一次更新中，vue 能够迅速响应，找到需要更新的范围，然后以组件粒度更新组件，渲染视图。但是在 React 中，一次更新 React 无法知道此次更新的波及范围，所以 React 选择从根节点开始 diff ，查找不同，更新这些不同。

---

**什么是 fiber**

整个 React 团队花费两年时间重构 fiber 架构，目的就是解决大型 React 应用卡顿；fiber 在 React 中是最小粒度的执行单元，无论 React 还是 Vue ，在遍历更新每一个节点的时候都不是用的真实 DOM ，都是采用虚拟 DOM ，所以可以理解成 fiber 就是 React 的虚拟 DOM 。

Reactv16 为了解决卡顿问题引入了 fiber ，为什么它能解决卡顿，更新 fiber 的过程叫做 Reconciler（调和器），每一个 fiber 都可以作为一个执行单元来处理，所以每一个 fiber 可以根据自身的过期时间 expirationTime（ v17 版本叫做优先级 lane ）来判断是否还有空间时间执行更新，如果没有时间更新，就要把主动权交给浏览器去渲染，做一些动画，重排（ reflow ），重绘 repaints 之类的事情，这样就能给用户感觉不是很卡。然后等浏览器空余时间，在通过 scheduler （调度器），再次恢复执行单元上来，这样就能本质上中断了渲染，提高了用户体验。

---

element,fiber,dom 三种什么关系？

首先必须需要弄明白 React.element ，fiber 和真实 DOM 三者是什么关系。

- element 是 React 视图层在代码层级上的表象，也就是开发者写的 jsx 语法，写的元素结构，都会被创建成 element 对象的形式。上面保存了 props ， children 等信息。
- DOM 是元素在浏览器上给用户直观的表象。
- fiber 可以说是是 element 和真实 DOM 之间的交流枢纽站，一方面每一个类型 element 都会有一个与之对应的 fiber 类型，element 变化引起更新流程都是通过 fiber 层面做一次调和改变，然后对于元素，形成新的 DOM 做视图渲染。

![](React%20%E9%9D%A2%E8%AF%95%E5%87%86%E5%A4%87/0a90368f24f0477aaf0d446a8f6736db_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp)

首先先来看一下 element 与 fiber 之间的对应关系。

```js
export const FunctionComponent = 0; // 对应函数组件
export const ClassComponent = 1; // 对应的类组件
export const IndeterminateComponent = 2; // 初始化的时候不知道是函数组件还是类组件
export const HostRoot = 3; // Root Fiber 可以理解为跟元素 ， 通过reactDom.render()产生的根元素
export const HostPortal = 4; // 对应  ReactDOM.createPortal 产生的 Portal
export const HostComponent = 5; // dom 元素 比如 <div>
export const HostText = 6; // 文本节点
export const Fragment = 7; // 对应 <React.Fragment>
export const Mode = 8; // 对应 <React.StrictMode>
export const ContextConsumer = 9; // 对应 <Context.Consumer>
export const ContextProvider = 10; // 对应 <Context.Provider>
export const ForwardRef = 11; // 对应 React.ForwardRef
export const Profiler = 12; // 对应 <Profiler/ >
export const SuspenseComponent = 13; // 对应 <Suspense>
export const MemoComponent = 14; // 对应 React.memo 返回的组件
```

---

fiber 保存了哪些信息

```js
function FiberNode() {
  this.tag = tag; // fiber 标签 证明是什么类型fiber。
  this.key = key; // key调和子节点时候用到。
  this.type = null; // dom元素是对应的元素类型，比如div，组件指向组件对应的类或者函数。
  this.stateNode = null; // 指向对应的真实dom元素，类组件指向组件实例，可以被ref获取。

  this.return = null; // 指向父级fiber
  this.child = null; // 指向子级fiber
  this.sibling = null; // 指向兄弟fiber
  this.index = 0; // 索引

  this.ref = null; // ref指向，ref函数，或者ref对象。

  this.pendingProps = pendingProps; // 在一次更新中，代表element创建
  this.memoizedProps = null; // 记录上一次更新完毕后的props
  this.updateQueue = null; // 类组件存放setState更新队列，函数组件存放
  this.memoizedState = null; // 类组件保存state信息，函数组件保存hooks信息，dom元素为null
  this.dependencies = null; // context或是时间的依赖项

  this.mode = mode; //描述fiber树的模式，比如 ConcurrentMode 模式

  this.effectTag = NoEffect; // effect标签，用于收集effectList
  this.nextEffect = null; // 指向下一个effect

  this.firstEffect = null; // 第一个effect
  this.lastEffect = null; // 最后一个effect

  this.expirationTime = NoWork; // 通过不同过期时间，判断任务是否过期， 在v17版本用lane表示。

  this.alternate = null; //双缓存树，指向缓存的fiber。更新阶段，两颗树互相交替。
}
```

---

**每一个 fiber 如何建立起关联的**

每一个 element 都会对应一个 fiber ，每一个 fiber 是通过 return ， child ，sibling 三个属性建立起联系的。

- return： 指向父级 Fiber 节点。
- child： 指向子 Fiber 节点。
- sibling：指向兄弟 fiber 节点。

比如项目结构是这样

```js
export default class Index extends React.Component {
  state = { number: 666 };
  handleClick = () => {
    this.setState({
      number: this.state.number + 1,
    });
  };
  render() {
    return (
      <div>
        hello，world
        <p> 《React进阶实践指南》 {this.state.number} 👍 </p>
        <button onClick={this.handleClick}>点赞</button>
      </div>
    );
  }
}
```

---

**fiber 对应的关系如下**

![](React%20%E9%9D%A2%E8%AF%95%E5%87%86%E5%A4%87/5251e320a99f468ca3b46030febaa6b5_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp)

```js

```

---

问：如果如上又发生一次点击，会发生什么？

答：如果进行下一次更新，那么会将 current 的 alternate 作为基础（如图右树），复制一份作为 workInProgresss ，然后进行更新。

---

## react 18 更新了啥

3.1 Stack Reconciler
在 React 15.x 版本以及之前的版本，Reconciliation 算法采用了栈调和器（ Stack Reconciler ）来实现，但是这个时期的栈调和器存在一些缺陷：不能暂停渲染任务，不能切分任务，无法有效平衡组件更新渲染与动画相关任务的执行顺序，即不能划分任务的优先级（这样有可能导致重要任务卡顿、动画掉帧等问题）。Stack Reconciler 的实现。

3.2 Fiber Reconciler
为了解决 Stack Reconciler 中固有的问题，以及一些历史遗留问题，在 React 16 版本推出了新的 Reconciliation 算法的调和器—— Fiber 调和器（Fiber Reconciler）来替代栈调和器。Fiber Reconciler 将会利用调度器（Scheduler）来帮忙处理组件渲染/更新的工作。此外，引入 fiber 这个概念后，原来的 react element tree 有了一棵对应的 fiber node tree。在 diff 两棵 react element tree 的差异时，Fiber Reconciler 会基于 fiber node tree 来使用 diff 算法，通过 fiber node 的 return、child、sibling 属性能更方便的遍历 fiber node tree，从而更高效地完成 diff 算法。

fiber 调度的优点：

能够把可中断的任务切片处理;

能够调整任务优先级，重置并复用任务；

可以在父子组件任务间前进后退切换任务；

render 方法可以返回多个元素（即可以返回数组）；

## 支持异常边界处理异常；

[errorBoundaries](../../源码/React/errorBoundaries.md)

## react 组件通信如何实现

1.父组件向子组件通讯: 父组件可以向子组件通过传 props 的方式，向子组件进行通讯
子组件向父组件通讯: props+回调的方式,父组件向子组件传递 props 进行通讯，此 props 为作用域为父组件自身的函数，子

2.跨层级通信: Context 设计目的是为了共享那些对于一个组件树而言是“全局”的数据，例如当前认证的用户、主题或首选语言, 对于跨越多层的
全局数据通过 Context 通信再适合不过

3.发布订阅模式: 发布者发布事件，订阅者监听事件并做出反应,我们可以通过引入 event 模块进行通信

4.全局状态管理工具: 借助 Redux 或者 Mobx 等全局状态管理工具进行通信,这种工具会维护一个全局状态中心 Store,并根据不同的事件产生新的状态

## 你是如何理解 fiber 的?

React Fiber 是一种基于浏览器的单线程调度算法.
React 16 之前 ，reconcilation  算法实际上是递归，想要中断递归是很困难的，React 16 开始使用了循环来代替之前的递归.
Fiber：一种将 recocilation （递归 diff），拆分成无数个小任务的算法；它随时能够停止，恢复。停止恢复的时机取决于当前的一帧（16ms）内，还有没有足够的时间允许计算。

## react-redux 是如何工作的

Provider: Provider 的作用是从最外部封装了整个应用，并向 connect 模块传递 store
connect: 负责连接 React 和 Redux

获取 state: connect 通过 context 获取 Provider 中的 store，通过 store.getState()获取整个 store tree 上所有 state
包装原组件: 将 state 和 action 通过 props 的方式传入到原组件内部 wrapWithConnect 返回一个 ReactComponent 对象 Connect，Connect 重新 render 外部传入的原组件 WrappedComponent，并把 connect 中传入的 mapStateToProps, mapDispatchToProps 与组件上原有的 props 合并后，通过属性的方式传给 WrappedComponent
监听 store tree 变化: connect 缓存了 store tree 中 state 的状态,通过当前 state 状态和变更前 state 状态进行比较,从而确定是否调用 this.setState()方法触发 Connect 及其子组件的重新渲染

## redux 与 mobx 的区别

[Redux 与 Mobx 对比](../../源码/Redux/与Mobx对比.md)

## redux 中如何进行异步操作?

可以在 componentDidmount 中直接进行请求无须借助 redux.

或者使用异步流的管理, 通常我们会借助 redux 的异步中间件进行异步处理

## 为什么取消了 UNSAFE 前缀

# unSafe

React 官网上的计划是：

16.3：为不安全生命周期引入别名 UNSAFE_componentWillMount，UNSAFE_componentWillReceiveProps 和 UNSAFE_componentWillUpdate。 （旧的生命周期名称和新的别名都可以在此版本中使用。）

未来的 16.x 版本：为 componentWillMount，componentWillReceiveProps 和 componentWillUpdate 启用弃用警告。 （旧的生命周期名称和新的别名都可以在此版本中使用，但旧名称会记录 DEV 模式警告。）

17.0：删除 componentWillMount，componentWillReceiveProps 和 componentWillUpdate。 （从现在开始，只有新的“UNSAFE\_”生命周期名称将起作用。)

React 意识到 componentWillMount、componentWillReceiveProps 和 componentWillUpdate 这三个生命周期函数有缺陷，比较容易导致崩溃。但是由于旧的项目已经在用以及有些老开发者习惯用这些生命周期函数，于是通过给它加 UNSAFE\_来提醒用它的人要注意它们的缺陷。
2、React 加入了两个新的生命周期函数 getSnapshotBeforeUpdate 和 getDerivedStateFromProps，目的为了即使不使用这三个生命周期函数，也能实现只有这三个生命周期能实现的功能。

```js

componentWillMount、
componentWillReceiveProps
componentWillUpdate

```

现在这几个生命周期函数前都增加了“UNSAFE\_”前缀，变成如下模样：

```js

UNSAFE_componentWillMount、
UNSAFE_componentWillReceiveProps
UNSAFE_componentWillUpdate

```

因为 Fiber 重构后，渲染变成了异步的，通过查看新的生命周期图谱，这几个方法都处于原来的 render 阶段，也就是会出现重复调用的问题，比如说不合理的使用 setState 造成重复渲染死循环等。

总结
总的来说，React 生命周期的进化都是为 Fiber 架构服务的，Fiber 带了异步渲染的机制，使生命周期变的更加纯粹和可控，同时也减少了我们书写代码不规范造成的不必要的 bug。

## setState 到底是异步还是同步

案: 有时表现出异步,有时表现出同步

1. setState 只在合成事件和钩子函数中是“异步”的，在原生事件和 setTimeout  中都是同步的。

2. setState  的“异步”并不是说内部由异步代码实现，其实本身执行的过程和代码都是同步的，只是合成事件和钩子函数的调用顺序在更新之前，导致在合成事件和钩子函数中没法立马拿到更新后的值，形成了所谓的“异步”，当然可以通过第二个参数  setState(partialState, callback)  中的 callback 拿到更新后的结果。

3. setState  的批量更新优化也是建立在“异步”（合成事件、钩子函数）之上的，在原生事件和 setTimeout 中不会批量更新，在“异步”中如果对同一个值进行多次 setState，setState 的批量更新策略会对其进行覆盖，取最后一次的执行，如果是同时 setState 多个不同的值，在更新时会对其进行合并批量更新。

## ref 使用

ref 不能挂载在 function component 上,因为他没有实例, 只有 class component 初始化的时候才有实例

## jsx 是什么

回答：
JSX 是 JavaScript 的语法扩展，用于在 React 中描述 UI 结构，看起来像 HTML，但最终会被编译为 JavaScript 代码（如 React.createElement 调用）。

JSX 和 JS 的区别

1. 语法：JSX 类似 HTML，嵌套在 JS 中；JS 是标准 JavaScript 语法。
2. 功能：JSX 用于定义 React 组件的 UI；JS 用于逻辑控制和操作。
3. 处理：JSX 需编译为 JS 才能运行；JS 可直接运行。
4. 表达式：JSX 支持在 {} 中嵌入动态 JS 表达式。

## React-router 实现路由拦截

通过 useLocation 和 useNavigate 实现路由拦截

```js
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

function ProtectedRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = checkUserAuthentication(); // 替换为实际的身份验证逻辑

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
    }
  }, [isAuthenticated, location, navigate]);

  if (!isAuthenticated) {
    return null; // 或者返回一个加载指示器
  }

  return <h1>Protected Content</h1>;
}
```

## ① React Hooks 为什么必须在函数组件内部执行？React 如何能够监听 React Hooks 在外部执行并抛出异常。

## ② React Hooks 如何把状态保存起来？保存的信息存在了哪里？

## ③ React Hooks 为什么不能写在条件语句中？

对 React Hooks 而言，调用必须放在最前面，而且不能被包含在条件语句里，这是因为 React Hooks 采用下标方式寻找状态，一旦位置不对或者 Hooks 放在了条件中，就无法正确找到对应位置的值。

## ④ useMemo 内部引用 useRef 为什么不需要添加依赖项，而 useState 就要添加依赖项。

2. 为什么 useRef 不需要加依赖项？
   核心原因：引用稳定性

- useRef 的返回值是稳定的：

* 调用 useRef 返回的对象在组件的生命周期内始终是同一个引用（内存地址不变）。
* 即使 .current 的值改变，ref 对象本身不发生变化。

- React 的依赖检查：

* useMemo 的依赖数组通过浅比较（Object.is）检测变化。
* 因为 ref 对象的引用永远不变，useMemo 不需要重新计算。

为什么 useState 需要加依赖项？
核心原因：值变化触发更新

- useState 的值是动态的：

* 调用 setState 更新状态时，值变化并触发组件重新渲染。
* 新值通过 state 返回，与上一次可能不同。

- 依赖检查：

* 如果 useMemo 依赖 state，而 state 变化时未更新依赖数组，可能导致缓存值与实际状态不一致。

## ⑤ useEffect 添加依赖项 props.a ，为什么 props.a 改变，useEffect 回调函数 create 重新执行。

## ⑥ React 内部如何区别 useEffect 和 useLayoutEffect ，执行时机有什么不同

1. 基本概念

useEffect：

- 用于异步处理副作用，如数据获取、订阅事件。
- 在 DOM 更新后异步执行，不会阻塞浏览器渲染。

useLayoutEffect：

- 用于同步处理副作用，如测量 DOM 布局、同步更新样式。
- 在 DOM 更新后但浏览器绘制（paint）前同步执行。

(1). hook 的实现
在 react 内部底层都是调用同一个函数 mountEffect，但传递的阐述不同：

useEffect 调用 mountEffectImpl 时标记为 Passive（异步调度）。
useLayoutEffect 调用 mountEffectImpl 时标记为 Layout（同步调度）。

```js
// useEffect
function useEffect(effect, deps) {
  return mountEffectImpl(Passive, HookEffectTag, effect, deps);
}

// useLayoutEffect
function useLayoutEffect(effect, deps) {
  return mountEffectImpl(Layout, HookEffectTag, effect, deps);
}
```

(2). Fiber 调度

React 使用 Fiber 架构管理组件更新，每个 Fiber 节点有一个 effects 列表，记录需要执行的副作用。

useEffect 的副作用被标记为 PassiveEffect，放入异步队列。
useLayoutEffect 的副作用被标记为 LayoutEffect，放入同步队列。
源码：scheduleCallback 和 commitRoot 函数处理这些副作用。

(3) 执行阶段
React 的渲染分为三个阶段：
Render 阶段：构建虚拟 DOM，计算差异。
Commit 阶段：
Layout 阶段（同步）：更新真实 DOM，执行 useLayoutEffect。
Passive 阶段（异步）：浏览器绘制完成后，执行 useEffect。
源码：commitRootImpl（react-reconciler/src/ReactFiberWorkLoop.js）：
先执行 commitLayoutEffects（包含 useLayoutEffect）。
再调度 flushPassiveEffects（包含 useEffect）。

3. 执行时机的差异

执行流程

1. Render 阶段

React 构建新 Fiber 树，调用组件函数，收集 useEffect 和 useLayoutEffect

2. Commit 阶段

DOM 更新：将虚拟 DOM 变化应用到真实 DOM。

Layout 阶段（同步）：

- 执行 useLayoutEffect 的回调。
- 此时 DOM 已更新，但浏览器尚未绘制（paint）。

浏览器绘制：将更新后的 DOM 渲染到屏幕。

Passive 阶段（异步）：

- 在绘制后，异步调度执行 useEffect 的回调。
  可视化时间线

时间轴：

1. Render 阶段 ---> 构建虚拟 DOM
2. Commit 阶段：
   - DOM 更新 ---> 真实 DOM 更新完成
   - useLayoutEffect ---> 同步执行（浏览器绘制前）
   - 浏览器绘制 ---> 显示到屏幕
   - useLayoutEffect 清理（下一更新前）
   - useEffect ---> 异步执行（绘制后）

## 函数组件与类组件的区别

1. 写法：
   函数组件是无状态组件，直到引入 Hooks 才支持状态管理。
   类组件通过 class 声明，依赖 this 来管理状态和生命周期。

2. 状态和生命周期：
   函数组件用 useState 和 useEffect 管理状态和副作用。
   类组件用 state 和生命周期方法。

3. 性能：
   函数组件更轻量，性能更优（不涉及 this 和原型链）。

4. 代码复用：
   函数组件通过 Hook 实现更灵活的逻辑复用。
   类组件通常使用 HOC 和 render props。

## Hook 的使用限制有哪些

1. 只能在函数组件或自定义 Hook 中使用，不能在类组件或普通函数中调用
2. 只能在组件的顶层调用，不能在回调或事件处理函数中使用。
3. 调用顺序必须一致，不能在条件语句、循环或嵌套函数中调用。
4. 自定义 Hook 必须以 use 开头，确保 React 能识别。
5. 不能在类组件中使用，只能在函数组件中。

## React 性能优化

1. 使用 React.memo 对函数组件进行浅比较优化，避免不必要的重新渲染。
2. 在类组件中使用 shouldComponentUpdate 生命周期方法（在 React 16.3+中推荐使用 React.PureComponent 来简化这个过程）来手动控制组件是否更新。
3. 合理使用 key 属性，在列表渲染时确保 key 的唯一性且稳定，这有助于 React 识别哪些元素发生了变化，从而提高渲染效率。
4. 对于大型组件树，可以采用懒加载（React.lazy 结合 Suspense）来按需加载组件，减少初始加载时间。
5. 避免使用内联函数

## Redux 为什么 不能直接 修改值

- 设计需求：不可变性保证状态可预测、变更可检测、调试可回溯。
- 性能优化：新对象引用触发高效更新。
- 实现约定：通过 reducer 返回新状态实现。
