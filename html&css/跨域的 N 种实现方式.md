### 同源策略引起的跨域问题

同源策略是浏览器的行为，是为了保护本地数据不被 JavaScript 代码获取回来的数据污染，因此拦截的是客户端发出的请求回来的数据接收，即请求发送了，服务器响应了，但是无法被浏览器接收。需要注意的是，很多人以为同源策略是浏览器不让请求发出去、或者后端拒绝返回数据。实际情况是，请求正常发出，后端接口正常响应，只不过数据到了浏览器后被丢弃了。

![响应策略](2022-05-06-00-12-45.png)

### 同源跨域通信

1. JSONP
2. CORS
3. postMessage
4. WebSocket
5. nginx 反向代理

### CORS 是为了解决 AJAX 跨域的问题

整个 CORS 通信过程，都是浏览器自动完成，不需要用户参与。对于开发者来说，CORS 通信与同源的 AJAX 通信没有差别，代码完全一样。浏览器一旦发现 AJAX 请求跨源，就会自动添加一些附加的头信息，有时还会多出一次附加的请求，但用户不会有感觉。
CORS 背后的基本思想就是使用自定义的 HTTP 头部让浏览器与服务器进行沟通，从而决定请求或响应是应该成功，还是应该失败。

服务器端对于 CORS 的支持，主要就是通过设置 Access-Control-Allow-Origin 来进行的。如果浏览器检测到相应的设置，就可以允许 Ajax 进行跨域的访问。

比如一个简单的使用 GET 或者 POST 发送的请求，它没有自定义头部，而主体内容是 text/plain。在发送该请求时，需要给它附加一个额外的 Origin 头部，其中包含请求页面的源信息（协议、域名和端口），以便服务器根据这个头部信息来决定是否给予响应。下面是 Origin 头部的一个示例。

Origin: <http://www.nczonline.net>
如果服务器认为这个请求可以接受，就在 Access-Control-Allow-Origin 头部中回发相同的源信息（如果是公共资源，可以回发'\*'）。例如：

Access-Control-Allow-Origin: <http://www.nczonline.net>
如果没有这个头部，或者有这个头部但源信息不匹配，浏览器就会驳回请求。正常情况下，浏览器会处理请求。注意，请求进而响应都不包含 cookie 信息。

JSONP 是通过动态<script>元素来使用的，使用时可以为 src 属性指定一个跨域 URL。
这里的<scriot>元素与<img>元素类似，都有能力不受限制的从其他域加载资源。因为 JSONP 是有效的 JS 代码，所以在请求完成后，即在 JSONP 响应加载到页面中以后，就会立即执行。来看一个例子。

CORS 和 JSONP 对比

JSONP 只能实现 GET 请求，而 CORS 支持所有类型的 HTTP 请求。
使用 CORS，开发者可以使用普通的 XMLHttpRequest 发起请求和获得数据，比起 JSONP 有更好的错误处理。
JSONP 主要被老的浏览器支持，它们往往不支持 CORS，而绝大多数现代浏览器都已经支持了 CORS

# 跨域的 N 种实现方式

解决跨域的几种方案

跨域， 什么是跨域？跨域有什么好处？跨域有什么不好？怎么实现跨域？

## 什么是跨域

只要协议、域名、端口有任何一个不同，都被当作是不同的域，之间的请求就是跨域操作.
对于端口和协议的不同，只能通过后台来解决。

## 跨域有什么好处

防止 CSRF 攻击、同源策略：隔离潜在恶意文件的重要安全机制

或者使用 CSP 建立白名单，开发者明确告诉浏览器哪些外部资源可以加载和执行。
两种方式开启 CSP。

1. 设置 HTTP Header 中的  Content-Security-Policy

2. 设置  meta  标签的方式  meta http-equiv="Content-Security-Policy"

Content-Security-Policy: default-src 'self'

Content-Security-Policy: img-src https://\*

Content-Security-Policy: child-src 'none'

## 同源策略限制以下几种行为

同源策略限制内容有：

