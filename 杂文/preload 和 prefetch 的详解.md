# preload 和 prefetch 的详解

prefetch 是一个声明式 fetch, 可以强制浏览器在不阻塞 document 的 onload 事件的情况下请求资源
prefetch 告诉浏览器这个资源将来可能需要,但是什么时候加载这个资源是有浏览器来决定的.

正确使用 preload/prefetch 不会造成二次下载, 当页面使用到这个资源时候 preload 资源还没下载完，这时候不会造成二次下载，会等待第一次下载并执行脚本。

可以使用 preload 让 css 样式立即生效吗?
preload 支持基于异步加载的标记, 使用 link rl = 'preload' 的样式表可以使用 onload 事件立即应用于当前文档
对于 preload 来说，一旦页面关闭了，它就会立即停止 preload 获取资源，而对于 prefetch 资源，即使页面关闭，prefetch 发起的请求仍会进行不会中断。

```js
<link rel="preload" href="style.css" onload="this.rel=stylesheet">
```

prefetch 要注意的点

在 Chrome 中，如果用户导航离开一个页面，而对其他页面的预取请求仍在进行中，这些请求将不会被终止。

此外，无论资源的可缓存性如何，prefetch 请求在未指定的网络堆栈缓存中至少保存 5 分钟。

script 脚本资源根据它们在文件中的未知是否异步、延迟或阻塞

preload 只下载资源并不执行,待真正使用到才会执行文件

对于页面上主/首屏脚本，可以直接使用 defer 加载，而对于非首屏脚本/其它资源，可以采用 preload/prefeth 来进行加载。

## 其他加载方式对比

### async、 defer

defer:

- 使用时不阻塞 html 的解析
- defer 加载脚本执行会在所有元素解析完成，domContentLoaded 事件触发之前完成执行。

```JS
<p>...content before scripts...</p>

<script>
  document.addEventListener('DOMContentLoaded', () => alert("DOM ready after defer!"));
</script>

<script defer src="https://javascript.info/article/script-async-defer/long.js?speed=1"></script>

<p>...content after scripts...</p>
```

1.页面内容立即显示。
2.DOMContentLoaded 事件处理程序等待具有 defer 特性的脚本执行完成。它仅在脚本下载且执行结束后才会被触发。

**defer 特性仅适用于外部脚本,如果 \<script\> 脚本没有 src，则会忽略 defer 特性。**

async:

async 特性与 defer 有些类似。它也能够让脚本不阻塞页面。但是，在行为上二者有着重要的区别。

async 特性意味着脚本是完全独立的：

- 浏览器不会因 async 脚本而阻塞（与 defer 类似）。
- 其他脚本不会等待 async 脚本加载完成，同样，async 脚本也不会等待其他脚本。

- DOMContentLoaded 和异步脚本不会彼此等待：
  - DOMContentLoaded 可能会发生在异步脚本之前（如果异步脚本在页面完成后才加载完成）
  - DOMContentLoaded 也可能发生在异步脚本之后（如果异步脚本很短，或者是从 HTTP 缓存中加载的）

```JS
<p>...content before scripts...</p>

<script>
  document.addEventListener('DOMContentLoaded', () => alert("DOM ready!"));
</script>

<script async src="https://javascript.info/article/script-async-defer/long.js"></script>
<script async src="https://javascript.info/article/script-async-defer/small.js"></script>

<p>...content after scripts...</p>
```

- 页面内容立刻显示出来：加载写有 async 的脚本不会阻塞页面渲染。

- DOMContentLoaded 可能在 async 之前或之后触发，不能保证谁先谁后。

- 较小的脚本 small.js 排在第二位，但可能会比 long.js 这个长脚本先加载完成，所以 small.js 会先执行。虽然，可能是 long.js 先加载完成，如果它被缓存了的话，那么它就会先执行。换句话说，异步脚本以“加载优先”的顺序执行。

---

解释下 long.js 可能先加载完成，指的是直接从缓存（cache）取

当我们将独立的第三方脚本集成到页面时，此时采用异步加载方式是非常棒的：计数器，广告等，因为它们不依赖于我们的脚本，我们的脚本也不应该等待它们：

它的用途其实跟 preload 十分相似。你可以使用 defer 加载脚本在 head 末尾，这比将脚本放在 body 底部效果来的更好。

## HTTP/2 Server Push

HTTP/2 PUSH 功能可以让服务器在没有相应的请求情况下预先将资源推送到客户端。这个跟 preload/prefetch 预加载资源的思路类似，将下载和资源实际执行分离的方法，当脚本真正想要请求文件的时候，发现脚本就存在缓存中，就不需要去请求网络了。

preload 预加载指定资源（加载后并不执行）， 需要执行时在执行。一定会执行。 1.将加载和执行分离开，不堵塞渲染和 document 的 onload 事件 2.提前加载制定资源， 不在出现依赖的 font 字体隔了一段时间才刷出的情况

link prefetch 是预加载下一页面可能会用到的资源的意思，目的是让浏览器在空闲时间下载或预读取一些文档资源，用户在将来将会访问这些资源。加载优先等级非常低，不一定会执行。

prefetch 和 preload 不要混用

prerender 预渲染
预渲染意味着我们提前加载好用户即将访问的下一个页面
浏览器会帮我们渲染但隐藏指定的页面，一旦我们访问这个页面，则秒开。

不能预加载的场景：
1.url 中包含下载资源 2.页面中包含音频、视频
3.post、put 等 ajax 请求
4.http 认证 authentication
5.https

- 如果 async="async"：脚本相对于页面的其余部分异步地执行（当页面继续进行解析时，脚本将被执行）
- 如果不使用 async 且 defer="defer"：脚本将在页面完成解析时执行
- 如果既不使用 async 也不使用 defer：在浏览器继续解析页面之前，立即读取并执行脚本

<!-- 加载图片 -->

[async_defer](./async_defer.png)
