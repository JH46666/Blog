## [React 进阶实践指南(二)](https://juejin.cn/book/6945998773818490884)

React 优化环节，React 优化会从**渲染、加载、海量数据、细节**四个方向入手，详细

对于 React 渲染，你不要仅仅理解成类组件触发 render 函数，函数组件本身执行，事实上，从调度更新任务到调和 fiber，再到浏览器渲染真实 DOM，每一个环节都是渲染的一部分，至于对于每个环节的性能优化。

React 在底层已经处理了大部分优化细节，包括设立任务优先级、异步调度、diff 算法、时间分片都是 React 为了提高性能，提升用户体验采取的手段。

render 阶段作用是什么?

**render 的作用**是根据一次更新中产生的新状态值，通过 React.createElement ，替换成新的状态，得到新的 React element 对象，新的 element 对象上，保存了最新状态值。
createElement 会产生一个全新的 props。到此 render 函数使命完成了。

接下来，React 会调和由 render 函数产生 chidlren，将子代 element 变成 fiber（这个过程如果存在 alternate，会复用 alternate 进行克隆，如果没有 alternate ，那么将创建一个），将 props 变成 pendingProps ，至此当前组件更新完毕。然后如果 children 是组件，会继续重复上一步，直到全部 fiber 调和完毕。完成 render 阶段。

### **React 几种控制 render 方法**

1. **缓存 React.element 对象**

```jsx
export default class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numberA: 0,
      numberB: 0,
    };
    this.component = <Children number={this.state.numberA} />;
  }
  controllComponentRender = () => {
    /* 通过此函数判断 */
    const { props } = this.component;
    if (props.number !== this.state.numberA) {
      /* 只有 numberA 变化的时候，重新创建 element 对象  */
      return (this.component = React.cloneElement(this.component, {
        number: this.state.numberA,
      }));
    }
    return this.component;
  };
  render() {
    return (
      <div>
        {this.controllComponentRender()}
        <button
          onClick={() => this.setState({ numberA: this.state.numberA + 1 })}
        >
          改变numberA
        </button>
        <button
          onClick={() => this.setState({ numberB: this.state.numberB + 1 })}
        >
          改变numberB
        </button>
      </div>
    );
  }
}
```

原理:

每次执行 render 本质上 createElement 会产生一个新的 props,这个 props 将做为对应 fiber 的 pendingProps,
在此 fiber 更新调和阶段,React 会对比 fiber 上 oldProps 和新的 newProp(pendingProps)是否相等,
如果相等函数组件就会放弃子组件的调和更新,从而子组件不会重新渲染;

如果上述把 element 对象缓存起来,上面 props 也就和 fiber 上 oldProps 指向相同的内存空间,也就是相等,从而跳过了本次更新.

2. pureComponent

规则就是**浅比较 state 和 props 是否相等**

**PureComponent 原理及其浅比较原则**

PureComponent 内部是如何工作的呢，首先当选择基于 PureComponent 继承的组件。原型链上会有 isPureReactComponent 属性。一起看一下创建 PureComponent 时候：

```jsx
function checkShouldComponentUpdate() {
  if (typeof instance.shouldComponentUpdate === "function") {
    return instance.shouldComponentUpdate(
      newProps,
      newState,
      nextContext
    ); /* shouldComponentUpdate 逻辑 */
  }
  if (ctor.prototype && ctor.prototype.isPureReactComponent) {
    return (
      !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState)
    );
  }
}
```

- isPureReactComponent 就是判断当前组件是不是纯组件的，如果是 PureComponent 会浅比较 props 和 state 是否相等。
- 还有一点值得注意的就是 shouldComponentUpdate 的权重，会大于 PureComponent。
- shallowEqual 是如何浅比较的呢，由于我不想在章节中写过多的源码，我在这里就直接描述过程了。

shallowEqual 浅比较流程：

- 第一步，首先会直接比较新老 props 或者新老 state 是否相等。如果相等那么不更新组件。
- 第二步，判断新老 state 或者 props ，有不是对象或者为 null 的，那么直接返回 false ，更新组件。
- 第三步，通过 Object.keys 将新老 props 或者新老 state 的属性名 key 变成数组，判断数组的长度是否相等，如果不相等，证明有属性增加或者减少，那么更新组件。
- 第四步，遍历老 props 或者老 state ，判断对应的新 props 或新 state ，有没有与之对应并且相等的（这个相等是浅比较），如果有一个不对应或者不相等，那么直接返回 false ，更新组件。 到此为止，浅比较流程结束， PureComponent 就是这么做渲染节流优化的。

PureComponent 1. 避免使用箭头函数。不要给是 PureComponent 子组件绑定箭头函数，因为父组件每一次 render ，如果是箭头函数绑定的话，都会重新生成一个新的箭头函数， PureComponent 对比新老 props 时候，因为是新的函数，所以会判断不想等，而让组件直接渲染，PureComponent 作用终会失效。

```js
class Index extends React.PureComponent {}

export default class Father extends React.Component {
  render = () => <Index callback={() => {}} />;
}
```

    2. PureComponent 的父组件是函数组件的情况，绑定函数要用 useCallback 或者 useMemo 处理。这种情况还是很容易发生的，就是在用 class + function 组件开发项目的时候，如果父组件是函数，子组件是 PureComponent ，那么绑定函数要小心，因为函数组件每一次执行，如果不处理，还会声明一个新的函数，所以 PureComponent 对比同样会失效，如下情况：

```jsx
class Index extends React.PureComponent{}
export default function (){
    const callback = function handerCallback(){} /* 每一次函数组件执行重新声明一个新的callback，PureComponent浅比较会认为不想等，促使组件更新  */
    return <Index callback={callback}  />
}

export default function (){
    const callback = React.useCallback(function handerCallback(){},[])
    return <Index callback={callback}  />
}
```

3. **shouldComponentUpdate**

```jsx
    shouldComponentUpdate(newProp,newState,newContext){
        if(newProp.propsNumA !== this.props.propsNumA || newState.stateNumA !== this.state.stateNumA ){
            return true /* 只有当 props 中 propsNumA 和 state 中 stateNumA 变化时，更新组件  */
        }
        return false
    }


```

shouldComponentUpdate 可以根据传入的新的 props 和 state ，或者 newContext 来确定是否更新组件.

immutable.js 可以解决此问题，immutable.js 不可变的状态，对 Immutable 对象的任何修改或添加删除操作都会返回一个新的 Immutable 对象。鉴于这个功能，所以可以把需要对比的 props 或者 state 数据变成 Immutable 对象，通过对比 Immutable 是否相等，来证明状态是否改变，从而确定是否更新组件。

4. React.memo
   React.memo 可作为一种容器化的控制渲染方案，可以对比 props 变化，来决定是否渲染组件，首先先来看一下 memo 的基本用法。React.memo 接受两个参数，第一个参数 Component 原始组件本身，第二个参数 compare 是一个函数，可以根据一次更新中 props 是否相同决定原始组件是否重新渲染。

```jsx
React.memo(Component, compare);
```

memo 的几个特点是：

- React.memo: 第二个参数 返回 true 组件不渲染 ， 返回 false 组件重新渲染。和 shouldComponentUpdate 相反，
  shouldComponentUpdate : **返回 true 组件渲染 ， 返回 false 组件不渲染。**
- memo 当二个参数 compare 不存在时，会用**浅比较原则**处理 props ，相当于仅比较 props 版本的 pureComponent 。
- memo 同样适合类组件和函数组件。

被 memo 包裹的组件，element 会被打成 REACT_MEMO_TYPE 类型的 element 标签，在 element 变成 fiber 的时候， fiber 会被标记成 MemoComponent 的类型。

```jsx
function memo(type, compare) {
  const elementType = {
    $$typeof: REACT_MEMO_TYPE,
    type, // 我们的组件
    compare: compare === undefined ? null : compare, //第二个参数，一个函数用于判断prop，控制更新方向。
  };
  return elementType;
}
```

首先 React 对 MemoComponent 类型的 fiber 有单独的更新处理逻辑 updateMemoComponent 。

```jsx
function updateMemoComponent() {
  if (updateExpirationTime < renderExpirationTime) {
    let compare = Component.compare;
    compare = compare !== null ? compare : shallowEqual; //如果 memo 有第二个参数，则用二个参数判定，没有则浅比较props是否相等。
    if (compare(prevProps, nextProps) && current.ref === workInProgress.ref) {
      return bailoutOnAlreadyFinishedWork(
        current,
        workInProgress,
        renderExpirationTime
      ); //已经完成工作停止向下调和节点。
    }
  }
  // 返回将要更新组件,memo包装的组件对应的fiber，继续向下调和更新。
}
```

memo 主要逻辑是

- 通过 memo 第二个参数，判断是否执行更新，如果没有那么第二个参数，那么以浅比较 props 为 diff 规则。如果相等，当前 fiber 完成工作，停止向下调和节点，所以被包裹的组件即将不更新。
- memo 可以理解为包了一层的高阶组件，它的阻断更新机制，是通过控制下一级 children ，也就是 memo 包装的组件，是否继续调和渲染，来达到目的的。

5. 打破渲染限制
   1. forceUpdate。类组件更新如果调用的是 forceUpdate 而不是 setState ，会跳过 PureComponent 的浅比较和 shouldComponentUpdate 自定义比较。
      其原理是组件中调用 forceUpdate 时候，全局会开启一个 hasForceUpdate 的开关。当组件更新的时候，检查这个开关是否打开，如果打开，就直接跳过 shouldUpdate 。
   2. context 穿透，上述的几种方式，都不能本质上阻断 context 改变，而带来的渲染穿透，所以开发者在使用 Context 要格外小心，既然选择了消费 context ，就要承担 context 改变，带来的更新作用。
