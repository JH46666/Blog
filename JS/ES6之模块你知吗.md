# ES6 之模块你知吗

## 历史缘由

混乱时期 ---- 社区规范
CommonJs 分为两个派系
`*` 服务端
modules/1.x
modules/async  
 `*` browserify
AMD\UMD 代表有 requireJs 和 seaJs

ES6 时期
由于之前社区混乱无秩序，TC39 这个复仇者联盟出来发言了。其设计思想是尽量前端静态化，编译时就能确定模块的依赖关系，以及输入和输出的变量。而 CommonJs 和 AMD 模块，却只能在运行时确定这些东西。所以浏览器采用了 export 和 import 方式。而 Node 则是 CommonJS 规范的。

## ES6 时期

### import

    import 后面的 from 指定模块文件的位置，可以是相对的路径，也可以是绝对的，.js 后缀可以省略。如果只是模块名，不带路径，那么必须要有配置文件，告诉 JavaScript 引擎该模块的位置。
    在 ES6 模块中，顶层的 this 指向 undefined,即不应该在顶层代码中使用 this。

import 命令具有提升效果，会提升到整个模块的头部，首先执行。

以下是一些要注意的用法

```js
import { f as F } from "./a"; // 导入时起别名

import * as All from "./a"; // 导入模块中的所有成员， 绑定在 All 上

import myFunction from "./a"; //  不加{}, 导入默认
```

⚠️：import 加载模块的接口
import 命令接受一对大括号，里面指定要从其他模块导入的变量名。大括号里面的变量名，必须与被导入模块对外接口保持一致。import 命令是只读的，因为它的本质是输入接口,不过如果是个对象，我们则相当于修改了属性。

```js
import { a } from "./xxx.js";
a = {}; // Syntax Error : 'a' is read-only;
import { a } from "./xxx.js";
a.foo = "hello"; // 合法操作
// 因为 a 是一个对象，修改 a 的属性是允许的。
```

import 是静态执行，不能使用表达式和变量。因为这些只有运行时才能得到结果的语法解构。以下我们来看 import 的错误示例:

```js
// 报错
import { 'f' + 'oo' } from 'my_module';

// 报错
let module = 'my_module';
import { foo } from module;

// 报错
if (x === 1) {
  import { foo } from 'module1';
} else {
  import { foo } from 'module2';
}
```

为了解决从模块把所有一切导入到一个单独命名空间，而不是向作用域直接导入独立的成员。 命名空间导入。

```js
import * as foo from "./export.js";
foo.bar();
foo.x;
foo.baz();
```

注意点： 命名空间要么全有要么全无。

```js
  import { bar, baz } as foo from 'foo'
```

### 动态 import

标准用法的 import 导入的模块是静态的，会使所有被导入的模块，在加载时就被编译（无法做到按需编译，降低首页加载速度）

- 当静态导入的模块很明显的降低了代码的加载速度且被使用的可能性很低，或者并不需要马上使用它。
- 当静态导入的模块很明显的占用了大量系统内存且被使用的可能性很低。
- 当被导入的模块，在加载时并不存在，需要异步获取
- 当导入模块的说明符，需要动态构建。（静态导入只能使用静态说明符）
- 当被导入的模块有副作用（这里说的副作用，可以理解为模块中会直接运行的代码），这些副作用只有在触发了某些条件才被需要时。（原则上来说，模块不能有副作用，但是很多时候，你无法控制你所依赖的模块的内容）

```js
import("/modules/my-module.js").then((module) => {
  // Do something with the module.
});
```

### export

exports 用来导出模块 包括标识符（identify）和模块内容（contents）。

```js
//default
export default {}
export default class{}
export default class foo{}
export default function foo{}
```

```js
//variables exports
export var foo = 1;
export var foo = function () {};
export var bar;
export let foo = 2;
export const foo = 3;
```

```js
// name exports
export {foo}
export {foo, bar}
export {foo as bar}
export {foo as default}
export {foo as default, bar}
```

```js
export default {
  foo() {},
  bar() {},
};
```

    这个模式，js 引擎无法静态分析拼接对象的内容，这意味着它无法对静态 import 进行性能优化。让每个成员独一且显示的导出的优点是引擎可以对其进行静态分析和优化。

我们可以采用

```js
export default function foo(){}
export function bar(){}
export function baz(){}
或者
function foo(){}
function bar(){}
function baz(){}

export{ foo as default, bar, baz, ... } from ‘..’
```

没有用 export 标示的一切都在模块作用域内部保持私有。

```js
//默认导出，无需函数名
export default function () {
  console.log("I am default");
}
```

⚠️：export 对外输出的是接口。

```js
  export 1
  var m = 1;
  export m

```

上面两种没有提供对外的接口，都是直接输出值 1。 而不是输出接口。

它们的实质是，在接口名与模块内部变量之间，建议一一对应关系.
export 语句输出的接口， 与其对应的值是动态绑定关系，即通过该接口，可以取到模块内部实时的值。
CommonJS 模块输出的是值的缓存，不存在动态更新。

export 语句不允许出现在 if 语句中，不能有条件导出或以任何方式动态导出

无绑定导入最有可能被应用于创建 Polyfill 和 Shim

## CommonJS 规范的核心内容

1. 通过 require 关键字引用模块
2. module.exports 定义模块
   其中我们要理清楚的点： export 是 module.exports 的引用。

### require

浏览器端还不支持 require
require 是一个函数 参数是模块表示
require 函数的返回值是 module.exports 对象

