## 前置知识

# requestIdle

```JS
//JavaScript
requestIdleCallback(myWork);
// 一个任务队列
let tasks = [
  function t1() {
    console.log("执行任务1");
  },
  function t2() {
    console.log("执行任务2");
  },
];
// deadline是requestIdleCallback返回的一个对象
function myWork(deadline) {
  console.log(`当前帧剩余时间: ${deadline.timeRemaining()}`);
  // 方法timeRemaining返回的是当前帧的剩余时间
  if (deadline.timeRemaining() > 0 && tasks.length) {
    // 可以在这里做一些事情了
    const task = tasks.shift();
    task();
  }
  // 如果还有任务没有被执行，那就放到下一帧调度中去继续执行，类似递归
  if (tasks.length) {
    requestIdleCallback(myWork);
  }
}

```

## requestAnimationFrame 的 Polyfill

```javascript
/**
 * requestAnimationFrame polyfill
 */
(function () {
  let lastTime = 0;
  const vendors = ["ms", "moz", "webkit", "o"];
  for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[`${vendors[x]}RequestAnimationFrame`];
    window.cancelAnimationFrame =
      window[`${vendors[x]}CancelAnimationFrame`] ||
      window[`${vendors[x]}CancelRequestAnimationFrame`];
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function (callback) {
      const currTime = new DatePolyfill().getTime();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      const id = window.setTimeout(() => {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };

  class DatePolyfill {
    constructor(date) {
      if (!date) {
        return new Date();
      }
      const { userAgent } = window.navigator;
      if (userAgent.includes("Safari") || userAgent.includes("wxwork")) {
        if (typeof date === "string") {
          date = date.replace(/-/g, "/");
          return new Date(date);
        }
        return new Date(date);
      }
      return new Date(date);
    }
  }

  window.DatePolyfill = DatePolyfill;
})();
```

## requestAnimationFrame 帮我们计算出当前帧的剩余时间 然后调用 myWork

1. requestAnimationFrame 回调是由系统决定何时调用，而且是在每次绘制之前调用
1. 一般情况系统绘制频率是 60HZ，那么回调就是 1000/60=16.67ms 被执行一次，这样保证每次 16.66ms 调用一次执行这个回调，就不会出现丢帧导致卡顿的问题

我们来看下 MDN 对这个 API 的介绍：

```JS
window.requestAnimationFrame(callback);
```

参数
callback
下一次重绘之前更新动画帧所调用的函数(即上面所说的回调函数)。该回调函数会被传入 DOMHighResTimeStamp 参数，该参数与 performance.now()的返回值相同，它表示 requestAnimationFrame() 开始去执行回调函数的时刻。
返回值
一个 long 整数，请求 ID ，是回调列表中唯一的标识。是个非零值，没别的意义。你可以传这个值给 window.cancelAnimationFrame() 以取消回调函数。

实现一个 requestIdelCallback 需要知道 deadline.timeRemaining()当前帧剩余时间的计算。

1. 当前帧结束时间
   requestAnimationFrame 的回调被执行的时机是当前帧开始绘制之前。也就是说 rafTime 是当前帧开始绘制的时间
   frameDeadline = rafTime + 16.67ms
2. 当前帧剩余时间
   当前帧剩余时间 = 当前帧结束时间 - 当前帧花费时间
   需要知道『当前帧花费的时间』

我们来看下 react 中是怎么实现 MessageChannel 的代码：

```javascript
let frameDeadline; // 当前帧的结束时间
let penddingCallback; // requestIdleCallback的回调方法
let channel = new MessageChannel();
```

当执行此方法时，说明 requestAnimationFrame 的回调已经执行完毕，此时就能算出当前帧的剩余时间了，直接调用 timeRemaining()即可。
因为 MessageChannel 是宏任务，需要等主线程任务执行完后才会执行。我们可以理解 requestAnimationFrame 的回调执行是在当前的主线程中，只有回调执行完毕 onmessage 这个方法才会执行。
这里可以根据 setTimeout 思考一下，setTimeout 也是需要等主线程任务执行完毕后才会执行。

```js
channel.port2.onmessage = function () {
  // 判断当前帧是否结束
  // timeRemaining()计算的是当前帧的剩余时间 如果大于0 说明当前帧还有剩余时间
  let timeRema = timeRemaining();
  if (timeRema > 0) {
    // 执行回调并把参数传给回调
    penddingCallback &&
      penddingCallback({
        // 当前帧是否完成
        didTimeout: timeRema < 0,
        // 计算剩余时间的方法
        timeRemaining,
      });
  }
};
// 计算当前帧的剩余时间
function timeRemaining() {
  // 当前帧结束时间 - 当前时间
  // 如果结果 > 0 说明当前帧还有剩余时间
  return frameDeadline - performance.now();
}
window.requestIdleCallback = function (callback) {
  requestAnimationFrame((rafTime) => {
    // 算出当前帧的结束时间 这里就先按照16.66ms一帧来计算
    frameDeadline = rafTime + 16.66;
    // 存储回调
    penddingCallback = callback;
    // 这里发送消息，MessageChannel是一个宏任务，也就是说上面onmessage方法会在当前帧执行完成后才执行
    // 这样就可以计算出当前帧的剩余时间了
    channel.port1.postMessage("haha"); // 发送内容随便写了
  });
};
```

