# 初始化的流程

## 编译： parse optimize codegen

编译：

1. parse ： 模版 ->ast 树
2. optimize： 优化 ast 树
3. codegen： ast 树 ->代码

vue 源码自定义了很多类型 例如 decalre interface VNodeData

libs 部分用来描述包含指定库定义的目录

- compiler virtual dom render function 写的都是 tml

- core 内置组件 global-api keep-alive instance 实例化 生命周期 obersever 响应式 utils vdom

- platform web wexx mpvue

放一些平台编译 运行时的相关代码 server util

- server 服务端的代码跑在 node 上，渲染成 html 字符串，将它们直接发送到浏览器

- sfc 简单的解释器 .vue 文件编译出 js 对象

- shared 常量 工具方法

子继承父类的话 就是
先看下父类的 constructor 里面有没有定义 this 如果有的话 子类的方法能够读到
如果父类 constructor 没有定义 子类 constructor 定义也是子类方法读取的到

super(xxx) 一定要在前面 不然会错
Must call super constructor in derived class before accessing

对源码进行单步调试： debugger
断点调试： 第一个是跳到下一个端点 第二个是跳过这个逻辑 第三个是进入到函数里面

## 构建过程

vue rollup 构建出 cjs(COMMONJS) esm（ES MODULE） umd（umd 规范）三个版本

runtime-only 在开发过程中 webpack 的 vue-loader 事先把模板编译成 render 函数。
runtime-compiler 是将 tml 转成 render 所以我们源码分析的时候会基于此来分析.含编译代码的，可以把编译过程放在运行时做。

如果没有对代码做预编译，但又引入了 vue 的 tpl 并传入一个字符串，则需要在客户端编译了 这时候就需要 runtime+ compiler

mixn 能够将 vue 的原型 拆分到不同文件下 利于管理

在 src/core/index。js 中：

```js
initGlobalAPI(Vue);

Object.defineProperty(Vue.prototype, "$isServer", {
  get: isServerRendering,
});

Object.defineProperty(Vue.prototype, "$ssrContext", {
  get() {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext;
  },
});

// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, "FunctionalRenderContext", {
  value: FunctionalRenderContext,
});
```

vue 的这个写法有点溜啊

```js
function Vue(options) {
  if (process.env.NODE_ENV !== "production" && !(this instanceof Vue)) {
    warn("Vue is a constructor and should be called with the `new` keyword");
  }
  this._init(options);
}

initMixin(Vue);
stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);
```

为什么 Vue 不用 ES6 的 Class 去实现呢， 因为 xxxMixin 的函数调用， 并把 vue 当参数传入， 它们的功能都是给 vue 的 prototype 上扩展一些方法

## initGlobalAPI

```js
Object.defineProperty(Vue, "config", configDef);

Vue.util = {
  warn,
  extend,
  mergeOptions,
  defineReactive,
};

Vue.set = set;
Vue.delete = del;
Vue.nextTick = nextTick;

Vue.options = Object.create(null);
ASSET_TYPES.forEach((type) => {
  Vue.options[type + "s"] = Object.create(null);
});

// this is used to identify the "base" constructor to extend all plain-object
// components with in Weex's multi-instance scenarios.
Vue.options._base = Vue;

extend(Vue.options.components, builtInComponents);

initUse(Vue);
initMixin(Vue);
initExtend(Vue);
initAssetRegisters(Vue);
```

全局 global-api 包含了 **extend mixin use asset**

## 初始化

init 初始化： **lifecycle event render hook injections state provide**

```JS
Vue.prototype._init = function (options?: Object) {
  // expose real self
  vm._self = vm
  initLifecycle(vm)
  initEvents(vm)
  initRender(vm)
  callHook(vm, 'beforeCreate')
  initInjections(vm) // resolve injections before data/props
  initState(vm)
  initProvide(vm) // resolve provide after data/props
  callHook(vm, 'created')
}
```

Vue 初始化主要就干了几件事情，合并配置，初始化生命周期，初始化事件中心，初始化渲染，初始化 data、props、computed、watcher 等等。

## 实例挂载

Vue 中我们是通过 $mount 实例方法去挂载 vm 的，

```js
 /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }
  if (!options.render) {
    let template = options.template
    if (template) {}
  }
  if (template) {
  const { render, staticRenderFns } = compileToFunctions(template, {
        shouldDecodeNewlines,}
  }
```

首先，它对 el 做了限制，Vue 不能挂载在 body、html 这样的根节点上。接下来的是很关键的逻辑 —— 如果没有定义 render 方法，则会把 el 或者 template 字符串转换成 render 方法。它是调用 compileToFunctions 方法实现的.

$mount 方法实际上会去调用 mountComponent 方法

```js
export function mountComponent(
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el;
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode;
  }
  callHook(vm, "beforeMount");
  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  new Watcher(
    vm,
    updateComponent,
    noop,
    {
      before() {
        if (vm._isMounted) {
          callHook(vm, "beforeUpdate");
        }
      },
    },
    true /* isRenderWatcher */
  );
  hydrating = false;

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true;
    callHook(vm, "mounted");
  }
  return vm;
}
```