6. 渲染控制流程图
   ![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/3df03000a39549bead3c84750c62576c_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

### 对于 render 的思考

1. 无需过分在乎 React 没有必要的渲染,要理解执行 render 不等于真正的浏览器渲染视图，render 阶段执行是在 js 当中，js 中运行代码远快于浏览器的 Rendering 和 Painting 的，更何况 React 还提供了 diff 算法等手段，去复用真实 DOM 。
2. **什么时候需要注意渲染节流。**
   第二种情况含有大量表单的页面，React 一般会采用受控组件的模式去管理表单数据层，表单数据层完全托管于 props 或是 state ，而用户操作表单往往是频繁的，需要频繁改变数据层，所以很有可能让整个页面组件高频率 render 。

3. 第三种情况就是越是靠近 app root 根组件越值得注意，根组件渲染会波及到整个组件树重新 render ，子组件 render ，一是浪费性能，二是可能执行 useEffect ，componentWillReceiveProps 等钩子，造成意想不到的情况发生。

## 渲染调优

### 异步渲染

Suspense 是 React 提出的一种同步的代码来实现异步操作的方案。Suspense 让组件‘等待’异步操作，异步请求结束后在进行组件的渲染，也就是所谓的异步渲染，

**Suspense 用法**

Suspense 是组件，有一个 fallback 属性，用来代替当 Suspense 处于 loading 状态下渲染的内容，Suspense 的 children 就是异步组件。多个异步组件可以用 Suspense 嵌套使用。

```jsx
// 子组件
function UserInfo() {
  // 获取用户数据信息，然后再渲染组件。
  const user = getUserInfo();
  return <h1>{user.name}</h1>;
}
// 父组件
export default function Index() {
  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      <UserInfo />
    </Suspense>
  );
}
```

- Suspense 包裹异步渲染组件 UserInfo ，当 UserInfo 处于数据加载状态下，展示 Suspense 中 fallback 的内容。

现在的异步请求方式比较繁琐，主要是是通过类组件 componentDidMount 或者函数组件 useEffect 进行数据交互，获得数据后通过调用 setState 或 useState 改变 state 触发视图的更新。

传统模式：挂载组件-> 请求数据 -> 再渲染组件。
异步模式：请求数据-> 渲染组件。

那么异步渲染相比传统数据交互相比好处就是：

- 不再需要 componentDidMount 或 useEffect 配合做数据交互，也不会因为数据交互后，改变 state 而产生的二次更新作用。
- 代码逻辑更简单，清晰。

**动态加载（懒加载）**

现在的 Suspense 配合 React.lazy 可以实现动态加载功能。

React.lazy 接受一个函数，这个函数需要动态调用 import() 。它必须返回一个 Promise ，该 Promise 需要 resolve 一个 default export 的 React 组件。

```jsx
const LazyComponent = React.lazy(() => import("./test.js"));

export default function Index() {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

- 用 React.lazy 动态引入 test.js 里面的组件，配合 Suspense 实现动态加载组件效果。**这样很利于代码分割，不会让初始化的时候加载大量的文件。**

原理揭秘： **React.lazy 和 Suspense 实现动态加载原理**

整个 render 过程都是同步执行一气呵成的，但是在 Suspense 异步组件情况下允许**调用 Render => 发现异步请求 => 悬停，等待异步请求完毕 => 再次渲染展示数据**。

Suspense 原理:

Suspense 在执行内部可以通过 try{}catch{} 方式捕获异常，这个异常通常是一个 Promise ，可以在这个 Promise 中进行数据请求工作，Suspense 内部会处理这个 Promise ，Promise 结束后，Suspense 会再一次重新 render 把数据渲染出来，达到异步渲染的效果。

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/60d20c4fad834541873697ead2ec6dda_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

**React.lazy 原理：**

再看一下 React.lazy，lazy 内部模拟一个 promiseA 规范场景。完全可以理解 React.lazy 用 Promise 模拟了一个请求数据的过程，但是请求的结果不是数据，而是一个动态的组件。下一次渲染就直接渲染这个组件，

所以是 React.lazy 利用 Suspense **接收 Promise ，执行 Promise ，然后再渲染**这个特性做到动态加载的。

```js
function lazy(ctor) {
  return {
    $$typeof: REACT_LAZY_TYPE,
    _payload: {
      _status: -1, //初始化状态
      _result: ctor,
    },
    _init: function (payload) {
      if (payload._status === -1) {
        /* 第一次执行会走这里  */
        const ctor = payload._result;
        const thenable = ctor();
        payload._status = Pending;
        payload._result = thenable;
        thenable.then((moduleObject) => {
          const defaultExport = moduleObject.default;
          resolved._status = Resolved; // 1 成功状态
          resolved._result =
            defaultExport; /* defaultExport 为我们动态加载的组件本身  */
        });
      }
      if (payload._status === Resolved) {
        // 成功状态
        return payload._result;
      } else {
        //第一次会抛出Promise异常给Suspense
        throw payload._result;
      }
    },
  };
}
```

整个流程是这样的，React.lazy 包裹的组件会标记 **REACT_LAZY_TYPE** 类型的 element，在调和阶段会变成 LazyComponent 类型的 fiber ，React 对 LazyComponent 会有单独的处理逻辑：

- 第一次渲染首先会执行 init 方法，里面会执行 lazy 的第一个函数，得到一个 Promise，绑定 Promise.then 成功回调，回调里得到将要渲染组件 defaultExport
  这里要注意的是，如上面的函数当第二个 if 判断的时候，因为此时状态不是 Resolved ，所以会走 else ，抛出异常 Promise，抛出异常会让当前渲染终止。
- 这个异常 Promise 会被 Suspense 捕获到，Suspense 会处理 Promise ，Promise 执行成功回调得到 defaultExport（将想要渲染组件），然后 Susponse 发起第二次渲染，第二次 init 方法已经是 Resolved 成功状态，那么直接返回 result 也就是真正渲染的组件。这时候就可以正常渲染组件了。

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/6792d24862464d89b2034bfa4cf9e5a8_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

### 渲染错误边界

为了防止如上的渲染异常情况 React 增加了 componentDidCatch 和 static getDerivedStateFromError() 两个额外的生命周期，去挽救由于渲染阶段出现问题造成 UI 界面无法显示的情况。

### componentDidCatch

componentDidCatch 可以捕获异常，它接受两个参数：

- 1 error —— 抛出的错误。
- 2 info —— 带有 componentStack key 的对象，其中包含有关组件引发错误的栈信息。 先来打印一下，生命周期 componentDidCatch 参数长什么样子？

```js
class Index extends React.Component {
  state = {
    hasError: false,
  };
  componentDidCatch(...arg) {
    uploadErrorLog(arg); /* 上传错误日志 */
    this.setState({
      /* 降级UI */ hasError: true,
    });
  }
  render() {
    const { hasError } = this.state;
    return (
      <div>
        {hasError ? <div>组件出现错误</div> : <ErrorTest />}
        <div> hello, my name is alien! </div>
        <Test />
      </div>
    );
  }
}
```

componentDidCatch 作用：

- 可以调用 setState 促使组件渲染，并做一些错误拦截功能。
- 监控组件，发生错误，上报错误日志。

**static getDerivedStateFromError**

React 更期望用 getDerivedStateFromError 代替 componentDidCatch 用于处理渲染异常的情况。getDerivedStateFromError 是静态方法，内部不能调用 setState。getDerivedStateFromError 返回的值可以合并到 state，作为渲染使用。用 getDerivedStateFromError 解决如上的情况。

```js
class Index extends React.Component {
  state = {
    hasError: false,
  };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    /* 如上 */
  }
}
```

如上完美解决了 ErrorTest 错误的问题。注意事项： 如果存在 getDerivedStateFromError 生命周期钩子，那么将不需要 componentDidCatch 生命周期再降级 ui。

### 从 diff children 看 key 的合理使用

首先 React 在一次更新中当发现通过 render 得到的 children 如果是一个数组的话。就会调用 reconcileChildrenArray 来调和子代 fiber ，整个对比的流程就是在这个函数中进行的。

diff children 流程
第一步： 遍历新 children，复用 oldFiber

```js
function reconcileChildrenArray(){
    /* 第一步  */
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
        if (oldFiber.index > newIdx) {
            nextOldFiber = oldFiber;
            oldFiber = null;
        } else {
            nextOldFiber = oldFiber.sibling;
        }
        const newFiber = updateSlot(returnFiber,oldFiber,newChildren[newIdx],expirationTime,);
        if (newFiber === null) { break }
        // ..一些其他逻辑
        }
        if (shouldTrackSideEffects) {  // shouldTrackSideEffects 为更新流程。
            if (oldFiber && newFiber.alternate === null) { /* 找到了与新节点对应的fiber，但是不能复用，那么直接删除老节点 */
                deleteChild(returnFiber, oldFiber);
            }
        }
    }
}

