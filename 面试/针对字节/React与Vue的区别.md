# vue 与 react 有什么不同 (react 和 vue 有什么区别)

先说相似之处：

1. 使用 virtual Dom
2. 提供了响应式（reactive）和组件化（component）的视图组件
3. 将注意力集中保持在核心库，而将其他功能如路由和全局状态管理交给相关的库

不同之处：

1. react 有比 vue 更好的生态系统
2. 在 React 应用中，当某个组件的状态发生变化时，它会以该组件为根，重新渲染整个组件子树。使用 PureComponent 和 shouldComponentUpdate 时，需要保证该组件的整个子树的渲染输出都是由该组件的 props 所决定的。

而在 vue 中，组件的依赖是在渲染过程中自动追踪的，所以系统能精确知晓哪个组件确实需要被重新渲染。

jsx vs templates

jsx 的优势
在 react 中 一切都是 js

1. 使用临时变量、js 自带的流程控制、以及直接引用当前 js 作用域的值
2. 开发工具对 jsx 的支持比 vue 更先进（linting， 类型检查， 编辑器的自动完成）

vue 的优势：
我们也可以写 babel-jsx-loader
vue 鼓励写近似常规 html 的模板， 更像经典的 web

## Vue Hooks 的优势

1. setup 仅执行一遍, 而 React Function Component 每次渲染都会执行

2. Vue 的代码更符合 JS 直觉
   当 Hooks 要更新值时，Vue 只要用等于号赋值即可，而 React Hooks 则需要调用一个函数，当对象类型复杂时，还需要借助第三方库才能保证进行了正确的 Immutable 更新

对 Hooks 使用顺序无要求，而且可以放在条件语句里

对 React Hooks 而言，调用必须放在最前面，而且不能被包含在条件语句里，这是因为 React Hooks 采用下标方式寻找状态，一旦位置不对或者 Hooks 放在了条件中，就无法正确找到对应位置的值。

而 Vue Function API 中的 Hooks 可以放在任意位置、任意命名、被条件语句任意包裹的，因为其并不会触发 setup 的更新，只在需要的时候更新自己的引用值即可，而 Template 的重渲染则完全继承 Vue 2.0 的依赖收集机制，它不管值来自哪里，只要用到的值变了，就可以重新渲染了。

不会再每次渲染重复调用，减少 GC 压力。

这确实是 React Hooks 的一个问题，所有 Hooks 都在渲染闭包中执行，每次重渲染都有一定性能压力，而且频繁的渲染会带来许多闭包，虽然可以依赖 GC 机制回收，但会给 GC 带来不小的压力。

而 Vue Hooks 只有一个引用，所以存储的内容就非常精简，也就是占用内存小，而且当值变化时，也不会重新触发 setup 的执行，所以确实不会造成 GC 压力。

必须要总包裹 useCallback 函数确保不让子元素频繁重渲染。

React Hooks 有一个问题，就是完全依赖 Immutable 属性。而在 Function Component 内部创建函数时，每次都会创建一个全新的对象，这个对象如果传给子组件，必然导致子组件无法做性能优化。 因此 React 采取了 useCallback 作为优化方案：

const fn = useCallback(() => /_ .. _/, [])
只有当第二个依赖参数变化时才返回新引用。但第二个依赖参数需要 lint 工具确保依赖总是正确的（关于为何要对依赖诚实，感兴趣可以移步 精读《Function Component 入门》 - 永远对依赖诚实）。

回到 Vue 3.0，由于 setup 仅执行一次，因此函数本身只会创建一次，不存在多实例问题，不需要 useCallback 的概念，更不需要使用 lint 插件 保证依赖书写正确，这对开发者是实实在在的友好。

不需要使用 useEffect useMemo 等进行性能优化，所有性能优化都是自动的。

这也是实在话，毕竟 Mutable + 依赖自动收集就可以做到最小粒度的精确更新，根本不会触发不必要的 Rerender，因此 useMemo 这个概念也不需要了。

而 useEffect 也需要传递第二个参数 “依赖项”，在 Vue 中根本不需要传递 “依赖项”，所以也不会存在用户不小心传错的问题，更不需要像 React 写一个 lint 插件保证依赖的正确性。（这也是笔者想对 React Hooks 吐槽的点，React 团队如何保障每个人都安装了 lint？就算装了 lint，如果 IDE 有 BUG，导致没有生效，随时可能写出依赖不正确的 “危险代码”，造成比如死循环等严重后果）

