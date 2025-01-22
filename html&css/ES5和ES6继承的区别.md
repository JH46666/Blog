# ES5 和 ES6 的区别

## ES5 的继承

实质是先创造子类的实例对象 this，然后再将父类的方法添加到 this 上面（Parent.apply(this)）

## ES6 的继承

先创建父类实例 this 通过 class、extends、super 关键字定义子类，并改变 this 指向,
super 本身是指向父类的构造函数但做函数调用后返回的是子类的实例，
实际上做了父类.prototype.constructor.call(this)，
做对象调用时指向父类.prototype,从而实现继承。

```JS
//ES5
function Super() {}

function Sub() {}
Sub.prototype = new Super();
Sub.prototype.constructor = Sub;

var sub = new Sub();

Sub.prototype.constructor === Sub; // ② true
sub.constructor === Sub; // ④ true
sub.__proto__ === Sub.prototype; // ⑤ true
Sub.prototype.__proto__ == Super.prototype; // ⑦ true

```

```JS
// ES6
class Super {}

class Sub extends Super {}

var sub = new Sub();

Sub.prototype.constructor === Sub; // ② true
sub.constructor === Sub; // ④ true
sub.__proto__ === Sub.prototype; // ⑤ true
Sub.__proto__ === Super; // ⑥ true
Sub.prototype.__proto__ === Super.prototype; // ⑦ true
```

```js
// 寄生组合式继承
// 通过借用构造函数来继承属性, 通过原型链来继承方法
// 不必为了指定子类型的原型而调用父类型的构造函数,我们只需要父类型的一个副本而已
// 本质上就是使用寄生式继承来继承超类型的原型, 然后再讲结果指定给子类型的原型

function c1(name) {
  this.name = name;
  this.color = ["red", "green"];
}
c1.prototype.sayName = function () {
  console.log(this.name);
};
function c2(name, age) {
  c1.call(this, name);
  this.age = age;
}
// 第一步:创建父类型原型的一个副本
// 第二步:为创建的副本添加 constructor 属性, 从而弥补因重写原型而失去的默认的 constructor 属性
// 第三步:将新创建的对象(即副本)赋值给子类型的原型
function inheritPrototype(Child, Parent) {
  // 继承原型上的属性
  Child.prototype = Object.create(Parent.prototype);

  // 修复 constructor
  Child.prototype.constructor = Child;
}

inheritPrototype(c1, c2);
// c2的方法必须放在寄生继承之后
c2.prototype.sayAge = function () {
  console.log(this.age);
};
```

区别于 ES5 的继承，ES6 的继承实现在于使用 super 关键字调用父类，反观 ES5 是通过 call 或者 apply 回调方法调用父类。

所以 ES6 和 ES5 的继承是一模一样的，只是多了 class 和 extends，ES6 的子类和父类，子类原型和父类原型，通过**proto**连接。
