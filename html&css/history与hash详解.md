# history 与 hash 路由策略

## 原始阶段

早期浏览器就是根据浏览器网址的变化，跳转请求资源的。但是在单页应用盛行的今天又是怎么做到网址改变不刷新页面的呢。浏览器的 hash 和 history 都能够做到。

```js
  function(){
    return () {
        window.location.href = 'https://www.baidu.com'
    }
  }
```

浏览器有两大 api： location 和 history

- location 有 href、reload、search、pathname、hash

- history 有 pushState replaceState go back forward 等功能

## hash

网址中的 # 称为位置的标识符，代表网页中的一个位置，浏览器的 hash，将资源路径伪装成锚点，通过 onhashchange 事件来改变状态，同时又不会刷新浏览器。

当 # 值发生变化时，就会触发 onhashchange 事件

```js
// 显示当前时间
setInterval(function () {
  window.location.hash = "J";
}, 2000);
window.onhashchange = funcRef;

//以上操作将覆盖现有的事件处理程序。
//为了添加一个新的事件处理程序，而不覆盖掉已有的其他事件处理程序，可以使用函数 "addEventListener"。

// 监听onhashchange事件
window.addEventListener(
  "hashchange",
  function (e) {
    console.log("e: ", e);
    // 获取hash值判断页面状态
    var flag = location.hash && location.hash.substring(1);
    console.log("flag: ", flag);
  },
  false
);
```

```js
window.location.href = "www.baidu.com/#";

window.location.href = "www.baidu.com/#/foo";
```

## history

html5 的 history api

- history.pushState
- history.replaceState
- history.back()
- history.forward()
- history.go()

  可以在不刷新页面的前提下动态改变浏览器地址栏中的 url 地址，动态修改页面上所显示资源。

  **pushState(state, title, url);** //添加一条历史记录，不刷新页面

  state: 一个于执行网址相关的状态对象，popstate 事件触发时，该对象会传回调函数， 如果不需要这个对象，此处可以填 null

  title: 新页面的标题，所有浏览器可以忽略这个值，可以填 null

  url: 新的网址，必须与前页面处在同一个域。浏览器的地址将显示这个网址。

## replaceState 和 pushState 的区别

```js
  pushState()、 replaceState() 方法接收三个参数： stateObj、 title、 url。

  // 设置状态
  history.pushState({
      color: null
  }, null, "newHistory");

  // 监听状态
  window.onpopstate = function(event) {
      console.log(event.state);
      if (event.state && event.state.color === "newHistory") {
          document.body.style.color = "newHistory";
      }
  }

  // 改变状态
  history.back();
  history.forward();
```

replaceState(state, title, url); 替换当前的历史记录，历史栈没有变化，而 pushState 有。

### hashchange 和 popstate

这两个都能监听 url hash 的改变

```js
window.addEventListener("hashchange", function (e) {
  console.log(e);
});

window.addEventListener("popstate", function (e) {
  console.log(e);
});
```

1.popstate 事件： 历史记录发生改变时触发，调用 history.pushState() 或者 history.replaceState() 时，不会触发 popState 事件。

2.hashchange 事件：当页面的 hash 值改变的时候触发，history.pushState() 或者 history.replaceState() 也不会触发。

## hash 和 history 两者之间区别

- hash 前端路由，无刷新 #
- history 会去请求接口 /

1. hash 改变 hash 不会加载页面。
2. history 修改页面 url 时，浏览器不会向后端发送请求。

hash 模式下，# 之前的内容包含在 http 请求中，对后端来说，即使没有对路由做到全面覆盖，也不会报 404;

history 在刷新页面时，如果服务器中没有相应的响应资源，就会出现 404，如果 url 匹配不到任何静态资源，则应该返回同一个 index.html 页面。

## vue-router 提供两种模式的原因

前端路由的核心：改变视图的同时不会向后端发出请求。

1.hash： hash 虽然出现在 url 中，但不会被包含 http 请求，

2.history 能够修改同源下面的任意 url，hash 只能修改 # 后面的部分，因为只能设置当前 url 同文档的 url。

```JS
export class HashHistory extends History{
  constructor(router: Router, base: ?string, fallback: boolean){
    super(router, base){
      if(fallback && checkFallback(this.base)){
        return
      }
      ensureSlash()
    }
  }
}


```

接着 history.transitionTo 做路由过渡

```JS
transitionTo (
    location: RawLocation,
    onComplete?: Function,
    onAbort?: Function
  ) {
    let route
    // catch redirect option https://github.com/vuejs/vue-router/issues/3201
    try {
      route = this.router.match(location, this.current)
    } catch (e) {
      this.errorCbs.forEach(cb => {
        cb(e)
      })
      // Exception should still be thrown
      throw e
    }
    const prev = this.current
    this.confirmTransition(
      route,
      () => {
        this.updateRoute(route)
        onComplete && onComplete(route)
        this.ensureURL()
        this.router.afterHooks.forEach(hook => {
          hook && hook(route, prev)
        })

        // fire ready cbs once
        if (!this.ready) {
          this.ready = true
          this.readyCbs.forEach(cb => {
            cb(route)
          })
        }
      },
      err => {
        if (onAbort) {
          onAbort(err)
        }

      }
    )
  }

```

