function typeOfValue(value) {
  const typeMap = {
    "[object Boolean]": "boolean",
    "[object Number]": "number",
    "[object String]": "string",
    "[object Function]": "function",
    "[object Array]": "array",
    "[object Date]": "date",
  };
  const result = Object.prototype.toString.call(value);
  const match = result.match(/\[object (\w+)\]/);
  if (match) {
    return match[1].toLowerCase();
  }
  return "unknown";
}
console.log("typeOfValue", typeOfValue(true));
