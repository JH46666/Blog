# css modules 使用教程

## 模块化方案

1. css 命名规范（比如 bem）
2. css in js（比如 react-style-component）
3. 使用 js 来管理样式模块（比如 css modules）

## css modules

构建步骤中对 css 类名选择器限定作用域的一种方式
A CSS Module is a CSS file in which all class names and animation names are scoped locally by default. CSS 模块就是所有的类名都只有局部作用域的 CSS 文件。

It doesn’t really matter in the end (although shorter class names mean shorter stylesheets) because the point is that they are dynamically generated, unique, and mapped to the correct styles. 在使用 CSS 模块时，类名是动态生成的，唯一的，并准确对应到源文件中的各个类的样式。

## 为什么要 css 模块化

css 的规则都是全局的，任何一个组件的样式规则， 都对整个页面有效。

**class 命名写长一点吧，降低冲突的几率
** 加个父元素的选择器，限制范围
\*\* 重新命名个 class 吧，比较保险

## css modules 使用教程

webpack css-loader

启用 css modules

编写 index.module.css another-stylesheet.css

```css
//index.module.css
.error {
  background-color: red;
}

//another-stylesheet.css
.error {
  color: red;
}
```

```js
import styles from "./index.module.css";
import styles from "./Button.module.css"; // 使用 CSS Modules 的方式引入
import "./another-stylesheet.css"; // 普通引入

class Button extends Component {
  render() {
    // reference as a js object
    return <button className={styles.table}>123</button>;
  }
}
```

CSS Modules 按照 localIdentName 自动生成的 class 名。在浏览器看到的效果就是<div class="login_table__a7lac">123</div>

还有一种方式是直接配置 module 省略重复书写. webpack.config.js 找到 test: cssRegex

```js

use: getStyleLoaders({
  importLoaders: 1,
  modules: true,
  sourceMap: isEnvProduction && shouldUseSourceMap,
}),

```

用法跟第一种差不多

```js
import React, { Component } from "react";
import styles from "./index.css"; // 可以直接使用 CSS Modules 的方式引入了
import "./another-stylesheet.css"; // 普通引入

class Button extends Component {
  render() {
    // reference as a js object
    return <button className={styles.table}>123</button>;
  }
}
```

在浏览器看到的效果就是<div class="ZAzDthWpQaZdGQMixKXL9">123</div>

react-css-modules

```js
import React from "react";
import CSSModules from "react-css-modules";
import styles from "./table.css";

class Table extends React.Component {
  render() {
    return <div styleName="table"></div>;
  }
}

export default CSSModules(Table, styles);
```

在 react 中使用

```js
import React from 'react';
import styles from './table.css';

export default class Table extends React.Component {
  render () {
    return <div className={styles.table}>
      <div className={styles.row}>
        <div className={styles.cell}>A0</div>
        <div className={styles.cell}>B0</div>
      </div>
    </div>;
  }
}
Rendering the component will produce a markup similar to:

<div class="table__table___32osj">
  <div class="table__row___2w27N">
    <div class="table__cell___1oVw5">A0</div>
    <div class="table__cell___1oVw5">B0</div>
  </div>
</div>
```

我们引入插件 **babel-plugin-react-css-modules**
babel-plugin-react-css-modules 可以实现使用 styleName 属性自动加载 CSS 模块。我们通过该 babel 插件来进行语法树解析并最终生成 className。

```js
import React from 'react';
import styles from './table.css';

class Table extends React.Component {
    render () {
        return <div styleName='table'>
        </div>;
    }
}

export default Table；

```

1. 构建每个文件的所有样式表导入的索引（导入具有.css 或.scss 扩展名的文件）。
2. 使用 postcss 解析匹配到的 css 文件
3. 遍历所有 JSX 元素声明
4. 把 styleName 属性解析成匿名和命名的局部 css 模块引用
5. 查找与 CSS 模块引用相匹配的 CSS 类名称：

- 如果 styleName 的值是一个字符串字面值，生成一个字符串字面值。
- 如果是 JSXExpressionContainer，在运行时使用 helper 函数来构建如果 styleName 的值是一个 jSXExpressionContainer, 使用辅助函数（[getClassName] 在运行时构造 className 值。

6. 从元素上移除 styleName 属性。
7. 将生成的 className 添加到现有的 className 值中（如果不存在则创建 className 属性）。