```

- 第一步对于 React.createElement 产生新的 child 组成的数组，首先会遍历数组，因为 fiber 对于同一级兄弟节点是用 sibling 指针指向，所以在遍历 children 遍历，sibling 指针同时移动，找到与 child 对应的 oldFiber 。
- 然后通过调用 updateSlot ，updateSlot 内部会判断当前的 tag 和 key 是否匹配，如果匹配复用老 fiber 形成新的 fiber ，如果不匹配，返回 null ，此时 newFiber 等于 null 。
- 如果是处于更新流程，找到与新节点对应的老 fiber ，但是不能复用 alternate === null ，那么会删除老 fiber 。

**第二步：统一删除 oldfiber**

```js
if (newIdx === newChildren.length) {
  deleteRemainingChildren(returnFiber, oldFiber);
  return resultingFirstChild;
}
```

- 第二步适用于以下情况，当第一步结束完 newIdx === newChildren.length 此时证明所有 newChild 已经全部被遍历完，那么剩下没有遍历 oldFiber 也就没有用了，那么调用 deleteRemainingChildren 统一删除剩余 oldFiber 。

情况一：节点删除

- **oldChild: A B C D**
- **newChild: A B** A , B 经过第一步遍历复制完成，那么 newChild 遍历完成，此时 C D 已经没有用了，那么统一删除 C D。

**第三步：统一创建 newFiber**

```js
if (oldFiber === null) {
  for (; newIdx < newChildren.length; newIdx++) {
    const newFiber = createChild(
      returnFiber,
      newChildren[newIdx],
      expirationTime
    );
    // ...
  }
}
```

- 第三步适合如下的情况，当经历过第一步，oldFiber 为 null ， 证明 oldFiber 复用完毕，那么如果还有新的 children ，说明都是新的元素，只需要调用 createChild 创建新的 fiber 。

情况二：节点增加

- **oldChild: A B**
- **newChild: A B C D** A B 经过第一步遍历复制完，oldFiber 没有可以复用的了，那么直接创建 C D。

**第四步：针对发生移动和更复杂的情况**

```js
const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
for (; newIdx < newChildren.length; newIdx++) {
  const newFiber = updateFromMap(existingChildren, returnFiber);
  /* 从mapRemainingChildren删掉已经复用oldFiber */
}
```

- mapRemainingChildren 返回一个 map ，map 里存放剩余的老的 fiber 和对应的 key (或 index )的映射关系。
- 接下来遍历剩下没有处理的 Children ，通过 updateFromMap ，判断 mapRemainingChildren 中有没有可以复用 oldFiber ，如果有，那么复用，如果没有，新创建一个 newFiber 。
- 复用的 oldFiber 会从 mapRemainingChildren 删掉。

情况三：节点位置改变

- **oldChild: A B C D**
- **newChild: A B D C** 如上 A B 在第一步被有效复用，第二步和第三步不符合，直接进行第四步，C D 被完全复用，existingChildren 为空。

**第五步：删除剩余没有复用的 oldFiber**

```js
if (shouldTrackSideEffects) {
  /* 移除没有复用到的oldFiber */
  existingChildren.forEach((child) => deleteChild(returnFiber, child));
}
```

最后一步，对于没有复用的 oldFiber ，统一删除处理。
情况四：复杂情况(删除 + 新增 + 移动)

- **oldChild: A B C D**
- **newChild: A E D B**

首先 A 节点，在第一步被复用，接下来直接到第四步，遍历 newChild ，E 被创建，D B 从 existingChildren 中被复用，existingChildren 还剩一个 C 在第五步会删除 C ，完成整个流程。

### 关于 diffChild 思考和 key 的使用

- 1 React diffChild 时间复杂度 O(n^3) 优化到 O(n)。
- 2 React key 最好选择唯一性的 id，如上述流程，如果选择 Index 作为 key ，如果元素发生移动，那么从移动节点开始，接下来的 fiber 都不能做得到合理的复用。 index 拼接其他字段也会造成相同的效果。

## React 对于大量数据的处理方案

- 第一种就是数据可视化，比如像热力图，地图，大量的数据点位的情况。
- 第二种情况是长列表渲染。

实践一： 时间分片

时间分片主要解决，初次加载，一次性渲染大量数据造成的卡顿现象。**浏览器执 js 速度要比渲染 DOM 速度快的多。**

```jsx
class Index extends React.Component {
  state = {
    dataList: [], //数据源列表
    renderList: [], //渲染列表
    position: { width: 0, height: 0 }, // 位置信息
    eachRenderNum: 500, // 每次渲染数量
  };
  box = React.createRef();
  componentDidMount() {
    const { offsetHeight, offsetWidth } = this.box.current;
    const originList = new Array(20000).fill(1);
    const times = Math.ceil(
      originList.length / this.state.eachRenderNum
    ); /* 计算需要渲染此次数*/
    let index = 1;
    this.setState(
      {
        dataList: originList,
        position: { height: offsetHeight, width: offsetWidth },
      },
      () => {
        this.toRenderList(index, times);
      }
    );
  }
  toRenderList = (index, times) => {
    if (index > times) return; /* 如果渲染完成，那么退出 */
    const { renderList } = this.state;
    renderList.push(
      this.renderNewList(index)
    ); /* 通过缓存element把所有渲染完成的list缓存下来，下一次更新，直接跳过渲染 */
    this.setState({
      renderList,
    });
    requestIdleCallback(() => {
      /* 用 requestIdleCallback 代替 setTimeout 浏览器空闲执行下一批渲染 */
      this.toRenderList(++index, times);
    });
  };
  renderNewList(index) {
    /* 得到最新的渲染列表 */
    const { dataList, position, eachRenderNum } = this.state;
    const list = dataList.slice(
      (index - 1) * eachRenderNum,
      index * eachRenderNum
    );
    return (
      <React.Fragment key={index}>
        {list.map((item, index) => (
          <Circle key={index} position={position} />
        ))}
      </React.Fragment>
    );
  }
  render() {
    return (
      <div className="bigData_index" ref={this.box}>
        {this.state.renderList}
      </div>
    );
  }
}
```

- 第一步：计算时间片，首先用 eachRenderNum 代表一次渲染多少个，那么除以总数据就能得到渲染多少次。
- 第二步：开始渲染数据，通过 index>times 判断渲染完成，如果没有渲染完成，那么通过 requestIdleCallback 代替 setTimeout 浏览器空闲执行下一帧渲染。
- 第三步：通过 renderList 把已经渲染的 element 缓存起来，渲染控制章节讲过，这种方式可以直接跳过下一次的渲染。实际每一次渲染的数量仅仅为 demo 中设置的 500 个。

**实践二 虚拟列表**

虚拟列表是一种长列表的解决方案，现在滑动加载是 M 端和 PC 端一种常见的数据请求加载场景，这种数据交互有一个问题就是，如果没经过处理，加载完成后数据展示的元素，都显示在页面上，如果伴随着数据量越来越大，会使页面中的 DOM 元素越来越多，即便是像 React 可以良好运用 diff 来复用老节点，但也不能保证大量的 diff 带来的性能开销。所以虚拟列表的出现，就是解决大量 DOM 存在，带来的性能问题。

何为虚拟列表，就是在长列表滚动过程中，只有视图区域显示的是真实 DOM ，滚动过程中，不断截取视图的有效区域，让人视觉上感觉列表是在滚动。达到无限滚动的效果。

虚拟列表划分可以分为三个区域：视图区 + 缓冲区 + 虚拟区。
![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/e0a19faafac24c3a9be8c49e7f85c259_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

- 视图区：视图区就是能够直观看到的列表区，此时的元素都是真实的 DOM 元素。
- 缓冲区：缓冲区是为了防止用户上滑或者下滑过程中，出现白屏等效果。（缓冲区和视图区为渲染真实的 DOM ）
- 虚拟区：对于用户看不见的区域（除了缓冲区），剩下的区域，不需要渲染真实的 DOM 元素。虚拟列表就是通过这个方式来减少页面上 DOM 元素的数量。

具体实现思路。

- 通过 useRef 获取元素，缓存变量。
- useEffect 初始化计算容器的高度。截取初始化列表长度。这里需要 div 占位，撑起滚动条。
- 通过监听滚动容器的 onScroll 事件，根据 scrollTop 来计算渲染区域向上偏移量, 这里需要注意的是，当用户向下滑动的时候，为了渲染区域，能在可视区域内，可视区域要向上滚动；当用户向上滑动的时候，可视区域要向下滚动。
- 通过重新计算 end 和 start 来重新渲染列表。

防抖节流总结：

- 防抖函数一般用于表单搜索，点击事件等场景，目的就是为了防止短时间内多次触发事件。
- 节流函数一般为了降低函数执行的频率，比如滚动条滚动。

按需引入

React 动画

1. 首选： 动态添加类名

第一种方式是通过 transition，animation 实现动画然后写在 class 类名里面，通过动态切换类名，达到动画的目的。

```jsx
export default function Index() {
  const [isAnimation, setAnimation] = useState(false);
  return (
    <div>
      <button onClick={() => setAnimation(true)}>改变颜色</button>
      <div className={isAnimation ? "current animation" : "current"}></div>
    </div>
  );
}
```

```css
.current {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #ccc;
}
.animation {
  animation: 1s changeColor;
  background: yellowgreen;
}
@keyframes changeColor {
  0% {
    background: #c00;
  }
  50% {
    background: orange;
  }
  100% {
    background: yellowgreen;
  }
}
```

**② 其次：操纵原生 DOM**

如果第一种方式不能满足要求的话，或者必须做一些 js 实现复杂的动画效果，那么可以获取原生 DOM ，然后单独操作 DOM 实现动画功能，这样就避免了 setState 改变带来 React Fiber 深度调和渲染的影响。

```js
export default function Index() {
  const dom = useRef(null);
  const changeColor = () => {
    const target = dom.current;
    target.style.background = "#c00";
    setTimeout(() => {
      target.style.background = "orange";
      setTimeout(() => {
        target.style.background = "yellowgreen";
      }, 500);
    }, 500);
  };
  return (
    <div>
      <button onClick={changeColor}>改变颜色</button>
      <div className="current" ref={dom}></div>
    </div>
  );
}
```

**③ 再者：setState + css3**

如果 ① 和 ② 都不能满足要求，一定要使用 setState 实时改变 DOM 元素状态的话，那么尽量采用 css3 ， css3 开启硬件加速，使 GPU (Graphics Processing Unit) 发挥功能，从而提升性能。
比如想要改变元素位置 left ，top 值，可以换一种思路通过改变 transform: translate，transform 是由 GPU 直接控制渲染的，所以不会造成浏览器的重排。

```js
export default function Index() {
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const changePosition = () => {
    let time = 0;
    let timer = setInterval(() => {
      if (time === 30) clearInterval(timer);
      setPosition({ left: time * 10, top: time * 10 });
      time++;
    }, 30);
  };
  const { left, top } = position;
  return (
    <div>
      <button onClick={changePosition}>改变位置</button>
      <div
        className="current"
        style={{ transform: `translate(${left}px,${top}px )` }}
      ></div>
    </div>
  );
}
```

react 事件合成

- 1 给元素绑定的事件，不是真正的事件处理函数。
- 2 在冒泡/捕获阶段绑定的事件，也不是在冒泡/捕获阶段执行的。
- 3 甚至在事件处理函数中拿到的事件源 e ，也不是真正的事件源 e 。

独特的事件处理

冒泡阶段和捕获阶段

```js
export default function Index() {
  const handleClick = () => {
    console.log("模拟冒泡阶段执行");
  };
  const handleClickCapture = () => {
    console.log("模拟捕获阶段执行");
  };
  return (
    <div>
      <button onClick={handleClick} onClickCapture={handleClickCapture}>
        点击
      </button>
    </div>
  );
}
```

- 冒泡阶段：开发者正常给 React 绑定的事件比如 onClick，onChange，默认会在模拟冒泡阶段执行。
- 捕获阶段：如果想要在捕获阶段执行可以将事件后面加上 Capture 后缀，比如 onClickCapture，onChangeCapture。

**阻止冒泡**

React 中如果想要阻止事件向上冒泡，可以用 e.stopPropagation() 。

```js
export default function Index() {
  const handleClick = (e) => {
    e.stopPropagation(); /* 阻止事件冒泡，handleFatherClick 事件讲不在触发 */
  };
  const handleFatherClick = () => console.log("冒泡到父级");
  return (
    <div onClick={handleFatherClick}>
      <div onClick={handleClick}>点击</div>
    </div>
  );
}
```

- React 阻止冒泡和原生事件中的写法差不多，当如上 handleClick 上 阻止冒泡，父级元素的 handleFatherClick 将不再执行，但是底层原理完全不同，接下来会讲到其功能实现。

阻止默认行为

React 阻止默认行为和原生的事件也有一些区别。

- **原生事件：** e.preventDefault() 和 return false 可以用来阻止事件默认行为，由于在 React 中给元素的事件并不是真正的事件处理函数。**所以导致 return false 方法在 React 应用中完全失去了作用。**

- **React 事件** 在 React 应用中，可以用 e.preventDefault() 阻止事件默认行为，这个方法并非是原生事件的 preventDefault ，由于 React 事件源 e 也是独立组建的，所以 preventDefault 也是单独处理的。

React 事件系统可以分为三个部分

- 第一个部分是事件合成系统，初始化会注册不同的事件插件。
- 第二个就是在一次渲染过程中，对事件标签中事件的收集，向 container 注册事件。
- 第三个就是一次用户交互，事件触发，到事件执行一系列过程。

```jsx
export default function Index() {
  const handleClick = () => {};
  const handleChange = () => {};
  return (
    <div>
      <input onChange={handleChange} />
      <button onClick={handleClick}>点击</button>
    </div>
  );
}
```

在 input 上还是没有找到绑定的事件 handleChange ，但是 document 的事件如下：
![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/c5faf37d6fd94bd89bea8ee131df9c09_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

多了 blur，change ，focus ，keydown，keyup 等事件。

- React 的事件不是绑定在元素上的，而是统一绑定在顶部容器上，在 v17 之前是绑定在 document 上的，在 v17 改成了 app 容器上。这样更利于一个 html 下存在多个应用（微前端）。
- 绑定事件并不是一次性绑定所有事件，比如发现了 onClick 事件，就会绑定 click 事件，比如发现 onChange 事件，会绑定 [blur，change ，focus ，keydown，keyup] 多个事件。
- React 事件合成的概念：React 应用中，元素绑定的事件并不是原生事件，而是 React 合成的事件，比如 onClick 是由 click 合成，onChange 是由 blur ，change ，focus 等多个事件合成。

**事件插件机制**

React 有一种事件插件机制，比如上述 onClick 和 onChange ，会有不同的事件插件 SimpleEventPlugin ，ChangeEventPlugin 处理，先不必关心事件插件做了些什么，只需要先记住两个对象

1. **第一个 registrationNameModules ：**

```jsx
const registrationNameModules = {
    onBlur: SimpleEventPlugin,
    onClick: SimpleEventPlugin,
    onClickCapture: SimpleEventPlugin,
    onChange: ChangeEventPlugin,
    onChangeCapture: ChangeEventPlugin,
    onMouseEnter: EnterLeaveEventPlugin,
    onMouseLeave: EnterLeaveEventPlugin,
    ...
}

