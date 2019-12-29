# ES6之解构赋值与箭头函数的妙用

## 解构赋值

  解构想必大家都非常了解吧， 无需多言。
  先来看个小🌰

```js
function foo(x,y,z){
  console.log(x,y,z)
}
foo(...[1,2,3])

```

foo.apply(null, [1,2,3])

还有一种情况是 ...的另外一种常见用法基本上可以看成反向的行为

```js

function foo(x,y, ...z){
  console.log(x,y,z)
}
foo(1,2,3,4,5)  //1, 2, [3,4,5]

// 知道为什么(...args)里面的经常这样写函数了
```

// 解构 我跟倾向于叫他收集：reset参数

```js
function foo(...args){
  console.log(args)
}

// foo([1,2,3,4,5,])
```

以下是要注意的点:

* reset/gather 参数不能有默认值

* 函数默认值可以是任意合法表达式，函数调用


```js
function bar(val) {
  console.log('var called')
  return y + val;
}

function foo(x = y + 3, z = bar(x)) {
  console.log(x, z)
}
var y = 5;
foo();

foo(10);

y = 6

foo(undefined, 10);


// undefined 就是缺失

```

默认值表达式是惰性求值的，是在参数的值省略或者为 undefined 的时候

函数声明中形式参数是在它们自己的作用域中，可以理解为(..)的作用域中,而不是在函数提作用域中，这意味着在默认值表达式中的标识符引用首先匹配到形式参数作用域，然后才会搜索外层作用域。

```js
var w = 1,
  z = 2;

function foo(x = w + 1, y = x + 1, z = z + 1) {
  console.log(x, y, z)
}
foo(); //ReferenceError

```

ES6 中引入了 TDZ ,它防止变量在未初始化的状态下被访问

默认值表达式
// 函数引用，而不是函数调用本身（后面没有调用形式()）

```js
// foo 结构
function foo2() {
  return [1, 2, 3];
}

var tmp = foo2(),
  a = tmp[0], 
  b = tmp[1],
  c = tmp[2]

console.log(a, b, c)
```

可以把将数组或者对象属性中带索引的值手动赋值看作结构化赋值.改成如下：

```js
var {
  a,
  b,
  c
} = foo2()
```

注意点 不应该在赋值中混入声明，不然会出现语法错误。

```js
var x = 10,
  y = 20;
[y, x] = [x, y]
console.log(x, y)
```

对象或者数组结构的赋值表达式的完成值是所有右侧对象/数组的值。

```js
var a = [2, 3, 4];
var b = [...a, c]
```

结构参数

```js
function f3([x, t, ...z], ...w) {
  console.log(x, y, z, w)
}

f3([]);
f3([1, 2, 3, 4], 5, 6)
```

解构默认值 + 参数默认值
函数参数默认值如果是一个对象，而不是解构默认值。 它只在第二参数没有传入，或者传入undefined的时候才会生效。
看下面这个例子:

```js
  function test({
    x = 1
  } = {}, {
    y
  } = {
    y: 2
  }) {
    console.log(x, y);
  }
test({}, {}); //1 undefined
test(); // 1 2
test(undefined, undefined) //1 2
test({}, undefined) //1,2
test({
  x: 2
}, {
  y: 3
}) //2 3
```

我们传入的参数({})， 所以没有使用默认值 {y:10} ,而是在传入的空对象 {} 上进行 {y} 结构

```js
// 嵌套默认

//default合并进config
var defaultt = {
  options: {
    remove: 1,
    enable: 2,
  }
}

{
  //（带默认值赋值的）的解构
  let {
    options: {
      remove: default.options.remove,
      enable: default.options.enable,
    } = {},
    log: {
      warn = defalut.log.warn,
      error = defalut.log.error
    }
  } = config;

  //重组
  config = {
    options: {
      remove,
      enable
    },
    log: {
      warn,
      error
    }
  };
}

//生成器
var o = {
  * foo() {
  }
}

//深入理解
runSomething({
  something: function something(x, y) {
    if (x > y) {
      //交换x和y的递归调用
      return something(y, x)
    }
    return y - x
  }
})
```

第一个属性 something 使得我们能够通过 o.someting(..) 来调用，像是它的公开名称。 而第二个 something 是一个词法名称， 用于其在自身内部引用这个函数，其目的是递归。

```js
// 如果我们采用简洁方法的话
runSomething({
  something(x, y) {
    if (x > y) {
      //交换x和y的递归调用
      return something(y, x)
    }
    return y - x
  }
})
```

 会提示找不到 someting 标识符
 简洁方法意味着匿名函数表达式
 你应该在不需要它们执行递归或者事件绑定 / 解绑定的时候使用

```js
var o = {
  __id: 10,
  get id() {
    return this.__id++;
  },
  set id(v) {
    return this.__id = v;
  }
}
o.id;
o.id;
o.id = 20;
o.id;

o.__id;
o.__id;
```

setter 字面量必须有且只有一个声明参数：省略或者多写都是语法错误
所需的参数可以使用解构和默认值 set id({id: v=0}){..}
但是 gather/reset... 是不允许的 set id(...v){..}

super 只允许在简洁方法中出现，而不允许在普通函数表达式属性中出现，也只允许以 super.xxx 的形式（用于属性/方法访问）出现，而不能以 super() 的心事出现

字符串字面量在它出现的词法作用域内, 没有任何形式的动态作用域

```js
function foo(string ,...value){
  console.log('string: ', string);
  console.log('...value: ', ...value);
}
var desc = 'awesome'

foo`Everything is ${desc}!`;
```

 标签（tag）部分，即`..`字符串字面量之前说的，是一个要调用的函数值。
 实际上它可以是任意结果为函数的表达式，甚至可以是一个结果为另一个函数的函数调用

 ## 箭头函数

 箭头函数表达式的语法比函数表达式更简洁，并且没有自己的 this，arguments，super或 new.target。这些函数表达式更适用于那些本来需要匿名函数的地方，并且它们不能用作构造函数。

 箭头函数总是表达式，不存在箭头函数声明
  在箭头函数内部, this绑定不是都动态的，而是语法的。
 => 是 var self = this（ 或者.bind(this) ）的词法替代形式

，我们说过箭头函数从词法范围中获取它们的值。这意味着它只是在周围的代码块中使用这个值。它不在乎叫它什么，它只在乎它在哪里被定义

```js
let obj = {
  myVar: 'foo',
  
  myFunc: function() { 
    console.log(this.myVar)  
  
    setTimeout(() => {
      console.log(this.myVar)
    }, 1000)
  }
}
obj.myFunc() // foo ... then... foo

```

你可能希望this指向obj。但是箭头函数不会将它绑定到调用它们的对象。他们只是在定义的范围内使用这个值。在这种情况下，this指向全局对象。所以箭头函数不能用于对象方法！

```js

let obj = {
  myVar: 'foo',
  
  myFunc: () => { 
    console.log(this.myVar)  
  }
}
obj.myFunc() // undefined

```
你可能希望this指向obj。但是箭头函数不会将它绑定到调用它们的对象。他们只是在定义的范围内使用这个值。在这种情况下，this指向全局对象。所以箭头函数不能用于对象方法！





 箭头函数的适用时机规则：
   *简短单句，return出某个值 -> 函数内部没有this引用，且没有自身引用（递归、事件绑定/解绑） -> 不执行函数表达式定义的其他函数

  *内层函数表达式，如果依赖于在包含它的函数中调用var self = this（ 或者.bind(this) ），那么这个内层表达式可以使用箭头函数。

   底线=>  是关于this、arguments、super的词法绑定。
