// 反转链表
function reverseList(head) {
  if (!head || !head.next) return head;
  let prev = null;
  let cur = head;
  while (cur) {
    const next = cur.next;
    cur.next = prev;
    prev = next;
    cur = next;
  }
  return prev;
}
// 反转从位置{m, n}的链表
const reverseList = (head) => {
  let pre = null;
  let cur = head;

  while (cur) {
    const next = cur.next;
    cur.next = pre;
    pre = cur;
    cur = next;
  }
  return pre;
};