```

registrationNameModules 记录了 React 事件（比如 onBlur ）和与之对应的处理插件的映射.

比如上述的 onClick ，就会用 SimpleEventPlugin 插件处理，
onChange 就会用 ChangeEventPlugin 处理。

应用于事件触发阶段，根据不同事件使用不同的插件。

2. **第二个 registrationNameDependencies**

```jsx
{
    onBlur: ['blur'],
    onClick: ['click'],
    onClickCapture: ['click'],
    onChange: ['blur', 'change', 'click', 'focus', 'input', 'keydown', 'keyup', 'selectionchange'],
    onMouseEnter: ['mouseout', 'mouseover'],
    onMouseLeave: ['mouseout', 'mouseover'],
    ...
}
```

这个对象保存了 React 事件和原生事件对应关系，这就解释了为什么上述只写了一个 onChange ，会有很多原生事件绑定在 document 上。

在事件绑定阶段，如果发现有 React 事件，比如 onChange ，就会找到对应的原生事件数组，逐一绑定。

**事件绑定**

事件绑定阶段，所谓事件绑定，就是在 React 处理 props 时候，如果遇到事件比如 onClick ，就会通过 addEventListener 注册原生事件

```jsx
export default function Index(){
  const handleClick = () => console.log('点击事件')
  const handleChange =() => console.log('change事件)
  return <div >
     <input onChange={ handleChange }  />
     <button onClick={ handleClick } >点击</button>
  </div>
}
```

- 对于如上结构，最后 onChange 和 onClick 会保存在对应 DOM 元素类型 fiber 对象（ hostComponent ）的 memoizedProps 属性上，如上结构会变成这样。

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/d44abaf90b694fbc8e77f0675a69ecfb_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

React 根据事件注册事件监听器。

```jsx
function diffProperties(){
    /* 判断当前的 propKey 是不是 React合成事件 */
    if(registrationNameModules.hasOwnProperty(propKey)){
         /* 这里多个函数简化了，如果是合成事件， 传入成事件名称 onClick ，向document注册事件  */
         legacyListenToEvent(registrationName, document）;
    }
}
```

diffProperties 函数在 diff props 如果发现是合成事件( onClick ) 就会调用 legacyListenToEvent 函数。

注册事件监听器。接下来看一下 legacyListenToEvent 是如何注册事件的。

```jsx
function legacyListenToEvent(registrationName，mountAt){
   const dependencies = registrationNameDependencies[registrationName]; // 根据 onClick 获取  onClick 依赖的事件数组 [ 'click' ]。
    for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    //  addEventListener 绑定事件监听器
    ...
  }
}

```

- 这个就是应用上述 registrationNameDependencies 对 React 合成事件，分别绑定原生事件的事件监听器。比如发现是 onChange ，那么取出 [‘blur’, ‘change’, ‘click’, ‘focus’, ‘input’, ‘keydown’, ‘keyup’, ‘selectionchange’] 遍历绑定。

**那么有一个疑问，绑定在 document 的事件处理函数是如上写的 handleChange，handleClick 吗？**

答案是否定的，绑定在 document 的事件，是 React 统一的事件处理函数 dispatchEvent ，React 需要一个统一流程去代理事件逻辑，包括 React 批量更新等逻辑。

只要是 **React 事件触发，首先执行的就是 dispatchEvent** ，那么有的同学会问，dispatchEvent 是如何知道是什么事件触发的呢？

实际在注册的时候，就已经通过 bind ，把参数绑定给 dispatchEvent 了。

比如绑定 click 事件

```jsx
const listener = dispatchEvent.bind(null, "click", eventSystemFlags, document);
/* TODO: 重要, 这里进行真正的事件绑定。*/
document.addEventListener("click", listener, false);
```

### 事件触发

一次点击事件

```jsx
export default function Index() {
  const handleClick1 = () => console.log(1);
  const handleClick2 = () => console.log(2);
  const handleClick3 = () => console.log(3);
  const handleClick4 = () => console.log(4);
  return (
    <div onClick={handleClick3} onClickCapture={handleClick4}>
      <button onClick={handleClick1} onClickCapture={handleClick2}>
        点击
      </button>
    </div>
  );
}
```

第一步：批量更新

dispatchEvent 执行会传入真实的事件源 button 元素本身，通过元素可以找到 button 对应的 fiber，fiber 和原生 DOM 之间是如何建立起联系的呢？

React 在初始化真实 DOM 的时候，用一个随机的 key internalInstanceKey 指针指向了当前 DOM 对应的 fiber 对象，fiber 对象用 stateNode 指向了当前的 DOM 元素。

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/273b4791827544ef82f475137f3657d4_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)
接下来就是批量更新环节：

```js
export function batchedEventUpdates(fn, a) {
  isBatchingEventUpdates = true; //打开批量更新开关
  try {
    fn(a); // 事件在这里执行
  } finally {
    isBatchingEventUpdates = false; //关闭批量更新开关
  }
}
```

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/caf96e356f7e46248a4c546cef46b2bc_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

第二步：合成事件源

接下来会通过 onClick 找到对应的处理插件 SimpleEventPlugin ，合成新的事件源 e ，里面包含了 preventDefault 和 stopPropagation 等方法。

第二阶段模型：

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/c5791b365ca346749df096f1111fb714_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

第三步： 形成事件执行队列

在第一步通过原生 DOM 获取到对应的 fiber ，接着会从这个 fiber 向上遍历，遇到元素类型 fiber ，就会收集事件，用一个数组收集事件：

- 如果遇到捕获阶段事件 onClickCapture ，就会 unshift 放在数组前面。以此模拟事件捕获阶段。
- 如果遇到冒泡阶段事件 onClick ，就会 push 到数组后面，模拟事件冒泡阶段。
- 一直收集到最顶端 app ，形成执行队列，在接下来阶段，依次执行队列里面的函数。

```jsx
while (instance !== null) {
  const { stateNode, tag } = instance;
  if (tag === HostComponent && stateNode !== null) {
    /* DOM 元素 */
    const currentTarget = stateNode;
    if (captured !== null) {
      /* 事件捕获 */
      /* 在事件捕获阶段,真正的事件处理函数 */
      const captureListener = getListener(instance, captured); // onClickCapture
      if (captureListener != null) {
        /* 对应发生在事件捕获阶段的处理函数，逻辑是将执行函数unshift添加到队列的最前面 */
        dispatchListeners.unshift(captureListener);
      }
    }
    if (bubbled !== null) {
      /* 事件冒泡 */
      /* 事件冒泡阶段，真正的事件处理函数，逻辑是将执行函数push到执行队列的最后面 */
      const bubbleListener = getListener(instance, bubbled); //
      if (bubbleListener != null) {
        dispatchListeners.push(bubbleListener); // onClick
      }
    }
  }
  instance = instance.return;
}
```

那么如上点击一次按钮，4 个事件执行顺序是这样的：

- 首先第一次收集是在 button 上，handleClick1 冒泡事件 push 处理，handleClick2 捕获事件 unshift 处理。形成结构 [ handleClick2 , handleClick1 ]
- 然后接着向上收集，遇到父级，收集父级 div 上的事件，handleClick3 冒泡事件 push 处理，handleClick4 捕获事件 unshift 处理。[handleClick4, handleClick2 , handleClick1, handleClick3 ]
- 依次执行数组里面的事件，所以打印 4 2 1 3。

第三阶段模型：

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/f361b1a9c38646c698ae12b8befa8535_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

React 如何模拟阻止事件冒泡

那么 React 是如何阻止事件冒泡的呢。来看一下事件队列是怎么执行的。

```jsx
function runEventsInBatch() {
  const dispatchListeners = event._dispatchListeners;
  if (Array.isArray(dispatchListeners)) {
    for (let i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        /* 判断是否已经阻止事件冒泡 */
        break;
      }
      dispatchListeners[i](event); /* 执行真正的处理函数 及handleClick1... */
    }
  }
}
```

对于上述队列 [handleClick4, handleClick2 , handleClick1, handleClick3 ]

- 假设在上述队列中，handleClick2 中调用 e.stopPropagation()，那么事件源里将有状态证明此次事件已经停止冒泡，

- 那么下次遍历的时候， event.isPropagationStopped() 就会返回 true ，所以跳出循环，handleClick1, handleClick3 将不再执行，模拟了阻止事件冒泡的过程。

### react 的两大核心模块：调度（ Scheduler ）和调和（ Reconciler ）。

时间分片

React 如何让浏览器控制 React 更新呢，首先浏览器每次执行一次事件循环（一帧）都会做如下事情：
处理事件，执行 js ，调用 requestAnimation ，布局 Layout ，绘制 Paint ，在一帧执行后，如果没有其他事件，那么浏览器会进入休息时间，那么有的一些不是特别紧急 React 更新，就可以执行了。

```jsx

```

那么首先就是**如何知道浏览器有空闲时间？**

requestIdleCallback 是谷歌浏览器提供的一个 API， 在浏览器有空余的时间，浏览器就会调用 requestIdleCallback 的回调。首先看一下 requestIdleCallback 的基本用法：

```jsx
requestIdleCallback(callback, { timeout });
```

- callback 回调，浏览器空余时间执行回调函数。
- timeout 超时时间。如果浏览器长时间没有空闲，那么回调就不会执行，为了解决这个问题，可以通过 requestIdleCallback 的第二个参数指定一个超时时间。

React 为了防止 requestIdleCallback 中的任务由于浏览器没有空闲时间而卡死，所以设置了 5 个优先级。

- Immediate -1 需要立刻执行。
- UserBlocking 250ms 超时时间 250ms，一般指的是用户交互。
- Normal 5000ms 超时时间 5s，不需要直观立即变化的任务，比如网络请求。
- Low 10000ms 超时时间 10s，肯定要执行的任务，但是可以放在最后处理。
- Idle 一些没有必要的任务，可能不会执行。

react 的异步更新任务就是通过类似 requestIdleCallback 去向浏览器做一帧一帧请求，等到浏览器有空余时间，去执行 React 的异步更新任务，这样保证页面的流畅。

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/4cdece5756244975beb3ca5352af4eb8_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

**模拟 requestIdleCallback**

但是 requestIdleCallback 目前只有谷歌浏览器支持 ，为了兼容每个浏览器，React 需要自己实现一个 requestIdleCallback ，那么就要具备两个条件：

- 1 实现的这个 requestIdleCallback ，可以主动让出主线程，让浏览器去渲染视图。
- 2 一次事件循环只执行一次，因为执行一个以后，还会请求下一次的时间片。

**MessageChannel**

为了让视图流畅地运行，可以按照人类能感知到最低限度每秒 60 帧的频率划分时间片，这样每个时间片就是 16ms 。也就是这 16 毫秒要完成如上 js 执行，浏览器绘制等操作，而上述 setTimeout 带来的浪费就足足有 4ms，react 团队应该是注意到这 4ms 有点过于铺张浪费，所以才采用了一个新的方式去实现，那就是 MessageChannel 。

MessageChannel 接口允许开发者创建一个新的消息通道，并通过它的两个 MessagePort 属性发送数据。

- MessageChannel.port1 只读返回 channel 的 port1 。
- MessageChannel.port2 只读返回 channel 的 port2 。 下面来模拟一下 MessageChannel 如何触发异步宏任务的。

```jsx
let scheduledHostCallback = null;
/* 建立一个消息通道 */
var channel = new MessageChannel();
/* 建立一个port发送消息 */
var port = channel.port2;

