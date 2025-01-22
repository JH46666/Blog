/**
 * @param {number} dividend
 * @param {number} divisor
 * @return {number}
 */
var divide = function (dividend, divisor) {
  // 定义 32 位 整数边界
  const MAX_INT = 2 ** 31 - 1;
  const MIN_INT = -(2 ** 31);

  // 特殊情况：溢出
  if (dividend === MIN_INT && divisor === -1) {
    return MAX_INT;
  }
  // 记录符号，转换为正数运算
  const sign = (dividend > 0) ^ (divisor > 0) ? -1 : 1;
  dividend = Math.abs(dividend);
  divisor = Math.abs(divisor);

  // 初始化结果
  let res = 0;

  while (dividend >= divisor) {
    dividend -= divisor;
    res++;
  }
  return sign * res;
};

// var dividend = 10, divisor = 3;
// var dividend = 7, divisor = -3;
// var dividend = -7, divisor = 3;
// var dividend = -1, divisor = 1;
// var dividend = -2147483648, divisor = -1;
var dividend = 2147483647,
  divisor = 1;

var val = divide(dividend, divisor);
console.log("val: ", val);
