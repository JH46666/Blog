/** 二叉树的最大深度 
 * Definition for a binary tree node.
 * function TreeNode(val) {
 *     this.val = val;
 *     this.left = this.right = null;
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number}
 */
var maxDepth = function(root) {
  if(root == null){
    return 0;
  }
  return Math.max(maxDepth(root.left),maxDepth(root.right)) + 1;
}
    

// 1. 什么是深度？
// 二叉树的深度是从根节点到某个叶子节点路径上的节点数。

// 最大深度是所有路径中最长的那条。

// 比如上面例子：
// 3 -> 9：深度 2

// 3 -> 20 -> 15：深度 3

// 3 -> 20 -> 7：深度 3

// 最大深度是 3。

// 2. 递归的直觉
// 树的深度可以用“分而治之”来算：
// 根节点的深度 = 左右子树中较大的深度 + 1。

// 子树的深度又可以用同样的方法算。

// 如果树是空的（null），深度就是 0。

























  
};