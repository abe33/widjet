export default class Widget {
  constructor (element, handler, options, handledClass) {
    this.active = false
    this.element = element
    this.options = options
    this.handledClass = handledClass

    if (typeof handler === 'object') {
      this.onInitialize = handler.initialize
      this.onActivate = handler.activate
      this.onDeactivate = handler.deactivate
      this.onDispose = handler.dispose
    } else {
      this.handler = handler
    }
  }

  activate () {
    if (this.active) { return }

    this.onActivate && this.onActivate()
    this.active = true
  }

  deactivate () {
    if (!this.active) { return }

    this.onDeactivate && this.onDeactivate()
    this.active = false
  }

  init () {
    if (this.initialized) { return }

    this.element.classList.add(this.handledClass)
    const args = [this.element, this]
    if (this.handler) { this.disposable = this.handler.apply(this, args) }
    this.onInitialize && this.onInitialize()

    this.initialized = true
  }

  dispose () {
    if (this.disposed) { return }

    this.element.classList.remove(this.handledClass)

    this.disposable && this.disposable.dispose()
    this.onDispose && this.onDispose()

    delete this.element
    delete this.handler
    delete this.handledClass
    delete this.disposable

    this.disposed = true
  }
}
