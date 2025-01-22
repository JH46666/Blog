# Taro 浅析用法与原理

## json 配置

```json
  "postcss": {
    "plugins": {
      "autoprefixer": {},
      "postcss-px2rem": {
        "remUnit": 75
      },
      "postcss-assets": {
        "loadPaths": "[path.resolve(__dirname, 'src/assets/img')]",
        "relative": true
      }
    }
  },
```

```js
class Demo extends Component {
  constructor(props) {
    super(props);
  }
  componentWillMount() {
    window.temp = "demo";
  }
}
```

## 生命周期

页面切换的执行顺序：

- 离开的顺序： index 的跳转方法 后面跟着 componentdDidHide

- 进入的顺序： componentWillMount componentDidShow componentDidMount

15 版本的生命周期与方法

- constructor，顾名思义，组件的构造函数。一般会在这里进行  state  的初始化，事件的绑定等等
- componentWillMount，是当组件在进行挂载操作前，执行的函数，一般紧跟着  constructor  函数后执行
- componentDidMount，是当组件挂载在 dom 节点后执行。一般会在这里执行一些异步数据的拉取等动作
- shouldComponentUpdate，返回  false  时，组件将不会进行更新，可用于渲染优化
- componentWillReceiveProps，当组件收到新的  props  时会执行的函数，传入的参数就是  nextProps ，你可以在这里根据新的  props  来执行一些相关的操作，例如某些功能初始化等
- componentWillUpdate，当组件在进行更新之前，会执行的函数
- componentDidUpdate，当组件完成更新时，会执行的函数，传入两个参数是  prevProps 、prevState
- componentWillUnmount，当组件准备销毁时执行。在这里一般可以执行一些回收的工作，例如  clearInterval(this.timer)  这种对定时器的回收操作

16 版本的生命周期与方法

- constructor，顾名思义，组件的构造函数。一般会在这里进行  state  的初始化，事件的绑定等等
- componentDidMount，是当组件挂载在 dom 节点后执行。一般会在这里执行一些异步数据的拉取等动作
- shouldComponentUpdate，返回  false  时，组件将不会进行更新，可用于渲染优化
- componentDidUpdate，当组件完成更新时，会执行的函数，传入两个参数是  prevProps 、prevState
- componentWillUnmount，当组件准备销毁时执行。在这里一般可以执行一些回收的工作，例如  clearInterval(this.timer)  这种对定时器的回收操作

taro 版本对应的是 16 之前

去对比了一下 react 16 的生命周期

**挂载**
当组件实例被创建并插入 DOM 中时，其生命周期调用顺序如下：