channel.port1.onmessage = function () {
  /* 执行任务 */
  scheduledHostCallback();
  /* 执行完毕，清空任务 */
  scheduledHostCallback = null;
};
/* 向浏览器请求执行更新任务 */
requestHostCallback = function (callback) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    port.postMessage(null);
  }
};
```

- 在一次更新中，React 会调用 requestHostCallback ，把更新任务赋值给 scheduledHostCallback ，然后 port2 向 port1 发起 postMessage 消息通知。
- port1 会通过 onmessage ，接受来自 port2 消息，然后执行更新任务 scheduledHostCallback ，然后置空 scheduledHostCallback ，借此达到异步执行目的

### 异步调度原理

React 发生一次更新，会统一走 ensureRootIsScheduled（调度应用）

- 对于正常更新会走 performSyncWorkOnRoot 逻辑，最后会走 workLoopSync 。
- 对于低优先级的异步更新会走 performConcurrentWorkOnRoot 逻辑，最后会走 workLoopConcurrent 。

如下看一下 workLoopSync，workLoopConcurrent。

```jsx
function workLoopSync() {
  while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}
```

```jsx
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}
```

在一次更新调度过程中，workLoop 会更新执行每一个待更新的 fiber 。他们的区别就是异步模式会调用一个 shouldYield() ，

如果当前浏览器没有空余时间， shouldYield 会中止循环，直到浏览器有空闲时间后再继续遍历，从而达到终止渲染的目的。这样就解决了一次性遍历大量的 fiber ，导致浏览器没有时间执行一些渲染任务，导致了页面卡顿。

### scheduleCallback

无论是上述正常更新任务 workLoopSync 还是低优先级的任务 workLoopConcurrent ，都是由调度器 scheduleCallback 统一调度的，那么两者在进入调度器时候有什么区别呢？

对于正常更新任务，最后会变成类似如下结构：

```js
scheduleCallback(Immediate, workLoopSync);
```

对于异步任务

```js
/* 计算超时等级，就是如上那五个等级 */
var priorityLevel = inferPriorityFromExpirationTime(
  currentTime,
  expirationTime
);
scheduleCallback(priorityLevel, workLoopConcurrent);
```

低优先级异步任务的处理，比同步多了一个超时等级的概念。会计算上述那五种超时等级。

```js
function scheduleCallback(){
   /* 计算过期时间：超时时间  = 开始时间（现在时间） + 任务超时的时间（上述设置那五个等级）     */
   const expirationTime = startTime + timeout;
   /* 创建一个新任务 */
   const newTask = { ... }
  if (startTime > currentTime) {
      /* 通过开始时间排序 */
      newTask.sortIndex = startTime;
      /* 把任务放在timerQueue中 */
      push(timerQueue, newTask);
      /*  执行setTimeout ， */
      requestHostTimeout(handleTimeout, startTime - currentTime);
  }else{
    /* 通过 expirationTime 排序  */
    newTask.sortIndex = expirationTime;
    /* 把任务放入taskQueue */
    push(taskQueue, newTask);
    /*没有处于调度中的任务， 然后向浏览器请求一帧，浏览器空闲执行 flushWork */
     if (!isHostCallbackScheduled && !isPerformingWork) {
        isHostCallbackScheduled = true;
         requestHostCallback(flushWork)
     }

  }

}
```

对于调度本身，有几个概念必须掌握。

- taskQueue，里面存的都是过期的任务，依据任务的过期时间( expirationTime ) 排序，需要在调度的 workLoop 中循环执行完这些任务。
- timerQueue 里面存的都是没有过期的任务，依据任务的开始时间( startTime )排序，在调度 workLoop 中 会用 advanceTimers 检查任务是否过期，如果过期了，放入 taskQueue 队列。

scheduleCallback 流程如下。

- 创建一个新的任务 newTask。
- 通过任务的开始时间( startTime ) 和 当前时间( currentTime ) 比较:当 startTime > currentTime, 说明未过期, 存到 timerQueue，当 startTime <= currentTime, 说明已过期, 存到 taskQueue。
- 如果任务过期，并且没有调度中的任务，那么调度 requestHostCallback。本质上调度的是 flushWork。
- 如果任务没有过期，用 requestHostTimeout 延时执行 handleTimeout。

**什么是 fiber**

整个 React 团队花费两年时间重构 fiber 架构，目的就是解决大型 React 应用卡顿；fiber 在 React 中是最小粒度的执行单元，无论 React 还是 Vue ，在遍历更新每一个节点的时候都不是用的真实 DOM ，都是采用虚拟 DOM ，所以可以理解成 fiber 就是 React 的虚拟 DOM 。

Reactv16 为了解决卡顿问题引入了 fiber ，为什么它能解决卡顿，更新 fiber 的过程叫做 Reconciler（调和器），每一个 fiber 都可以作为一个执行单元来处理，所以每一个 fiber 可以根据自身的过期时间 expirationTime（ v17 版本叫做优先级 lane ）来判断是否还有空间时间执行更新，如果没有时间更新，就要把主动权交给浏览器去渲染，做一些动画，重排（ reflow ），重绘 repaints 之类的事情，这样就能给用户感觉不是很卡。然后等浏览器空余时间，在通过 scheduler （调度器），再次恢复执行单元上来，这样就能本质上中断了渲染，提高了用户体验。

**Fiber 更新机制**

**第一步：创建 fiberRoot 和 rootFiber**

- fiberRoot：首次构建应用， 创建一个 fiberRoot ，作为整个 React 应用的根基。
- rootFiber： 如下通过 ReactDOM.render 渲染出来的，如上 Index 可以作为一个 rootFiber。一个 React 应用可以有多 ReactDOM.render 创建的 rootFiber ，但是只能有一个 fiberRoot（应用根节点）。

```js
ReactDOM.render(<Index />, document.getElementById("app"));
```

第一次挂载的过程中，会将 fiberRoot 和 rootFiber 建立起关联。

```js
// react-reconciler/src/ReactFiberRoot.js

function createFiberRoot(containerInfo, tag) {
  /* 创建一个root */
  const root = new FiberRootNode(containerInfo, tag);
  const rootFiber = createHostRootFiber(tag);
  root.current = rootFiber;
  return root;
}
```

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/cb68640d39914c03bc77ea15616c7918_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

**第二步：workInProgress 和 current**

经过第一步的处理，开始到正式渲染阶段，会进入 beginwork 流程，在讲渲染流程之前，要先弄明白两个概念：

- workInProgress 是：正在内存中构建的 Fiber 树称为 workInProgress Fiber 树。在一次更新中，所有的更新都是发生在 workInProgress 树上。在一次更新之后，workInProgress 树上的状态是最新的状态，那么它将变成 current 树用于渲染视图。
- current：正在视图层渲染的树叫做 current 树。

接下来会到 rootFiber 的渲染流程，首先会复用当前 current 树（ rootFiber ）的 alternate 作为 workInProgress ，如果没有 alternate （初始化的 rootFiber 是没有 alternate ），那么会创建一个 fiber 作为 workInProgress 。会用 alternate 将新创建的 workInProgress 与 current 树建立起关联。这个关联过程只有初始化第一次创建 alternate 时候进行

```js
currentFiber.alternate = workInProgressFiber;
workInProgressFiber.alternate = currentFiber;
```

效果：
![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/9a7f5a9b77ff45febd8e255fcba1ba3a_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

**第三步：深度调和子节点，渲染视图**

接下来会按照上述第二步，在新创建的 alternates 上，完成整个 fiber 树的遍历，包括 fiber 的创建。

效果：
![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/cda0522c0c85435494ccf3a3ea587baa_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

最后会以 workInProgress 作为最新的渲染树，fiberRoot 的 current 指针指向 workInProgress 使其变为 current Fiber 树。到此完成初始化流程。

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/907fb4f6768842438e0df7f083adc4b6_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

**2 更新**

如果对于上述 demo ，开发者点击一次按钮发生更新，接下来会发生什么呢?

首先会走如上的逻辑，重新创建一颗 workInProgresss 树，复用当前 current 树上的 alternate ，作为新的 workInProgress ，由于初始化 rootfiber 有 alternate ，所以对于剩余的子节点，React 还需要创建一份，和 current 树上的 fiber 建立起 alternate 关联。渲染完毕后，workInProgresss 再次变成 current 树。
![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/ff00ce5f2db0430c841ea3a01754542e_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

问：如果如上又发生一次点击，会发生什么？
答：如果进行下一次更新，那么会将 current 的 alternate 作为基础（如图右树），复制一份作为 workInProgresss ，然后进行更新。

### 双缓冲树

canvas 绘制动画的时候，如果上一帧计算量比较大，导致清除上一帧画面到绘制当前帧画面之间有较长间隙，就会出现白屏。为了解决这个问题，canvas 在内存中绘制当前动画，绘制完毕后直接用当前帧替换上一帧画面，由于省去了两帧替换间的计算时间，不会出现从白屏到出现画面的闪烁情况。这种在内存中构建并直接替换的技术叫做**双缓存**。

React 用 workInProgress 树(内存中构建的树) 和 current (渲染树) 来实现更新逻辑。双缓存一个在内存中构建，一个渲染视图，两颗树用 alternate 指针相互指向，在下一次渲染的时候，直接复用缓存树做为下一次渲染树，上一次的渲染树又作为缓存树，这样可以防止只用一颗树更新状态的丢失的情况，又加快了 DOM 节点的替换与更新。

**两大阶段：render 和 commit**

render 阶段和 commit 阶段是整个 fiber Reconciler 的核心

1. render 阶段

```js
function workLoop() {
  while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}
