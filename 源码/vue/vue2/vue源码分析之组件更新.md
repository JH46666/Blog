# 组件更新

## 原理

组件的更新还是调用了 vm.\_update 方法，我们再回顾一下这个方法，它的定义在 src/core/instance/lifecycle.js 中：

sameVnode 接着就会进入
patchVnode

触发 reactiveSetter

子组件 subs 触发了我们 wacher
子组件 patch 过程

创建新节点
先拿到父节点
更新父的占位符节点

App 组件先更新， 然后执行到对 hello world 执行 prepatch， 也就会重新赋值 props 触发 set，这时候讲 helloworld 的渲染 watcher 放入队列里， nexttick 执行。

会在一个 nexttick 内更新所有子组件， 其原因是当最外层的组件开始执行 update 更新的时候， 会在 nexttick 执行 flushschedulerqueue。这个时候内部的 flushing 会设置为 true，之后执行 patch 然后执行 prepatch 更新子组件的时候，会触发子组件的重新渲染，这个时候子组件执行 queueWatcher 的时候，flushing 值为 true，那么就会同步把 queue 插入到当前执行的队列中，同步更新。

dep。notify 进行渲染 watcher， 进行 path
无论你触发多少次 setter，最终都只在 nextTick 执行一次 update，这是 Vue 做的优化，具体代码在 src/core/observer/scheduler.js 中
![queuewatch](./0081Kckwgy1gkf8hun4vhj30dw0bigm0.webp)

多种方式的判断 需找最优解

加 key 主要不是为了性能，而是为了区分 2 个 vnode 的节点，比如一个列表，你删除其中一项，如果不加 key 区分，那么删除后新旧 vnode 对比就会出现 bug，因为列表元素 DOM 结构相同，Vue 会把原本不同的两个节点认为是 sameVnode，导致 bug。

双端比较的主要优势是在于最终尽可能用一种较少的 DOM 操作完成新旧子树的更新，而不是在于循环遍历次数导致的性能浪费。即使你顺序循环一次，也就是一个 O(n) 的复杂度，没有本质区别。

总结:

- 组件更新的过程核心就是新旧 vnode diff，对新旧节点相同以及不同的情况分别做不同的处理

- 新旧节点不同的更新流程是创建新节点-》 更新父占位符节点-》删除旧节点

- 新旧节点相同的更新流程是去获取它们的 children， 根据不同情况做不同的更新逻辑
