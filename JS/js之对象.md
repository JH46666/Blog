# 对象

- 内置对象： 引擎初始化阶段就被创建好的对象。
- 原生对象 ： 除了内置对象，还包括一些在运行过程中动态创建的对象

## 原生对象

ecma-262 把 原生对象（native object）定义为“独立于宿主环境的 ECMAScript 实现提供的对象”
包括一下几点：

    global
    Object
    Function
    Array
    String
    Boolean
    Number
    Date
    RegExp
    Error EvalError
    RangeError
    ReferenceError
    syntaxError、
    TypeError、
    URIError、
    ActiveXObject(服务器方面)、
    Enumerator(集合遍历类)、
    RegExp（正则表达式）

## 内置对象（不需要 New）

一个内置的构造器函数是一个内置的对象，也是一个构造函数
常见的有

```js
native Objects： object(constructor), date, math, parseInt, val.
host objects: window, documents, location, history, XMLhttpRequest, settimeout, getElementTagName, querySelectorAll
```

## 对象的扩展

```javascript
if (typeof String.prototype.ltrim == "undefined") {
  String.prototype.ltrim = function () {
    var s = this;
    s = s.replace(/^\s*/g, "");
    return s;
  };
}

if (typeof String.prototype.rtrim == "undefined") {
  String.prototype.rtrim = function () {
    var s = this;
    s = s.replace(/\s*$/g, "");
    return s;
  };
}

if (typeof String.prototype.trim == "undefined") {
  String.prototype.trim = function () {
    return this.ltrim().rtrim();
  };
}

if (typeof String.prototype.htmlEncode == "undefined") {
  String.prototype.htmlEncode = function (encodeNewLine) {
    //encodeNewLine:是否encode换行符
    var s = this;
    s = s.replace(/&/g, "&amp;");
    s = s.replace(/</g, "&lt;");
    s = s.replace(/>/g, "&gt;");
    s = s.replace(/'/g, "&quot;");
    if (encodeNewLine) {
      s = s.replace(/\r\n/g, "<br />");
      s = s.replace(/\r/g, "<br />");
      s = s.replace(/\n/g, "<br />");
    }
    return s;
  };
}
```

js 原生对象的复制和扩展

```js
  var obj1 = {
      name: 'trigkit4',
      age: 22
  };
  var obj2 = {
      name: 'frank',
      age: 21,
      speak: function() {
          alert("hi, I'm + name ");
      }
  };

  var obj3 = {
      age: 20
  };

  function cloneObj(oldObj) { //复制对象方法
      if (typeof(oldObj) != 'object') return oldObj;
      if (oldObj == null) return oldObj;
      var newObj = Object();
      for (var i in oldObj)
          newObj[i] = cloneObj(oldObj[i]);
      return newObj;
  }

  function extendObj() { //扩展对象
      var args = arguments; //将传递过来的参数数组赋值给args变量
      if (args.length < 2) return;
      var temp = cloneObj(args[0]); //调用复制对象方法
      for (var n = 1; n < args.length; n++) {
          for (var i in args[n]) {
              temp[i] = args[n][i];
          }
      }
      return temp;
  }
  var obj = extendObj(obj1, obj2, obj3);
  console.log(obj); //{ name: 'frank', age: 20, speak: [Function] }
  console.log(obj1); //{ name: 'trigkit4', age: 22 }
  console.log(obj2); //{ name: 'frank', age: 21, speak: [Function] }
  console.log(obj3); //{ age: 20 }

  pop
  移除数组的最后一个元素， 返回值是被删除的元素。

  push
  在数组的末尾添加一个或者多个元素， 返回值是新的数组的长度。

  reverse
  颠倒数组中元素的顺序， 原先第一个元素现在变成最后一个， 同样原先的最后一个元素变成了现在的第一个， 也就是数组的索引发生了变化。

  shift
  删除数组的第一个元素， 返回值是删除的元素。

  sort
  对数组中的元素进行排序。

  splice
  添加或删除数组中的一个或多个元素。

  unshift
  添加一个或者多个元素在数组的开头， 返回值是新的数组的长度。

  Accessor方法
  concat
  返回一个包含此数组和其他数组和 / 或值的结合的新数组
  indexOf
  返回第一个与给定参数相等的数组元素的索引， 没有找到则返回 - 1。
  join
  将所有的数组元素连接成一个字符串。

  lastIndexOf
  返回在数组中搜索到的与给定参数相等的元素的最后（ 最大） 索引。

  slice
  返回数组中的一段。

  toSource
  Returns an array literal representing the specified array;
  you can use this value to create a new array.Overrides the Object.toSource method.

  toString
  返回代表该数组及其元素的字符, 重写Object.toString 过程.

  valueOf
  Returns the primitive value of the array.Overrides the Object.valueOf method.

  循环迭代
  filter
  对数组中的每一个元素调用参数中指定的过滤函数， 并将对于过滤函数返回值为true的那些数组元素集合为新的数组返回。

  forEach
  对数组的每一个元素依次调用参数中指定的函数。

  every
  如果数组中每一个元素都满足参数中提供的测试函数， 则返回真。

  map
  Creates a new array with the results of calling a provided
  function on every element in this array.

  some
  如果数组中至少有一个元素满足参数函数的测试， 则返回true。

  改变原数组的方法： pop() push() reverse() shift() sort() splice unshift()
  不改变原数组的方法 concat() join() slice() toString()
```

## Object.setPrototypeOf()

Object.setPrototypeOf() 方法设置一个指定的对象的原型 ( 即, 内部[[Prototype]]属性）到另一个对象或 null。

不建议这么使用 建议使用 objcet.create()来创建带有你想要的[[prototyp]] 的新对象

Object.setPrototypeOf()是 ECMAScript 6 最新草案中的方法，相对于 Object.prototype.**proto** ，它被认为是修改对象原型更合适的方法

所有的对象都具有 toLocaleString()、toString()和 valueOf()方法。因为所有的对象都继承自 Object, 而前面所说的方法都是 Object 的方法!

toString 方法返回每个值的字符串形式 拼接成了一个字符串，中间用逗号隔开
valueOf() 返回的还是数组的字符串形式

第三行 alert()要接收字符串参数，而第三行传给 alert 是一个数组，所以 alert 会在后台调用 toString 方法，输出数组的字符串类型

二者共同的缺点
无法获取 null 和 undefined 的值

用途的区别
tostring() 用于输出字符串
valueOf()用于算术计算和关系运算

返回值类型的差别
toString 一定将所有内容转为字符串
valueOf 取出对象内部的值， 不进行类型转换。

冷知识： new Object 产生的实例对象是各个类型 Array Number
//虽然用法相似，但是 Object(value)与 new Object(value)两者的语义是不同的，Object(value)表示将 value 转成一个对象，new Object(value)则表示新生成一个对象，它的值是 value。

```js
var ar2 = new Object(123);

console.log(ar1 instanceof Number);
```