```js
// CommonJS模块
let { stat, exists, readFile } = require("fs");

// 等同于
let fs = require("fs");
let stat = fs.stat;
let exists = fs.exists;
let readfile = fs.readfile;
```

    加载的是整个 fs 对象，再从这个对象上读取 3 个方法。 这种加载称为“运行时加载”，只有运行时才能得到这个对象，没有办法做到编译时“静态优化”。

益处：
`-` 编译加载，能够静态分析。 能够引入宏 (marco) 和类型检查 (type system)。
`-` 不在需要 umd 模块格式了，将来服务器和浏览器都会支持 ES6 模块格式。
`-` 不再需要对象作为命名空间（比如 Math 对象），未来这些功能可以通过模块提供。
弊处：
没法引用 ES6 模块本身，因为他不是对象。

### module.exports

先说结论：
exports 是 module.exports 的引用。
exports 是一个特殊的对象，它的任何输出都将对作为一个对外暴露的公共 api.
module.exports = {} //那么顶级的会覆盖次级的导出。
导出方式：

- module.exports 对外导出的对象只能有 1 个
- exports.xxx 对外导出的值可以有多个

两者用法区别：
exports 多用于编写对外暴露多个 api 的工具类代码。
module.exports 用于编写对外暴露同一个对象 api 的代码。

```js
// 导出多个变量
exports.c = 3;
exports.d = 4;
```

## 模块依赖环

require 还有按需加载的含义，当多次引用一个模块的时候，该模块只会被加载一次，其他情况下都在缓存中加载，不需要重新加载。模块间的循环引用，require 返回的对象必须至少包含此外部模块在调用 require。函数之前就已经准备完毕的输出。

```js
  module A
  import bar from 'B'

  export default function foo(x){
    if(x > 10) return bar(x-1)
    return x*2
  }

  module B
  import foo from 'A'

  export default function bar(y){
    if(y >5) return foo(y/2)
    return y*3
  }
```

如果先加载模块 A，第一步是扫描这个文件分析所有导出，注册所有可以导入的绑定。然后处理 import .. from 'B'。
引擎加载”B“之后，会对它的导出绑定进行同样的分析。当看到 import .. from "A"，它已经了解"A"的 api，所以可以验证 import 是否有效。现在它了解'B'的 api， 就可以验证等待的“A”模块中 import .. from 'b'的有效性。

![这是更详细的例子](http://pvt7l4h05.bkt.clouddn.com/2019-08-12-modulelLoading.png)

## 模块加载

第一步肯定是解析路径，系统解析出一个绝对路径。如果是核心模块，比如 fs，就直接返回模块。如果是带有路径的 /、./等，则进行拼接，然后先读取缓存 require.cache，在读取文件。在加载的过程中，按照依赖关系依次执行，结果保存到 cache， 下次在运行时，遇到则不执行。
我们将 path 设置为 id，
下面是相关的伪代码

```js
var cache = {},
  loadings = {},
  queue = [],
  scripts = doc.getElementsTagName("script"),
  root = scripts[scripts.length - 1].src,
  baseUrl = root.slice(0, root.lastIndexOf("/") + 1);
function Module(path, deps, factory) {
  this.id = path;
  uitls.addLoading(this.deps);
  cache[path] = this;
}

var utils = {
  addLoading() {
    for (var i = 0; i < deps.length; i++) {
      var id = deps[i],
        stat = loadings[id];
      loadings[id] = sta ? stat : 0;
    }
  },
  loadDeps() {
    for (var i = 0; i < deps.length; i++) {
      var m = deps[i];
      if (m.state < STATUS.LOADED) {
        m.load();
      }
    }
  },
  run() {
    queue.push(path);
    utils.addLoading([path]);
    utils.loadDeps();
  },
};

Module.prototype = {
  compile: function () {
    return this.factory(utils._r);
  },
};

const run = utils.run();
```

## 补充

浏览器对于带有 type="module"的<script>，都是异步加载，不会造成堵塞浏览器，即等到整个页面渲染完，再执行模块脚本，等同于打开了<script>标签的 defer 属性。

- CommonJS 模块输出的是一个值的拷贝，ES6 模块输出的是值的引用。
- CommonJS 模块是运行时加载，ES6 模块是编译时输出接口。

第二个差异是因为 CommonJs 加载的是一个对象（即 module.exports 属性），该对象只有在脚本运行完才会生成。而 ES6 模块不是对象，它的对外接口只是一种静态定义，在代码静态解析阶段就会生成。
第一个差异 CommonJs 输出的是值拷贝，也就是说，一旦输出一个值，模块内部的变化就影响不到这个值。注意：要是原始类型的值，才会被缓存。ES6 模块的运行机制与 CommonJS 不一样。JS 引擎对脚本静态分析的时候，遇到模块加载命令 import，就会生成一个只读引用。等到脚本真正执行时，再根据这个只读引用，到被加载的那个模块里面去取值。ES6 模块是动态引用，并且不会缓存值，模块里面的变量绑定其所在的模块。
export 通过接口，输出的是同一个值。不同的脚本加载这个接口，得到的都是同样的实例。

script 一个 type="module"表明这里面是 ES6 的模块，而且这个标签默认是异步加载.
测试代码

```js
let count = 0;
class nub {
  addCount() {
    count = count + 2;
  }
}

export { nub, count };

<script type="module">
  import {(count, nub)} from './xxx.js'; //count=4//不可修改，会报错
  nub.addCount() console.log(count);
</script>;
```

## 参考文献

[ES6 入门指南--阮一峰](http://es6.ruanyifeng.com/#docs/module-loader)
