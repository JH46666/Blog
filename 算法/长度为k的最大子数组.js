// # 长度为 k 的最大子数组
// 滑动窗口找到最优解
function maxSumOfK(nums, k) {
  // 边界检查
  if (nums.length < k) return null;

  // 初始化第一个窗口的和
  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += nums[i];
  }
  let maxSum = windowSum;

  // 滑动窗口
  for (let i = k; i < nums.length; i++) {
    // 移除左边元素，加上右边新元素
    windowSum = windowSum - nums[i - k] + nums[i];
    maxSum = Math.max(maxSum, windowSum);
  }

  return maxSum;
}

// 测试
console.log(maxSumOfK([1, -1, 5, -2, 3], 3)); // 输出 6
console.log(maxSumOfK([1, 2, 3], 4)); // 输出 null
console.log(maxSumOfK([-1, -2, -3], 2)); // 输出 -3