- Cookie、LocalStorage、IndexedDB 等存储性内容
- DOM 节点
- AJAX 跨域请求的数据

## 怎么实现跨域访问

1. JSONP

JSONP 跨域 GET 请求是一个常用的解决方案，下面我们来看一下 JSONP 跨域是如何实现的，并且探讨下 JSONP 跨域的原理

利用在页面中创建

节点的方法向不同域提交 HTTP 请求的方法称为 JSONP，这项技术可以解决跨域提交 Ajax 请求的问题。JSONP 的工作原理如下所述

假设在 <http://example1.com/index.php>

这个页面中向 <http://example2.com/getinfo.php> 提交 GET 请求，我们可以将下面的 JavaScript 代码

放在 <http://example1.com/index.php> 这个页面中来实现：

代码如下:

```js
//server.js
const url = require('url');

require('http').createServer((req, res) => {
    // console.log('req: ', req);
    const data = {
        x: 10
    };
    console.log('url.parse(req.url, true).query: ', url.parse(req.url, true).query);
    const callback = url.parse(req.url, true).query.callback;
    res.writeHead(200);
    res.end(`${callback}(${JSON.stringify(data)})`); // jsonpCallback(data)
}).listen(3000, '127.0.0.1');

console.log('启动服务，监听 127.0.0.1:3000');

//html

function jsonpCallback(data) {
    alert('获得 X 数据:' + data.x);
}
script src = "http://127.0.0.1:3000?callback=jsonpCallback" > < /script>
```

当 GET 请求从 <http://xx1.html> 返回时，可以返回一段 JavaScript 代码，这段代码会自动执行，可以用来负责调用 <http://xxx2.html> 页面中的一个 callback 函数

JSONP 的优点是：它不像 XMLHttpRequest 对象实现的 Ajax 请求那样受到同源策略的限制；它的兼容性更好，在更加古老的浏览器中都可以运行，不需要 XMLHttpRequest 或 ActiveX 的支持；并且在请求完毕后可以通过调用 callback 的方式回传结果。

JSONP 的缺点则是：它只支持 GET 请求而不支持 POST 等其它类型的 HTTP 请求；它只支持跨域 HTTP 请求这种情况，不能解决不同域的两个页面之间如何进行 JavaScript 调用的问题。

再来一个例子：

```js
//server.js
const url = require("url");

require("http")
  .createServer((req, res) => {
    const data = {
      x: "10",
    };
    console.log(
      "url.parse(req.url, true).query: ",
      url.parse(req.url, true).query
    );
    if (url.parse(req.url, true).query.word === "sjh") {
      const callback = url.parse(req.url, true).query.callback;
      res.writeHead(200);
      res.end(`${callback}(${JSON.stringify(data)})`);
    }
  })
  .listen(3000, "127.0.0.1");

console.log("启动服务，监听 127.0.0.1:3000");

//html
var qsData = {
  word: "shj",
};
$.ajax({
  async: false,
  url: "http://127.0.0.1:3000", //跨域的dns
  type: "GET",
  dataType: "jsonp",
  jsonp: "callback",
  data: qsData,
  timeout: 5000,
  success: function (json) {
    console.log("json: ", json);
    alert(json.x);
    let obj = JSON.parse(json);
    console.log("obj: ", obj);
  },
  error: function (xhr) {
    console.log("xhr: ", xhr);
    //请求出错处理
    alert("请求出错)", xhr);
  },
});
```

这种方式其实是上例$.ajax({..}) api的一种高级封装，有些$.ajax api 底层的参数就被封装而不可见了。

jquery $.ajax方法名有误导人之嫌。 如果设为dataType: 'jsonp'，这个$.ajax 方法就和 ajax

XmlHttpRequest 没什么关系了，这种跨域方式其实与 ajax XmlHttpRequest 协议无关了。 取而代之的则是 JSONP 协议。JSONP 是一个非官方的协议，它允许在服务器端集成 Script tags 返回至客户端，通过 javascript callback 的形式实现跨域访问。

