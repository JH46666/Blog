# Tell2.0 前端复盘

## 基础

### mpvue 和 megalo 开发的生命周期还不太熟悉

```javascript
    beforeCreate
    created
    onLoad/onLaunch
    onShow/onHide
    onReady
    beforeMount
    mounted
    beforeUpdate
    beforeDestroy
    destoryed
    ...
```

![生命周期图片](http://mpvue.com/assets/lifecycle.jpg)

### 有一些状态要清理 onlaunch 的时候

    例如常见的不保留用户填写的信息

### 基础 api

- wx.getSystemInfoSync 获取信息系统
- wx.login
- wx.showShareMenu
- wx.navigateTo({url:})

### 移动端经验不足

缺乏移动思维 在页面布局方面没有合理的运用 flex 布局

包括很多层级深一点的页面，都没有做 relaunch ,导致页面超过 10 层

还有些 button opentype 等功能没有采用新方法， 沿用旧文档

### 还有低版本库的兼容问题

解决方法：
版本号比较

```javascript
export function compareVersion(v1, v2) {
  v1 = v1.split(".");
  v2 = v2.split(".");
  const len = Math.max(v1.length, v2.length);

  while (v1.length < len) {
    v1.push("0");
  }
  while (v2.length < len) {
    v2.push("0");
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i]);
    const num2 = parseInt(v2[i]);

    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }

  return 0;
}
```

### scropllview 高度

```javascript
const query = wx.createSelectorQuery();
const res = query
  .select(".bar")
  .boundingClientRect()
  .exec(
    function (res) {
      let barHeight = res[0].height;
      let systemInfo = wx.getSystemInfoSync();
      this.scrolHeight =
        systemInfo.windowHeight - systemInfo.statusBarHeight - barHeight;
    }.bind(this)
  );
```

### tabbar 高度兼容

```javascript
const model = wx.getSystemInfoSync().model;
if (model.includes("iPhone X")) {
  this.isIpx = true;
}
```

### 对功能方面的需求没有理解到上个版本的主要实现

例如信链这一块的东西

### scroll-view 滑动

```javascript
<scroll-view scroll-y:style="`height: ${scrolHeight}px`"></scroll-view>
```

### 与后端运用 restful api

### 前期没有做一些相关物料 导致后期还在实现

### megalo 的特定结构转译之后的东西

sesstion，label，div 等，在小程序的表现形式都不一样

### 一些 button、textArea 去除默认样式
