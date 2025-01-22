/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var swapPairs = function (head) {
  // 创建哑节点，处理头节点删除的情况
  const dummy = new ListNode(0);
  dummy.next = head;

  // 定义快慢指针
  let slow = dummy;
  let fast = dummy;

  // 快指针先走n步
  for (let i = 0; i < n; i++) {
    fast = fast.next;
  }

  // 快慢指针一起走，直到快指针到达链表尾部
  while (fast.next) {
    slow = slow.next;
    fast = fast.next;
  }

  // 删除倒数第n个节点
  slow.next = slow.next.next;

  return dummy.next;
};
