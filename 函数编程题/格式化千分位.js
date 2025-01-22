function numFormat(num) {
  if (num.toString().indexOf(".") !== -1) {
    var b = num.toLocaleString();
    return b;
  } else {
    var c = num.toString().replace(/(\d)(?=(?:\d{3})+$)/g, "$1,");
    return c;
  }
}

// ## toLocaleString()方法我的理解是用于返回某语言系统下数字的表示字符串
(10122.22).toLocaleString("en-US", { style: "currency", currency: "USD" });

1001;