通过对比 Vue Hooks 与 React Hooks 可以发现，Vue 3.0 将 Mutable 特性完美与 Hooks 结合，规避了一些 React Hooks 的硬伤。所以我们可以说 Vue 借鉴了 React Hooks 的思想，但创造出来的确实一个更精美的艺术品。

但 React Hooks 遵循的 Immutable 也有好的一面，就是每次渲染中状态被稳定的固化下来了，不用担心状态突然变更带来的影响（其实反而要注意状态用不变更带来的影响），对于数据记录、程序运行的稳定性都有较高的可预期性。

最后，对于喜欢 Mutable 的开发者，Vue 3.0 是你的最佳选择，基于 React + Mutable 搞的一些小轮子做到顶级可能还不如 Vue 3.0。对于 React 开发者来说，坚持你们的 Immutable 信仰吧，Vue 3.0 已经将 Mutable 发挥到极致，只有将 React Immutable 特性发挥到极致才能发挥 React 的最大价值。

## dom diff 的区别

React 的 DOM DIFF
核心原理
React 的 DOM Diff 算法基于以下假设和策略：

- 逐层比较：只比较同一层级的节点，不跨层级比较。
- Key 优化：通过 key 属性标识节点，加速列表节点的匹配。
- 简单粗暴：如果节点类型不同，直接删除旧节点并创建新节点。

算法步骤

1. 同层比较

   - 新旧虚拟 DOM 从根节点开始，逐层对比。
   - 如果节点类型（标签名、组件类型）不同，停止深入比较，标记删除旧节点，插入新节点。

2. 子节点处理：
   - 如果是单一节点，递归比较其子节点。
   - 如果是列表（如 map 生成），按顺序比较子节点。
   - 有 key 时，通过 key 匹配对应节点，找出插入、删除、移动操作。
3. 更新：
   - 计算出差异后，生成 Patch（补丁），批量应用到真实 DOM。

Vue 的 DOM Diff
核心原理
Vue 的 DOM Diff（在 Vue 2 和 Vue 3 中略有不同，以下以 Vue 2 为例，Vue 3 稍后补充）基于双端比较算法，更加精细：

- 双端比较：同时从新旧子节点的两端（头尾）比较，优化列表更新。
- 复用节点：尽可能复用相同类型的节点，减少创建和销毁。
- 更智能：尝试匹配节点内容，即使位置变化也能复用。

算法步骤
Vue 2 使用 patchVnode 和 updateChildren 函数（源码在 src/core/vdom/patch.js）：

1. 节点比较：

- 如果新旧节点类型不同，替换整个节点。
- 如果相同，深入比较属性和子节点。

2. 子节点双端比较：
   定义四个指针：旧头（oldStart）、旧尾（oldEnd）、新头（newStart）、新尾（newEnd）。
   循环比较：
   旧头 vs 新头：相同则复用，指针右移。
   旧尾 vs 新尾：相同则复用，指针左移。
   旧头 vs 新尾：相同则移动到尾部。
   旧尾 vs 新头：相同则移动到头部。
   无匹配：通过 key 或顺序查找，插入或删除。

3. 更新：
   计算最小操作集（移动、插入、删除），更新真实 DOM

Vue 3 的改进

- 最长递增子序列（LIS）：
  Vue 3 使用 LIS 优化列表更新，找出无需移动的最长稳定序列，其他节点再调整。
  源码：src/runtime-core/vdom.ts 中的 patchKeyedChildren。
- 性能提升：对于复杂列表，减少不必要操作。

## vue 和 react 都是怎么监听 input 事件的

在 Vue 和 React 中，监听 `input` 事件的方式有所不同，但核心思想都是通过事件处理函数来获取输入框的值并更新状态。以下是两者的具体实现方法：

---

## Vue 中监听 `input` 事件

在 Vue 中，通常使用 `v-model` 指令来双向绑定输入框的值，也可以直接使用 `@input` 监听 `input` 事件。

### 1. **使用 `v-model`**

