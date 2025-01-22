// ## 滑动窗口
/**
 * @param {string} s
 * @return {string} //返回最长回文子串
 */
var longestPalindrome_bf = function (s, res = s[0]) {
  //回文的特点就是对称
  //是否是回文  判断方式 倒着来res 输出跟输入看是否一样
  const isHui = (val) => {
    // 回文判断
    let res = "";
    for (let i = val.length - 1; i >= 0; i--) {
      res += val[i];
    }
    return val === res;
  };
  for (let i = 0; i < s.length - res.length; i++) {
    for (let j = s.length; j > res.length - i; j--) {
      let cache = s.slice(i, j);
      if (isHui(cache)) {
        res = res.length < cache.length ? cache : res;
        break;
      }
    }
  }

  return res;
};
// 复杂度太高了
longestPalindrome_bf("babad");

// var longestPalindrome_bf = function (s) {
//   if (!s) return "";
//   var maxLength = 1;
//   var start = 0;
//   var expandAroundCenter = function (left, right) {
//     while (left >= 0 && right < s.length && s[left] === s[right]) {
//       left--;
//       right++;
//     }
//     return [right - left - 1, left + 1];
//   };
//   for (var i = 0; i < s.length; i++) {
//     // 奇数长度回文
//     let [len1, start1] = expandAroundCenter(i, i);
//     // 偶数长度回文
//     let [len2, start2] = expandAroundCenter(i, i + 1);
//     if (len1 > maxLength) {
//       maxLength = len1;
//       start = start1;
//     }
//     if (len2 > maxLength) {
//       maxLenth = len2;
//       start = start2;
//     }
//   }
//   return s.substring(start, start + maxLength);
// };

// 中心扩散算法
/**
 * @param {string} s
 * @return {string}
 */

//中心扩散法
var longestPalindrome = function (s) {
  let max = 0; // 当前最大回文串的长度
  let start = -1; // 当前最大回文串的起始索引
  const l = s.length; // s 的长度
  for (let i = 0; i < l; i++) {
    // 遍历 s
    let now = 1; // 当前回文串的长度
    let l = i - 1; // 左侧开始遍历的指针
    while (s[i + 1] === s[i]) {
      // 如果当前字符后边的字符都一样, 当前长度 + 1,  s遍历指针向后推
      now++;
      i++;
    }
    let r = i + 1; // 获取右侧开始遍历的指针
    while (s[l] === s[r] && s[l] !== undefined) {
      // 从连续字符两端开始像两侧扩展,直到越界或者不一致,一致的直接累积到当前长度中,修改左右指针
      now += 2;
      l--;
      r++;
    }
    if (now > max) {
      // 判断与之前最大的对比,更新当前最大回文串的起始索引
      max = now;
      start = l + 1;
    }
  }
  return s.slice(start, start + max); // 通过最大长度和起始索引,获取需要的字符串
};