```

每一个 fiber 可以看作一个执行的单元，在调和过程中，每一个发生更新的 fiber 都会作为一次 workInProgress 。

那么 workLoop 就是执行每一个单元的调度器，如果渲染没有被中断，那么 workLoop 会遍历一遍 fiber 树。 performUnitOfWork 包括两个阶段 beginWork 和 completeWork 。

```js
function performUnitOfWork() {
  next = beginWork(current, unitOfWork, renderExpirationTime);
  if (next === null) {
    next = completeUnitOfWork(unitOfWork);
  }
}
```

beginWork：是向下调和的过程。就是由 fiberRoot 按照 child 指针逐层向下调和，期间会执行函数组件，实例类组件，diff 调和子节点，打不同 effectTag。

completeUnitOfWork：是向上归并的过程，如果有兄弟节点，会返回 sibling 兄弟，没有返回 return 父级，一直返回到 fiberRoot ，期间可以形成 effectList，对于初始化流程会创建 DOM ，对于 DOM 元素进行事件收集，处理 style，className 等。

总结 beginWork 作用如下：

- 对于组件，执行部分生命周期，执行 render ，得到最新的 children 。
- 向下遍历调和 children ，复用 oldFiber ( diff 算法)，diff 流程在第十二章已经讲过了。
- 打不同的副作用标签 effectTag ，比如类组件的生命周期，或者元素的增加，删除，更新。

**reconcileChildren**

```js
function reconcileChildren(current, workInProgress) {
  if (current === null) {
    /* 初始化子代fiber  */
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderExpirationTime
    );
  } else {
    /* 更新流程，diff children将在这里进行。 */
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderExpirationTime
    );
  }
}
```

EffectTag

```js
export const Placement = /*             */ 0b0000000000010; // 插入节点
export const Update = /*                */ 0b0000000000100; // 更新fiber
export const Deletion = /*              */ 0b0000000001000; // 删除fiebr
export const Snapshot = /*              */ 0b0000100000000; // 快照
export const Passive = /*               */ 0b0001000000000; // useEffect的副作用
export const Callback = /*              */ 0b0000000100000; // setState的 callback
export const Ref = /*                   */ 0b0000010000000; // ref
```

## 向上归并 completeUnitOfWork

completeUnitOfWork 的流程是自下向上的，那么 completeUnitOfWork 过程主要做写什么呢？

- 首先 completeUnitOfWork 会将 effectTag 的 Fiber 节点会被保存在一条被称为 effectList 的单向链表中。在 commit 阶段，将不再需要遍历每一个 fiber ，只需要执行更新 effectList 就可以了。
- completeWork 阶段对于组件处理 context ；对于元素标签初始化，会创建真实 DOM ，将子孙 DOM 节点插入刚生成的 DOM 节点中；会触发 diffProperties 处理 props ，比如事件收集，style，className 处理，

### commit 阶段

- 一方面是对一些生命周期和副作用钩子的处理，比如 componentDidMount ，函数组件的 useEffect ，useLayoutEffect ；

- 另一方面就是在一次更新中，添加节点（ Placement ），更新节点（ Update ），删除节点（ Deletion ），还有就是一些细节的处理，比如 ref 的处理。

commit 细分可以分为：

- Before mutation 阶段（执行 DOM 操作前）；
- mutation 阶段（执行 DOM 操作）；
- layout 阶段（执行 DOM 操作后）

**① Before mutation**

```js
function commitBeforeMutationEffects() {
  while (nextEffect !== null) {
    const effectTag = nextEffect.effectTag;
    if ((effectTag & Snapshot) !== NoEffect) {
      const current = nextEffect.alternate;
      // 调用getSnapshotBeforeUpdates
      commitBeforeMutationEffectOnFiber(current, nextEffect);
    }
    if ((effectTag & Passive) !== NoEffect) {
      scheduleCallback(NormalPriority, () => {
        flushPassiveEffects();
        return null;
      });
    }
    nextEffect = nextEffect.nextEffect;
  }
}
```

- 因为 Before mutation 还没修改真实的 DOM ，是获取 DOM 快照的最佳时期，如果是类组件有 getSnapshotBeforeUpdate ，那么会执行这个生命周期。
- 会异步调用 useEffect ，在生命周期章节讲到 useEffect 是采用异步调用的模式，其目的就是防止同步执行时阻塞浏览器做视图渲染。

**② Mutation**

```js
function commitMutationEffects() {
  while (nextEffect !== null) {
    if (effectTag & Ref) {
      /* 置空Ref */
      const current = nextEffect.alternate;
      if (current !== null) {
        commitDetachRef(current);
      }
    }
    switch (primaryEffectTag) {
      case Placement: {
      } //  新增元素
      case Update: {
      } //  更新元素
      case Deletion: {
      } //  删除元素
    }
  }
}
```

mutation 阶段做的事情有：

- 置空 ref ，在 ref 章节讲到对于 ref 的处理。
- 对新增元素，更新元素，删除元素。进行真实的 DOM 操作。

**③ Layout**

```js
function commitLayoutEffects(root) {
  while (nextEffect !== null) {
    const effectTag = nextEffect.effectTag;
    commitLayoutEffectOnFiber(
      root,
      current,
      nextEffect,
      committedExpirationTime
    );
    if (effectTag & Ref) {
      commitAttachRef(nextEffect);
    }
  }
}
```

Layout 阶段 DOM 已经更新完毕，Layout 做的事情有：

- commitLayoutEffectOnFiber 对于类组件，会执行生命周期，setState 的 callback，对于函数组件会执行 useLayoutEffect 钩子。
- 如果有 ref ，会重新赋值 ref 。

接下来对 commit 阶段做一个总结，主要做的事就是执行 effectList，更新 DOM，执行生命周期，获取 ref 等操作。

**调和 + 异步调度 流程总图**

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/429a103a732e42b69b6cd9a32f1d265a_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

### 位运算

位运算就是直接对整数在内存中的二进制位进行操作。

两个位元算符号 & 和 ｜：

- & 对于每一个比特位,两个操作数都为 1 时, 结果为 1, 否则为 0
- | 对于每一个比特位,两个操作数都为 0 时, 结果为 0, 否则为 1

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/874D7F1E-8D8C-4411-B80C-850AE7DAA1FD.png>)

**位运算的一个使用场景**

**位掩码：** 对于常量的声明（如上的 A B C ）必须满足只有一个 1 位，而且每一个常量二进制 1 的所在位数都不同，如下所示：

0b0000000000000000000000000000001 = 1
0b0000000000000000000000000000010 = 2
0b0000000000000000000000000000100 = 4
0b0000000000000000000000000001000 = 8
0b0000000000000000000000000010000 = 16
0b0000000000000000000000000100000 = 32
0b0000000000000000000000001000000 = 64

**React 位掩码场景（1）—更新优先级**

所以 React 解决方案就是多个更新优先级的任务存在的时候，**高优先级的任务会优先执行，等到执行完高优先级的任务，在回过头来执行低优先级的任务
**

在新版本 React 中，每一个更新中会把待更新的 fiber 增加了一个更新优先级，我们这里称之为 lane ，而且存在不同的更新优先级，这里枚举了一些优先级，如下所示：

```js
export const NoLanes = /*                        */ 0b0000000000000000000000000000000;
const SyncLane = /*                        */ 0b0000000000000000000000000000001;

const InputContinuousHydrationLane = /*    */ 0b0000000000000000000000000000010;
const InputContinuousLane = /*             */ 0b0000000000000000000000000000100;

const DefaultHydrationLane = /*            */ 0b0000000000000000000000000001000;
const DefaultLane = /*                     */ 0b0000000000000000000000000010000;

const TransitionHydrationLane = /*                */ 0b0000000000000000000000000100000;
const TransitionLane = /*                        */ 0b0000000000000000000000001000000;
```

如上 SyncLane 代表的数值是 1，它却是最高的优先级，也即是说 lane 的代表的数值越小，此次更新的优先级就越大 ，

在新版本的 React 中，还有一个新特性，就是 render 阶段可能被中断，在这个期间会产生一个更高优先级的任务，那么会再次更新 lane 属性，这样多个更新就会合并，这样一个 **lane 可能需要表现出多个更新优先级。**

**分离高优先级任务**

当存在多个更新优先级的时候，React 肯定需要优先执行高优先级的任务，那么首先就是需要从合并的优先级 lane 中分离出高优先级的任务，来看一下实现细节。

```js
function getHighestPriorityLanes(lanes) {
   /* 通过 getHighestPriorityLane 分离出优先级高的任务 */
  switch (getHighestPriorityLane(lanes)) {
       case SyncLane:
         return SyncLane;
       case InputContinuousHydrationLane:
         return InputContinuousHydrationLane;
       ...
  }

```

```js
function getHighestPriorityLane(lanes) {
  return lanes & -lanes;
}
```

如上就是通过 lanes & -lanes 分离出最高优先级的任务的，我们来看一下具体的流程。

可以看得出来 lane & -lane 的结果是 SyncLane，所以通过 lane & -lane 就能分离出最高优先级的任务。

**react 位掩码场景（2）——更新上下文**

lane 是标记了更新任务的优先级的属性，那么 lane 决定了更新与否，那么进入了更新阶段，也有一个属性用于判断现在更新上下文的状态，这个属性就是 ExecutionContext。

React 如何知道当前的上下文中需要合并更新的呢？这个时候更新上下文状态 ExecutionContext 就派上用场了，通过给 ExecutionContext 赋值不同的状态，来证明当前上下文的状态，点击事件里面的上下文会被赋值独立的上下文状态。具

```js
function batchedEventUpdates() {
  var prevExecutionContext = executionContext;
  executionContext |= EventContext; // 赋值事件上下文 EventContext
  try {
    return fn(a); // 执行函数
  } finally {
    executionContext = prevExecutionContext; // 重置之前的状态
  }
}
```

在 React 事件系统中给 executionContext 赋值 EventContext，在执行完事件后，再重置到之前的状态。就这样在事件系统中的更新能感知到目前的更新上下文是 EventContext，那么在这里的更新就是可控的，就可以实现批量更新的逻辑了。

在 React 整体设计中，executionContext 作为一个全局状态，指引 React 更新的方向，在 React 运行时上下文中，无论是初始化还是更新，都会走一个入口函数，它就是 scheduleUpdateOnFiber ，这个函数会使用更新上下文来判别更新的下一步走向。

```js
if (lane === SyncLane) {
  if (
    (executionContext & LegacyUnbatchedContext) !== NoContext && // unbatch 情况，比如初始化
    (executionContext & (RenderContext | CommitContext)) === NoContext
  ) {
    //直接更新
  } else {
    if (executionContext === NoContext) {
      //放入调度更新
    }
  }
}
```

executionContext 以及位运算来判断是否**直接更新**还是**放入到调度中去更新**。

二 **hooks 与 fiber（workInProgress）**

类组件的状态比如 state ，context ，props 本质上是存在类组件对应的 fiber 上，包括生命周期比如 componentDidMount ，也是以副作用 effect 形式存在的。

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/05d76f28b43d41168ff25e6310c61e96_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

Hooks 既然赋予了函数组件如上功能，所以 hooks 本质是离不开函数组件对应的 fiber 的。hooks 可以作为函数组件本身和函数组件对应的 fiber 之间的沟通桥梁。

- 1 ContextOnlyDispatcher： 第一种形态是防止开发者在函数组件外部调用 hooks ，所以第一种就是报错形态，只要开发者调用了这个形态下的 hooks ，就会抛出异常。
- 2 HooksDispatcherOnMount： 第二种形态是函数组件初始化 mount ，因为之前讲过 hooks 是函数组件和对应 fiber 桥梁，这个时候的 hooks 作用就是建立这个桥梁，初次建立其 hooks 与 fiber 之间的关系。
- 3 HooksDispatcherOnUpdate：第三种形态是函数组件的更新，既然与 fiber 之间的桥已经建好了，那么组件再更新，就需要 hooks 去获取或者更新维护状态。

```js
const HooksDispatcherOnMount = { /* 函数组件初始化用的 hooks */
    useState: mountState,
    useEffect: mountEffect,
    ...
}
const  HooksDispatcherOnUpdate ={/* 函数组件更新用的 hooks */
   useState:updateState,
   useEffect: updateEffect,
   ...
}
const ContextOnlyDispatcher = {  /* 当hooks不是函数内部调用的时候，调用这个hooks对象下的hooks，所以报错。 */
   useEffect: throwInvalidHookError,
   useState: throwInvalidHookError,
   ...
}
```

**函数组件触发**

所有函数组件的触发是在 renderWithHooks 方法中，在 fiber 调和过程中，遇到 FunctionComponent 类型的 fiber（函数组件），就会用 updateFunctionComponent 更新 fiber ，在 updateFunctionComponent 内部就会调用 renderWithHooks 。

```js
let currentlyRenderingFiber;
function renderWithHooks(current, workInProgress, Component, props) {
  currentlyRenderingFiber = workInProgress;
  workInProgress.memoizedState =
    null; /* 每一次执行函数组件之前，先清空状态 （用于存放hooks列表）*/
  workInProgress.updateQueue = null; /* 清空状态（用于存放effect list） */
  ReactCurrentDispatcher.current =
    current === null || current.memoizedState === null
      ? HooksDispatcherOnMount
      : HooksDispatcherOnUpdate; /* 判断是初始化组件还是更新组件 */
  let children = Component(
    props,
    secondArg
  ); /* 执行我们真正函数组件，所有的hooks将依次执行。 */
  ReactCurrentDispatcher.current =
    ContextOnlyDispatcher; /* 将hooks变成第一种，防止hooks在函数组件外部调用，调用直接报错。 */
}
```

workInProgress 正在调和更新函数组件对应的 fiber 树。

- 对于类组件 fiber ，用 memoizedState 保存 state 信息，**对于函数组件 fiber ，用 memoizedState 保存 hooks 信息**。
- 对于函数组件 fiber ，updateQueue 存放每个 useEffect/useLayoutEffect 产生的副作用组成的链表。在 commit 阶段更新这些副作用。
- 然后判断组件是初始化流程还是更新流程，如果初始化用 HooksDispatcherOnMount 对象，如果更新用 HooksDispatcherOnUpdate 对象。函数组件执行完毕，将 hooks 赋值给 ContextOnlyDispatcher 对象。**引用的 React hooks 都是从 ReactCurrentDispatcher.current 中的， React 就是通过赋予 current 不同的 hooks 对象达到监控 hooks 是否在函数组件内部调用。**
- Component ( props ， secondArg ) 这个时候函数组件被真正的执行，里面每一个 hooks 也将依次执行。
- 每个 hooks 内部为什么能够读取当前 fiber 信息，因为 currentlyRenderingFiber ，函数组件初始化已经把当前 fiber 赋值给 currentlyRenderingFiber ，每个 hooks 内部读取的就是 currentlyRenderingFiber 的内容。

**hooks 初始化- hooks 如何和 fiber 建立起关系**

hooks 初始化流程使用的是 mountState，mountEffect 等初始化节点的 hooks，将 hooks 和 fiber 建立起联系，那么是如何建立起关系呢，每一个 hooks 初始化都会执行 mountWorkInProgressHook ，接下来看一下这个函数。

```js
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };
  if (workInProgressHook === null) {
    // 只有一个 hooks
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 有多个 hooks
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}
```

首先函数组件对应 fiber 用 memoizedState 保存 hooks 信息，每一个 hooks 执行都会产生一个 hooks 对象，hooks 对象中，保存着当前 hooks 的信息，不同 hooks 保存的形式不同。每一个 hooks 通过 next 链表建立起关系。

```js
export default function Index() {
  const [number, setNumber] = React.useState(0); // 第一个hooks
  const [num, setNum] = React.useState(1); // 第二个hooks
  const dom = React.useRef(null); // 第三个hooks
  React.useEffect(() => {
    // 第四个hooks
    console.log(dom.current);
  }, []);
  return (
    <div ref={dom}>
      <div onClick={() => setNumber(number + 1)}> {number} </div>
      <div onClick={() => setNum(num + 1)}> {num}</div>
    </div>
  );
}
```

那么如上四个 hooks ，初始化，每个 hooks 内部执行 mountWorkInProgressHook ，然后每一个 hook 通过 next 和下一个 hook 建立起关联，最后在 fiber 上的结构会变成这样。
![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/b589f284235c477e9e987460862cc5ef_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

### hooks 更新

更新 hooks 逻辑和之前 fiber 章节中讲的双缓冲树更新差不多，会首先取出 workInProgres.alternate 里面对应的 hook ，然后根据之前的 hooks 复制一份，形成新的 hooks 链表关系。这个过程中解释了一个问题，就是**hooks 规则，hooks 为什么要通常放在顶部，hooks 不能写在 if 条件语句中**，因为在更新过程中，如果通过 if 条件语句，增加或者删除 hooks，在复用 hooks 过程中，会产生复用 hooks 状态和当前 hooks 不一致的问题。举一个例子，还是将如上的 demo 进行修改。

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/e3a10b8466324fa89cf2bc5903b29618_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

useState 和 useReducer 原理大同小异，本质上都是触发更新的函数都是 dispatchAction。

setNumber 本质就是 dispatchAction 。首先需要看一下执行 useState(0) 本质上做了些什么？

```js
function mountState(initialState){
     const hook = mountWorkInProgressHook();
    if (typeof initialState === 'function') {initialState = initialState() } // 如果 useState 第一个参数为函数，执行函数得到初始化state
     hook.memoizedState = hook.baseState = initialState;
    const queue = (hook.queue = { ... }); // 负责记录更新的各种状态。
    const dispatch = (queue.dispatch = (dispatchAction.bind(  null,currentlyRenderingFiber,queue, ))) // dispatchAction 为更新调度的主要函数
    return [hook.memoizedState, dispatch];
}
```

- 上面的 state 会被当前 hooks 的 memoizedState 保存下来，每一个 useState 都会创建一个 queue 里面保存了更新的信息。
- 每一个 useState 都会创建一个更新函数，比如如上的 setNumber 本质上就是 dispatchAction，那么值得注意一点是，当前的 fiber 被 bind 绑定了固定的参数传入 dispatchAction 和 queue ，所以当用户触发 setNumber 的时候，能够直观反映出来自哪个 fiber 的更新。
- 最后把 memoizedState dispatch 返回给开发者使用。

```js
function dispatchAction(fiber, queue, action){
    /* 第一步：创建一个 update */
    const update = { ... }
    const pending = queue.pending;
    if (pending === null) {  /* 第一个待更新任务 */
        update.next = update;
    } else {  /* 已经有带更新任务 */
       update.next = pending.next;
       pending.next = update;
    }
    if( fiber === currentlyRenderingFiber ){
        /* 说明当前fiber正在发生调和渲染更新，那么不需要更新 */
    }else{
       if(fiber.expirationTime === NoWork && (alternate === null || alternate.expirationTime === NoWork)){
            const lastRenderedReducer = queue.lastRenderedReducer;
            const currentState = queue.lastRenderedState;                 /* 上一次的state */
            const eagerState = lastRenderedReducer(currentState, action); /* 这一次新的state */
            if (is(eagerState, currentState)) {                           /* 如果每一个都改变相同的state，那么组件不更新 */
               return
            }
       }
       scheduleUpdateOnFiber(fiber, expirationTime);    /* 发起调度更新 */
    }
}

