// LeetCode 11#盛最多水的容器.js
/**
 * @param {number[]} height
 * @return {number}
 */
var maxArea = function (height) {
  let left = 0; // 左指针
  let right = height.length - 1; // 右指针
  let maxWater = 0; // 最大盛水量

  // 当左指针小于右指针时继续循环
  while (left < right) {
    // 计算当前宽度
    let width = right - left;
    // 计算当前高度（取左右两边较短的那一边）
    let currentHeight = Math.min(height[left], height[right]);
    // 计算当前面积
    let currentArea = width * currentHeight;
    // 更新最大面积
    maxWater = Math.max(maxWater, currentArea);

    // 移动较短的那一边指针
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return maxWater;
};

// 测试用例
console.log(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])); // 输出: 49
console.log(maxArea([1, 1])); // 输出: 1
console.log(maxArea([4, 3, 2, 1, 4])); // 输出: 16

// 这个解法使用了双指针技巧：
// 算法思路：
// 使用两个指针，一个从数组开头（left），一个从数组结尾（right）

// 计算当前两指针形成的容器的容量

// 每次移动较短边的那一侧指针，因为面积受限于较短边

// 更新最大容量

// 时间复杂度：O(n)，只需要遍历一次数组

// 空间复杂度：O(1)，只使用了常数级别的额外空间

// 工作原理：
// 容器的水量 = 宽度 × 最小高度

// 通过移动指针不断尝试不同的组合

// 移动较短边是因为如果移动较长边，宽度变小而高度不会变大，面积只会变小

// 示例说明：
// 对于 [1,8,6,2,5,4,8,3,7]

// 最大面积是 49（8和7之间的面积）

// 宽度为 8（索引8-0），高度为 7（两边最小值）
