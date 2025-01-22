// # 自己手写一个 http 请求
function sendGetRequest(url, callback) {
  // 1. 创建一个 XMLHttpRequest 对象
  const xhr = new XMLHttpRequest();
  // 初始化请求: 请求方式, 请求地址, 是否异步
  xhr.open("GET", url, true);
  // 设置请求头（如果需要）
  // xhr.setRequestHeader('Content-Type', 'application/json');
  // 注册事件监听器： 监听请求状态的变化
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      // 请求完成
      if (xhr.status === 200) {
        // 请求成功
        callback(xhr.responseText);
      } else {
        // 请求失败
        console.error("请求失败");
      }
    }
  };
  xhr.send();
}
