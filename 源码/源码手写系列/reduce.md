# reduce

reduce() 方法接收一个函数作为累加器，数组中的每个值（从左到右）开始缩减，最终为一个值，是 ES5 中新增的又一个数组逐项处理方法

## 用法

arr.reduce(callback[, initialValue])
参数：

- callback（一个在数组中每一项上调用的函数，接受四个函数：）
- previousValue（上一次调用回调函数时的返回值，或者初始值）
- currentValue（当前正在处理的数组元素）
- currentIndex（当前正在处理的数组元素下标）
- array（调用 reduce()方法的数组）
- initialValue（可选的初始值。作为第一次调用回调函数时传给 previousValue 的值）

![图解参数](./0081Kckwgy1gjy8548m93j30uq07oq39.webp)

## 原理

```js
Array.prototype.reduce = function (func, initState) {
  const arr = this;
  const callback = func;

  let init = initState;

  arr.forEach(function (value, index) {
    init = callback(init, value);
  });
  return init;
};
```

## 总结

至此，我们可以很形象的归纳出来 forEach、map 以及 reduce 的不同点：

forEach 方法是将数组中的每一个值取出做一些程序员想让他们做的事情
map 方法 是将数组中的每一个值放入一个方法中做一些程序员想让他们做的事情后返回一个新的数组
reduce 方法 将数组中的每一个值与前面的被返回相加的总和(初试值为数组的第一个值或者 initialValue)

compose  
主要用于执行一连串不定长度的任务（方法）
compose 方法的参数是函数数组，返回的也是一个函数。
compose 方法的参数是任意长度的，所有的参数都是函数， 执行方向是自右向左的，因此初始函数一定要放在参数的最右面

```js
const compose = function (...args) {
  let length = args.length;
  let count = length - 1;
  let result;
  return function f1(...args) {
    result = args[count].apply(this, arg1);
    if (count <= 0) {
      count = length - 1;
      return result;
    }
    count--;
    return f1.call(null, result);
  };
};
```
