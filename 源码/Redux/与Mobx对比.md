# Mobx 和 Redux 对比

## Redux

## Mobx

Mobx 是一个透明函数响应式编程（Transparently Functional Reactive Programming，TFRP）的状态管理库，它使得状态管理简单可伸缩：

![Mobx模型流程](https://tva1.sinaimg.cn/large/007S8ZIlgy1gj6rrgl9zyj31330dfjsl.jpg)

## 区别

- Redux 带来了函数式编程、不可变性思想等理念。为了遵循这些理念，开发者必须写很多“模式代码（ boilerplate ）”，烦琐以及重复是开发者不愿容忍的。当然也有很多 hack 旨在减少样板模式，但目前可以说 Redux 天生就带着烦琐.

- 应用需要使用 object 或者 array 描述状态
- 应用需要使用 plain object 类型的 action 来描述变化
- 应用需要使用纯函数来处理变化
  以上种种限制， 使得开发者很难痛痛快快地编写业务代码， 一旦发生任何变化，就要对应地编写 action ( action creator ）、 reducer 等，这样一来，和偏响应式的解决方案如 MobX 相比，编程体验会打折扣。

### 函数式和面向对象

Redux 更多的是遵循函数式编程（Functional Programming, FP）思想，而 Mobx 则更多从面相对象角度考虑问题。

Redux 提倡编写函数式代码，如 reducer 就是一个纯函数（pure function），如下：

```js
(state, action) => {
  return Object.assign({}, state, {
    ...
  })
}
```

函数，接受输入，然后输出结果，除此之外不会有任何影响，也包括不会影响接收的参数；对于相同的输入总是输出相同的结果。
Mobx 设计更多偏向于面向对象编程（OOP）和响应式编程（Reactive Programming），通常将状态包装成可观察对象，于是我们就可以使用可观察对象的所有能力，一旦状态对象变更，就能自动获得更新。

## 单一 store 和多 store

store 是应用管理数据的地方，在 Redux 应用中，我们总是将所有共享的应用数据集中在一个大的 store 中，而 Mobx 则通常按模块将应用状态划分，在多个独立的 store 中管理。

## JavaScript 对象和可观察对象

Redux 默认以 JavaScript 原生对象形式存储数据，而 Mobx 使用可观察对象：

Redux 需要手动追踪所有状态对象的变更；
Mobx 中可以监听可观察对象，当其变更时将自动触发监听；

## 不可变（Immutable）和可变（Mutable）

Redux 状态对象通常是不可变的（Immutable）：

```js
switch (action.type) {
  case REQUEST_POST:
    return Object.assign({}, state, {
      post: action.payload.post,
    });
  default:
    return state;
}
```

复制代码我们不能直接操作状态对象，而总是在原来状态对象基础上返回一个新的状态对象，这样就能很方便的返回应用上一状态；而 Mobx 中可以直接使用新值更新状态对象

## Reconil

组件状态只能通过往上推送至公共祖先来进行共享，这可能包含一个巨大的树，随后这个树需要重新渲染。

Context 只能存储一个值，而不能存储一组不确定的值，让每个值都有自己的消费者。

以上两点使得将树的顶部（状态必须要存在的地方）与树的叶子（状态被使用的地方）进行代码分离变得非常困难。

## Mobx 的状态管理的用法

以下是 MobX 的具体用法

```js
import { observable, autorun } from "mobx";

var todoStore = observable({
  /* some observable state */
  todos: [],

  /* a derived value */
  get completedCount() {
    return this.todos.filter((todo) => todo.completed).length;
  },
});

/* a function that observes the state */
autorun(function () {
  console.log(
    "Completed %d of %d items",
    todoStore.completedCount,
    todoStore.todos.length
  );
});

/* ..and some actions that modify the state */
todoStore.todos[0] = {
  title: "Take a walk",
  completed: false,
};
// -> synchronously prints: 'Completed 0 of 1 items'

todoStore.todos[0].completed = true;
// -> synchronously prints: 'Completed 1 of 1 items'
```

## redux 和 mobx 的区别与优缺点

- 首先在 Mobx 在上手程度上，要优于 Redux ，比如 Redux 想使用异步，需要配合中间价，流程比较复杂。
- Redux 对于数据流向更规范化，Mobx 中数据更加多样化，允许数据冗余。
- Redux 整体数据流向简单，Mobx 依赖于 Proxy， Object.defineProperty 等，劫持属性 get ，set ，数据变化多样性。
- Redux 可拓展性比较强，可以通过中间件自定义增强 dispatch 。
- 在 Redux 中，基本有一个 store ，统一管理 store 下的状态，在 mobx 中可以有多个模块，可以理解每一个模块都是一个 store ，相互之间是独立的。

  1.共同点：

1. 都是为了解决状态不好管理，无法有效同步的问题而产生的工具
2. 都是用来统一管理应用状态的工具 3.某一个状态只有一个可靠的数据来源 4.操作更新的方式是统一的，并且可控的。 5.都支持 store 和 react 组件，如 react-redux，mbox-react；

## 两者对比：

1. redux 将数据保存在单一的 store 中，而 mbox 将数据保存在分散的多个 store 中。
2. redux 使用 plain object 保存数据，需要手动处理变化后的操作，mbox 使用 observable 保存数据，数据变化后自动处理响应式的操作。
3. redux 使用的是不可变状态，意味着状态只是只读的，不能直接去修改它，而应该返回一个新的状态，同时使用纯函数；Mobx 中的状态是可变的，可以直接对其进行修改。
4. mbox 相对来说比较简单，在其中有很多的抽象，mbox 使用的更多的是面向对象的思维，redux 会比较复杂，因为其中的函数式编程思想掌握起来不是那么容易，同时需要借助一系列的中间件来处理异步和副作用。
5. mobx 中有更多的抽象和封装，所以调试起来会更加复杂，同时结果也更难以预测，而 redux 提供可以进行时间回溯的开发工具，同时其纯函数以及更少的抽象，让调试变得更加容易

关键词：
mobx:面向对象思维、多个 store、observable 自动响应变化操作、mobx 状态可变，直接修改、更多的抽象和封装，调试复杂，结果难以预测。
redux:函数式编程思想、单一 store，plan object 保存数据，手动处理变化后的操作、使用不可变状态，意味着状态只读，使用纯函数修改，返回的是一个新的状态、提供时间回溯的开发工具。

[详细查看](https://juejin.cn/post/6924572729886638088)

## 场景辨析:

mobx 更适合数据不复杂的应用: mobx 难以调试,很多状态无法回溯,面对复杂度高的应用时,往往力不从心.
mobx 适合短平快的项目: mobx 上手简单,样板代码少,可以很大程度上提高开发效率.

redux 适合有回溯需求的应用: 比如一个画板应用、一个表格应用，很多时候需要撤销、重做等操作，由于 redux 不可变的特性，天然支持这些操作.
