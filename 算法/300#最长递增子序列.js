// 1.首先定义dp数组并初始化都为1，dp[i]表示以nums[i]这个数结尾的最长递增子序列的长度
// 2.然后从索引0的位置开始遍历数组，并且将i与i前面的元素比较；若找到比i小的元素，则让该元素的最长子序列长度加1，然后dp[i]取两者中较大的一个（因为此题求的是非连续子序列，所以需要两次循环）
// 3.最后求dp数组的最大值即递增子序列的最大长度
// # 300. 最长递增子序列
/**
 * @param {number[]} nums
 * @return {number}
 */
/**
 * @param {number[]} nums
 * @return {number}
 */
var lengthOfLIS = function (nums) {
  const dp = new Array(nums.length).fill(1);
  for (let i = 0; i < nums.length; i++) {
    // 遍历i前面的所有元素，将i与i前面的元素比较
    for (let j = 0; j < i; j++) {
      // 找比i小的元素，若有则让该元素的最长子序列长度加1，然后dp[i]取两者中较大的一个
      if (nums[i] > nums[j]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
  }
  // 找出最大的子序列
  return Math.max(...dp);
};
