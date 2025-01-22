## 针对中英文不同长度的问题

```js
// 中文占2个字符，英文占1个字符
export function getStringLength(str: string) {
  let strLength = 0;
  const strLen = str.length;
  for (let i = 0; i < strLen; i++) {
    const charCode = str.charCodeAt(i);
    // 大于255，表示双字节字符，需要长度+2
    if (charCode > 255) {
      strLength += 2;
    } else {
      strLength += 1;
    }
  }
  return strLength;
}
```

然后在 onchange 的时候 实时监听 在计算出剩余的长度

```js
export const NAME_MAX_LIMIT = 40;

const [maxLength, setMaxLength] = useState(NAME_MAX_LIMIT);

const inputOnKeyUp = (
  event: React.KeyboardEvent<HTMLInputElement>,
  name: string
) => {
  if (event.key === "Enter") {
    const value = event.currentTarget.value;
  }
};
const inputOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const remainingStingLength =
    NAME_MAX_LIMIT - getStringLength(event.target.value);
  setMaxLength(event.target.value.length + remainingStingLength);
};

<input
  ref={inputRef}
  onKeyUp={(e) => inputOnKeyUp(e, actorName)}
  onChange={(e) => inputOnChange(e)}
  maxLength={maxLength}
/>;
```

## 针对输入法的处理

input 组合事件
compositionEvent 组合事件是拆分了不同步骤的事件的组合，是由 compositionStart，compositionUpdate 和 compositionEnd 三个事件组合而成。

Start 和 End 事件只执行一次，Update 会执行多次。
输入前，会触发 Start 和 Update 事件；没有选中中文之前，会一直触发 Update 事件；选中文字后，会触发 End 事件；一个组合事件完成，以此循环。

compositionstart
输入法编辑器开始新的输入合成时会触发 compositionstart 事件。
例如：当用户使用拼音输入法开始输入汉字时，这个事件就会被触发。

compositionupdate
字符被输入到一段文字的时候（这些可见字符的输入可能需要一连串的键盘操作、语音识别或者点击输入法的备选词）会触发 compositionupdate 事件。

compositionend
当文本段落的组成完成或取消时, compositionend 事件将被触发。

```js
<input
  placeholder="Basic usage"
  onChange={(e) => console.log("onchange", e.target.value)}
  onCompositionStart={(e) => console.log("onCompositionStart", e.target.value)}
  onCompositionUpdate={(e) =>
    console.log("onCompositionUpdate", e.target.value)
  }
  onCompositionEnd={(e) => console.log("onCompositionEnd", e.target.value)}
/>
```

直接使用 onCompositionEnd 事件，只能监听到输入改变，不能监听到删除。
