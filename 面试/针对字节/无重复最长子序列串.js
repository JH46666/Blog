function lengthOfLongestSubstring(s) {
  if (!s) return 0;
  let map = new Map();
  let start = 0;
  let maxLength = 0;
  for (let i = 0; i < s.length; i++) {
    // 当存在，需要更新 start
    if (map.has(s[i])) {
      start = Math.max(start, map.get(s[i]) + 1);
    }
    map.set(s[i], i);
    maxLength = Math.max(maxLength, i - start + 1);
  }
  return maxLength;
}
console.log(lengthOfLongestSubstring("abcabcbb"));