Jsonp 的执行过程如下：
首先在客户端注册一个 callback (如:'jsoncallback'), 然后把 callback 的名字(如:jsonp1236827957501)传给服务器。注意：服务端得到 callback 的数值后，要用 jsonp1236827957501(......)把将要输出的 json 内容包括起来，此时，服务器生成 json 数据才能被客户端正确接收。

然后以 javascript 语法的方式，生成一个 function， function 名字就是传递上来的参数 'jsoncallback'的值 jsonp1236827957501 .
最后将 json 数据直接以入参的方式，放置到 function 中，这样就生成了一段 js 语法的文档，返回给客户端。

客户端浏览器，解析 script 标签，并执行返回的 javascript 文档，此时 javascript 文档数据，作为参数， 传入到了客户端预先定义好的 callback 函数(如上例中 jquery $.ajax()方法封装的的 success: function (json))里。

可以说 jsonp 的方式原理上和<script src="http://跨/...xx.js"></>是一致的(qq 空间就是大量采用这种方式来实现跨域数据交换的)。JSONP 是一种脚本注入(Script Injection)行为，所以有一定的安全隐患。

那 jquery 为什么不支持 post 方式跨域呢？

2. 跨域资源共享 CORS
   什么是 CORS

   CORS(cross-Origin Resource Sharing) 跨域资源共享，管理跨源请求。而跨域资源共享是有益的。今天的我们创建的大多数网站加载资源从网络的各个不同的地方，
   当我们发送 GET 请求时，大多数情况浏览器头会 Access-Control-Allow-Origin: \* 。意思是能够共享资源在任何域名下。否则就是只能在特定的情况下了。
   当请求时以下时，将在原始请求前先进行标准预请求，使用 OPTIONS 头，

```js
    http: //www.example.com/foo-bar.html
```

浏览器访问外部资源时会出现下面这种情况

![same-origin](https://user-gold-cdn.xitu.io/2019/8/24/16cc43b8950eff00?w=1136&h=686&f=png&s=11964)

而我们想要的效果是这种情况.

![cors-origin](https://user-gold-cdn.xitu.io/2019/8/24/16cc43b8945a6eb6?w=1128&h=654&f=png&s=11837)

我们可以在 HTTP 请求头加上 CORS 标准。

- Access-Control-Allow-Origin
- Access-Control-Allow-Credentials
- Access-Control-Allow-Headers
- Access-Control-Allow-Methods
- Access-Control-Expose-Headers
- Access-Control-Max-Age
- Access-Control-Request-Headers
- Access-Control-Request-Method
- Origin

  当我们发送 GET 请求时，大多数情况浏览器头会 Access-Control-Allow-Origin: \* 。意思是能够共享资源在任何域名下。否则就是只能在特定的情况下了。

  app.use(cors());
  当请求时以下时，将在原始请求前先进行标准预请求，使用 OPTIONS 头，

- PUT
- DELETE
- CONNECT
- OPTIONS
- TRACE
- PATCH
  当我们发的预处理请求并指示原始请求是否安全，如果指定原始请求时安全的，则它将允许原始请求。否则拒接。

options：与 head 类似，是客户端用于查看服务器的性能 。JavaScript 的 XMLHttpRequest 对象进行 CORS 跨域资源共享时，就是使用 OPTIONS 方法发送嗅探请求，以判断是否有对指定资源的访问权限

![OPTIONS](https://user-gold-cdn.xitu.io/2019/8/24/16cc43b86c12667c?w=1640&h=1272&f=png&s=30057)

```js
//npm install cors

response.setHeader("Content-Type", "text/html");

var express = require("express");
var cors = require("cors");

//或者直接设置
res.writeHead(200, {
  "Access-Control-Allow-Origin": "http://localhost:8080",
});
var app = express();

app.use(cors());

app.get("/hello/:id", function (req, res, next) {
  res.json({
    msg: "CORS-enabled!",
  });
});

app.listen(80, function () {
  console.log("CORS-enabled web ");
});
```

4. Server Proxy:
   服务器代理，当你需要有跨域请求额操作时发送给后端，让后端帮你带为请求，然后将最后的获取的结果发送给你。

```js
//html
$.get("http://127.0.0.1:3000/topics", function (data) {
  consoel.log(data);
});

//server.js
const url = require("url");

const http = require("http");

const server = http
  .createServer((req, res) => {
    const path = url.parse(req.url).path.slice(1);
    console.log("path: ", path);

    if (path === "topics") {
      http.get("http://cnodejs.org/api/v1/topics", (resp) => {
        const { statusCode } = resp;
        const contentType = resp.headers["content-type"];
        console.log("resp: ", statusCode, contentType);
        let error;
        if (statusCode !== 200) {
          error = new Error("Request Failed.\n" + `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
          error = new Error(
            "Invalid content-type.\n" +
              `Expected application/json but received ${contentType}`
          );
        }
        if (error) {
          console.error(error.message);
          // Consume response data to free up memory
          resp.resume();
          return;
        }

        res.setEncoding("utf8");
        let data = "";
        resp.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const parsedData = JSON.parse(rawData);
            console.log(parsedData);
          } catch (e) {
            console.error(e.message);
          }
        });
      });
    }
  })
  .listen(3000, "127.0.0.1");

