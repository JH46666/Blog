/**
 * @param {string} s
 * @return {string}
 */
var decodeString = function (s) {
  const repeatStack = []; // 保存重复次数的栈
  const strStack = []; // 保存字符串的栈
  let repeatCount = 0; // 当前重复次数
  let currentStr = ""; // 当前字符串

  for (let i = 0; i < s.length; i++) {
    const char = s.charAt(i);

    if (char === "]") {
      // 取出重复次数
      let count = repeatStack.pop();
      // 生成重复字符串
      let temp = "";
      for (let j = 0; j < count; j++) {
        temp += currentStr;
      }
      // 和前面的字符串拼接
      currentStr = strStack.pop() + temp;
    } else if (char === "[") {
      // 将当前状态压入栈中
      repeatStack.push(repeatCount);
      strStack.push(currentStr);
      // 重置状态
      repeatCount = 0;
      currentStr = "";
    } else if (char >= "0" && char <= "9") {
      // 计算重复次数
      repeatCount = repeatCount * 10 + Number(char);
    } else {
      // 累积字符
      currentStr += char;
    }
  }

  return currentStr; // 返回最终结果
};
