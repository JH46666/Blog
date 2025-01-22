# 常见操作

## 发送 响应

```js
editor.fire("tencentDocAfterCreate", { editor: target, doc });

editor.on("tencentDocAfterCreate", function (data) {
  $("body").trigger("tencentDocAfterCreate", data);
});
```

## 获取焦点

```js
editor.editorManager.get(editor.settings.id).focus(); // 获取焦点
editor.insertContent(""); // 获取焦点
```

## 获取编辑器点击的元素

```js
function composedPath(event) {
  if (event.path) {
    return event.path;
  }
  try {
    return event.composedPath();
  } catch (e) {
    const path = [];
    let el = event.target;
    while (el) {
      path.push(el);
      if (el.tagName === "HTML") {
        path.push(document);
        path.push(window);
        return path;
      }
      el = el.parentElement;
    }
    return path;
  }
}
editor.on("click", function (event) {
  function getCherryModuleEventInfo(event) {
    let eventflag = "";
    const path = composedPath(event);

    for (let index = path.length - 1; index >= 0; index--) {
      const element = path[index];
      if (!element.getAttribute) {
        continue;
      }

      if (element.getAttribute("cm-eventflag")) {
        eventflag = element.getAttribute("cm-eventflag");
      }
    }
    return {
      eventflag,
    };
  }
  const value = getCherryModuleEventInfo(event);
  const targetDom = getCurrentChooseWorkItemTable();
  if (value.eventflag === "refreshWorkItemBlock") {
    editor.fire("refreshWorkItemBlockEvent", {
      editor: editor,
      workitemBlockNode: targetDom,
    });
  }
});
```

## 点击的元素是不是含有某个 class 类

```js
const isWorkItemBlock = function (dom) {
  if (
    editor.dom.is(dom, "div") &&
    editor.dom.hasClass(dom, "cherry-choose-workitem")
  ) {
    return true;
  }
  return false;
};
```

## 注册悬浮菜单栏

```js
editor.addCommand("changeWorkItemBlock", function (ui, type) {
  if (type === void 0) {
    type = defaultType;
  }
});
editor.addCommand("showWorkItemBlock", function (ui, { key, targetDom }) {
  if (key == "show") {
    editor.fire("createWorkItemShowFileds", {
      editor: editor,
      workitemBlockNode: targetDom,
    });
  } else if (key == "change") {
    editor.fire("changeWorkItemShowFileds", {
      editor: editor,
      workitemBlockNode: targetDom,
    });
  }
});

// 注册bubble menu 按钮组里的具体按钮
Object.keys(defaultList).forEach((key) => {
  editor.ui.registry.addToggleButton(`ch-workitem__${key}`, {
    text: defaultList[key].name,
    tooltip: `${defaultList[key].name}`,
    onAction() {
      const targetDom = getCurrentChooseWorkItemTable();
      editor.execCommand("showWorkItemBlock", true, { key, targetDom });
    },
  });
});
editor.ui.registry.addToggleButton("ch-workitem__delete", {
  icon: workitemList.delete.iconName,
  tooltip: "workitem Block delete",
  onAction: function () {
    editor.execCommand("removeWorkItemBlock");
  },
});
```

## 注册 bubble menu 按钮组

```js
editor.ui.registry.addContextToolbar("chooseworkitem_toolbar", {
  predicate: function (node) {
    return isWorkItemBlock(node);
  },
  items: editor.getParam("chooseworkitem_toolbar", defaultBubbleMenu),
  position: "node",
  scope: "node",
});
```

## 删除点击的元素

```js
// 获取光标所在的业务对象表格
const getCurrentChooseWorkItemTable = function () {
  const currentNode = editor.selection.getNode();
  let targetDom = null;
  if (
    editor.dom.is(currentNode, "div") &&
    editor.dom.hasClass(currentNode, "cherry-choose-workitem")
  ) {
    targetDom = currentNode;
  } else {
    const parentDom = editor.dom.getParent(
      currentNode,
      "div.cherry-choose-workitem"
    );
    if (parentDom) {
      targetDom = parentDom;
    }
  }
  if (!targetDom || !editor.dom.hasClass(targetDom, "cherry-choose-workitem")) {
    return false;
  }
  return targetDom;
};
// 删除业务对象表格
const remove = function () {
  const targetDom = getCurrentChooseWorkItemTable();
  editor.dom.remove(targetDom);
};
```

## dom 的一些操作

