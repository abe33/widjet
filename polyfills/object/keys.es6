if (!Object.keys) {
  Object.keys = function (o) {
    const a = []
    for (let k in o) { a.push(k) }
    return a
  }
}
