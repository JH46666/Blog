// 第二版的代码
function myNew(constructor, ...args) {
  // 1.创建一个空对象
  let obj = {};
  // 2.将空对象的原型指向构造函数的prototype
  obj.__proto__ = constructor.prototype;
  // 3.将构造函数的 this 指向这个空对象
  const result = constructor.apply(obj, args);
  // 4.如果构造函数返回的是对象，则返回这个对象
  return result instanceof Object ? result : obj;
}

// 例子3 多加一个参数
function Student(name, age) {
  this.name = name;
  this.age = age;
}
Student.prototype.doSth = function () {
  console.log(this.name);
};
var student1 = myNew(Student, "若", 18);
var student2 = myNew(Student, "川", 18);
// var student1 = new Student('若');
// var student2 = new Student('川');
console.log(student1, student1.doSth()); // {name: '若'} '若'
console.log(student2, student2.doSth()); // {name: '川'} '川'

student1.__proto__ === Student.prototype; // true
student2.__proto__ === Student.prototype; // true
// __proto__ 是浏览器实现的查看原型方案。
// 用ES5 则是：
Object.getPrototypeOf(student1) === Student.prototype; // true
Object.getPrototypeOf(student2) === Student.prototype; // true

// 代码解释：
// 1.创建一个新的对象 obj：

// 使用 {} 创建一个新的空对象。
// 将新对象的 __proto__ 指向构造函数的 prototype：

// 这一步确保了新对象能够访问到构造函数的 prototype 中的方法和属性。
// 执行构造函数并绑定 this 为新对象：

// 使用 apply 方法调用构造函数，并传入 obj 作为 this，并传递额外的参数。构造函数的内容会在 obj 上执行，初始化属性。
// 返回对象：

// 如果构造函数返回的是一个对象，则返回该对象。
// 否则，返回我们手动创建的对象 obj。
// 记忆要点：
// 新对象的创建：new 会首先创建一个空对象，这个对象的 __proto__ 会指向构造函数的 prototype。
// this 绑定：构造函数中的 this 会绑定到新创建的对象上，初始化对象的属性。
// 返回值判断：如果构造函数返回一个对象，那就返回这个对象；如果返回的是基本数据类型，则返回新创建的对象。
// 为什么要使用 apply 而不是直接调用构造函数？
// 使用 apply 来执行构造函数是为了确保 this 被正确绑定到新创建的对象上。如果直接调用构造函数，this 可能会指向全局对象（在严格模式下是 undefined）。

// 总结：
// 通过自定义实现 new，你可以清楚地理解 new 在 JavaScript 中的工作原理，并且通过模拟过程来帮助记忆：

// 创建空对象。
// 将对象的 prototype 设为构造函数的 prototype。
// 调用构造函数并绑定 this。
// 返回正确的对象。
