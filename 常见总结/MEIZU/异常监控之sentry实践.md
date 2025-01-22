# 异常监控之 sentry 实践

sentry 是一个日志平台，分为客户端和服务端，客户端(目前客户端有Python, PHP, C#, Ruby等多种语言)就嵌入在你的应用程序中间，程序出现异常.。它专门用于监视错误和提取执行适当的事后操作所需的所有信息, 而无需使用标准用户反馈循环的任何麻烦。

这个是主页面

![页面](https://tva1.sinaimg.cn/large/007S8ZIlgy1ggb98np9qpj30tz0cejrr.jpg)

首先我们先注册登录一下, 接着创建一下项目生成 token.
点击头像左下角，选择API，生成token，勾选project:write权限

![token](https://tva1.sinaimg.cn/large/007S8ZIlgy1ggb9no1ez0j319h0i7q46.jpg)

## 基础配置

安装 sentry 对应的命令行管理工具 sentry-cli

```js
npm i -g @sentry/cli

sentry-cli -V // 检查版本
```

安装好之后可以登录

```js
sentry-cli login
```

输入一下命令配置

```js
vi /Users/sjh/.sentryclirc
```

![sentryclirc](https://tva1.sinaimg.cn/large/007S8ZIlgy1ggba338kxdj30us07ejrg.jpg)

### 上传 source map

接着配置 sentry-cli releases files test004 upload-sourcemaps --url-prefix 'http://172.18.8.33:5000/static/js' './build/static/js/'

成功的话会出现这个

![上传成功页面](https://tva1.sinaimg.cn/large/007S8ZIlgy1ggb9ljibnfj30wh068gly.jpg)

如果出现 error: project not found  可以输入一下命令

```js
sentry-cli info
```

这是我们配置的详细信息, 可以对一下是否写错

```js
sentry-cli projects list
```

查看下项目的对应名称是否输错

2）清空 SourceMap 文件

``` sh
sentry-cli releases files staging@1.0.1 delete --all
```

上传成功后我们可以在页面看到这个

![sentry 成功](https://tva1.sinaimg.cn/large/007S8ZIlgy1ggbivhx2xnj31as0h374v.jpg)

### release控制

1. 创建release

``` sh
sentry-cli releases -o 组织 -p 项目 new staging@1.0.1

# 这里的 staging@1.0.1 就是我们指定的版本号. 
# -o -p可以通过页面左上角可以看到。现在我们可以通过创建多个版本号来进行异常分类。 同时，也可以通过页面中"Releases"查看是否创建成功

```

2. 本地应用release

``` js
# 安装raven - js
npm install raven - js--save

# 回到前端项目中， 在config添加对应的release， 指定版本后， 每次上报的异常就会分类到该版本下。

import Raven from 'raven-js';

Raven.config(DSN, {
    release: 'staging@1.0.1'
}).install()
```

3. 删除release

``` sh
sentry-cli releases -o 组织 -p 项目 delete staging@1.0.1

# 注意 删除某个release时需要将其下的异常处理掉,并将该版本的sourcemap文件清空
# 完成上面两步可能还要等待2小时才能删除，不然会报错：该版本还有其它依赖。

```

## vue

``` js
import * as Sentry from '@sentry/browser';
d;

Sentry.init({
    dsn: 'https://3ab8eff44adc41bdb4b7b3abeb9af39e@o209216.ingest.sentry.io/5304337',
    integrations: [new VueIntegration({
        Vue,
        attachProps: true
    })],
});
Vue.prototype.Sentry = Sentry // 在捕获错误的界面需要用到Sentry
```

接着在 webpack 中配置

``` js
    configureWebpack: {
        plugins: [
            new SentryCliPlugin({
                include: "../game-developer-web/src/main/webapp/resources/dist", // 作用的文件夹(打包好的文件夹)
                release: process.env.RELEASE_VERSION, // 版本号
                configFile: "sentry.properties",
                ignore: ['node_modules'],
                urlPrefix: "../game-developer-web/src/main/webapp/resources/dist" // 线上项目的文件夹名
            })
        ]
    }
```

![vue 效果图](https://tva1.sinaimg.cn/large/007S8ZIlgy1ggbitbai4sj30sv06uweq.jpg)

## react

对应的 react 项目配置很简单

在 index.js 引入

``` js
import * as serviceWorker from './serviceWorker';
import * as Sentry from '@sentry/browser';

Sentry.init({
    release: 'test004',
    dsn: "https://b0e87f818a464f319892f9c0eeb5e39e@o209216.ingest.sentry.io/5303156",
    release: 'test004',
    beforeSend(event, hint) {
        // Check if it is an exception, and if so, show the report dialog
        if (event.exception) {
            Sentry.showReportDialog({
                eventId: event.event_id
            });
        }
        return event;
    }
});
```
