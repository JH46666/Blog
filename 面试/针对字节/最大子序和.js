// 53. 最大子序和

// 给定一个整数数组 nums ，找到一个具有最大和的连续子数组（子数组最少包含一个元素），返回其最大和。

// 输入: [-2,1,-3,4,-1,2,1,-5,4],
// 输出: 6
// 解释: 连续子数组 [4,-1,2,1] 的和最大，为 6。
var maxSubArray = function (nums) {
  // 滑动窗口
};

// ## 长度为 K 子数组中的最大和
function maximumSubarraySum(nums, k) {
  // 初始窗口的和
  let windowSum = 0;
  const windowFreq = new Map(); // 记录元素频率
  for (let i = 0; i < k; i++) {
    windowSum += nums[i];
    windowFreq.set(nums[i], (windowFreq.get(nums[i]) || 0) + 1);
  }
  // 检查第一个窗口是否无重复
  let maxSum = windowFreq.size === k ? windowSum : 0;

  // 滑动窗口
  for (let i = k; i < nums.length; i++) {
    // 移除左边元素
    const left = nums[i - k];
    windowSum -= left;
    const freq = windowFreq.get(left);
    if (freq === 1) windowFreq.delete(left);
    else windowFreq.set(left, freq - 1);

    // 加入右边元素
    const right = nums[i];
    windowSum += right;
    windowFreq.set(right, (windowFreq.get(right) || 0) + 1);

    // 检查当前窗口是否无重复
    if (windowFreq.size === k) {
      maxSum = Math.max(maxSum, windowSum);
    }
  }

  return maxSum;
}
