/**
 * @param {number[]} nums
 * @return {number}
 */
/**
 * @param {number[]} nums
 * @return {number}
 */
var removeDuplicates = function (nums) {
  // 数组为空或只有一个元素，直接返回长度
  if (nums.length === 0) return 0;
  if (nums.length === 1) return 1;

  // 慢指针slow, 指向新数组的最后一个位置
  let slow = 0;
  for (let fast = 1; fast < nums.length; fast++) {
    // 如果当前元素和慢指针指向的元素不同，说明不重复
    if (nums[fast] !== nums[slow]) {
      slow++; // 慢指针前进一位
      nums[slow] = nums[fast]; // 把不重复的元素放到慢指针位置
    }
  }

  // 返回新长度
  return slow + 1;
};

// 测试
let nums1 = [1, 1, 2];
console.log("长度:", removeDuplicates(nums1), "数组:", nums1); // 2, [1, 2, 2]

let nums2 = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4];
console.log("长度:", removeDuplicates(nums2), "数组:", nums2); // 5, [0, 1, 2, 3, 4, 2, 2, 3, 3, 4]

// 思路讲解
// 1. 问题分析
// 因为数组是有序的，重复元素一定挨在一起，比如 [1,1,2] 或 [0,0,1,1]。

// 我们不需要真的“删除”元素，只要把不重复的元素挪到数组前面，返回新长度就行。

// 题目要求原地操作，不能用新数组，只能覆盖原数组。

// 2. 双指针的直觉
// 慢指针（slow）：像个“记录员”，记录不重复元素应该放的位置。

// 快指针（fast）：像个“侦察兵”，跑遍数组，找到不重复的元素。

// 规则：如果 fast 找到的元素跟 slow 当前指向的不同，就把这个新元素交给 slow，让 slow 前进一步。

// 3. 实现步骤
// 初始化：
// slow 从 0 开始，因为第一个元素肯定保留。

// fast 从 1 开始，检查后续元素。

// 遍历：
// fast 跑遍数组，比较 nums[fast] 和 nums[slow]：
// 如果一样，说明重复，fast 继续跑。

// 如果不一样，说明找到新元素：
// slow 前进一步（准备放新元素）。

// 把 nums[fast] 赋值到 nums[slow]。

// 返回：
// slow 最后停在不重复部分的最后一个位置，新长度是 slow + 1。

// 4. 举例推演
// 拿 [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]：
// 初始：slow = 0, fast = 1, nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]

// fast = 1：nums[1] = 0，跟 nums[0] = 0 一样，跳过。

// fast = 2：nums[2] = 1，跟 nums[0] = 0 不一样：
// slow = 1, nums[1] = 1, 数组变成 [0, 1, 1, 1, 1, 2, 2, 3, 3, 4]

// fast = 3：nums[3] = 1，跟 nums[1] = 1 一样，跳过。

// fast = 4：nums[4] = 1，一样，跳过。

// fast = 5：nums[5] = 2，跟 nums[1] = 1 不一样：
// slow = 2, nums[2] = 2, 数组变成 [0, 1, 2, 1, 1, 2, 2, 3, 3, 4]

// fast = 6：nums[6] = 2，一样，跳过。

// fast = 7：nums[7] = 3，不一样：
// slow = 3, nums[3] = 3, 数组变成 [0, 1, 2, 3, 1, 2, 2, 3, 3, 4]

// fast = 8：nums[8] = 3，一样，跳过。

// fast = 9：nums[9] = 4，不一样：
// slow = 4, nums[4] = 4, 数组变成 [0, 1, 2, 3, 4, 2, 2, 3, 3, 4]

// 结束：slow = 4，返回 4 + 1 = 5。