```JS
let frameDeadline // 当前帧的结束时间
let penddingCallback // requestIdleCallback的回调方法
let channel = new MessageChannel()

// 当执行此方法时，说明requestAnimationFrame的回调已经执行完毕，此时就能算出当前帧的剩余时间了，直接调用timeRemaining()即可。
// 因为MessageChannel是宏任务，需要等主线程任务执行完后才会执行。我们可以理解requestAnimationFrame的回调执行是在当前的主线程中，只有回调执行完毕onmessage这个方法才会执行。
// 这里可以根据setTimeout思考一下，setTimeout也是需要等主线程任务执行完毕后才会执行。
channel.port2.onmessage = function() {
  // 判断当前帧是否结束
  // timeRemaining()计算的是当前帧的剩余时间 如果大于0 说明当前帧还有剩余时间
  let timeRema = timeRemaining()
	if(timeRema > 0){
    	// 执行回调并把参数传给回调
		penddingCallback && penddingCallback({
      		// 当前帧是否完成
      		didTimeout: timeRema < 0,
      		// 计算剩余时间的方法
			timeRemaining
		})
	}
}
// 计算当前帧的剩余时间
function timeRemaining() {
    // 当前帧结束时间 - 当前时间
	// 如果结果 > 0 说明当前帧还有剩余时间
	return frameDeadline - performance.now()
}
window.requestIdleCallback = function(callback) {
	requestAnimationFrame(rafTime => {
      // 算出当前帧的结束时间 这里就先按照16.66ms一帧来计算
      frameDeadline = rafTime + 16.66
      // 存储回调
      penddingCallback = callback
      // 这里发送消息，MessageChannel是一个宏任务，也就是说上面onmessage方法会在当前帧执行完成后才执行
      // 这样就可以计算出当前帧的剩余时间了
      channel.port1.postMessage('haha') // 发送内容随便写了
	})
}

```

● 但很显然这种行为与 rIC 的逻辑差异很大：rIC 是指没有任务可做的时候；setTimeout 是指尽快执行
● 高阶：我们已经有 setTimeout、rAF 等时间相关的接口，为什么还需要设计 rIC？
○ setTimeout 的逻辑是：在多久之后执行；在遵循事件循环机制下，尽快执行；这些都不能确保浏览器进入空闲状态，因此可能影响用户交互
○ rAF 发生在 frame 的头部，在此之后还需要计算样式、布局、重绘、执行其它浏览器内部逻辑等，raf 回调时间越长对帧率影响越大
○ 其它如 setImediate 等，都是差不多的逻辑，都基本会在一帧中执行，都无法确保浏览器已经进入空闲状态

## scheduleWork

找到更新对应的 fibrerRoot 节点
如果符合条件重置 stack