从上面的代码可以看到，mountComponent 核心就是先实例化一个渲染 Watcher，在它的回调函数中会调用 updateComponent 方法，在此方法中调用 vm.\_render 方法先生成虚拟 Node，最终调用 vm.\_update 更新 DOM。

Watcher 在这里起到两个作用，一个是初始化的时候会执行回调函数，另一个是当 vm 实例中的监测的数据发生变化的时候执行回调函数.

函数最后判断为根节点的时候设置 vm.\_isMounted 为 true， 表示这个实例已经挂载了，同时执行 mounted 钩子函数

### render

Vue 的 \_render 方法是实例的一个私有方法，它用来把实例渲染成一个虚拟 Node。

```js
Vue.prototype._render = function (): VNode {
  const vm: Component = this
  const { render, _parentVnode } = vm.$options
  try {
    vnode = render.call(vm._renderProxy, vm.$createElement)
  }

  // set parent
  vnode.parent = _parentVnode
  return vnode
}
```

vm.$createElement 方法定义是在执行 initRender 方法的时候，可以看到除了 vm.$createElement 方法，还有一个 vm.\_c 方法，它是被模板编译成的 render 函数使用，而 vm.$createElement 是用户手写 render 方法使用的， 这俩个方法支持的参数相同，并且内部都调用了 createElement 方法。

## virtual Dom

Virtual DOM 就是用一个原生的 JS 对象去描述一个 DOM 节点，所以它比创建一个 DOM 的代价要小很多。在 Vue.js 中，Virtual DOM 是用 VNode

```JS
export default class VNode {
  tag: string | void;
  data: VNodeData | void;
  children: ?Array<VNode>;
  text: string | void;
  elm: Node | void;
  ns: string | void;
  context: Component | void; // rendered in this component's scope
  key: string | number | void;
  componentOptions: VNodeComponentOptions | void;
  componentInstance: Component | void; // component instance
  parent: VNode | void; // component placeholder node

  // strictly internal
  raw: boolean; // contains raw HTML? (server only)
  isStatic: boolean; // hoisted static node
  isRootInsert: boolean; // necessary for enter transition check
  isComment: boolean; // empty comment placeholder?
  isCloned: boolean; // is a cloned node?
  isOnce: boolean; // is a v-once node?
  asyncFactory: Function | void; // async component factory function
  asyncMeta: Object | void;
  isAsyncPlaceholder: boolean;
  ssrContext: Object | void;
  fnContext: Component | void; // real context vm for functional nodes
  fnOptions: ?ComponentOptions; // for SSR caching
  fnScopeId: ?string; // functional scope id support

  constructor (
    tag?: string,
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  )
}

```

Vue.js 利用 createElement 方法创建 VNode，

### createElement

```js
export function createElement(
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNode | Array<VNode> {
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children;
    children = data;
    data = undefined;
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE;
  }
  return _createElement(context, tag, data, children, normalizationType);
}
```

createElement 方法实际上是对 \_createElement 方法的封装，它允许传入的参数更加灵活，在处理这些参数后，调用真正创建 VNode 的函数\_createElement：

### children

由于 Virtual DOM 实际上是一个树状结构，每一个 VNode 可能会有若干个子节点，这些子节点应该也是 VNode 的类型。\_createElement 接收的第 4 个参数 children 是任意类型的

normalizationType 的不同，调用了 normalizeChildren(children) 和 simpleNormalizeChildren(children) 方法

```js
export function simpleNormalizeChildren(children: any) {
  for (let i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children);
    }
  }
  return children;
}
```

functional component 函数式组件返回的是一个数组而不是一个根节点，所以会通过 Array.prototype.concat 方法把整个 children 数组打平，让它的深度只有一层。

VNode 的创建

```JS
let vnode, ns
if (typeof tag === 'string') {
  let Ctor
  ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
  if (config.isReservedTag(tag)) {
    // platform built-in elements
    vnode = new VNode(
      config.parsePlatformTagName(tag), data, children,
      undefined, undefined, context
    )
  } else if (isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
    // component
    vnode = createComponent(Ctor, data, context, children, tag)
  } else {
    // unknown or unlisted namespaced elements
    // check at runtime because it may get assigned a namespace when its
    // parent normalizes children
    vnode = new VNode(
      tag, data, children,
      undefined, undefined, context
    )
  }
} else {
  // direct component options / constructor
  vnode = createComponent(tag, data, context, children)
}

```

这里先对 tag 做判断，如果是 string 类型，则接着判断如果是内置的一些节点，则直接创建一个普通 VNode，如果是为已注册的组件名，则通过 createComponent 创建一个组件类型的 VNode，否则创建一个未知的标签的 VNode。 如果是 tag 一个 Component 类型，则直接调用 createComponent 创建一个组件类型的 VNode 节点

### UPDATE

Vue 的 \_update 是实例的一个私有方法，它被调用的时机有 2 个，一个是首次渲染，一个是数据更新的时候；

