/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 * 输入：(2 -> 4 -> 3) + (5 -> 6 -> 4)
 * 输出：7 -> 0 -> 8
 * 原因：342 + 465 = 807
 */
/**
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
var addTwoNumbers = function (l1, l2) {
  // 哑节点，简化头节点处理
  const dummy = new ListNode(0);
  let current = dummy; // 当前节点指针
  let carry = 0; // 进位

  // 当 l1 或 l2 有节点，或有进位时继续
  while (l1 || l2 || carry) {
    // 取当前位值，没节点就用 0
    const x = l1 ? l1.val : 0;
    const y = l2 ? l2.val : 0;

    // 计算当前位和进位
    const sum = x + y + carry;
    carry = Math.floor(sum / 10); // 新进位
    const digit = sum % 10; // 当前位结果

    // 创建新节点
    current.next = new ListNode(digit);
    current = current.next;

    // 移动指针
    l1 = l1 ? l1.next : null;
    l2 = l2 ? l2.next : null;
  }

  return dummy.next; // 返回结果链表
};