![](https://tva1.sinaimg.cn/large/007S8ZIlgy1gj242yk65tj31120sata4.jpg)

我们每次更新都是从 rootfiber 开始，调用也是从其开始调用

```js
  if (
   1 expirationTime !== nextRenderExpirationTime ||
   2 root !== nextRoot ||
   3 nextUnitOfWork === null
  ) {
    // Reset the stack and start working from the root.
    resetStack();
    }

```

1. 相同的 root 但是任务有不同优先级的任务要渲染
2. 新的 root 要渲染
3. 或者在老的任务上没有下一个节点需要渲染了

可以优先打断老的应用

```js
function resetStack() {
  if (nextUnitOfWork !== null) {
    let interruptedWork = nextUnitOfWork.return;
    while (interruptedWork !== null) {
      unwindInterruptedWork(interruptedWork);
      interruptedWork = interruptedWork.return;
    }
  }
  //  向上去去需找被打断的任务
  if (__DEV__) {
    ReactStrictModeWarnings.discardPendingWarnings();
    checkThatStackIsEmpty();
  }

  nextRoot = null;
  nextRenderExpirationTime = NoWork;
  nextLatestAbsoluteTimeoutMs = -1;
  nextRenderDidError = false;
  nextUnitOfWork = null;
}
```

requestWork 处于 ConcurrentMode 下的子树的渲染就是异步. 加入到 root 调度队列. 判断是否批量更新, 根据 expirationTime 判断调度类型

```js
// Check if this root is already part of the schedule.
if (root.nextScheduledRoot === null) {
  // This root is not already scheduled. Add it.
  root.expirationTime = expirationTime;
  if (lastScheduledRoot === null) {
    firstScheduledRoot = lastScheduledRoot = root;
    root.nextScheduledRoot = root;
  } else {
    lastScheduledRoot.nextScheduledRoot = root;
    lastScheduledRoot = root;
    lastScheduledRoot.nextScheduledRoot = firstScheduledRoot;
  }

  // 单向链表插入
}

if (expirationTime === Sync) {
  performSyncWork();
} else {
  scheduleCallbackWithExpirationTime(root, expirationTime); //deadline 执行不太重要的  在执行前 交由浏览器
}
```

```js
var requestAnimationFrameWithTimeout = function (callback) {
  // schedule rAF and also a setTimeout
  rAFID = localRequestAnimationFrame(function (timestamp) {
    // cancel the setTimeout
    localClearTimeout(rAFTimeoutID);
    callback(timestamp);
  });
  rAFTimeoutID = localSetTimeout(function () {
    // cancel the requestAnimationFrame
    localCancelAnimationFrame(rAFID);
    callback(getCurrentTime());
  }, ANIMATION_FRAME_TIMEOUT);
};
//我们设置了个timeout , 如果localRequestAnimationFrame 在100ms没有被调用
```

performWork

是否有 deadline 的区分

超过时间片的处理

```js
while (
  nextFlushedRoot !== null &&
  nextFlushedExpirationTime !== NoWork &&
  (minExpirationTime === NoWork ||
    minExpirationTime >= nextFlushedExpirationTime) &&
  (!deadlineDidExpire || currentRendererTime >= nextFlushedExpirationTime)
) {
  performWorkOnRoot(
    nextFlushedRoot,
    nextFlushedExpirationTime,
    currentRendererTime >= nextFlushedExpirationTime
  );
  findHighestPriorityRoot();
  recomputeCurrentRendererTime();
  currentSchedulerTime = currentRendererTime;
}
```

while 判断 expiration 调度

## renderRoot 过程

调用 workLoop 进行循环单元更新, 将整棵 fiberRoot 进行更新
捕获错误并进行处理

```js
function renderRoot(
  root: FiberRoot,
  isYields: boolean,
  isExpired: boolean,
){
  do {
    try {
      workLoop(isYields);
    }
}


function workLoop(isYields) {
  if (!isYields) {
    // Flush work without yielding
    while (nextUnitOfWork !== null) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }
  } else {
    // Flush asynchronous work until the deadline runs out of time.
    while (nextUnitOfWork !== null && !shouldYield()) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }
  }
}


```

```js
next = beginWork(current, workInProgress, nextRenderExpirationTime);
```

在 render 阶段:
在 render 阶段, react 将更新应用于通过 setState 或 render 方法触发的组件, 并确定需要在用户屏幕上做哪些更新 -- 哪些节点需要插入, 更新或删除, 哪些组件需要调用其生命周期方法. 最终的这些更新信息被保存在一个叫 effect list 的 fiber 节点树上( 关于 fiber 的内容, 在这篇文章中简述 react 中的 fiber). 当然, 在首次渲染时, React 不需要产生任何更新信息，而是会给每个从 render 方法返回的 element 生成一个 fiber 节点，最终生成一个 fiber 节点树， 后续的更新也是复用了这棵 fiber 树。

在上图中， render 阶段被标记为纯的、没有副作用的，可能会被 React 暂停、终止或者重新执行。也就是说，React 会根据产生的任务的优先级，安排任务的调度（schedule）。利用类似 requestIdleCallback 的原理在浏览器空闲阶段进行更新计算，而不会阻塞动画，事件等的执行。

在 commit 阶段: react 内部会有三个 fiber 树

current fiber tree: 在首次渲染时, react 不需要产生任何更新信息, 而是会给每个从 render 方法返回的 element 生成一个 fiber 节点,后续的更新也是复用了这颗 fiber 树.

workInProgress fiber tree: 所有的更新计算工作都在 workInProgress tree 的 fiber 上执行. 当 react 遍历 current fiber tree 时, 它为每个 current fiber 创建一个替代 (alternate) 节点, 这样的 alternate 节点构成了 workInProgress tree.

effect list fiber tree: workInProgress fiber tree 的子树.

这个树的作用串联了标记具有更新的节点.

commit 阶段会遍历 effect list，把所有更新都 commit 到 DOM 树上。具体的，首先会有一个**pre-commit**阶段，主要是执行**getSnapshotBeforeUpdate**方法，可以获取当前 DOM 的快照（snap）。然后给需要卸载的组件执行**componentWillUnmount**方法。接着会把**current fiber tree**替换为**workInProgress fiber tree**。最后执行 DOM 的插入、更新和删除，给更新的组件执行 componentDidUpdate，给插入的组件执行 componentDidMount。

重点要注意的是，这一阶段是同步执行的，不能中止。

# ReactNative 用法

其中 16.3 版本和 16.4 版本的生命周期稍有不同，首先我们一起来 16.4 版本的流程图

1.React 16.4 版本中 getDerivedStateFromProps()在父组件更新接受 props,组件自身调用 setState()函数以及 forceUpdate()函数执行时都会被触发
2.React 16.3 在更新阶段只有父组件更新才会触发。

## 初始化

## 挂载

## 卸载

```

```
