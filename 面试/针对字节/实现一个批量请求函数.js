const limitPromise = function (arr, limit) {
  let currentCount = 0; //当前执行中的任务数
  const queue = []; //任务队列

  // 执行队列中的下一个任务
  function next() {
    if (queue.length > 0 && currentCount < limit) {
      const task = queue.shift();
      task();
    }
  }

  // 执行单个任务
  function runTask(task) {
    const execute = () => {
      currentCount++;
      task()
        .then((result) => {
          console.log(result); // 完成后立即输出
          currentCount--; // 结束时计数减1
          next(); // 安排下一个任务
        })
        .catch((err) => {
          console.log(err); // 完成后立即输出
          currentCount--; // 出错时也要减计数
          next(); // 继续下一个任务
        });
    };
    if (currentCount < limit) {
      execute(); // 有空位，立即执行
    } else {
      queue.push(execute); // 满了，排队
    }
  }
  arr.forEach((task) => {
    runTask(task);
  });
};

// 使用示例
const tasks = [
  () =>
    new Promise((resolve) => setTimeout(() => resolve("Task 1 done"), 1000)),
  () =>
    new Promise((resolve) => setTimeout(() => resolve("Task 2 done"), 2000)),
  () =>
    new Promise((resolve) => setTimeout(() => resolve("Task 3 done"), 1000)),
  () => new Promise((resolve) => setTimeout(() => resolve("Task 4 done"), 500)),
];
limitPromise(tasks, 2);