```JS
Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
  const vm: Component = this
  const prevEl = vm.$el
  const prevVnode = vm._vnode
  const prevActiveInstance = activeInstance
  activeInstance = vm
  vm._vnode = vnode
  // Vue.prototype.__patch__ is injected in entry points
  // based on the rendering backend used.
  if (!prevVnode) {
    // initial render
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
  } else {
    // updates
    vm.$el = vm.__patch__(prevVnode, vnode)
  }

  // if parent is an HOC, update its $el as well
  if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
    vm.$parent.$el = vm.$el
  }
  // updated hook is called by the scheduler to ensure that children are
  // updated in a parent's updated hook.
}

```

\_update 的核心就是调用 vm.**patch** 方法

在客户端中会指向 patch 方法 src/platforms/web/runtime/patch.js

```JS
export const patch: Function = createPatchFunction({ nodeOps, modules })
```

该方法的定义是调用 createPatchFunction 方法的返回值，这里传入了一个对象，包含 nodeOps 参数和 modules 参数。其中，nodeOps 封装了一系列 DOM 操作的方法，modules 定义了一些模块的钩子函数的实现

```JS
const hooks = ['create', 'activate', 'update', 'remove', 'destroy']

export function createPatchFunction (backend) {
  let i, j
  const cbs = {}

  const { modules, nodeOps } = backend

  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = []
    for (j = 0; j < modules.length; ++j) {
      if (isDef(modules[j][hooks[i]])) {
        cbs[hooks[i]].push(modules[j][hooks[i]])
      }
    }
  }
  return function patch (oldVnode, vnode, hydrating, removeOnly) {
    if (isUndef(vnode)) {
      if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
      return
    }
    if (isUndef(oldVnode)) {
      // empty mount (likely as component), create new root element
      isInitialPatch = true
      createElm(vnode, insertedVnodeQueue)
    } else {
      const isRealElement = isDef(oldVnode.nodeType)
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        // patch existing root node
        patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly)
      } else {

      }
    }
  }

    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
    return vnode.elm
}
```

createPatchFunction 内部定义了一系列的辅助方法，最终返回了一个 patch 方法，这个方法就赋值给了 vm.\_update 函数里调用的 vm.**patch**。

回到 patch 方法本身，它接收 4 个参数，oldVnode 表示旧的 VNode 节点，它也可以不存在或者是一个 DOM 对象；vnode 表示执行 \_render 后返回的 VNode 的节点；hydrating 表示是否是服务端渲染；removeOnly 是给 transition-group 用的.

createElm 的作用是通过虚拟节点创建真实的 DOM 并插入到它的父节点中。 我们来看一下它的一些关键逻辑，createComponent 方法目的是尝试创建子组件

```js
createChildren(vnode, children, insertedVnodeQueue);

function createChildren(vnode, children, insertedVnodeQueue) {
  if (Array.isArray(children)) {
    if (process.env.NODE_ENV !== "production") {
      checkDuplicateKeys(children);
    }
    for (let i = 0; i < children.length; ++i) {
      createElm(
        children[i],
        insertedVnodeQueue,
        vnode.elm,
        null,
        true,
        children,
        i
      );
    }
  } else if (isPrimitive(vnode.text)) {
    nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)));
  }
}
```

createChildren 的逻辑很简单，实际上是遍历子虚拟节点，递归调用 createElm，这是一种常用的深度优先的遍历算法，这里要注意的一点是在遍历过程中会把 vnode.elm 作为父容器的 DOM 节点占位符传入。

```js
if (isDef(data)) {
  invokeCreateHooks(vnode, insertedVnodeQueue);
}

function invokeCreateHooks(vnode, insertedVnodeQueue) {
  for (let i = 0; i < cbs.create.length; ++i) {
    cbs.create[i](emptyNode, vnode);
  }
  i = vnode.data.hook; // Reuse variable
  if (isDef(i)) {
    if (isDef(i.create)) i.create(emptyNode, vnode);
    if (isDef(i.insert)) insertedVnodeQueue.push(vnode);
  }
}
```

最后调用 insert 方法把 DOM 插入到父节点中，因为是递归调用，子元素会优先调用 insert，所以整个 vnode 树节点的插入顺序是先子后父。

render 函数
vm.$render.call(vm._renderProxy, vm.$createElement);

执行 initRender 方法 $createElement， 返回 vnode。

createElement 包含五个属性： context 、tag、data、children、normalizationType

virtual dom 就是用一个原生的 js 对象去描述一个 dom 节点，所以它比创建 dom 的代价小很多。

vnode 是对真实 dom 的一种抽象描述， 它的核心定义无非就是： 标签名、数据、子节点、键值。

我们根据 simple_normalize always_normalize 判断两种类型

1. simpleNormalizeChidlren children 包含函数式组件，可能返回一个数组而不是根结点，使用 for 循环遍历，进行 concat 拼接

2.（1）render 函数是用户手写的，当 children 只有一个节点的时候， 会调用 createTextvNodex 写成基础类型： isprimitive
（2）normalizeChildren 如果是 tpl、slot、v-for 的话 就判断有没有 children.normalizeArrayChildren

