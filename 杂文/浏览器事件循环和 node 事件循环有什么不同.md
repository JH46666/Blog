# 浏览器与 Node.js 事件循环的区别

浏览器和 Node.js 都基于事件驱动的异步编程模型，但它们的事件循环实现有一些重要区别。

## 浏览器事件循环

浏览器的事件循环主要由以下部分组成：

1. **宏任务队列(Macrotask Queue)**：

   - 包含：`setTimeout`、`setInterval`、UI 渲染、I/O 操作、事件回调等
   - 每次事件循环只会从宏任务队列中取出一个任务执行

2. **微任务队列(Microtask Queue)**：

   - 包含：`Promise.then/catch/finally`、`MutationObserver`、`queueMicrotask`等
   - 当前宏任务执行完后，会清空所有微任务

3. **执行顺序**：
   ```
   执行同步代码（当前宏任务）→ 清空微任务队列 → UI渲染 → 执行下一个宏任务
   ```

```javascript
console.log("1"); // 同步代码

setTimeout(() => {
  console.log("2"); // 宏任务
}, 0);

Promise.resolve().then(() => {
  console.log("3"); // 微任务
});

console.log("4"); // 同步代码

// 输出顺序: 1 4 3 2
```

## Node.js 事件循环

Node.js 的事件循环基于 libuv 库实现，比浏览器更复杂，分为多个阶段：

1. **六个阶段**：

   - **timers**：执行`setTimeout`和`setInterval`的回调
   - **pending callbacks**：执行系统操作的回调，如 TCP 错误
   - **idle, prepare**：内部使用
   - **poll**：获取新的 I/O 事件，执行 I/O 相关回调
   - **check**：执行`setImmediate`回调
   - **close callbacks**：执行关闭事件的回调，如`socket.on('close', ...)`

2. **微任务执行时机**：
   - Node.js 11 版本前：每个阶段结束后才会清空微任务队列
   - Node.js 11 版本后：与浏览器行为趋同，每个宏任务执行后就会清空微任务队列

```javascript
// Node.js 10及以前版本
setTimeout(() => {
  console.log("timeout1");
  Promise.resolve().then(() => console.log("promise1"));
}, 0);

setTimeout(() => {
  console.log("timeout2");
  Promise.resolve().then(() => console.log("promise2"));
}, 0);

// 输出: timeout1 timeout2 promise1 promise2

// Node.js 11及以后版本
// 输出: timeout1 promise1 timeout2 promise2
```

## 主要区别

1. **任务队列结构**：

   - 浏览器：简单的宏任务队列和微任务队列
   - Node.js：多阶段事件循环，每个阶段都有自己的回调队列

2. **任务优先级**：

   - 浏览器中没有`setImmediate`
   - Node.js 中`setImmediate`(check 阶段)和`setTimeout`(timers 阶段)的优先级取决于调用时的上下文

3. **I/O 处理**：

   - Node.js 有专门的 poll 阶段处理 I/O 回调
   - 浏览器将 I/O 操作视为普通宏任务

4. **微任务执行时机**：

   - 浏览器：每个宏任务执行完后立即执行所有微任务
   - Node.js：在不同版本中有不同行为，新版本已趋同于浏览器

5. **nextTick 特性**：
   - Node.js 特有的`process.nextTick()`优先级高于所有微任务

```javascript
// Node.js中的特殊情况
setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));
process.nextTick(() => console.log("nextTick"));
Promise.resolve().then(() => console.log("promise"));

// 输出顺序: nextTick promise timeout immediate
```

## 实际应用中的影响

1. 在处理复杂异步逻辑时，需要注意不同环境下的执行顺序差异
2. 在 Node.js 中，`process.nextTick()`可用于需要立即异步执行但又不阻塞同步代码的场景
3. 在浏览器中，微任务可能会阻塞 UI 渲染，需要谨慎使用

理解这些差异对于编写跨平台 JavaScript 代码和调试异步问题非常重要。
