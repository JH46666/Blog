// 下划线转换驼峰
function toHump(name) {
  return name.replace(/\_(\w)/g, function (all, letter) {
    return letter.toUpperCase();
  });
}
function toHump(a) {
  // 首先切割出来， 字符串变成数组
  let arr = a.split("");
  console.log("ar", arr);
  // 把下划线的 index 记录下来，index+1就是要变成大写的
  const newArry = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== "_") {
      newArry.push(arr[i]);
    } else {
      newArry[i + 1] = arr[i + 1].toUpperCase();
      // 同时i++,跳过
      i++;
    }
  }
  return newArry.join("");
}

function toHump(a) {
  const arr = a.split("");
  const result = [];
  let skipNext = false; // 标记是否跳过下一个字符

  for (let i = 0; i < arr.length; i++) {
    const currentChar = arr[i];
    if (skipNext) {
      // 跳过当前字符，因为前面的下划线已经处理过
      skipNext = false;
      continue;
    }

    if (currentChar === "_") {
      // 处理下划线后的字符
      const nextIndex = i + 1;
      if (nextIndex < arr.length) {
        result.push(arr[nextIndex].toUpperCase());
        skipNext = true; // 标记跳过下一个字符
      }
      // 跳过当前下划线
      continue;
    }

    // 非下划线字符直接添加到结果数组
    result.push(currentChar);
  }

  return result.join("");
}

// 驼峰转换下划线
function toLine(name) {
  return name.replace(/([A-Z])/g, "_$1").toLowerCase();
}

function changeStr(str) {
  if (str.split("_").length == 1) return;
  str.split("_").reduce((a, b) => {
    var value = a + b.substr(0, 1).toUpperCase() + b.substr(1);
    return value;
  });
}

// 测试
let a = "a_b2_345_c2345";
console.log(toHump(a));

let b = "aBdaNf";
console.log(toLine(b));