console.log("启动服务，监听 127.0.0.1:3000");
```

5. document.domain + iframe

基于 iframe 实现的跨域要求两个域具有 aa.xx.com, bb.xx.com 这种特点，也就是两个页面必须属于一个基础域（例如都是 xxx.com，或是 xxx.com.cn），使用同一协议（例如都是 http）和同一端口（例如都是 80），这样在两个页面中同时添加 document.domain，就可以实现父页面调用子页面的函数，当然这种方法只能解决主域相同而二级域名不同的情况。
代码如下：

```js
//页面一在head内添加js如下：
document.domain = “xx.com”;

function aa() {
    alert(“p”);
}
//body添加iframe和js如下
<
iframe src = ”http: //localhost:8080/2.html“ id=”i”>
    document.getElementById(‘i’).onload = function() {
        var d = document.getElementById('i').contentWindow;
        d.a();
    };
//页面二 head添加如下
document.domain = “xx.com”;

function a() {
    alert("c");
}
//这时候父页面就可以调用子页面的a函数，实现js跨域访问
```

6.1、通过 location.hash 跨域

以下三种都是通过 iframe 方式来，我们根据 iframe 能够在浏览器下能够跨域的特点，进行通信。

在 url 中，<http://www.a.com#la> 的 "#la" 就是 location.hash，改变 hash 值不会导致页面刷新，所以可以利用 hash 值来进行数据的传递，当然数据量是有限的。

```js
//locationNameA
<
script >

    function startRequest() {
        var ifr = document.createElement('iframe');
        ifr.style.display = 'none';
        ifr.src = 'http://127.0.0.1:5501/locationNameB.html#name';
        document.body.appendChild(ifr);
    }

function checkHash() {
    try {
        var data = location.hash ? location.hash.substring(1) : '';
        if (console.log) {
            console.log('Now the data is ' + data);
        }
    } catch (e) {};
}

setInterval(checkHash, 2000);

</script>
//locationNameB
<script >

    function callBack() {
        try {
            parent.location.hash = 'somedata';
        } catch (e) {
            // ie、chrome的安全机制无法修改parent.location.hash，
            // 所以要利用一个中间的cnblogs域下的代理iframe
            var ifrproxy = document.createElement('iframe');
            ifrproxy.style.display = 'none';
            ifrproxy.src = 'http://127.0.0.1:5502/locationNameC.html#sjh';
            document.body.appendChild(ifrproxy);
        }
    }

    //locationNameC
    <
    script >
    parent.parent.location.hash = self.location.hash.substring(1);
