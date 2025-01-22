# express 面试准备 koa 中间件原理

## koa 中间件原理

1. 什么是 Koa 中间件
   Koa 中的中间件是一个函数，可以访问请求对象（ctx.request）、响应对象（ctx.response）以及调用下一个中间件函数的 next 函数。中间件的主要作用是：

- 处理请求（例如解析参数、验证身份等）。

- 修改响应（例如设置状态码、返回数据等）。

- 在请求-响应生命周期中执行特定逻辑。

```js
async function middleware(ctx, next) {
  console.log("中间件开始");
  await next(); // 调用下一个中间件
  console.log("中间件结束");
}
```

2. 核心机制

Koa 的中间件机制基于 Promise 和 async/await，通过 next() 函数串联多个中间件，形成一个执行链。与 Express 的线性执行不同，Koa 的中间件采用“洋葱模型”，即中间件是嵌套执行的，请求从外层进入内层，再从内层回到外层。

执行流程

1. 注册中间件：通过 app.use(middleware) 将中间件加入执行队列。
2. 组合中间件：Koa 内部使用 compose 函数将所有中间件组合成一个可执行的函数。
3. 洋葱模型执行：

- 当请求到来时，中间件按注册顺序依次执行。

- 每个中间件可以选择在 await next() 前后执行逻辑。

- await next() 会暂停当前中间件的执行，进入下一个中间件。

- 当所有中间件执行完毕后，控制权从最内层依次返回到外层。

```js
const Koa = require("koa");
const app = new Koa();

app.use(async (ctx, next) => {
  console.log("中间件 1 开始");
  await next();
  console.log("中间件 1 结束");
});

app.use(async (ctx, next) => {
  console.log("中间件 2 开始");
  await next();
  console.log("中间件 2 结束");
});

app.use(async (ctx) => {
  ctx.body = "Hello, Koa!";
  console.log("中间件 3 执行");
});

app.listen(3000);
```

从输出可以看出，中间件的执行顺序是“先进后出”，类似洋葱层层包裹。

3. compose 函数的原理

Koa 的中间件机制依赖于一个核心工具函数：koa-compose。它将所有中间件组合成一个单一的函数，负责管理中间件的嵌套执行。

```js
function compose(middlewares) {
  return function (ctx) {
    // 从第一个中间件开始执行
    function dispatch(index) {
      if (index >= middlewares.length) return Promise.resolve();
      const fn = middlewares[index];
      return Promise.resolve(fn(ctx, () => dispatch(index + 1)));
    }
    return dispatch(0);
  };
}
```

- dispatch 函数递归调用下一个中间件。

- 每个中间件通过 next 参数控制是否进入下一个中间件。

- 用 Promise 确保异步操作按预期顺序完成。

4. 洋葱模型的优势

   1. 灵活性： 可以在 next() 前后分别处理请求和响应的逻辑。例如，记录请求时间：

   ```js
   app.use(async (ctx, next) => {
     const start = Date.now();
     await next();
     const ms = Date.now() - start;
     console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
   });
   ```

   2. 控制流清晰：通过 await next()，开发者可以精确控制代码的执行顺序。

   3. 错误处理：可以在外层中间件捕获内层抛出的错误。

5. 与 Express 的区别

   执行模型：Express 是线性的，中间件按顺序执行到底；而 Koa 是嵌套的，请求和响应会“回溯”。

   异步支持：Koa 基于 async/await，更适合现代 JavaScript；Express 更依赖回调。

   简洁性：Koa 不内置路由等功能，更加轻量，中间件机制更纯粹。

## Express 中间件原理

1. 中间件函数通常有以下三种形式：

   - 普通中间件：(req, res, next) => {}，接收请求对象 req、响应对象 res 和 next 函数。

   - 路由中间件：绑定到特定路径，如 app.get('/path', middleware)。

   - 错误中间件：(err, req, res, next) => {}，接收错误对象 err、请求对象 req、响应对象 res 和 next 函数。

