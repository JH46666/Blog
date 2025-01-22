# vue composition api

1. vue3 使用 js 实现了类型推断，新版 api 全部采用普通函数，避免使用了装饰器@
2. 解决了多组件间逻辑重用问题
3. composition api 简单。

```js
let oldArrayPrototype = Array.prototype;
let proto = Object.create(oldArrayPrototype); //继承
['push', 'shift', 'unshfit'].forEach(method =>{  //函数劫持， 把函数重写  内部 继续调用老的方法
  updateView(); //切片变成
  oldArrayPrototype[method].call(this, ...arguments)
})

function observer(target){
  if(typeof target ! == 'object' || target == null){
    return target ;
  }
  if(Array.isArray(target)){  //拦截数组，对数组的方法进行重写
    Object.setPrototypeOf(target, proto)  //写个循环， 赋予给target
    // target.__proto———— = proto;
  }
  for(let key in target){
    definReactive(target, key, target[key])
  }
}
function definReactive(target, key, value){
  observer(value); //递归
  Object.defineProperty(target, key ,{
    get(){
      return value
    },
    set(newValue){
      if(newValue !== value){
        observer(newValue);
        updateView();
        value = newValue;
      }
    }
  })
}


let data = {name: 'sjh', age:[1,2,3]}

observer(data);

data.age.push(4)
console.log('data: ', data.age);


```

## 更好的代码管理方式 monorepo

reactivity 响应式库 是可以独立于 vue.js 使用的

通过在编译阶段优化编译的结果，实现运行时的 patch 过程的优化

Block tree
block tree 是一个将模板基于动态节点指令切割的嵌套区块， 每个区块内部的节点结构是固定的
每个区块只需要以一个 array 来追踪自身包含的动态节点

借助 block tree， vue.js 将 vnode 更新性能由模板整体大小相关提升为与动态内容的数量相关。

## 编译优化

在编译阶段还包含对 Slot 的编译优化、事件侦听函数的缓存优化， 并在运行时重写了 diff 算法

编写组件本质就是在编写一个『包含了描述组件选项的对象』我们把他称为 Options API

提供了一种新的 api： composition api
就是将某个逻辑关注点相关的代码全部放在一个函数里， 这样当需要修改一个功能时，就不在需要在文件中跳来跳去

除了在逻辑复用方面有优势， 也会有更好的类型支持

因为他们都是一些函数， 在调用函数时， 自然所有的类型就被推导出来了 不像 Options API 所有的东西使用 this
另外， Composition API 对 tree-shaking 友好， 代码也更容易压缩。

在 vue 中一个组件真正的渲染生成 DOM 的几个步骤

创建 vnode => 渲染 vnode => 生成 Dom

应用初始化
在执行 app.mount 的时候， 不需要传入渲染器 render
因为在执行 createAppAPI 的时候 渲染器 render 参数已经被保留下来了

我们可以根据 vnode 在去生成不同平台的代码

1. 抽象
2. 跨平台
   例如服务端渲染 小程序端 weex 端
   性能并不是 vnode 的优势

![](./0081Kckwgy1gkzj8497i1j312a0eiado.webp)

创建入口的时候

```js
const createApp = (...args) => {
  // 创建 app 对象
  const app = ensureRenderer().createApp(...args);
  const { mount } = app;
  // 重写 mount 方法
  app.mount = (containerOrSelector) => {
    // ...
  };
  return app;
};
```

## 创建 app 对象和重写 app.mount 方法

1.创建 app 对象
ensureRenderer().createApp() 来创建 app 对象

```js
const app = ensureRenderer().createApp(...args);
```

ensureRenderer() 用来创建一个渲染器对象

```js
// 渲染相关的一些配置，比如更新属性的方法，操作 DOM 的方法

const rendererOptions = {
  patchProp,

  ...nodeOps,
};

let renderer;

// 延时创建渲染器，当用户只依赖响应式包的时候，可以通过 tree-shaking 移除核心渲染逻辑相关的代码

function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions));
}

function createRenderer(options) {
  return baseCreateRenderer(options);
}

function baseCreateRenderer(options) {
  function render(vnode, container) {
    // 组件渲染的核心逻辑
  }

  return {
    render,

    createApp: createAppAPI(render),
  };
}

function createAppAPI(render) {
  // createApp createApp 方法接受的两个参数：根组件的对象和 prop

  return function createApp(rootComponent, rootProps = null) {
    const app = {
      _component: rootComponent,

      _props: rootProps,

      mount(rootContainer) {
        // 创建根组件的 vnode

        const vnode = createVNode(rootComponent, rootProps);

        // 利用渲染器渲染 vnode

        render(vnode, rootContainer);

        app._container = rootContainer;

        return vnode.component.proxy;
      },
    };

    return app;
  };
}
```

先用 ensureRenderer() 来延时创建渲染器，这样做的好处是当用户只依赖响应式包的时候，就不会创建渲染器，因此可以通过 tree-shaking 的方式移除核心渲染逻辑相关的代码。
渲染器理解为包含平台渲染核心逻辑的 JavaScript 对象。
在 Vue.js 3.0 内部通过 createRenderer 创建一个渲染器，这个渲染器内部会有一个 createApp 方法，它是执行 createAppAPI 方法返回的函数，接受了 rootComponent 和 rootProps 两个参数，我们在应用层面执行 createApp(App) 方法时，会把 App 组件对象作为根组件传递给 rootComponent。这样，createApp 内部就创建了一个 app 对象，它会提供 mount 方法，这个方法是用来挂载组件的。

2. 重写 app.mount 方法

```js
mount(rootContainer) {

  // 创建根组件的 vnode

  const vnode = createVNode(rootComponent, rootProps)

  // 利用渲染器渲染 vnode

  render(vnode, rootContainer)

  app._container = rootContainer

  return vnode.component.proxy

}

```

## vue3 删除的点

**$listeners 在 Vue 3 中，$listeners 对象已经被删除。事件监听器现在是 $attrs 的一部分**

**在 vue3 中完全删除了 on off 和 once 语法**
