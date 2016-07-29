export default class Widget {
  constructor (element) {
    this.active = false
    this.element = element
  }

  activate () {
    if (this.active) { return }
    this.active = true
    this.activated && this.activated()
  }

  deactivate () {
    if (!this.active) { return }
    this.active = false
    this.deactivated && this.deactivated()
  }

  init () { this.initialized && this.initialized() }

  dispose () { this.disposed && this.disposed() }
}
