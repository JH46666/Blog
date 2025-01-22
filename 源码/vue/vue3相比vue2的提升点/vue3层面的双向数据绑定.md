# vue2

1. object.defineProperty

Object.defineProperty()方法可以用来定义对象的属性。它允许精确地添加或修改对象的属性。这个方法接收三个参数：要定义属性的对象、属性的名称和一个描述符对象。描述符对象可以包含 get 和 set 方法，get 用于获取属性值，set 用于设置属性值。

```js
let data = {};
let internalValue;
Object.defineProperty(data, "value", {
  get: function () {
    return internalValue;
  },
  set: function (newValue) {
    internalValue = newValue;
  },
});
data.value = 5;
console.log(data.value);
```

Vue 会将 message 属性转换为具有 get 和 set 方法的形式。当模板中使用{{message}}来显示数据时，实际上是调用了 message 属性的 get 方法获取值。当组件中的方法修改 message（如 this.message = 'New Message'）时，set 方法被触发。

在 set 方法中，Vue 会进行依赖收集和更新通知。它会通知所有依赖于这个属性的视图部分（如模板中的插值表达式或者使用了这个属性的计算属性）进行更新。

依赖收集和观察者模式（Watcher）

依赖收集：当编译模板时，Vue.js 会解析模板中的表达式。对于每个表达式中用到的数据属性，会建立一个依赖关系。这些依赖关系会被收集起来存储在一个依赖收集器中。例如，在模板中有{{message}}，Vue 会识别出这个表达式依赖于 message 属性，然后将这个依赖记录下来。

观察者模式（Watcher） ：每个数据属性都有一个对应的 Watcher 对象。Watcher 对象会在属性被读取时将自己添加到依赖收集器中，在属性被更新时（通过 set 方法），依赖收集器会通知所有相关的 Watcher 对象。Watcher 对象收到通知后，会触发相应的更新操作，比如更新 DOM 中的文本内容或者属性。

可以简单地理解为，Watcher 就像是一个监听器，它监听数据属性的变化，并且在数据变化时执行相应的更新操作。

# vue3 层面的双向数据绑定

在 Vue 3 中，相比于 Vue 2，双向数据绑定的实现方式发生了显著变化，主要体现在以下几个方面：

1. 响应式系统的实现：

Vue 2： 使用 Object.defineProperty 对每个属性进行 getter 和 setter 的定义，实现数据劫持。

Vue 3： 采用 ES6 的 Proxy 对象来代理整个对象，实现对对象的全面代理和拦截。

2. 对象和数组的响应式处理：

Vue 2： 对于对象，无法检测属性的添加和删除；对于数组，无法检测通过索引直接设置数组项和修改数组长度的操作。

Vue 3： 使用 Proxy，可以直接代理整个对象，能够检测对象属性的添加和删除；对于数组，能够直接拦截数组元素的访问和修改操作，提供了更灵活和全面的响应式处理。

3. 性能优化：

Vue 2： 由于需要递归地为每个属性添加 getter 和 setter，性能相对较低。

Vue 3： 通过 Proxy，可以直接绑定整个对象，避免了递归操作，提高了性能。

4. 代码复杂度：

Vue 2： 需要使用 for...in 循环和闭包来处理对象的响应式，代码相对复杂。

Vue 3： 通过 Proxy，可以直接绑定整个对象，简化了代码结构
