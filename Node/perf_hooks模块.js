const { performance, PerformanceObserver } = require("perf_hooks");

// 创建一个 PerformanceObserver 实例
const obs = new PerformanceObserver((list) => {
  // 获取性能条目列表中的所有条目
  const entries = list.getEntries();
  entries.forEach((entry) => {
    console.log(`${entry.name}: ${entry.startTime}`);
  });
});

// 监听 'mark' 类型的性能条目
obs.observe({ entryTypes: ["mark"] });

// 创建性能标记和测量
performance.mark("A"); // 创建标记 'A'
setTimeout(() => {
  performance.mark("B"); // 创建标记 'B'
}, 100);

performance.mark("C"); // 创建标记 'C'
