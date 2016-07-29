export default class Hash {
  constructor () {
    this.clear()
  }

  clear () {
    this.keys = []
    this.values = []
  }

  set (key, value) {
    if (this.hasKey(key)) {
      const index = this.keys.indexOf(key)
      this.keys[index] = key
      this.values[index] = value
    } else {
      this.keys.push(key)
      this.values.push(value)
    }
  }

  get (key) { return this.values[ this.keys.indexOf(key) ] }

  getKey (value) { return this.keys[ this.values.indexOf(value) ] }

  hasKey (key) { return this.keys.indexOf(key) > 0 }

  unset (key) {
    const index = this.keys.indexOf(key)
    this.keys.splice(index, 1)
    this.values.splice(index, 1)
  }

  each (block) { this.values.forEach(block) }

  eachKey (block) { this.keys.forEach(block) }

  eachPair (block) {
    if (!block) { return }

    this.keys.forEach(key => block(key, this.get(key)))
  }
}
