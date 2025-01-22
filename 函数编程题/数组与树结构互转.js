const arr = [
  {
    id: 2,
    name: "部门B",
    parentId: 0,
  },
  {
    id: 3,
    name: "部门C",
    parentId: 1,
  },
  {
    id: 1,
    name: "部门A",
    parentId: 2,
  },
  {
    id: 4,
    name: "部门D",
    parentId: 1,
  },
  {
    id: 5,
    name: "部门E",
    parentId: 2,
  },
  {
    id: 6,
    name: "部门F",
    parentId: 3,
  },
  {
    id: 7,
    name: "部门G",
    parentId: 2,
  },
  {
    id: 8,
    name: "部门H",
    parentId: 4,
  },
];

const arrToTree = function (arr) {
  if (!Array.isArray(arr)) {
    return arr;
  }
  if (!arr.length) {
    return [];
  }
  const map = new Map();
  const result = [];
  arr.forEach((item) => {
    map[item.id] = { ...item, children: [] };
  });
  console.log(map);
  arr.forEach((item) => {
    const node = map[item.id];
    if (item.parentId === 0) {
      result.push(node);
    } else {
      const parent = map[item.parentId];
      if (parent) {
        parent.children.push(node);
      }
    }
  });
  return result;
};
// 解释：

// 首先，创建一个 map 对象，将每个节点的 id 映射到对应的节点对象，并初始化 children 属性为空数组。
// 然后，遍历原始数组，对于每个节点，检查其 parentId：
// 如果 parentId 为 0，表示该节点是根节点，将其添加到 result 数组中。
// 如果 parentId 不为 0，表示该节点有父节点，将其添加到父节点的 children 数组中。

console.log(arrToTree(arr));

const tree = [
  {
    id: 1,
    name: "部门1",
    children: [
      {
        id: 2,
        name: "部门2",
        children: [
          { id: 4, name: "部门4", children: [] },
          { id: 5, name: "部门5", children: [] },
        ],
      },
      { id: 3, name: "部门3", children: [] },
    ],
  },
  { id: 6, name: "部门6", children: [] },
];

function treeToList(tree) {
  const result = [];

  function traverse(node) {
    const { children, ...rest } = node;
    result.push(rest);
    if (children) {
      children.forEach(traverse);
    }
  }

  tree.forEach(traverse);
  return result;
}

console.log(treeToList(tree));

// 解释：
// traverse 函数用于递归遍历树形结构的每个节点。
// 在遍历过程中，使用解构赋值 { children, ...rest } = node; 移除 children 属性，以避免冗余数据。
// 将处理后的节点添加到结果数组 result 中。
// 递归遍历完成后，返回包含所有节点的扁平化数组。