```

原来当每一次改变 state ，底层会做这些事。

- 首先用户每一次调用 dispatchAction（比如如上触发 setNumber ）都会先创建一个 update ，然后把它放入待更新 pending 队列中。
- 然后判断如果当前的 fiber 正在更新，那么也就不需要再更新了。
- 反之，说明当前 fiber 没有更新任务，那么会拿出上一次 state 和 这一次 state 进行对比，如果相同，那么直接退出更新。如果不相同，那么发起更新调度任务。**这就解释了，为什么函数组件 useState 改变相同的值，组件不更新了。**
  接下来就是更新的环节，下面模拟一个更新场景。

```js
function updateReducer() {
  // 第一步把待更新的pending队列取出来。合并到 baseQueue
  const first = baseQueue.next;
  let update = first;
  do {
    /* 得到新的 state */
    newState = reducer(newState, action);
  } while (update !== null && update !== first);
  hook.memoizedState = newState;
  return [hook.memoizedState, dispatch];
}
```

- 当再次执行 useState 的时候，会触发更新 hooks 逻辑，本质上调用的就是 updateReducer，如上会把待更新的队列 pendingQueue 拿出来，合并到 baseQueue，循环进行更新。
- 循环更新的流程，说白了就是执行每一个 num => num + 1 ，得到最新的 state 。接下来就可以从 useState 中得到最新的值。
  hooks 中的 useEffect 和 useLayoutEffect 也是副作用，接下来以 effect 为例子，看一下 React 是如何处理 useEffect 副作用的。

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/750ee5e50ff8494791f52bd095b305ca_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

### 处理副作用

初始化

```js
function mountEffect(create, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  currentlyRenderingFiber.effectTag |= UpdateEffect | PassiveEffect;
  hook.memoizedState = pushEffect(
    HookHasEffect | hookEffectTag,
    create, // useEffect 第一次参数，就是副作用函数
    undefined,
    nextDeps // useEffect 第二次参数，deps
  );
}
```

- mountWorkInProgressHook 产生一个 hooks ，并和 fiber 建立起关系。
- 通过 pushEffect 创建一个 effect，并保存到当前 hooks 的 memoizedState 属性下。
- pushEffect 除了创建一个 effect ， 还有一个重要作用，就是如果存在多个 effect 或者 layoutEffect 会形成一个副作用链表，绑定在函数组件 fiber 的 updateQueue 上。

为什么 React 会这么设计呢，首先对于类组件有 componentDidMount/componentDidUpdate 固定的生命周期钩子，用于执行初始化/更新的副作用逻辑。
但是对于函数组件，可能存在多个 useEffect/useLayoutEffect ，hooks 把这些 effect，独立形成链表结构，在 commit 阶段统一处理和执行。
![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/21485f1321864045a73bca1b3afdc948_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

更新
更新流程对于 Effect 来说也很简单，首先设想一下 useEffect 更新流程，无非判断是否执行下一次的 effect 副作用函数。

```js
function updateEffect(create, deps) {
  const hook = updateWorkInProgressHook();
  if (areHookInputsEqual(nextDeps, prevDeps)) {
    /* 如果deps项没有发生变化，那么更新effect list就可以了，无须设置 HookHasEffect */
    pushEffect(hookEffectTag, create, destroy, nextDeps);
    return;
  }
  /* 如果deps依赖项发生改变，赋予 effectTag ，在commit节点，就会再次执行我们的effect  */
  currentlyRenderingFiber.effectTag |= fiberEffectTag;
  hook.memoizedState = pushEffect(
    HookHasEffect | hookEffectTag,
    create,
    destroy,
    nextDeps
  );
}
```

- 就是判断 deps 项有没有发生变化，如果没有发生变化，更新副作用链表就可以了；

- 如果发生变化，更新链表同时，打执行副作用的标签：fiber => fiberEffectTag，hook => HookHasEffect。在 commit 阶段就会根据这些标签，重新执行副作用。

### 不同的 effect

**React 就是在 commit 阶段，通过标识符，证明是 useEffect 还是 useLayoutEffect ，接下来 React 会同步处理 useLayoutEffect ，异步处理 useEffect** 。

如果函数组件需要更新副作用，会标记 UpdateEffect，至于哪个 effect 需要更新，那就看 hooks 上有没有 HookHasEffect 标记，所以初始化或者 deps 不相等，就会给当前 Hooks 标记上 HookHasEffect，所以会执行组件的副作用钩子

**状态获取与状态缓存**

**1 对于 ref 处理**

在 ref 章节详细介绍过，useRef 就是创建并维护一个 ref 原始对象。用于获取原生 DOM 或者组件实例，或者保存一些状态等。

创建：

```js
function mountRef(initialValue) {
  const hook = mountWorkInProgressHook();
  const ref = { current: initialValue };
  hook.memoizedState = ref; // 创建ref对象。
  return ref;
}
```

更新：

```js
function updateRef(initialValue) {
  const hook = updateWorkInProgressHook();
  return hook.memoizedState; // 取出复用ref对象。
}
```

2. 对于 useMemo 的处理

创建：

```js
function updateMemo(nextCreate, nextDeps) {
  const hook = updateWorkInProgressHook();
  const prevState = hook.memoizedState;
  const prevDeps = prevState[1]; // 之前保存的 deps 值
  if (areHookInputsEqual(nextDeps, prevDeps)) {
    //判断两次 deps 值
    return prevState[0];
  }
  const nextValue = nextCreate(); // 如果deps，发生改变，重新执行
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
```

- useMemo 初始化会执行第一个函数得到想要缓存的值，将值缓存到 hook 的 memoizedState 上。

更新：

```js
function updateMemo(nextCreate, nextDeps) {
  const hook = updateWorkInProgressHook();
  const prevState = hook.memoizedState;
  const prevDeps = prevState[1]; // 之前保存的 deps 值
  if (areHookInputsEqual(nextDeps, prevDeps)) {
    //判断两次 deps 值
    return prevState[0];
  }
  const nextValue = nextCreate(); // 如果deps，发生改变，重新执行
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
```

- useMemo 更新流程就是对比两次的 dep 是否发生变化，如果没有发生变化，直接返回缓存值，如果发生变化，执行第一个参数函数，重新生成缓存值，缓存下来，供开发者使用。

### React-Router

1. history， React-router，React-router-dom

![核心](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/7ff05efcf1d04fefaa4c2b94d09827bd_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

- **history：** history 是整个 React-router 的核心，里面包括两种路由模式下改变路由的方法，和监听路由变化方法等。
- **react-router：既然有了 history 路由监听/改变的核心，那么需要调度组件**负责派发这些路由的更新，也需要**容器组件**通过路由更新，来渲染视图。所以说 React-router 在 history 核心基础上，增加了 Router ，Switch ，Route 等组件来处理视图渲染。
- **react-router-dom：** 在 react-router 基础上，增加了一些 UI 层面的拓展比如 Link ，NavLink 。以及两种模式的根部路由 BrowserRouter ，HashRouter 。

两种路由主要方式

- ## history 模式下：http://www.xxx.com/home
- ## hash 模式下：http://www.xxx.com/#/home

- 开启 history 模式

```js
import { BrowserRouter as Router } from "react-router-dom";
function Index() {
  return <Router>{/* ...开启history模式 */}</Router>;
}
```

- 开启 hash 模式

```js
import { HashRouter as Router } from "react-router-dom";
// 和history一样
```

```js
import { createBrowserHistory as createHistory } from "history";
class BrowserRouter extends React.Component {
  history = createHistory(this.props);
  render() {
    return <Router history={this.history} children={this.props.children} />;
  }
}
```

- 通过 createBrowserHistory 创建一个 history 对象，并传递给 Router 组件。

**React 路由原理**

### BrowserHistory 模式下

1. **①**改变路由

改变路由，指的是通过调用 api 实现的路由跳转，比如开发者在 React 应用中调用 **history.push** 改变路由，本质上是调用 **window.history.pushState** 方法。

**window.history.pushState**

```js
history.pushState(state, title, path);
```

- state：一个与指定网址相关的状态对象， popstate 事件触发时，该对象会传入回调函数。如果不需要可填 null。
- title：新页面的标题，但是所有浏览器目前都忽略这个值，可填 null 。
- path：新的网址，必须与当前页面处在同一个域。浏览器的地址栏将显示这个地址。

**history.replaceState**

```js
history.replaceState(state, title, path);
```

参数和 pushState 一样，这个方法会修改当前的 history 对象记录， 但是 history.length 的长度不会改变。

2. ② 监听路由 **popstate**

```js
window.addEventListener("popstate", function (e) {
  /* 监听改变 */
});
```

用 history.pushState() 或者 history.replaceState() 不会触发 popstate 事件。

popstate 事件只会在浏览器某些行为下触发, 比如点击后退、前进按钮或者调用 history.back()、history.forward()、history.go()方法。

总结： BrowserHistory 模式下的 history 库就是基于上面改变路由，监听路由的方法进行封装处理，最后形成 history 对象，并传递给 Router。

**HashHistory 模式下**

① 改变路由**window.location.hash**

通过 window.location.hash 属性获取和设置 hash 值。开发者在哈希路由模式下的应用中，切换路由，本质上是改变 window.location.hash 。

**② 监听路由**

**onhashchange**

```js
window.addEventListener("hashchange", function (e) {
  /* 监听改变 */
});
```

### **React-Router 基本构成**

1. **history，location，match**

- history 对象：history 对象保存改变路由方法 push ，replace，和监听路由方法 listen 等。
- location 对象：可以理解为当前状态下的路由信息，包括 pathname ，state 等。
- match 对象：这个用来证明当前路由的匹配信息的对象。存放当前路由 path 等信息。

2. 路由组件

## ①Router

**Router 是整个应用路由的传递者和派发更新者**。

开发者一般不会直接使用 Router ，而是使用 react-router-dom 中 BrowserRouter 或者 HashRouter ，两者关系就是 Router 作为一个传递路由和更新路由的容器，而 BrowserRouter 或 HashRouter 是不同模式下向容器 Router 中注入不同的 history 对象。所以开发者确保整个系统中有一个根部的 BrowserRouter 或者是 HashRouter 就可以了。

综上先用一幅图来描述 Router 和 BrowserRouter 或 HashRouter 的关系：

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/49d8c80ea16d4ff59b51412559942cf6_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

```js
class Router extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      location: props.history.location,
    };
    this.unlisten = props.history.listen((location) => {
      /* 当路由发生变化，派发更新 */
      this.setState({ location });
    });
  }
  /* .... */
  componentWillUnmount() {
    if (this.unlisten) this.unlisten();
  }
  render() {
    return (
      <RouterContext.Provider
        children={this.props.children || null}
        value={{
          history: this.props.history,
          location: this.state.location,
          match: Router.computeRootMatch(this.state.location.pathname),
          staticContext: this.props.staticContext,
        }}
      />
    );
  }
}
```

- 首先 React-Router 是通过 context 上下文方式传递的路由信息。在 context 章节讲过，context 改变，会使消费 context 组件更新，
  这就能合理解释了，当开发者触发路由改变，为什么能够重新渲染匹配组件。
- props.history 是通过 BrowserRouter 或 HashRouter 创建的 history 对象，并传递过来的，当路由改变，会触发 **listen** 方法，传递新生成的 location ，然后通过 **setState 来改变 context 中的 value** ，所以改变路由，本质上是 location 改变带来的更新作用。

**②Route**

Route 是整个路由核心部分，它的工作主要就是一个： **匹配路由，路由匹配，渲染组件。** 由于整个路由状态是用 context 传递的，所以 Route 可以通过 RouterContext.Consumer 来获取上一级传递来的路由进行路由匹配，如果匹配，渲染子代路由。并利用 context 逐层传递的特点，将自己的路由信息，向子代路由传递下去。这样也就能轻松实现了嵌套路由

```js
function Index(){
    const mes = { name:'alien',say:'let us learn React!' }
    return <div>
        <Meuns/>
        <Switch>
            <Route path='/router/component'   component={RouteComponent}   /> { /* Route Component形式 */ }
            <Route path='/router/render'  render={(props)=> <RouterRender { ...props }  /> }  {...mes}  /> { /* Render形式 */ }
            <Route path='/router/children'  > { /* chilren形式 */ }
                <RouterChildren  {...mes} />
            </Route>
            <Route path="/router/renderProps"  >
                { (props)=> <RouterRenderProps {...props} {...mes}  /> }  {/* renderProps形式 */}
            </Route>
        </Switch>
    </div>
}
export default Index
```

- path 属性：Route 接受 path 属性，用于匹配正确的理由，渲染组件。
- 对于渲染组件 Route 可以接受四种方式。

**四种形式：**

- Component 形式：将组件直接传递给 Route 的 component 属性，Route 可以将路由信息隐式注入到页面组件的 props 中，但是无法传递父组件中的信息，比如如上 mes 。
- render 形式：Route 组件的 render 属性，可以接受一个渲染函数，函数参数就是路由信息，可以传递给页面组件，还可以混入父组件信息。
- children 形式：直接作为 children 属性来渲染子组件，但是这样无法直接向子组件传递路由信息，但是可以混入父组件信息。
- renderProps 形式：可以将 childen 作为渲染函数执行，可以传递路由信息，也可以传递父组件信息。

#### exact

Route 可以加上 exact ，来进行精确匹配，精确匹配原则，pathname 必须和 Route 的 path 完全匹配，才能展示该路由信息。

```js
<Route path="/router/component" exact component={RouteComponent} />
```

**所以如果是嵌套路由的父路由，千万不要加 exact=true 属性。换句话只要当前路由下有嵌套子路由，就不要加 exact** 。

**从路由改变到页面跳转流程图**

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/05eddc3893034f4a99d4874ef8cebfc3_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

```js