VNode 的创建
我们对 tag 对判断

```js
if(string){

	if(内置节点){
		Vnode
	}  else if(组册组件) {
		createComponent 创建一个组件类型的Vnode
	} else {
	 未知标签的vnode
	}

}
if(component){

	createComponent 创建一个组件类型的Vnode

}
```

\_update 被调用的时机有两个： 首次渲染、数据更新的时候。

**patch** = isBrowser ? path : noop

createPatchFunction 传入一个对象，包含 nodeOps 参数和 modules 参数
nodeOps 封装了一系列 dom 操作
modules 定义了一些模块的钩子函数

function patch (oldVnode, vnode, hydrating, removeOnly)
oldvnode 表示旧节点， vnode 表示执行 render 后返回的 vnode 节点， hydrating 表示是否是服务端渲染，removeOnly 表示是给 transition-group 用的

```js
hooks = 【’create’, ‘active’, ‘update’, ‘remove’, ’destroy’】

  // create new node
  createElm(
    vnode,
    insertedVnodeQueue,
    // extremely rare edge case: do not insert if old element is in a
    nodeOps.nextSibling(oldElm)
  )
```

createElment 作用是通过虚拟节点创建真实的 dom 并插入到它的父节点中
createchildren 方法创建子元素 遍历子虚拟节点， 递归调用 createElment

接着再调用  invokeCreateHooks  方法执行所有的 create 的钩子并把  vnode push 到  insertedVnodeQueue  中。

最后调用  insert  方法把  DOM  插入到父节点中，因为是递归调用，子元素会优先调用  insert，所以整个  vnode  树节点的插入顺序是先子后父。

这是最后的总结图

![渲染流程](./0081Kckwgy1gkfurpk8noj314o0k0wf5.webp)

## createComponent

createComponent 方法主要完成了下面三个核心步骤：

构造子类构造函数，安装组件钩子函数和实例化  vnode

### 构造子类构造函数

```JS
const baseCtor = context.$options._base
if (isObject(Ctor)) {
  Ctor = baseCtor.extend(Ctor)
}

```

```JS
vm.$options = mergeOptions(
  resolveConstructorOptions(vm.constructor),
  options || {},
  vm
)
```

mergeOptions 将 vue 构造函数的 options 和用户传入的 options 做一层合并，到 vm.$optiosn
子组件 构造器 extends 父组件的一些状态 还拥有自己的 options
继承于 vue 的构造器 sub，做一些属性扩展（globalapi、options、props、computed）

```JS
Vue.extend(){
$super = this
cacheCtos
 const Sub = function VueComponent (options) {

    this._init(options)

  }
Sub.prototype = Object.create(Super.prototype)
  Sub.prototype.constructor = Sub
  Sub.options = mergeOptions(

    Super.options,
    extendOptions

  )
  Sub['super'] = Super
}
```

Vue.extend 的作用就是构造一个 Vue 的子类，它使用一种非常经典的原型继承的方式把一个纯对象转换一个继承于 Vue 的构造器 Sub 并返回，然后对 Sub 这个对象本身扩展了一些属性，如扩展 options、添加全局 API 等，最后对 sub 构造器函数做缓存，避免多次执行 vue.extend 的时候对同一个子组件重复构造。

### 安装组件钩子函数

installComponentHooks(data)

将组件的一些状态 merge 遍历

```JS
hooksToMerge = object.keys(componentVNodeHooks
)
```

整个 installComponentHooks 的过程就是把 componentVNodeHooks 的钩子函数有 init、prepatch、insert、destroy 合并到 data.hook 中.在 vnode 执行 patch 执行相关钩子函数
如果某个时机的钩子已经存在 data.hook 中，那么通过执行 mergeHook 函数做合并。

### 实例化 vnode

```JS
const name = Ctor.options.name || tag
const vnode = new VNode(
  `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
  data, undefined, undefined, undefined, context,
  { Ctor, propsData, listeners, tag, children },
  asyncFactory
)
return vnode
```

最后一步非常简单，通过 new VNode 实例化一个 vnode 并返回。需要注意的是和普通元素节点的 vnode 不同，组件的 vnode 是没有 children 的

## patch

createComponent 创建了组件 VNode，接下来会走到 vm.\_update，执行 vm.**patch** 去把 VNode 转换成真正的 DOM 节点。

```JS
function createElm (
  vnode,
  insertedVnodeQueue,
  parentElm,
  refElm,
  nested,
  ownerArray,
  index
) {
  // ...
  if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
    return
  }
  // ...
}
```

组件 vnode 创建的时候合并钩子函数执行 init. createComponentInstanceForVnode 了一个实例。然后调用 $mount 方法挂载子组件。

```JS
export function createComponentInstanceForVnode (
  vnode: any, // we know it's MountedComponentVNode but flow doesn't
  parent: any, // activeInstance in lifecycle state
): Component {
  const options: InternalComponentOptions = {
    _isComponent: true,
    _parentVnode: vnode,
    parent
  }
  // check inline-template render functions
  const inlineTemplate = vnode.data.inlineTemplate
  if (isDef(inlineTemplate)) {
    options.render = inlineTemplate.render
    options.staticRenderFns = inlineTemplate.staticRenderFns
  }
  return new vnode.componentOptions.Ctor(options)
}

