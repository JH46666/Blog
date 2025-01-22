1.计算与渲染
把动画的一帧渲染出来，需要经过以下步骤：

计算：处理电子表格逻辑，计算 workbook 的状态，不涉及 DOM 操作（当然也包含对 Canvas 上下文的操作）。
渲染：真正把对象绘制出来。
JavaScript 调用 DOM API（包括 Canvas API）以进行渲染。
浏览器 把渲染后的结果呈现在屏幕上的过程。

2.canvas 绘制间隔策略
主动触发刷新 canvas （电子表格）
定时器循环刷新 canvas （动画，游戏推荐）, requestAnimationFrame 相对于 setInterval 处理动画有以下几个优势：
经过浏览器优化，动画更流畅
窗口没激活时，动画将停止，省计算资源
更省电，尤其是对移动终端 3.分层 Canvas
分层 Canvas 的出发点是，动画中的元素（层），对渲染和动画的要求是不一样的
实现 UI 重叠的视觉效果（案例：腾讯文档 word 画布） 4. canvas scale() 天然支持放大缩小

5.离屏绘制，使用缓存
绘制同样的一块区域，如果数据源是一张大图上的一部分，性能就会比较差，因为每一次绘制还包含了裁剪工作。可以先把待绘制的区域裁剪好，保存起来，这样每次绘制时就能轻松很多。

drawImage 方法的第一个参数不仅可以接收 Image 对象，也可以接收另一个 Canvas 对象。而且，使用 Canvas 对象绘制的开销与使用 Image 对象的开销几乎完全一致。我们只需要实现将对象绘制在一个未插入页面的 Canvas 中，然后每一帧使用这个 Canvas 来绘制。

并且离屏 canvas 也不能用的太泛滥，如果用太多离屏 canvas 也会有性能问题

6. 尽量少调用 canvasAPI ，尽可能集中绘制
   提升 canvas 的性能最主要的还是得注意代码的结构，减少不必要的 API 调用，在每一帧中减少复杂的运算或者把复杂运算由每一帧算一次改成数帧算一次。

7.避免使用高耗能的 API
清除画布尽量使用 clearRect
避免浮点运算
一般情况下的性能： clearRect > fillRect > canvas.width=canvas.width;

8. 避免「阻塞」
   偶尔的且较小的阻塞是可以接收的，频繁或较大的阻塞是不可以接受的。也就是说，我们需要解决两种阻塞：

频繁（通常较小）的阻塞。其原因主要是过高的渲染性能开销，在每一帧中做的事情太多。
较大（虽然偶尔发生）的阻塞。其原因主要是运行复杂算法、大规模的 DOM 操作等等。
对前者，我们应当仔细地优化代码，有时不得不降低动画的复杂（炫酷）程度，本文前几节中的优化方案，解决的就是这个问题。

而对于后者，主要有以下两种优化的策略。

使用 Web Worker，在另一个线程里进行计算。
将任务拆分为多个较小的任务，插在多帧中进行。
Web Worker 是好东西，性能很好，兼容性也不错。浏览器用另一个线程来运行 Worker 中的 JavaScript 代码，完全不会阻碍主线程的运行。动画（尤其是游戏）中难免会有一些时间复杂度比较高的算法，用 Web Worker 来运行再合适不过了。

尽可能少调用 api
// 减少 stroke();

减少 beginpath 和 stroke

```javascript
context.beginPath();
for (var i = 0; i < points.length - 1; i++) {
  var p1 = points[i];
  var p2 = points[i + 1];
  context.moveTo(p1.x, p1.y);
  context.lineTo(p2.x, p2.y);
}
context.stroke();
```

// 在左侧的 tale 表格改变 开始时间和结束时间的时候 右侧的甘特图时间条也会相应移动
局部重绘

由于 canvas 的绘制方式是画笔式的，在 canvas 上绘图时没调用一次 api 就会在画布上进行绘制，一旦绘制就成为画布的一部分，绘制图形时并没有对象保存下来，一旦图形需要更新， 需要清楚整个画布重新绘制。

canvas 局部刷新的方案：

1. 清除指定区域的颜色，并设置 clip。
1. 所有同这个区域香蕉的图形重新绘制

要实现局部渲染时，需要考虑的两个因素是：

单次刷新时影响的范围最小
刷新的图形不会影响其他图形的正确绘制

清除画布内容

```javascript
context.fillRect(); //颜色填充
context.clearRect(0, 0, w, h);
canvas.width = canvas.width; // 一种画布专用的技巧
```

坐标值尽量使用整数

避免使用浮点数坐标，使用非整数的坐标绘制内容，系统会自动使用抗锯齿功能，尝试对线条进行平滑处理，这又是一种性能消耗。

当然性能最优越的方法莫过于将数值加 0.5 然后对所得结果进行移位运算以消除小数部分。

```javascript
1 rounded = (0.5 + somenum) | 0;
2 rounded = ~~ (0.5 + somenum);
3 rounded = (0.5 + somenum) << 0;
```

可以调用 Math.round 四舍五入取整，或者 floor 向上 ceil 向下取整，trunc 直接丢弃小数位

### 双缓存

```jsx
import React, { useEffect, useRef } from "react";

function App() {
  const canvasRef = useRef < HTMLCanvasElement > null;
  const offscreenCanvasRef = (useRef < HTMLCanvasElement) | (null > null);

  // 模拟复杂计算的绘制函数
  const drawComplexShape = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) => {
    // 模拟复杂计算过程
    for (let i = 0; i < 1000; i++) {
      const radius = 50 + Math.sin(i * 0.1) * 20;
      const hue = (i + x) % 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      ctx.beginPath();
      ctx.arc(
        x + Math.cos(i * 0.1) * 30,
        y + Math.sin(i * 0.1) * 30,
        2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 创建离屏 Canvas
    offscreenCanvasRef.current = document.createElement("canvas");
    const offscreenCanvas = offscreenCanvasRef.current;

    // 设置两个 Canvas 的尺寸
    const width = 800;
    const height = 600;
    canvas.width = width;
    canvas.height = height;
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;

    const ctx = canvas.getContext("2d");
    const offscreenCtx = offscreenCanvas.getContext("2d");

    if (!ctx || !offscreenCtx) return;

    let x = 0;
    let animationFrameId: number;

    const render = () => {
      // 清除离屏 Canvas
      offscreenCtx.fillStyle = "#1a1a1a";
      offscreenCtx.fillRect(0, 0, width, height);

      // 在离屏 Canvas 上绘制复杂图形
      drawComplexShape(offscreenCtx, x, height / 2);

      // 将整个离屏 Canvas 复制到可见 Canvas
      ctx.drawImage(offscreenCanvas, 0, 0);

      // 更新位置
      x = (x + 2) % width;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Canvas 双缓存演示
        </h1>
        <p className="text-gray-300 max-w-xl text-center">
          这个演示展示了双缓存如何防止复杂动画过程中的闪烁现象。
          尽管动画执行了大量计算，但由于使用了离屏渲染，动画依然保持流畅。
        </p>
      </div>
      <canvas
        ref={canvasRef}
        className="border-4 border-indigo-500 rounded-lg shadow-2xl"
      />
    </div>
  );
}

export default App;
```