`v-model` 是 Vue 提供的语法糖，它会自动监听 `input` 事件并更新数据。

```vue
<template>
  <div>
    <input v-model="message" placeholder="Enter something" />
    <p>You typed: {{ message }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: "", // 绑定输入框的值
    };
  },
};
</script>
```

- **说明**：
  - `v-model` 会自动监听 `input` 事件，并将输入框的值绑定到 `message`。
  - 当用户输入时，`message` 会自动更新。

---

### 2. **使用 `@input` 监听事件**

如果你需要手动处理 `input` 事件，可以使用 `@input`。

```vue
<template>
  <div>
    <input
      :value="message"
      @input="handleInput"
      placeholder="Enter something"
    />
    <p>You typed: {{ message }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: "",
    };
  },
  methods: {
    handleInput(event) {
      this.message = event.target.value; // 更新 message
    },
  },
};
</script>
```

- **说明**：
  - `@input` 监听输入框的 `input` 事件。
  - `event.target.value` 获取输入框的值，并手动更新 `message`。

---

## React 中监听 `input` 事件

在 React 中，通常使用受控组件（Controlled Component）来监听 `input` 事件，并通过 `onChange` 事件更新状态。

### 1. **使用受控组件**

受控组件将输入框的值绑定到组件的状态，并通过 `onChange` 事件更新状态。

```jsx
import React, { useState } from "react";

function App() {
  const [message, setMessage] = useState(""); // 定义状态

  const handleInput = (event) => {
    setMessage(event.target.value); // 更新状态
  };

  return (
    <div>
      <input
        value={message}
        onChange={handleInput}
        placeholder="Enter something"
      />
      <p>You typed: {message}</p>
    </div>
  );
}

export default App;
```

- **说明**：
  - `value={message}` 将输入框的值绑定到 `message` 状态。
  - `onChange={handleInput}` 监听 `input` 事件，并通过 `event.target.value` 更新状态。

---

### 2. **使用非受控组件**

如果你不想使用受控组件，可以使用 `ref` 直接获取输入框的值。

```jsx
import React, { useRef } from "react";

function App() {
  const inputRef = useRef(null); // 创建 ref

  const handleButtonClick = () => {
    alert(inputRef.current.value); // 获取输入框的值
  };

  return (
    <div>
      <input ref={inputRef} placeholder="Enter something" />
      <button onClick={handleButtonClick}>Submit</button>
    </div>
  );
}

export default App;
```

- **说明**：
  - 使用 `useRef` 创建 `ref`，并将其绑定到输入框。
  - 通过 `inputRef.current.value` 获取输入框的值。

---

### 3. **监听 `input` 事件**

如果你需要直接监听 `input` 事件，可以使用 `onInput`。

```jsx
import React, { useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  const handleInput = (event) => {
    setMessage(event.target.value);
  };

  return (
    <div>
      <input onInput={handleInput} placeholder="Enter something" />
      <p>You typed: {message}</p>
    </div>
  );
}

export default App;
```

- **说明**：
  - `onInput` 是 React 提供的原生事件，与 `onChange` 类似，但触发时机略有不同。
  - `onChange` 在输入框失去焦点时也会触发，而 `onInput` 只在输入时触发。

---

## Vue 和 React 的区别

| 特性           | Vue                         | React                        |
| -------------- | --------------------------- | ---------------------------- |
| **双向绑定**   | 使用 `v-model` 实现双向绑定 | 需要手动实现受控组件         |
| **事件监听**   | 使用 `@input` 或 `v-model`  | 使用 `onChange` 或 `onInput` |
| **状态管理**   | 使用 `data` 定义状态        | 使用 `useState` 定义状态     |
| **非受控组件** | 较少使用，通常用 `v-model`  | 使用 `ref` 实现非受控组件    |

---

## 总结

- **Vue**：
  - 推荐使用 `v-model` 实现双向绑定。
  - 如果需要手动处理事件，可以使用 `@input`。
- **React**：
  - 推荐使用受控组件，通过 `onChange` 更新状态。
  - 如果需要直接监听 `input` 事件，可以使用 `onInput`。

两者都可以灵活地监听 `input` 事件，Vue 的语法更简洁，而 React 更强调显式地管理状态。
