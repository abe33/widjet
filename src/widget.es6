export default class Widget {
  constructor (element, handler, options, handledClass) {
    this.active = false
    this.element = element
    this.handler = handler
    this.options = options
    this.handledClass = handledClass
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
    const args = [this.element, this.options, this]
    this.disposable = this.handler.apply(this, args)
    this.onInitialize && this.onInitialize()

    this.initialized = true
  }

  dispose () {
    if (this.disposed) { return }

    this.element.classList.remove(this.handledClass)

    this.disposable && this.disposable.dispose()
    this.onDispose && this.onDispose()

    delete this.element
    delete this.options
    delete this.handler
    delete this.handledClass
    delete this.disposable

    this.disposed = true
  }
}
