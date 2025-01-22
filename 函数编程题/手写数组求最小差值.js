// # 手写数组求最小差值
function findMinDifference(arr) {
  // 检查数组是否为空或长度小于2
  if (!Array.isArray(arr) || arr.length < 2) {
    return -1; // 无效输入
  }
  let min = Infinity;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      let diffMin = Math.abs(arr[j] - arr[i]);
      min = Math.min(diffMin, min);
    }
  }
  return min;
}
const testArray = [4, 2, 8, 5, 3];
console.log(findMinDifference(testArray)); // 1
