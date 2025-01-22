// 1. 手写 call
// call 方法的作用是立即调用函数，并且可以传入一个指定的 this 值以及函数的参数。
Function.prototype.myCall = function (context, ...args) {
  // 如果没有传入上下文，则默认指向 global 或 window
  context = context || globalThis;

  // 给上下文对象加上当前函数作为临时属性
  const fnSymbol = Symbol("fn");
  context[fnSymbol] = this;

  // 调用并传入参数
  const result = context[fnSymbol](...args);

  // 删除临时属性
  delete context[fnSymbol];

  return result; // 返回函数执行结果
};

// 2. 手写 apply
// apply 方法与 call 方法非常相似，区别是 apply 接收的是一个数组或类数组对象作为参数，而 call 是逐个传参。
Function.prototype.myApply = function (context, args) {
  // 如果没有传入上下文，则默认指向 global 或 window
  context = context || globalThis;

  // 给上下文对象加上当前函数作为临时属性
  const fnSymbol = Symbol("fn");
  context[fnSymbol] = this;

  // 调用并传入参数（args 是数组或类数组）
  const result = context[fnSymbol](...args);

  // 删除临时属性
  delete context[fnSymbol];

  return result; // 返回函数执行结果
};
// 3. 手写 bind
// bind 方法与 call 和 apply 的主要不同点是，它不会立即调用函数，而是返回一个新的函数。当新的函数被调用时，它会以指定的 this 和传入的参数调用原始函数。

Function.prototype.myBind = function (context, ...args) {
  const self = this; // 保存原始函数的引用

  return function (...newArgs) {
    // 返回一个新函数，执行时绑定正确的上下文
    return self.apply(context, [...args, ...newArgs]);
  };
};

// 原理解释
// call 原理：

// call 方法直接调用函数，并指定 this 为传入的上下文。
// 通过将函数临时添加到传入的 context 上并执行它来实现。
// 可以接受多个参数，第一个是指定的 this，后面是参数。
// 记忆要点：

// call 是立即执行，并且传递参数时一个一个传。

// apply 原理：

// apply 方法与 call 相似，但它的参数传递方式不同，apply 接受一个数组或类数组作为参数。
// 也通过将函数临时添加到传入的 context 上来执行。
// 记忆要点：

// apply 与 call 相似，区别在于参数是数组形式。

// bind 原理：

// bind 与 call 和 apply 的不同之处是，它不会立即调用函数，而是返回一个新的函数，新的函数会在调用时按指定的 this 和参数执行原始函数。
// 使用闭包保存原始函数和参数，返回的函数在执行时调用 apply 来确保 this 和参数正确。
// 记忆要点：

// bind 不立即调用，而是返回一个新函数，这个新函数会被调用时执行。
