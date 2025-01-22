/**
 * @param {string} digits
 * @return {string[]}
 */
var letterCombinations = function (digits) {
  // 如果输入为空，返回空数组
  if (digits == 0) return [];
  // 定义电话按键的映射
  const phoneMap = {
    2: "abc",
    3: "def",
    4: "ghi",
    5: "jkl",
    6: "mno",
    7: "pqrs",
    8: "tuv",
    9: "wxyz",
  };
  var len = digits.length;
  // 结果数组
  const result = [];
  // 回溯函数

  function backtrack(index, path) {
    // 如果路径长度等于输入长度，说明找到了一个结果
    if (path.length == len) {
      result.push(path);
      return;
    }
    // 获取当前数字
    const digit = digits[index];
    // 获取当前数字对应的字母
    const letters = phoneMap[digit];
    // 遍历字母
    for (let letter of letters) {
      // 递归
      backtrack(index + 1, path + letter);
    }
  }
  // 开始回溯
  backtrack(0, "");
  return result;
};
var digits = "2";
var val = letterCombinations(digits);
console.log("val: ", val);