```

createComponentInstanceForVnode 函数构造的一个内部组件的参数，然后执行 new vnode.componentOptions.Ctor(options)。这里的 vnode.componentOptions.Ctor 对应的就是子组件的构造函数，

```js
vm.$parent = parent;
vm.$vnode = _parentVnode; // 当前组件的父Vnode
vm._parentVnode = parenVnode;

vm._vnode.parent === vm.$vnode;
```

createComponentInstanceForVnode 函数传入的几个参数合并到内部的选项 $options 里了。

child 节点在父组件渲染的时候生成”组件 vnode”，并且在父组件的 patch 过程，递归初始化 child 组件，同时把这个 “组件 vnode” 当作 parentVnode 传入

先创建一个父节点占位符 vnode，然后再遍历所有子 VNode 递归调用 createElm，在遍历的过程中，如果遇到子 VNode 是一个组件的 VNode，则重复开始的过程，这样通过一个递归的方式就可以完整地构建了整个组件树。

patch 先子节点渲染在插入父节点
createComponent -> 子组件初始化 -> 子组件 render ->子组件 patch

activeInstance 为当前激活的 vm 实例； vm.$vnode 为组件的占位 vnode, vm.\_vnode 为组件的渲染 vnode

vue 整个初始化是一个深度遍历的过程，在实例化子组件的过程中，它需要知道当前上下文的 vue 实例是什么。并把它作为子组件的父 Vue 实例。

我们现在在来梳理一下整个流程：

传入的 vnode 组件渲染 vnode，createComponent： initComponent 、insert(parenElm, vnode)

## 合并配置

### 外部调用场景

this.init_options 的组件场景

```js
vm.$options = mergeOptions(
  resolveConstructorOptions(vm.constructor),
  options || {},
  vm
);
```

options 在 globalapi 中定义 initglobal 里面执行

```js
Vue.options = Object.create(null)
const Aeest_types = [‘component’, ‘directive’, ‘filter’]
  ASSET_TYPES.forEach(type => {

    Vue.options[type + 's'] = Object.create(null)

  })
```

上面遍历后的结果

```JS
Vue.options.components = {}
Vue.options.directives = {}
Vue.options.filters = {}
```

最后通过 extend(Vue.options.components, builtInComponents) 把一些内置组件扩展到 Vue.options.components 上，Vue 的内置组件目前有 \<keep-alive>、\<transition> 和 \<transition-group>

## mergeOptions

mergeOptions 函数主要把 parent 和 child 这两个对象根据一些合并策略，合并成一个新对象

先递归把 extend & mixins 合并到 parent 上， 遍历 parent 调用 mergeField

mergeFiled 合并 hook 和 props 类型遵循下面的规律的数组

```js
function mergeHook(
  parentVal: ?Array<Function>,
  childVal: ?Function | ?Array<Function>
): ?Array<Function> {
  const res = childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
      ? childVal
      : [childVal]
    : parentVal;
  return res ? dedupeHooks(res) : res;
}
export const LIFECYCLE_HOOKS = [
  "beforeCreate",
  "created",
  "beforeMount",
  "mounted",
  "beforeUpdate",
  "updated",
  "beforeDestroy",
  "destroyed",
  "activated",
  "deactivated",
  "errorCaptured",
  "serverPrefetch",
];

LIFECYCLE_HOOKS.forEach((hook) => {
  strats[hook] = mergeHook;
});
```

## 组件场景

由于组件的构造函数是通过 Vue.extend 继承自 Vue 的

```JS
/**
 * Class inheritance
 */
