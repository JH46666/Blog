# 错误监控&错误捕获

可能会发生的错误有很多类型，每种错误都有对应的错误类型，而当错误发生的时候，就会抛出响应的错误对象。ECMA-262 中定义了下列 7 种错误类型：

在 js 执行期间

1. Error 错误的基类，其他错误都继承自该类型
2. RangError 数组越界
3. EvalError: Eval 函数执行异常
4. ReferenceError 尝试引用一个未被定义的变量时，将会抛出此异常
5. SyntaxError 语法解析不合理
6. TypeError 类型错误，用来表示值的类型非预期类型时发生的错误
7. URLError 以一种错误的方式使用全局 URL 处理函数而产生的错误

## 异常处理

JavaScript 引擎首先会读取代码，然后运行它。在读取阶段发生的错误被称为“解析时间（parse-time）”错误，并且无法恢复（从该代码内部）。这是因为引擎无法理解该代码。

所以，try..catch 只能处理同步代码中出现的错误。这类错误被称为“运行时的错误（runtime errors）”，有时被称为“异常（exceptions）”。

```js
try {
  setTimeout(function () {
    noSuchVariable; // 脚本将在这里停止运行
  }, 1000);
} catch (e) {
  alert("won't work");
}
```

当 JS 运行时错误发生时，window 会触发一个 ErrorEvent 接口的 error 事件，并执行 window.onerror()。

```js
window.onerror = function (msg, url, row, col, error) {
  console.log("🌸", msg); //能捕获到异步错误
  return true;
};
```

同步错误可以捕获到，但是，请注意 window.onerror 无法捕获静态资源异常和 JS 代码错误。

## try catch 不能捕获到 promise.resolve()的报错

try...catch 只能捕获同步代码中的异常。对于异步操作，错误是在异步任务执行时抛出的，而 try...catch 已经执行完毕，无法捕获这些错误。

```js
try {
  new Promise((resolve, reject) => {
    throw new Error("Error inside Promise");
  });
} catch (e) {
  console.error("Caught:", e);
}
```

## 静态资源加载异常

方法一： onerror 来捕获

```javascript
<script>
  function errorHandler(error) {
    console.log("捕获到静态资源加载异常", error);
  }
</script>
<script src="http://cdn.xxx.com/js/test.js" onerror="errorHandler(this)"></script>
<link rel="stylesheet" href="http://cdn.xxx.com/styles/test.css" onerror="errorHandler(this)">
```

方法二： addEventListener('error')

```js
window.addEventListener(
  "error",
  () => {
    console.log("🌸", msg); //能捕获到异步错误
  },
  true
);
```

由于网络请求异常不会事件冒泡，因此必须在捕获阶段将其捕获到才行

## Promise 异常

```js
// 捕获全局 promise 错误
window.addEventListener("unhandledrejection", function (e) {
  e.preventDefault();
  console.log(e.reason);
  // 消化错误， 则需要显示返回true
  return true;
});

new Promise((resolve, reject) => {
  reject("第一个 error");
});

Promise.reject("第二个错误");
```

## 错误的传递

1. 用户 xpath 用户操作栈
2. 服务端 xpath mp4=> gif
3. socket 图片 html2canvas
4. session statck
5. 容错 数据的时候 ajax navigator.sendBeacon('xx.php')

在 Node 中，

- unhandeleRejection 在一个事件循环中，当 Promise 被拒绝，并且没有提供任何处理程序的时候，触发该事件

- rejectionHandled 在一个事件循环后，当 Promise 被拒绝时，若拒绝处理程序被调用，触发该事件

捕获到错误后，我们需要思考当错误发生时：

1. 如果是服务器未知异常导致，可以阻塞用户操作，弹窗提示用户『服务器异常，请稍后重试』，并提供给用户一个刷新的按钮

1. 如果是数据异常导致，可阻塞用户操作，弹窗提示用户『服务器异常』，同时将错误信息上报异常服务器，开发人员通过异常堆栈和用户埋点定位问题原因

## 错误的收集方式

- 可疑区域增加 try-catch
- 全局监控 JS 异常 window.onerror
- 全局监控静态资源异常 window.addEventListener
- 捕获没有 catch 的 Promise 异常用 unhandledrejection
- Vue errorHandler 和 React componentDidCatch
- Axios 请求统一异常处理用拦截器 interceptors
- 使用日志监控服务收集用户错误信息
