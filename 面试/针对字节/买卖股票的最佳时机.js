// # 买卖股票的最佳时机
function maxProfit(prices) {
  if (!prices || prices.length < 2) return 0; // 数组为空或只有一个元素，无法交易

  let minPrice = prices[0]; // 记录最低买入价格
  let maxProfit = 0; // 记录最大利润

  // 从第 1 天开始遍历
  for (let i = 1; i < prices.length; i++) {
    // 更新最低买入价格
    minPrice = Math.min(minPrice, prices[i]);
    // 更新最大利润：当前价格卖出时的利润 vs 之前最大利润
    maxProfit = Math.max(maxProfit, prices[i] - minPrice);
  }

  return maxProfit;
}

// 测试用例
console.log(maxProfit([7, 1, 5, 3, 6, 4])); // 输出 5
console.log(maxProfit([7, 6, 4, 3, 1])); // 输出 0
console.log(maxProfit([2, 4, 1])); // 输出 2
console.log(maxProfit([])); // 输出 0