Vue.extend = function (extendOptions: Object): Function {
  // ...
  Sub.options = mergeOptions(
    Super.options,
    extendOptions
  )

  // ...
  // keep a reference to the super options at extension time.
  // later at instantiation we can check if Super's options have
  // been updated.
  Sub.superOptions = Super.options
  Sub.extendOptions = extendOptions
  Sub.sealedOptions = extend({}, Sub.options)

  // ...
  return Sub
}
```

子组件的初始化过程

```JS
export function createComponentInstanceForVnode (
  vnode: any, // we know it's MountedComponentVNode but flow doesn't
  parent: any, // activeInstance in lifecycle state
): Component {
  const options: InternalComponentOptions = {
    _isComponent: true,
    _parentVnode: vnode,
    parent
  }
  // ...
  return new vnode.componentOptions.Ctor(options)
}
```

initInternalComponent 方法首先执行 const opts = vm.$options = Object.create(vm.constructor.options)，这里的 vm.constructor 就是子组件的构造函数 Sub，相当于 vm.$options = Object.create(Sub.options)。

接着又把实例化子组件传入的子组件父 VNode 实例 parentVnode、子组件的父 Vue 实例 parent 保存到 vm.$options 中，另外还保留了 parentVnode 配置中的如 propsData 等其它的属性。

这么看来，initInternalComponent 只是做了简单一层对象赋值，并不涉及到递归、合并策略等复杂逻辑。

总结：

- 外部调用场景下的合并配置是通过 mergeOption, 并遵循一定的合并策略
- 子组件合并是通过 initInternalComponent, 它的合并更快

我们看看 strats 怎么定义的

```js
strats = config.optionsMergeStrategies;
strats.el = strats.propsData = function (parent, child, vm, key) {};
```

里面有各种各样的策略，data.watch.props=inject=methods.computed

## 生命周期

设置数据监听、编译模板、挂载实例到 DOM、在数据变化时更新 DOM

![生命周期](./0081Kckwgy1gkfwhesws2j30u023zt9s.jpg)

### beforeCreate & created

beforeCreate 和 created 函数都是在实例化 Vue 的阶段，在 \_init 方法中执行的

```js
// expose real self
vm._self = vm;
initLifecycle(vm);
initEvents(vm);
initRender(vm);
callHook(vm, "beforeCreate");
initInjections(vm); // resolve injections before data/props
initState(vm);
initProvide(vm); // resolve provide after data/props
callHook(vm, "created");
```

所以我们在 **beforeCreate** 中拿不到 **data props** 等， 因为 **initState** 阶段 才会执行 **props、data、methods、watch、computed**
beforeCreate 的钩子函数中就不能获取到 props、data 中定义的值，也不能调用 methods 中定义的函数。
vue-router 和 vuex 的时候会发现它们都混合了 beforeCreatd 钩子函数。

### beforeMount & mounted

顾名思义，beforeMount 钩子函数发生在 mount，也就是 DOM 挂载之前，它的调用时机是在 mountComponent 函数中

```JS
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el
  // ...
  callHook(vm, 'beforeMount')
  updateComponent = () => {
    const vnode = vm._render(),

    vm._update(vnode, hydrating)
  }

  new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)

  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}
```

在执行 vm.\_render() 函数渲染 VNode 之前，执行了 beforeMount 钩子函数，在执行完 vm.\_update() 把 VNode patch 到真实 DOM 后，执行 mounted 钩子。
这里对 mounted 钩子函数执行有一个判断逻辑，vm.$vnode 如果为 null，则表明这不是一次组件的初始化过程，而是我们通过外部 new Vue 初始化过程。

insertedVnodeQueue 的添加顺序是先子后父，所以对于同步渲染的子组件而言，mounted 钩子函数的执行顺序也是先子后父。

生命周期总结：

- beforemount 是父组件先执行 在执行子组件
- mount 则是子组件先执行 在执行父组件

### beforeUpdate & updated

beforeUpdate  的执行时机是在渲染 Watcher 的  before  函数中，注意这里有个判断，也就是在组件已经 mounted 之后，才会去调用这个钩子函数。

update  的执行时机是在 flushSchedulerQueue  函数调用的时候。

```JS
function flushSchedulerQueue () {
  // ...
  // 获取到 updatedQueue
  callUpdatedHooks(updatedQueue)
}

function callUpdatedHooks (queue) {
  let i = queue.length
  while (i--) {
    const watcher = queue[i]
    const vm = watcher.vm
    if (vm._watcher === watcher && vm._isMounted) {
      callHook(vm, 'updated')
    }
  }
}

```

updatedQueue 是更新了的 wathcer 数组，那么在 callUpdatedHooks 函数中，它对这些数组做遍历，只有满足当前 watcher 为 vm.\_watcher 以及组件已经 mounted 这两个条件，才会执行 updated 钩子函数。

update 满足的条件 mounted 且数据有变化

重新渲染 才会执行 updated
例如下面这种情况

```js
    mounted() {
        this.msg = 'sjh'
        console.log('mounted Parent')
    },
    updated() {
        console.log('updated Parent')
    }
```

### beforeDestroy & destroyed

beforeDestroy 和 destroyed 钩子函数的执行时机在组件销毁的阶段

```JS
Vue.prototype.$destroy = function () {
    const vm: Component = this
    if (vm._isBeingDestroyed) {
      return
    }
    callHook(vm, 'beforeDestroy')
    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null)
    // fire destroyed hook
    callHook(vm, 'destroyed')
    // turn off all instance listeners.
    vm.$off()
    // remove __vue__ reference
    if (vm.$el) {
      vm.$el.__vue__ = null
    }
    // release circular reference (#6759)
    if (vm.$vnode) {
      vm.$vnode.parent = null
    }
}
```

beforeDestroy 钩子函数的执行时机是在 $destroy 函数执行最开始的地方，接着执行了一系列的销毁动作，包括从 parent 的 $children 中删掉自身，删除 watcher，当前渲染的 VNode 执行销毁钩子函数等，执行完毕后再调用 destroy 钩子函数。

$destroy 的执行过程中，它又会执行 vm.**patch**(vm.\_vnode, null) 触发它子组件的销毁钩子函数，这样一层层的递归调用，所以 destroy 钩子函数执行顺序是先子后父，和 mounted 过程一样。

## 组件注册

内置组件：
component 组件
transition 组件
transitionn-group 组件
keep-alive 组件
slot 组件

基础组件建议全局注册， 而业务组件建议局部注册

### 全局注册 Vue.component

```js
Vue.component("GlobalComponent", GlobalComponent);

