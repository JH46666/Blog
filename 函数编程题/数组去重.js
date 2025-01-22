// 方式一 for循环
function unoArr(arr) {
  const arr1 = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr1.indexOf(arr[i]) === -1) {
      arr1.push(arr[i]);
    }
  }
  return arr1;
}

// 方式二  new Set
function dosArr(arr) {
  const arr1 = [...new Set(arr)];
  return arr1;
}
