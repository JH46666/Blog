function myInstanceof(left, right) {
  var left = left.__proto__;
  var right = right.prototype;
  while (true) {
    if (left === null) return false;
    if (left === right) return true;
    left = left.__proto__;
  }
}

// 新版
function myInstanceof(obj, constructor) {
  // 基本数据类型直接返回false
  if (typeof obj !== "object" || obj === null) return false;
  //  获取对象的原型对象  Object.getPrototypeOf(obj); 等价于 obj.__proto__
  let proto = obj.getPrototypeOf(obj);
  while (proto) {
    if (proto === constructor.prototype) {
      return true;
    }
    proto = proto.__proto__;
  }
  return false;
}

// 代码解释：
// 1. Object.getPrototypeOf(obj)：获取对象的原型。obj.__proto__ 也是可以使用的，但推荐使用 Object.getPrototypeOf，它是更标准的方式。
// 2. 循环遍历原型链：通过 proto = Object.getPrototypeOf(proto) 继续沿着原型链查找，直到找到构造函数的 prototype 或者到达原型链的末尾（proto 为 null）。
// 匹配原型：
// 3. 如果在某个原型上找到了 constructor.prototype，说明该对象是构造函数的实例，返回 true。
// 4.未找到时返回 false：如果遍历到 null 都没有找到匹配的原型，则返回 false。

// 记忆要点：
// instanceof 的核心是原型链（Prototype Chain）。它检查对象的原型链上是否有指定构造函数的 prototype。
// 原型链是通过 __proto__ 属性进行连接的。
// 使用 myInstanceof 函数时，我们从对象的原型开始查找，沿着原型链逐级查找，直到找到目标构造函数的 prototype，如果找不到则返回 false。

// 为什么要使用 instanceof？
// instanceof 让我们能够判断一个对象是否是某个构造函数创建的实例。这对类型检查和确保数据类型非常有用，特别是在复杂的继承体系中。
