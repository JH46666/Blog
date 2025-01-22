// ## 字符串相加

var addString = function (num1, num2) {
  if (num1 === num2 && num1 === "0") {
    return num1;
  }
  //  切成数组倒过来，
};

var addString1 = function (num1, num2) {
  let i = num1.length - 1;
  let j = num2.length - 1;
  let carry = 0; // 进位数，即留到下一轮相加的数
  let res = [];
  while (i >= 0 || j >= 0 || carry !== 0) {
    // 这两个三元判断是为了防止相加的两个字符串的长度不同 或者 相加完后还需要进位，此时用0补充
    const v1 = i >= 0 ? num1.charAt(i) - "0" : 0;
    const v2 = j >= 0 ? num2.charAt(j) - "0" : 0;
    let val = v1 + v2 + carry;
    res.push(val % 10); // 将相加后的个位数放进数组
    carry = Math.floor(val / 10); // 相加后的十位数
    // 两个指针继续往前走
    i--;
    j--;
  }
  return res.reverse().join("");
};

var num1 = "11",
  num2 = "123";
addString(num1, num2);