console.log('parent.parent.location.hash: ', parent); <
/script>
```

6.2 通过 window.name 跨域
window 对象有个 name 属性，该属性有个特征：即在一个窗口(window)的生命周期内, 窗口载入的所有的页面都是共享一个 window.name 的，每个页面对 window.name 都有读写的权限，window.name 是持久存在一个窗口载入过的所有页面中的。window.name 属性的 name 值在不同的页面（甚至不同域名）加载后依旧存在（如果没修改则值不会变化），并且可以支持非常长的 name 值（2MB）。

```js
 window.name = data; //父窗口先打开一个子窗口，载入一个不同源的网页，该网页将信息写入。
 window.location = 'http://a.com/index.html'; //接着，子窗口跳回一个与主窗口同域的网址。
 var data = document.getElementById('myFrame').contentWindow.name。 //然后，主窗口就可以读取子窗口的window.name了。
```

如果是与 iframe 通信的场景就需要把 iframe 的 src 设置成当前域的一个页面地址。

```js
//http://127.0.0.1:5502/window.nameA.html
let data = '';
const ifr = document.createElement('iframe');
ifr.src = "http://127.0.0.1:5501/window.nameB.html";
ifr.style.display = 'none';
document.body.appendChild(ifr);
ifr.onload = function() {
        ifr.onload = function() {
            console.log('ifr。contentWindow: ', ifr.contentWindow, ifr.contentWindow.name);
            data = ifr.contentWindow.name;
            console.log('收到数据:', data);
        }
        ifr.src = "http://127.0.0.1:5502/window.nameC.html";
    } < /script、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、、>

    //http://127.0.0.1:5501/window.nameB.html
    <
    script >
    window.name = "你想要的数据!"; < /script>

//http://127.0.0.1:5502/window.nameC.html
```

6.3 windows.postMessage

otherWindow.postMessage(message, targetOrigin, [transfer]);

接收数据：data、type：类型、source：对象、origin：源;

```js
//postMessageChild.html
<
iframe src = "./postMessageChild.html"
id = "myFrame" > < /iframe>  <
script >

    iframe = document.getElementById('myFrame')

iframe.onload = function() {

    iframe.contentWindow.postMessage('MessageFromIndex1', '*')

    setTimeout(() => {
        iframe.contentWindow.postMessage('MessageFromIndex2', '*')
    })

}

function receiveMessageFromIframePage(event) {
    console.log('receiveMessageFromIframePage', event)
}

window.addEventListener('messae', receiveMessageFromIframePage, false)

//  postMessageParent.html
parent.postMessage({
    msg: 'MessageFromIframePage'
}, "*");

function receiveMessageFromParent(event) {
    consle.log('receiveMessageFromParent', event)
}

window.addEventListener('message', receiveMessageFromParent, false)
```

7. websocket

WebSocket 是一种通信协议，使用 ws://（非加密）和 wss://（加密）作为协议前缀。该协议不实行同源政策，只要服务器支持，就可以通过它进行跨源通信。

```js
//html
<
ul > < /ul> <
input type = "text" >
    $(function() {
        var iosocket = io.connect('http://localhost:3000/');
        var $ul = $("ul");
        var $input = $("input");
        iosocket.on('connect', function() { //接通处理
            $ul.append($('<li>连上啦</li>'));
            iosocket.on('message', function(message) { //收到信息处理
                $ul.append($('<li></li>').text(message));
            });
            iosocket.on('disconnect', function() { //断开处理
                $ul.append('<li>Disconnected</li>');
            });
        });

        $input.keypress(function(event) {
            if (event.which == 13) { //回车
                event.preventDefault();
                console.log("send : " + $input.val());
                iosocket.send($input.val());
                $input.val('');
            }
        });
    });

//server.js
var io = require('socket.io')(3000);
io.sockets.on('connection', function(client) {
    client.on('message', function(msg) { //监听到信息处理
        console.log('Message Received: ', msg);
        client.send('服务器收到了信息：' + msg);
    });
    client.on("disconnect", function() { //断开处理
        console.log("client has disconnected");
    });
});
console.log("listen 3000...");
```

8. canvas 操作图片的跨域问题
