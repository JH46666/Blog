// Itersection of Multiple Arrays

// Input: nums = [[3,1,2,4,5],[1,2,3,4],[3,4,5,6]]
// Output: [3,4]

// Input: nums = [[1,2,3],[4,5,6]]
// Output: []

// 实现一个时间复杂度为 O(n) 的算法，找出多个数组的交集。
/**
 * @param {number[][]} nums
 * @return {number[]}
 */
var intersection = function (nums) {
  // 循环每个数组
  // 建立 hash 表，存储出现的数组
  const hash = new Map();
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums[i].length; j++) {
      if (hash.has(nums[i][j])) {
        const value = hash.get(nums[i][j]);
        hash.set(nums[i][j], value + 1);
      } else {
        hash.set(nums[i][j], 1);
      }
    }
  }
  // 把 hash 里面数字大于 nums.length 的取出来。就是存在公共的
  const array = [];
  for (let [key, value] of hash) {
    if (value === nums.length) {
      // 判断是否在所有数组中都出现过
      array.push(key);
    }
  }
  return array.sort((a, b) => a - b);
};
intersection([
  [3, 1, 2, 4, 5],
  [1, 2, 3, 4],
  [3, 4, 5, 6],
]);