![dom.domQuery](https://www.tiny.cloud/docs-4x/api/tinymce.dom/tinymce.dom.domquery/)

```javascript
var test = tinymce.dom.$("p").attr("attr", "value").addClass("class");
```

## 获取当前元素的个数

![dom.domUtil](https://www.tiny.cloud/docs-4x/api/tinymce.dom/tinymce.dom.domutils/)

```javascript
tinymce.activeEditor.dom.select("div.cherry-choose-workitem") &&
  editor.dom.select("div.cherry-choose-workitem").length;
```

## 设置某元素的样式

![dom.domUtil](https://www.tiny.cloud/docs-4x/api/tinymce.dom/tinymce.dom.domutils/)

```javascript
setStyle;

tinymce.activeEditor.dom.setStyle(
  tinymce.activeEditor.dom.select("p"),
  "background-color",
  "red"
);

setStyles;
// Sets styles on all paragraphs in the currently active editor
tinymce.activeEditor.dom.setStyles(tinymce.activeEditor.dom.select("p"), {
  "background-color": "red",
  color: "green",
});

// Sets styles to an element by id in the current document
tinymce.DOM.setStyles("mydiv", { "background-color": "red", color: "green" });
```

## 遇到的问题

为了加快页面载入速度就要首先解决载入文件过多的问题，而大部分时间用户并不需要每次打开页面都先加载一遍 editor 的核心文件，而 editor 本身也要按需加载内容.把源码下载下来，做成异步组件。
导入的过程遇到 theme.js 路径不对的问题。
在默认配置下， tinymce 载入的 theme 的路径居然是这个

```JS
Request URL:<http://localhost:8080/themes/modern/theme.js>
```

改成 cdn 路径

```javascript
window.tinymce.baseURL = "http://cdn.xxx.com/static/tinymce";
```

然后把 plugins 包和 tinyMce 主体包在不阻塞页面加载的情况下，做个懒加载提前缓存好文件方便后面使用，而组件本身在挂载前做个监听 window.tinymce 全局变量的方法，然后 cdn 控制下文件的过期时间即可。

本地开发环境，谷歌和火狐浏览器都能完美兼容，打包后谷歌浏览器没问题，火狐浏览器存在问题，报的是 ip+/themes/modern/theme.js 找不见。

解决方法：

在当前组件配置 baseURL：

判断开发环境还是生产环境，改变引用资源的相对路径，保证富文本能加载到所需资源文件.

```js
if (process.env.BASE_API.indexOf(‘openManage’) >= 0) {

window.tinymce.baseURL = ‘./static/js’;

}
```

## 难点

1. 编辑器在弹出框中无法获取焦点：

当将 TinyMCE 嵌入到弹出框（如模态框）中时，可能会出现编辑器无法获取焦点或初始化失败的情况。

解决方案：

延迟初始化： 使用 v-if 或类似的条件渲染指令，确保在弹出框显示时才初始化 TinyMCE 编辑器。

```js
  <TinyMceEditor v-if="isVisible" :content="content" />
```

2. 插入视频被图片占位，视频无法编辑播放：

在编辑器中插入视频后，可能会出现视频被图片占位，且无法在编辑模式下播放的问题。

解决方案：

通过自定义 video_template_callback 回调方法，可以解决视频被图片占位的问题。

具体方法是：

1. 修改 media 插件源码：

找到 tinymce/plugins/media/ 目录下的 plugin.js 文件，定位到 createPreviewIframeNode 函数，将其代码替换为以下内容：

```js
var createPreviewIframeNode = function (editor, node) {
  var previewWrapper;
  var previewNode;
  var shimNode;
  var name = node.name;
  previewWrapper = new global$8("span", 1);
  previewWrapper.attr({
    contentEditable: "false",
    style: node.attr("style"),
    "data-mce-object": name,
    class: "mce-preview-object mce-object-" + name,
  });
  retainAttributesAndInnerHtml(editor, node, previewWrapper);
  previewNode = new global$8(name, 1);
  previewNode.attr({
    src: node.attr("src"),
    controls: "controls", // 新增
    allowfullscreen: node.attr("allowfullscreen"),
    style: node.attr("style"),
    class: node.attr("class"),
    width: node.attr("width"),
    height: node.attr("height"),
    frameborder: "0",
  });
  shimNode = new global$8("span", 1);
  shimNode.attr("class", "mce-shim");
  previewWrapper.append(previewNode);
  previewWrapper.append(shimNode);
  return previewWrapper;
};
```

2. 修改判断逻辑：
   找到以下代码块并注释掉（大概在 1137-1145 行之间）：

```js
/** if (node.name === 'iframe' && Settings.hasLiveEmbeds(editor) && global$1.ceFalse) {
      if (!isWithinEphoxEmbed(node)) {
        node.replace(createPreviewIframeNode(editor, node));
      }
    } else {
      if (!isWithinEphoxEmbed(node)) {
        node.replace(createPlaceholderNode(editor, node));
      }
    } **/
```

然后修改判断逻辑为：

```js
if (
  (node.name === "iframe" || node.name === "video") &&
  Settings.hasLiveEmbeds(editor) &&
  global$1.ceFalse
) {
  if (!isWithinEphoxEmbed(node)) {
    node.replace(createPreviewIframeNode(editor, node));
  }
} else {
  if (!isWithinEphoxEmbed(node)) {
    node.replace(createPlaceholderNode(editor, node));
  }
}
```

通过以上修改，可以有效解决在编辑器中插入视频后被图片占位，且无法在编辑模式下播放的问题。