new Vue({
  render: (h) => h(App),
  components: {
    GlobalComponent,
  },
}).$mount("#app");
```

```js
import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    )
      }
  })
}
```

Vue 是初始化了 3 个全局函数，并且如果 type 是 component 且 definition 是一个对象的话，通过 this.opitons.\_base.extend, 相当于 Vue.extend 把这个对象转换成一个继承于 Vue 的构造函数，最后通过 this.options[type + 's'][id] = definition 把它挂载到 Vue.options.components。

由于每个组件都是通过 Vue.extend 继承而来的

```js
Sub.options = mergeOptions(Super.options, extendOptions);
```

Vue.options 合并到 Sub.options，也就是组件的 options 上， 然后在组件的实例化阶段，会执行 merge options 逻辑，把 Sub.options.components 合并到 vm.$options.components 上。

然后在创建 vnode 的过程中，会执行 \_createElement 方法，

```JS
export function _createElement (
): VNode | Array<VNode> {
  // ...
  let vnode, ns
  if()
  else if (isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
```

这里有一个判断逻辑

```JS
// resolveAsset函数：

export function resolveAsset (
  options: Object,
  type: string,
  id: string,
  warnMissing?: boolean
): any {

  const assets = options[type]
  /* istanbul ignore if */
  if (hasOwn(assets,  id)) return assets[id]
  const camelizedId = camelize(id)
  if (hasOwn(assets,  camelizedId)) return assets[camelizedId]
  const PascalCaseId = capitalize(camelizedId)
  if (hasOwn(assets,  PascalCaseId)) return assets[PascalCaseId]
}
```

先通过 const assets = options[type] 拿到 assets，然后再尝试拿 assets[id]，这里有个顺序，先直接使用 id 拿，如果不存在，则把 id 变成驼峰的形式再拿，如果仍然不存在则在驼峰的基础上把首字母再变成大写的形式再拿，如果仍然拿不到则报错。这样说明了我们在使用 Vue.component(id, definition) 全局注册组件的时候，id 可以是连字符、驼峰或首字母大写的形式。

### 局部注册 components

局部注册是非常简单的。在组件的 Vue 的实例化阶段有一个合并 option 的逻辑，之前我们也分析过，所以就把 components 合并到 vm.$options.components 上，这样我们就可以在 resolveAsset 的时候拿到这个组件的构造函数，并作为 createComponent 的钩子的参数

## 异步组件加载

异步组件的 3 种实现方式

1. 普通函数异步组件

```JS
Vue.component('async-example', function (resolve, reject) {
   // 这个特殊的 require 语法告诉 webpack
   // 自动将编译后的代码分割成不同的块，
   // 这些块将通过 Ajax 请求自动下载。
   require(['./my-async-component'], resolve)
})
```

1. 高级异步组件

```JS
const MyAsyncComponent = () => ({
  // 需要加载的组件 (应该是一个  `Promise`  对象)
  component: import('./components/my-async-component')
})
```

1. promise 创建组件

```JS
Vue.component(
  'async-webpack-example',
  // 该 `import` 函数返回一个 `Promise` 对象。
  () => import('./my-async-component')
)
```

Vue 注册的组件不再是一个对象，而是一个工厂函数，函数有两个参数 resolve 和 reject，函数内部用 setTimout 模拟了异步，实际使用可能是通过动态请求异步组件的 JS 地址，最终通过执行 resolve 方法，它的参数就是我们的异步组件对象。

由于组件的定义并不是一个普通对象，所以不会执行 Vue.extend 的逻辑把它变成一个组件的构造函数，但是它仍然可以执行到 createComponent 函数

```js
export function createComponent (
  Ctor: Class<Component> | Function | Object | void,
  data: ?VNodeData,
  context: Component,
  children: ?Array<VNode>,
  tag?: string
)
  // async component
  let asyncFactory
  if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor, context)
    if (Ctor === undefined) {
      // return a placeholder node for async component, which is rendered
      // as a comment node but preserves all the raw information for the node.
      // the information will be used for async server-rendering and hydration.
      return createAsyncPlaceholder(
        asyncFactory,
        data,
        context,
        children,
        tag
      )
    }
  }

