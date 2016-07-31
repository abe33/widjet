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

    this.active = true
  }

  deactivate () {
    if (!this.active) { return }

    this.active = false
  }

  init () {
    if (this.initialized) { return }

    this.element.classList.add(this.handledClass)
    this.disposable = this.handler(this.element, this.options)

    this.initialized = true
  }

  dispose () {
    if (this.disposed) { return }

    this.element.classList.remove(this.handledClass)
    this.disposable && this.disposable.dispose()

    delete this.element
    delete this.options
    delete this.handler
    delete this.handledClass
    delete this.disposable

    this.disposed = true
  }
}