```

**React-Redux** 和 **React-Mobx** 。

**React-Redux,Redux,React 三者关系**

- Redux： 首先 Redux 是一个应用状态管理 js 库，它本身和 React 是没有关系的，
  换句话说，Redux 可以应用于其他框架构建的前端应用，甚至也可以应用于 Vue 中。
- React-Redux：React-Redux 是连接 React 应用和 Redux 状态管理的桥梁。

React-redux 主要专注两件事，一是如何向 React 应用中注入 redux 中的 Store ，二是如何根据 Store 的改变，把消息派发给应用中需要状态的每一个组件。

![](<%5BReact%20%E8%BF%9B%E9%98%B6%E5%AE%9E%E8%B7%B5%E6%8C%87%E5%8D%97(%E4%BA%8C)%5D(httpsjuejin.cnbook6945998773818490884)/83eaf84d71b04b94b7b7e754a6778cd1_tplv-k3u1fbpfcp-zoom-in-crop-mark_3024_0_0_0.webp>)

### Redux

1. **① 三大原则**

   1. 单向数据流：整个 redux ，数据流向都是单向的，我用一张官网的图片描述整个数据流动的流程。

   2. state 只读：在 Redux 中不能通过直接改变 state ，来让状态发生变化，如果想要改变 state ，那就必须触发一次 action ，通过 action 执行每个 reducer 。

   3. 纯函数执行：每一个 reducer 都是一个纯函数，里面不要执行任何副作用，返回的值作为新的 state ，state 改变会触发 store 中的 subscribe 。

2. ② 发布订阅思想
   redux 可以作为发布订阅模式的一个具体实现。redux 都会创建一个 store ，里面保存了状态信息，改变 store 的方法 dispatch ，以及订阅 store 变化的方法 subscribe 。

3. ③ 中间件思想
   redux 应用了前端领域为数不多的中间件 compose ，那么 redux 的中间件是用来做什么的？ 答案只有一个： 那就是**强化 dispatch** ， Redux 提供了中间件机制，使用者可以根据需要来强化 dispatch 函数，传统的 dispatch 是不支持异步的，但是可以针对 Redux 做强化，于是有了 redux-thunk，redux-actions 等中间件，包括 dvajs 中，也写了一个 redux 支持 promise 的中间件。

```js

```

### 更新流程

1. 控制进入调度

```js
function ensureRootIsScheduled(root, currentTime) {
  /* 计算一下执行更新的优先级 */
  var newCallbackPriority = returnNextLanesPriority();
  /* 当前 root 上存在的更新优先级 */
  const existingCallbackPriority = root.callbackPriority;
  /* 如果两者相等，那么说明是在一次更新中，那么将退出 */
  if (existingCallbackPriority === newCallbackPriority) {
    return;
  }
  if (newCallbackPriority === SyncLanePriority) {
    /* 在正常情况下，会直接进入到调度任务中。 */
    newCallbackNode = scheduleSyncCallback(
      performSyncWorkOnRoot.bind(null, root)
    );
  } else {
    /* 这里先忽略 */
  }
  /* 给当前 root 的更新优先级，绑定到最新的优先级  */
  root.callbackPriority = newCallbackPriority;
}
```