```

我们这个时候传入的 Ctor 是一个函数，那么它也并不会执行 Vue.extend 逻辑，因此它的 cid 是 undefiend，进入了异步组件创建的逻辑。这里首先执行了 Ctor = resolveAsyncComponent(asyncFactory, baseCtor, context)

```js
export function resolveAsyncComponent(
  factory: Function,
  baseCtor: Class<Component>,
  context: Component
): Class<Component> | void {
  if (isTrue(factory.error) && isDef(factory.errorComp)) {
    return factory.errorComp;
  }

  if (isDef(factory.resolved)) {
    //1.
    return factory.resolved;
  }

  if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
    // 2.  3.
    return factory.loadingComp;
  }

  if (isDef(factory.contexts)) {
    // already pending
    factory.contexts.push(context);
  } else {
    const contexts = (factory.contexts = [context]);
    let sync = true;

    const forceRender = () => {
      for (let i = 0, l = contexts.length; i < l; i++) {
        contexts[i].$forceUpdate();
      }
    };

    const resolve = once((res: Object | Class<Component>) => {
      // cache resolved
      factory.resolved = ensureCtor(res, baseCtor);
      // invoke callbacks only if this is not a synchronous resolve
      // (async resolves are shimmed as synchronous during SSR)
      if (!sync) {
        forceRender();
      }
    });

    const reject = once((reason) => {
      process.env.NODE_ENV !== "production" &&
        warn(
          `Failed to resolve async component: ${String(factory)}` +
            (reason ? `\nReason: ${reason}` : "")
        );
      if (isDef(factory.errorComp)) {
        factory.error = true;
        forceRender();
      }
    });

    const res = factory(resolve, reject);

    if (isObject(res)) {
      if (typeof res.then === "function") {
        // () => Promise
        if (isUndef(factory.resolved)) {
          res.then(resolve, reject);
        }
      } else if (
        isDef(res.component) &&
        typeof res.component.then === "function"
      ) {
        res.component.then(resolve, reject);

        if (isDef(res.error)) {
          factory.errorComp = ensureCtor(res.error, baseCtor);
        }

        if (isDef(res.loading)) {
          factory.loadingComp = ensureCtor(res.loading, baseCtor);
          if (res.delay === 0) {
            factory.loading = true;
          } else {
            setTimeout(() => {
              if (isUndef(factory.resolved) && isUndef(factory.error)) {
                factory.loading = true;
                forceRender();
              }
            }, res.delay || 200);
          }
        }

        if (isDef(res.timeout)) {
          setTimeout(() => {
            if (isUndef(factory.resolved)) {
              reject(
                process.env.NODE_ENV !== "production"
                  ? `timeout (${res.timeout}ms)`
                  : null
              );
            }
          }, res.timeout);
        }
      }
    }

    sync = false;
    // return in case resolved synchronously
    return factory.loading ? factory.loadingComp : factory.resolved;
  }
}
```

总结：
本质是 2 次渲染， 先渲染成注释节点， 当组件加载成功后， 在通过 forceRender 重新渲染。

```JS
  const first = resolve => require.ensure([], () => resolve( require(../components/first.vue)),  'chunkname1')
  const second = resolve => require.ensure([], () => resolve( require(../components/second.vue)),  'chunkname2')
```

解释 2: webpack 在编译时，会静态地解析代码中的 require.ensure()，同时将模块添加到一个分开的 chunk 当中。这个新的 chunk 会被 webpack 通过  jsonp  来按需加载

异步组件的原理：

vue 注册的组件不再是一个对象，而是一个工厂函数，函数有两个参数 reslove, reject， 函数内部用 setTimeout 模拟了异步。
asyncFactory 工厂函数
resolveAsyncComponent 函数

const res = factory(resolve , reject)

普通函数异步组件：
createAsyncPlacehilder 如果有 loading 的话就不是 undefined

factory.resolved = ensureCtor 生成一个构造器
forceRender 执行 $forceupdate 渲染

确保函数只执行一次：

```JS
export function once (fn: Function): Function {
  let called = false
  return function () {
    if (!called) {
      called = true
      fn.apply(this,  arguments)
    }
  }
}

lifecycle:

Vue.prototype.$forceUpdate = function () {
  const vm: Component = this
  if (vm._watcher) {

    vm._watcher.update()

  }
}
```

因为先要返回一个占位的 vnode，等待异步请求加载完毕后执行 forceUpdate 重新渲染， 然后这个节点会被更新渲染成组件的节点。

factory.error 的优先等级最高 如果为 error 则下面不在走。

promise 异步组件

```JS
typeof res.then === ‘function’
if (isUndef(factory.resolved)) {
  res.then(resolve, reject)
}

高级异步组件：
if (isDef(res.error)) {
  factory.errorComp = ensureCtor(res.error, baseCtor)
}

if (isDef(res.loading)) {
  factory.loadingComp = ensureCtor(res.loading, baseCtor)
  if (res.delay === 0) {

    factory.loading = true

  } else {

    setTimeout(() => {
      if (isUndef(factory.resolved) && isUndef(factory.error)) {
        factory.loading = true
        forceRender()
      }
    }, res.delay || 200)

  }
}

if (isDef(res.timeout)) {
  setTimeout(() => {

    if (isUndef(factory.resolved)) {
      reject(
        process.env. NODE_ENV !== 'production'
          ? `timeout (${res.timeout}ms)`
          : null
      )
    }

  }, res.timeout)
}
```
