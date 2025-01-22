// Kadane 算法是解决最大子数组和的标准方法，核心是：
// - 用一个变量 currSum 记录以当前元素结尾的最大子数组和。
// - 如果 currSum 变成负数，则抛弃之前的子数组，从当前元素重新开始（因为负数只会拖累和）。
// - 用 maxSum 记录遍历过程中遇到的全局最大和。
/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {
  let currSum = nums[0]; // 当前子数组和
  let maxSum = nums[0]; // 全局最大和

  for (let i = 1; i < nums.length; i++) {
    // 选择：要么加入当前元素，要么从当前元素重新开始
    currSum = Math.max(nums[i], currSum + nums[i]);
    // 更新全局最大和
    maxSum = Math.max(maxSum, currSum);
  }

  return maxSum;
}

// 测试
console.log(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])); // 输出 6

var n = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
var val = maxSubArray(n);
console.log("val: ", val);

var maxSubArray = function (nums) {
  let pre = 0,
    maxAns = nums[0];
  nums.forEach((x) => {
    pre = Math.max(pre + x, x);
    maxAns = Math.max(maxAns, pre);
  });
  return maxAns;
};

// ------------------------------

function maxSubArrayWithIndex(nums) {
  let currSum = nums[0],
    maxSum = nums[0];
  let start = 0,
    end = 0,
    tempStart = 0;

  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > currSum + nums[i]) {
      currSum = nums[i];
      tempStart = i;
    } else {
      currSum += nums[i];
    }
    if (currSum > maxSum) {
      maxSum = currSum;
      start = tempStart;
      end = i;
    }
  }
  return { maxSum, subArray: nums.slice(start, end + 1) };
}

console.log(maxSubArrayWithIndex([-2, 1, -3, 4, -1, 2, 1, -5, 4]));
// 输出: { maxSum: 6, subArray: [4, -1, 2, 1] }
