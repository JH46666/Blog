// 请你设计并实现一个满足  LRU (最近最少使用) 缓存 约束的数据结构。
// 实现 LRUCache 类：
// LRUCache(int capacity) 以 正整数 作为容量 capacity 初始化 LRU 缓存
// int get(int key) 如果关键字 key 存在于缓存中，则返回关键字的值，否则返回 -1 。
// void put(int key, int value) 如果关键字 key 已经存在，则变更其数据值 value ；如果不存在，则向缓存中插入该组 key-value 。如果插入操作导致关键字数量超过 capacity ，则应该 逐出 最久未使用的关键字。
// 函数 get 和 put 必须以 O(1) 的平均时间复杂度运行。

// 解题思路
// 1、一个节点包含key、value、pre和next；
// 2、定义两个哨兵节点-头结点、尾节点；
// 3、使用map保存所以的节点；
// 4、get方法：如果map中存在key，将节点移动到头部；
// 5、put方法：如果map中存在key，更新value并移动到头部；如果不存在，创建新节点并添加到头部，如果容量超出，删除尾节点；
// 6、删除节点：将节点的前一个节点的next指向节点的下一个节点，节点的下一个节点的pre指向节点的前一个节点；
/**
 * @param {number} capacity
 */
var LRUCache = function (capacity) {
  this.capacity = capacity;
  this.map = new Map();
  this.head = {};
  this.tail = {};
  this.head.next = this.tail;
  this.tail.pre = this.head;
};
LRUCache.prototype.moveToHead = function (node) {
  this.deleteNode(node); // 先从链表中移除
  this.addToHead(node); // 再添加头部
};
LRUCache.prototype.deleteNode = function (node) {
  node.pre.next = node.next;
  node.next.pre = node.pre;
};
LRUCache.prototype.addToHead = function (node) {
  node.next = this.head.next;
  node.pre = this.head;
  this.head.next.pre = node;
  this.head.next = node;
};
/**
 * @param {number} key
 * @return {number}
 */
LRUCache.prototype.get = function (key) {
  if (this.map.has(key)) {
    const node = this.map.get(key);
    this.moveToHead(node);
    return node.value;
  }
  return -1;
};

/**
 * @param {number} key
 * @param {number} value
 * @return {void}
 */
LRUCache.prototype.put = function (key, value) {
  if (this.map.has(key)) {
    // 更新
    const node = this.map.get(key);
    node.value = value;
    this.moveToHead(node);
    return;
  }
  // 如果 key 不存在，创建新节点并添加到链表头部
  const newNode = { key, value };
  this.map.set(key, newNode);
  this.addToHead(newNode);

  if (this.map.size > this.capacity) {
    const lastNode = this.tail.pre;
    this.deleteNode(lastNode);
    this.map.delete(lastNode.key);
  }
};

/**
 * Your LRUCache object will be instantiated and called as such:
 * var obj = new LRUCache(capacity)
 * var param_1 = obj.get(key)
 * obj.put(key,value)
 */

// 简易版本
function LRUCache(capacity) {
  if (capacity < 1) return;
  const map = new Map();
  function get(key) {
    if (map.has(key)) {
      const result = map.get(key);
      if (typeof result === "number") {
        // MoveToHead
        map.delete(key);
        map.set(key, result);
        return result;
      }
    }
    return -1;
  }
  function put(key, value) {
    if (map.has(key)) {
      // MoveToHead
      map.delete(key);
      map.set(key, value);
    } else {
      // addToHead
      map.set(key, value);
      if (map.size > capacity) {
        // removeTail
        const firstKey = ((map) => {
          for (const key of map.keys()) {
            return key;
          }
          throw Error("empty map");
        })(map);
        map.delete(firstKey);
      }
    }
  }
  return { get, put };
}