- constructor()
- static getDerivedStateFromProps()
- render()
- componentDidMount(-

componentwillMount 将被舍弃

**更新**

当组件的 props 或 state 发生变化时会触发更新。组件更新的生命周期调用顺序如下：

- static getDerivedStateFromProps()

- shouldComponentUpdate()

- render()

- getSnapshotBeforeUpdate()

- componentDidUpdate()

**卸载**

当组件从 DOM 中移除时会调用如下方法：

- componentWillUnmount()

其他 APIs
组件还提供了一些额外的 API：

- setState()

- forceUpdate()

class 属性

- defaultProps
- displayName

```js
class CustomButton extends React.Component {
  // ...
}

CustomButton.defaultProps = {
  color: "blue",
};
```

如果  props.color  被设置为  null，则它将保持为  null
render() {

    return <CustomButton color={null} /> ; // props.color 将保持是 null

**实例属性**

- props

- state

了解了一下小程序的生命周期：

- 应用级别的生命周期 onLaunch onShow onHide
- onLaunch  是当小程序初始化完成时，会触发 onLaunch（全局只触发一次）
- onShow  是当小程序启动，或从后台进入前台显示，会触发 onShow；
- onHide  是当小程序从前台进入后台，会触发 onHide；

页面的生命周期 onLoad、onReady、onShow、onHide、onUnload

- onLoad  是监听页面加载的函数
- onReady  是监听页面初次渲染完成的函数
- onShow  是监听页面显示的函数
- onHide  是监听页面隐藏的函数
- onUnload  是监听页面卸载的函数

Taro.pxTransform(10) // 小程序：rpx，H5：rem

if 语句和 for 循环在 JavaScript 中不是表达式，因此它们不能直接在 JSX 中使用，所以你可以将它们放在周围的代码中。

```jsx
import Taro, {
    Component
} from '@tarojs/taro'

class App extends Components {
    render() {

        let description

        if (this.props.number % 2 == 0) {
            description = < Text > even < /Text>
        } else {
            description = < Text > odd < /Text>
        }

        return <View > {
            this.props.number
        }
    }
}
```

布尔值、Null 和 Undefined 被忽略

```jsx
<View>
  {showHeader && <Header />}
  <Content />
</View>
```

![props 只读性](./007S8ZIlgy1gduhvdcxlcj30mo0am0sv.webp)

1. 不要直接更新状态

2. 状态更新一定是异步的

Taro 可以将多个  setState()  调用合并成一个调用来提高性能。
因为  this.state  和  props  一定是异步更新的，所以你不能在  setState  马上拿到  state  的值，例如：

```jsx
// 假设我们之前设置了 this.state.counter = 0
updateCounter () {
  this.setState({

    counter: 1

  }, () => {

    // 在这个函数内你可以拿到 setState 之后的值

  })
}
```

合并是浅合并，所以  this.setState({comments})  不会改变  this.state.posts  的值，但会完全替换  this.state.comments  的值。

当你通过 bind 方式向监听函数传参，在类组件中定义的监听函数，事件对象  e  要排在所传递参数的后面。

```jsx
class Popper extends Component {
  constructor () {

    super(...arguments)
    this.state = { name:'Hello world!' }

  }

  // 你可以通过 bind 传入多个参数
  preventPop (name, test, e) {    //事件对象 e 要放在最后

    e.stopPropagation()

  }

  render () {

    return <Button onClick={this.preventPop.bind(this, this.state.name, 'test')}></Button>

  }

const App = () => {
  const [c1, setC1] = useState(0);
  const [c2, setC2] = useState(0);
  const [c3, setC3] = useState(0);

  const increment = c => c + 1

  // 只有 useCallback 对应的 c1 或 c2 的值改变时，才会返回新的函数
  const increment1 = useCallback(() => setC1(increment), [c1]);
  const increment2 = useCallback(() => setC2(increment), [c2]);

  return (<View>

    <Text> Counter 1 is {c1} </Text>
    <Text> Counter 2 is {c2} </Text>
    <Text> Counter 3 is {c3} </Text>
    <View>
      <Button onClick={increment1}>Increment Counter 1</Button>
      <Button onClick={increment2}>Increment Counter 2</Button>
      <Button onClick={() => setC3(increment)}>Increment Counter 3</Button>
    </View>

  </View>)
}

      <Dialog
        renderHeader={
            <View className='welcome-message'>Welcome!</View>
          }
        renderFooter={
            <Button className='close'>Close</Button>
          }
        ref={this.refDialog}
      >
          <View className='dialog-message'>
            Thank you for using Taro.
          </View>
        </Dialog>

      <MList />
```

```jsx
// JSX 语法
const num = 1;
const hello = <div className="test">{num}</div>;

// 编译后的 JS
const num = 1;
const hello = React.createElement("div", { className: "test" }, num);
```

然而，在 JSX 里使用 JS 是有限制的，只能使用一些表达式，不能定义变量，使用  if/else  等，你可以用提前定义变量；用三元表达式来达到同样的效果。

组件中如果收到了新的  props，就会重新执行一次  render  函数，也就是重新渲染一遍。

```jsx
constructor(props) {

    super(props);
    this.state = {name: 'aotu,taro!'};

  }

```

下面这种写法可以尝试下：

```jsx
  render () {

    const { showHeader, showMain } = this.state
    const header = showHeader && <Header />
    const main = showMain && <Main />
    return (
      <View>
        {header}
        {main}
      </View>
    )
  }
```

## api

微信提供的回调是 bindgetuserinfo，但是 Taro 将 bind 事件都封装成了 on 事件，这个需要注意一下

```jsx
componentWillReact

    //天数计算
    int days = (num)/(24*3600);

    //小时计算
    int hours = (num)%(24*3600)/3600;

    //分钟计算
    int minutes = (num)%3600/60;

    //秒计算
    int second = (num)%60;

const SHAREINFO = {
  'title': '分享标题',
  'path': '路径',
  'imageUrl': '图片'
}

Component.prototype.onShareAppMessage = function () {
  return SHAREINFO
}

```

```jsx
Taro.authorize({
  scope: "scope.userInfo",
  success(data) {
    // 用同意小程序使用录音功能，后续调用 wx.startRecord 接口不会弹窗询问
    userStore.updateInfo(data.userInfo.avatarUrl, data.userInfo.nickName);
  },
});
```

```jsx
Taro.getStorage({
  key: "key",
  success: function (res) {
    console.log(res.data);
  },
});
try {
  var value = Taro.getStorageSync("key");
  if (value) {
    // Do something with return value
  }
} catch (e) {
  // Do something when catch error
}
```

## 遇到的坑

### 最佳实践

不能使用 wx:for ， 只能使用 map 方法

**无效使用方案**

```jsx
numbers.map((number) => {
  let element = null;
  const isOdd = number % 2;
  if (isOdd) {
    element = <Custom />;
  }
  return element;
});

numbers.map((number) => {
  let isOdd = false;
  if (number % 2) {
    isOdd = true;
  }
  return isOdd && <Custom />;
});
```

**有效解决方案**

```jsx
numbers.map((number) => {
  const isOdd = number % 2;
  return isOdd ? <Custom /> : null;
});

numbers.map((number) => {
  const isOdd = number % 2;
  return isOdd && <Custom />;
});
```

**解决方案：**

```jsx
numbers.filter(isOdd).map((number) => <View />);

for (let index = 0; index < array.length; index++) {
  // do you thing with array
}

const element = array.map((item) => {
  return <View />;
});
```

### 不能在 jsx 参数中使用匿名函数

```jsx
<View onClick={() => this.handleClick()} />

<View onClick={(e) => this.handleClick(e)} />

<View onClick={() => ({})} />

<View onClick={function () {}} />

<View onClick={function (e) {this.handleClick(e)}} />
```

可以使用 bind 或者类参数
<View onClick={this.props.hanldeClick.bind(this)} />

跟 vue 不同的点。不允许在 jsx 参数中传入 jsx 元素
不能使用内置组件化的 slot 功能

**无效方案**

```jsx
<Custom child={<View />} />

<Custom child={() => <View />} />

<Custom child={function () { <View /> }} />

<Custom child={ary.map(a => <View />)} />
```

**解决方案**

通过 props 传值在 JSX 模板中预先判定显示内容，或通过  props.children  来嵌套子组件。
小程序端不要在组件中打印传入的函数
this.props.onXxx && this.props.onXxx()  这种判断函数是否传入来进行调用的写法是完全支持的。

render () {
// 增加一个兼容判断
return this.state.abc && <Custom adc={abc} />
}

在微信小程序中，从调用  Taro.navigateTo、Taro.redirectTo  或  Taro.switchTab  后，到页面触发 componentWillMount 会有一定延时。因此一些网络请求可以提前到发起跳转前一刻去请求。

### 样式层面

分享按钮 包裹图片时出现点击无效 要设置 z-index

## 结合云函数

这里我用到了上传文件的功能, 结合存储

```jsx
Taro.cloud.downloadFile({
  fileID: this.fileID, // 文件 ID
  success: (res) => {
    // 返回临时文件路径
    console.log("tempFilePath", res.tempFilePath);
    that.setState({ videoUrl: res.tempFilePath });
  },
  fail: console.error,
});
```

文件主要分为两大类：代码包文件和本地文件（上限 50M）。

本地文件是通过调用接口本地生成，或通过网络下载后存储到本地的文件，包括本地临时文件、本地缓存文件和本地用户文件。

```jsx
Taro.chooseMessageFile({
  count: 10,
  type: "file",
  success(res) {
    // tempFilePath可以作为img标签的src属性显示图片
    const tempFilePaths = res.tempFiles[0].path;
    const name = Math.random() * 1000000;
    const cloudPath = name + tempFilePaths.match(/\.[^.]+?$/)[0];
    Taro.$upload(cloudPath, tempFilePaths);
    console.log("tempFilePaths: ", cloudPath, tempFilePaths);
  },
});
```

```jsx
Taro.loadFontFace({
  family: "Bitstream Vera Serif Bold",
  source: 'url("https://sungd.github.io/Pacifico.ttf")',
  success: console.log,
});
```

```jsx
Taro.chooseImage({
  sizeType: ["original", "compressed"], // 可以指定是原图还是压缩图，默认二者都有
  sourceType: ["album", "camera"], // 可以指定来源是相册还是相机，默认二者都有
  success: function (res) {
    Taro.showLoading({
      title: "上传中",
    });
    // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
    let filePath = res.tempFilePaths[0];
    const name = Math.random() * 1000000;
    const cloudPath = name + filePath.match(/\.[^.]+?$/)[0];
    Taro.$upload(cloudPath, filePath);
  },
  fail: (e) => {
    console.error("[上传图片] 失败：", e);
  },
  complete: () => {
    Taro.hideLoading();
  },
});
```

    const refDay = (node) => this.MDay = node // `this.MDay` 会变成 `MDay` 组件实例的引用
    const refDialog = (node) => this.MDialog = node // `this.MDialog` 会变成 `MDialog` 组件实例的引用

```jsx
二) 常量定义
1. 【强制】不允许出现任何魔法值(即未经定义的常量)直接出现在代码中；
2. 【推荐】不要使用一个常量类维护所有常量，应该按常量功能进行归类，分开维护。 如:缓存相关的常量放在类:CacheConsts下; 系统配置相关的常量放在类:ConfigConsts下； 说明:大而全的常量类，非得使用查找功能才能定位到修改的常量，不利于理解和维护；
【强制】常量命名全部大写，单词间用下划线隔开，力求语义表达完整清楚，不要嫌名字长； 正例: MAX_STOCK_COUNT 反例: MAX_COUNT

    const vStyle = classNames({
      playing: true,
      'vStyle-a': id === 'A',
      'vStyle-b': id === 'B',
      'vStyle-c': id === 'C'
    });
    const pStyle = classNames(
      'circle',
      { 'whiteCircle': playState === 'PLAY_START' },
      { 'blueCircle': playState === 'PLAY_LOAD' },
      { 'whiteCircle': playState === 'PLAY_STOP' }
    )

<View className={vStyle}>
            <View className={`${pStyle}`} onClick={this.clickPlay}>
              {Triangle
              ?<Image className='Triangle' src={play}></Image>
              :
              <Image className='Triangle' src={stop}></Image>
              }
            </View>



```

taro 组件使用 keys
小程序原生组件使用 taroKeys

```jsx
const numbers = [...Array(100).keys()]; // [0, 1, 2, ..., 98, 99]
const listItems = numbers.map((number) => {
  return (
    // native component
    <g-list taroKey={String(number)} className="g-list">
      我是第 {number + 1} 个数字
    </g-list>
  );
});
```

Taro 中，JSX 会编译成微信小程序模板字符串，因此你不能把  map  函数生成的模板当做一个数组来处理。当你需要这么做时，应该先处理需要循环的数组，再用处理好的数组来调用 map 函数。例如上例应该写成：

```js
const list = this.state.list
  .filter((l) => l.selected)
  .map((l) => {
    return <li>{l.text}</li>;
  });
```

在 Taro 中使用函数式组件有以下限制：

1. 函数的命名需要遵循帕斯卡式命名法；
2. 一个文件中只能定义一个普通函数式组件或一个 Class 组件

由于一个文件不能定义两个组件，但有时候我们需要组件内部的抽象组件

1. 函数的命名必须以  render  开头，render  后的第一个字母需要大写
2. 函数的参数不得传入 JSX 元素或 JSX 元素引用
3. 函数不能递归地调用自身

报没有 jsx 错误

```jsx
  renderFooter(){
    const todos = [{id:1,text:1, completed:true}, {id:2, text:2, completed: false}, {id:3,text:3, completed: true}]
    const contain = todos.map(todo=>{
      <View key={todo.id} id={todo.id} >
        <Text>{todo.text}</Text>
        <Text>{todo.completed}</Text>
      </View>
    })
    return (contain)
  }
```

### slot

```js
const MyContext = Taro.createContext(defaultValue);
```

Children 与组合 相当于 slot
请不要对  this.props.children  进行任何操作。
this.props.children && this.props.children、this.props.children[0]  在 Taro 中都是非法的。
this.props.children  无法用  defaultProps  设置默认内容。
不能把  this.props.children  分解为变量再使用

通过字符串创建 ref 只需要把一个字符串的名称赋给  ref prop

```js
// 如果 ref 的是小程序原生组件，那只有在 didMount 生命周期之后才能通过
// this.refs.input 访问到小程序原生组件
if (process.env.TARO_ENV === "weapp") {
  // 这里 this.refs.input 访问的时候通过 `wx.createSeletorQuery` 取到的小程序原生组件
} else if (process.env.TARO_ENV === "h5") {
  // 这里 this.refs.input 访问到的是 `@tarojs/components` 的 `Input` 组件实例
}
```

通过传递一个函数创建 ref, 在函数中被引用的组件会作为函数的第一个参数传递。

通过函数创建的 ref 是不是不能在函数式组件中使用 果然如此

```js
  this.cat = Taro.createRef()

  roar () {
    // 会打印 `miao, miao, miao~`
    this.cat.current.miao()
  }
```

你基本都能使用小程序本身提供的 API 达到同等的需求，其中就包括但不限于：

1. 使用  this.$scope.triggerEvent  调用通过 props 传递的函数;
2. 通过  this.$scope.selectComponent  和  wx.createSelectorQuery  实现  ref;
3. 通过  getCurrentPages  等相关方法访问路由；
4. 修改编译后文件  createComponent  函数创建的对象

```js
this.setState({
  value: this.state.value + 1,
}); // ✗ 错误

this.setState((prevState) => ({ value: prevState.value + 1 })); // ✓ 正确
```

尽量避免在 componentDidMount 中调用 this.setState
因为在  componentDidMount  中调用  this.setState  会导致触发更新

尽量避免，可以在 componentWillMount 中处理

不要在调用 this.setState 时使用 this.state  
由于 this.setState 异步的缘故，这样的做法会导致一些错误，可以通过给 this.setState 传入函数来避免

不要在 componentWillUpdate/componentDidUpdate/render 中调用 this.setState

```js
组件最好定义 defaultProps
  static defaultProps = {
    isEnable: true
  }

r//ender 方法必须有返回值
```

值为 true 的属性可以省略书写值