遍历路由表，将我们的路由信息加入到其中,创建路由映射表

```js
router.forEach((route) => {
  addRouteRecord(pathList, pathMap, nameMap, route);
});
```

进行深度遍历

```js
function addRouteRecord (
  pathList,
  pathMap,
  nameMap,
  route,
  parent,
  matchAs
) {
    route.children.forEach(function (child) {
      var childMatchAs = matchAs
        ? cleanPath((matchAs + "/" + (child.path)))
        : undefined;
      addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs);
    });
  }
}
```

pushState 设置的新 url，能与当前一样，这样也会记录添加到栈中，hash 设置的新值能不能与原来一样，一样的值不会触发动作将记录添加到栈中。pushstate 通过 stateObject 参数将

导航守卫

```JS
const {
  updated，
  deactivated,
  activated
} = resloveQueue(this.current.matched, route.matched){
  const queue = [].concat()
}



```

1、业务
2、性能、
3、技术栈 、vue、 java

## react router v5

两个基础组件 **BrowserRouter, Route**
它的组件形式是 react-router 提供了一些 router 的核心 api： router, route，switch 和 react-router-dom 提供了 dom 操作进行跳转的 API，browserrouter，routerlink

例如

```js
<Route path="/help" component={Help} />
```

当我们在浏览器地址栏中输入 **<http://localhost:3000/help>** 的时候，React Router 会匹配到 <Route path="/help" component={Help} /> 这一条记录，然后就会在当前位置渲染对应的 component。

还可以导入 Link 组件进行链接的跳转

```js
<li>
  <Link to="/help"> Help </Link>
</li>
```

## 配置方式

- <Route component={Index} />

如果没有指定 path 属性, 这时只要你打开项目, 无论访问什么, 都是匹配到这个 Route.

- <Route path="/" component={Index} />

跟上面一样那个, 我们访问的路径, 都包含"/"的路径. 无论访问什么, 都是匹配到这个 Route.

- <Route exact path="/" component={Index} />

我们可以设置 exact , 匹配规则就是匹配上才会走这个路由.

- <Route path="/render" render={ () => { return <h1>我是匹配到的路由</h1> } } />

render 属性。该属性是一个函数，当匹配到这个 Route 的时候，页面将会渲染出这个函数返回的内容。

匹配到的 Route 则会渲染出来, 没有匹配到的 Route, 则会替换成 null

```js
import warning from "warning";
import React from "react";
import PropTypes from "prop-types";
import { createBrowserHistory as createHistory } from "history";//这里的history就是上面第二个例子中的historyModule
import Router from "./Router"; //对应第二个例子中的Router对象

/**
 * The public API for a <Router> that uses HTML5 history. //这里是重点
 */
class BrowserRouter extends React.Component {
  history = createHistory(this.props);
  render() {
    return <Router history={this.history} children={this.props.children} />;
  }
}

export default BrowserRouter;




//定义一个接口
export interface History {
    length: number;
    action: Action;
    location: Location;
    push(path: Path, state?: LocationState): void;
    push(location: LocationDescriptorObject): void;
    replace(path: Path, state?: LocationState): void;
    replace(location: LocationDescriptorObject): void;
    go(n: number): void;
    goBack(): void;
    goForward(): void;
    block(prompt?: boolean): UnregisterCallback;
    listen(listener: LocationListener): UnregisterCallback;
    createHref(location: LocationDescriptorObject): Href;
}





/**
 * The public API for putting history on context. //这里的道理类似于例子二中第二步
 */
class Router extends React.Component {

  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  getChildContext() {
    return {
      router: {
        ...this.context.router,
        history: this.props.history,
        route: {
          location: this.props.history.location,
          match: this.state.match
        }
      }
    };
  }

  state = {
    match: this.computeMatch(this.props.history.location.pathname)
  };

  computeMatch(pathname) {
    return {
      path: "/",
      url: "/",
      params: {},
      isExact: pathname === "/"
    };
  }

  componentWillMount() {
    const { children, history } = this.props;
    // Do this here so we can setState when a <Redirect> changes the
    // location in componentWillMount. This happens e.g. when doing
    // server rendering using a <StaticRouter>.
    this.unlisten = history.listen(() => {
      this.setState({
        match: this.computeMatch(history.location.pathname)
      });
    });
  }

  componentWillReceiveProps(nextProps) {
    warning(
      this.props.history === nextProps.history,
      "You cannot change <Router history>"
    );
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    const { children } = this.props;
    return children ? React.Children.only(children) : null;
  }
}

export default Router;
```
