聊聊 requestIdleCallback 接口
解题：
● 初阶：
○ 是什么：用于在浏览器空闲时间执行回调代码的接口
○ 怎么做：

```js
function work(deadline) {
  console.log(`当前帧剩余时间: ${deadline.timeRemaining()}`);
  if (deadline.timeRemaining() > 1 || deadline.didTimeout) {
    // 走到这里，说明时间有余，我们就可以在这里写自己的代码逻辑
  }
  // 走到这里，说明时间不够了，就让出控制权给主线程，下次空闲时继续调用
  requestIdleCallback(work);
}
requestIdleCallback(work, { timeout: 1000 });
```

    ■ 注册回调
    ■ 回调中关注 deadline.timeRemaining，尽可能保证回调执行时间小于这个 dl

○ 为什么：可以让我们在不妨碍页面响应的情况下，执行一些代码操作
○ 应用场景：例如 react concurrent 模式就强依赖于该 api 实现时间分片调度
● 中阶：
○ 如何计算空闲时间
■ 浏览器一帧的事件为 16ms
■ 浏览器一帧中需要做很多事情：

      ● input 事件处理
      ● js 定时器、宏/微任务等
      ● resize、scroll 等事件处理
      ● rAF 回调
      ● 布局
      ● 绘制
    ■ 假如在 16ms 内完成上述事项，还有剩余时间，则进入 idle 状态，调用 ric

    ■ 第二种情况：长时间没有操作时

      ● 理论上到下一次动作之前都属于 idle 时间，但浏览器会将 deadline 设定为 50ms，以免过长的任务影响响应速度
      ● 所以，deadline < 50ms

    ○ 适用场景：适合做一些低优的、可拆分的任务
    ■ 数据上报
    ■ 数据同步、分析等
    ■ 检测卡顿
    ■ react 的 scheduler 调度器
    ■ qiankun 源码中的预加载
    ○ 问题：
    ■ 尽量避免在 rIC 中调用 dom 接口
    ● dom 操作可能导致重排重绘，时间不可控，可能会超出 deadline 定义的时间长度，因此不应该在 rIC 操作，可使用 rAF 代替
    ■ 避免使用 promise
    ● promise 优先级很高，会在 idle 后立即执行，可能影响下一帧时间
    ■ 兼容性差，至今依然处于实验阶段
    ● 使用 setTimeout 代替

```js
window.requestIdleCallback =
  window.requestIdleCallback ||
  function (cb) {
    var start = Date.now();
    return setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };
```