```js
function middleware(req, res, next) {
  console.log("中间件执行");
  next(); // 调用下一个中间件
}
```

2. 核心机制

Express 的中间件机制基于 回调函数 和 线性执行。中间件按照注册的顺序依次执行，通过 next() 函数将控制权传递给队列中的下一个中间件。如果不调用 next()，请求将被挂起或终止。

执行流程

1. 注册中间件：通过 app.use() 或 app.METHOD()（如 app.get()）注册中间件。

2. 请求到达：HTTP 请求触发 Express 应用，进入中间件队列。

3. 线性执行：

   - 从第一个中间件开始，按顺序执行。

   - 每个中间件通过 next() 交给下一个中间件。

   - 如果某个中间件调用 res.send() 或 res.end()，响应结束，后续中间件不再执行。

4. 错误处理：如果调用 next(err)，会跳到错误处理中间件。

```js
const express = require("express");
const app = express();

app.use((req, res, next) => {
  console.log("中间件 1");
  next();
});

app.use((req, res, next) => {
  console.log("中间件 2");
  next();
});

app.use((req, res) => {
  console.log("中间件 3");
  res.send("Hello, Express!");
});

app.listen(3000);
```

从输出可以看出，中间件的执行顺序是线性的，按注册顺序依次执行。没有”回溯“行为。

express 的内部实现原理

Express 的中间件机制依赖于一个简单的队列管理和调用栈。核心逻辑可以概括为以下几点：

简化的中间件处理逻辑

Express 内部维护一个中间件数组（stack），每次 app.use() 或 app.get() 会将中间件推入这个数组。当请求到来时，Express 调用一个调度函数（类似 handle），按顺序执行中间件。

```js
function createApp() {
  const middlewares = [];

  function app(req, res) {
    let index = 0;

    function next(err) {
      if (index >= middlewares.length) return; // 队列结束
      const middleware = middlewares[index++];
      if (err) {
        // 如果有错误，跳到错误处理中间件
        if (middleware.length === 4) {
          middleware(err, req, res, next);
        } else {
          next(err); // 继续向下传递错误
        }
      } else {
        // 普通中间件
        middleware(req, res, next);
      }
    }

    next(); // 开始执行
  }

  app.use = function (fn) {
    middlewares.push(fn);
    return app;
  };

  return app;
}

const app = createApp();
```

- app 本身是一个函数，符合 Node.js 的 http.createServer 签名。
- next 函数控制中间件的递进。
- 中间件队列通过数组存储，执行时按索引递增。

路由与中间件

Express 的路由（如 app.get('/path', fn)）本质上是中间件的一种特殊形式，内部通过 path-to-regexp 模块匹配路径，只有路径匹配时才会执行对应的中间件。

4. Express 的特点与局限

   特点

   - 线性执行：中间件按顺序执行，逻辑清晰，适合简单的请求处理流程。

   - 内置功能丰富：如路由、静态文件服务等，相比 Koa 更“开箱即用”。

   - 回调风格：依赖回调函数，异步处理需要额外注意。

   局限

   - 单向流程：不像 Koa 的洋葱模型，Express 中间件无法在响应返回时再执行逻辑。

   - 异步支持不够优雅：在处理复杂异步逻辑时，回调容易导致“回调地狱”，需要配合 async/await 和工具库（如 express-async-errors）。

5. 与 Koa 的对比

   - 执行模型：Express 是线性执行，Koa 是洋葱模型（请求进入和响应返回双向处理）。

   - 异步处理：Express 依赖回调，Koa 基于 async/await 和 Promise。

   - 内置功能：Express 包含路由和静态文件服务等，Koa 更轻量，功能需通过中间件扩展。

   - 灵活性：Koa 的洋葱模型更适合需要在响应后处理逻辑的场景（如日志记录时间）。
