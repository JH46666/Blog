# 首屏加载优化与性能指标分析

## 一、影响首屏加载的主要因素

### 1. 网络传输因素

- 资源文件大小
- 网络请求数量
- DNS 解析时间
- TCP 连接时间
- 服务器响应时间

### 2. 资源加载因素

- JavaScript 文件加载和执行
- CSS 文件加载和解析
- 图片等媒体资源加载
- 字体文件加载

### 3. 页面渲染因素

- DOM 树构建
- CSSOM 树构建
- 渲染树合成
- 页面布局和绘制

## 二、优化方案

### 1. 网络优化

```javascript
// 1. CDN加速
<script src="https://cdn.example.com/script.js"></script>

// 2. 资源预加载
<link rel="preload" href="critical.js" as="script">
<link rel="preconnect" href="https://example.com">
<link rel="dns-prefetch" href="https://example.com">

// 3. HTTP缓存配置
Cache-Control: max-age=31536000
```

### 2. 资源优化

```javascript
// 1. 代码分割
const Home = React.lazy(() => import('./Home'));

// 2. 图片优化
<img
  loading="lazy"
  srcset="img-320w.jpg 320w, img-640w.jpg 640w"
  sizes="(max-width: 320px) 280px, 640px"
  src="img-640w.jpg"
/>

// 3. 关键CSS内联
<style>
  /* 关键渲染路径CSS */
  .header { ... }
</style>
```

### 3. 渲染优化

```javascript
// 1. 避免重排重绘
const box = document.querySelector(".box");
box.style.width = "100px";
box.style.height = "100px";
box.style.margin = "10px";

// 优化后
const box = document.querySelector(".box");
box.style.cssText = "width: 100px; height: 100px; margin: 10px;";

// 2. 使用文档片段
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  const el = document.createElement("div");
  fragment.appendChild(el);
}
document.body.appendChild(fragment);
```

## 三、Performance API 关键指标

### 1. 时间类指标

```javascript
// 获取性能指标
const timing = performance.timing;

// 关键指标计算
const metrics = {
  // DNS解析时间
  dnsTime: timing.domainLookupEnd - timing.domainLookupStart,

  // TCP连接时间
  tcpTime: timing.connectEnd - timing.connectStart,

  // 首字节时间（TTFB）
  ttfb: timing.responseStart - timing.navigationStart,

  // DOM加载时间
  domLoadTime: timing.domContentLoadedEventEnd - timing.navigationStart,

  // 页面完全加载时间
  loadTime: timing.loadEventEnd - timing.navigationStart,
};
```

### 2. Web Vitals 核心指标

```javascript
// 1. LCP (Largest Contentful Paint)
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log("LCP:", lastEntry.startTime);
}).observe({ entryTypes: ["largest-contentful-paint"] });

// 2. FID (First Input Delay)
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  entries.forEach((entry) => {
    console.log("FID:", entry.processingStart - entry.startTime);
  });
}).observe({ entryTypes: ["first-input"] });

// 3. CLS (Cumulative Layout Shift)
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  entries.forEach((entry) => {
    console.log("CLS:", entry.value);
  });
}).observe({ entryTypes: ["layout-shift"] });
```

### 3. 性能指标参考值

- FCP (First Contentful Paint): < 1.8s
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- TTFB (Time to First Byte): < 600ms

## 四、性能监控实现

```javascript
// 性能监控示例
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.init();
  }

  init() {
    // 监控页面加载性能
    window.addEventListener("load", () => {
      const paint = performance.getEntriesByType("paint");
      this.metrics.FCP = paint.find(
        (entry) => entry.name === "first-contentful-paint"
      ).startTime;

      // 记录并上报性能指标
      this.reportMetrics();
    });

    // 监控资源加载性能
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (
          entry.initiatorType === "img" ||
          entry.initiatorType === "css" ||
          entry.initiatorType === "script"
        ) {
          this.metrics[entry.name] = entry.duration;
        }
      });
    }).observe({ entryTypes: ["resource"] });
  }

  reportMetrics() {
    // 上报性能数据
    navigator.sendBeacon("/performance", JSON.stringify(this.metrics));
  }
}

// 初始化性能监控
new PerformanceMonitor();
```

这些优化措施和监控指标能够帮助我们全面了解和改善网站的首屏加载性能。在实际项目中，应该根据具体情况选择合适的优化策略，并持续监控和改进。
