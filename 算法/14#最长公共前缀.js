/**
 * @param {string[]} strs
 * @return {string}
 */
function longestCommonPrefix(strs) {
  if (strs.length === 0) return ""; // 如果数组为空，直接返回空字符串

  let prefix = strs[0]; // 以第一个字符串作为初始前缀

  for (let i = 1; i < strs.length; i++) {
    while (strs[i].indexOf(prefix) !== 0) {
      // 如果当前字符串不包含前缀
      prefix = prefix.slice(0, prefix.length - 1); // 缩短前缀
      if (prefix === "") return ""; // 如果前缀为空，直接返回
    }
  }

  return prefix; // 返回最长公共前缀
}

// 示例用法
const strs = ["flower", "flow", "flight"];
console.log(longestCommonPrefix(strs)); // 输出 "fl"
