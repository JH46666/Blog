// ## 大数相乘
function multiplyBigNumber(num1, num2) {
  // 转为字符串并处理边界
  num1 = num1.toString();
  num2 = num2.toString();
  if (num1 === "0" || num2 === "0") return "0";

  const result = new Array(num1.length + num2.length).fill(0);
  for (let i = num1.length - 1; i >= 0; i--) {
    for (let j = num2.length - 1; j >= 0; j--) {
      const digit1 = parseInt(num1[i], 10);
      const digit2 = parseInt(num2[j], 10);
      const temp = digit1 * digit2 + result[i + j + 1];
      result[i + j + 1] = temp % 10;
      result[i + j] += Math.floor(temp / 10);
    }
  }
  // 转为字符串，去除前导 0
  let resultStr = result.join("");
  return resultStr.replace(/^0+/, "") || "0";
}
console.log(multiplyBigNumber("123456789", "987654321")); // 121932631112635269
