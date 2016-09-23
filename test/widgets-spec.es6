import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import {Disposable} from 'widjet-disposables'
import widgets from '../src/index'

function resizeTo (w, h) {
  window.innerWidth = w
  window.innerHeight = h
  widgets.dispatch(window, 'resize')
}

describe('widgets', () => {
  jsdom()

  let [spy, eventSpy, widget, element] = []

  beforeEach(() => {
    widgets.reset()

    spy = sinon.spy()
    eventSpy = sinon.spy()

    resizeTo(1024, 768)

    document.body.innerHTML = '<div class="dummy"></div>'
    element = document.body.querySelector('div')

    document.addEventListener('dummy:handled', eventSpy)

    widgets.define('dummy', spy)
  })

  it('raises an error when calling a widget that has not been defined', () => {
    expect(() => widgets('foo', '.dummy', {on: 'init'})).to.throwError()
  })

  describe('without any conditions', () => {
    beforeEach(() => {
      widgets('dummy', '.dummy', {on: 'custom:event'})

      widgets.dispatch('custom:event')

      widget = widgets.widgetsFor(element, 'dummy')
    })

    it('calls the widget method and creates a widget', () => {
      expect(spy.calledOn(widget)).to.be.ok()
      expect(spy.calledWith(element, {}, widget)).to.be.ok()
      expect(widget.element).to.be(element)
    })

    it('activates the widget object', () => {
      expect(widget.active).to.be.ok()
    })

    it('emits an event', () => {
      expect(eventSpy.called).to.be.ok()
    })

    it('decorates the target node with a handled class', () => {
      expect(element.classList.contains('dummy-handled')).to.be.ok()
    })

    it('passes any extra options to the widget function', () => {
      document.body.innerHTML = '<div class="dummy"></div>'
      element = document.body.querySelector('div')

      widgets('dummy', '.dummy', {on: 'init', foo: 'bar', baz: 10})
      widget = widgets.widgetsFor(element, 'dummy')

      expect(spy.calledWith(element, {foo: 'bar', baz: 10}, widget)).to.be.ok()
    })

    it('calls the passed-in block when called with one', () => {
      spy = sinon.spy()

      document.body.innerHTML = '<div class="dummy"></div>'
      element = document.body.querySelector('div')

      widgets('dummy', '.dummy', {on: 'init', foo: 'bar', baz: 10}, spy)

      widget = widgets.widgetsFor(element, 'dummy')

      expect(spy.calledOn(element)).to.be.ok()
      expect(spy.calledWith(element, widget)).to.be.ok()
    })
  })

  describe('with a if condition', () => {
    describe('that returns true', () => {
      beforeEach(() => {
        widgets('dummy', '.dummy', {on: 'custom:event', if: () => true})

        widgets.dispatch('custom:event')
      })

      it('calls the widget handler', () => {
        expect(spy.called).to.be.ok()
      })
    })

    describe('that returns false', () => {
      beforeEach(() => {
        widgets('dummy', '.dummy', {on: 'custom:event', if: () => false})
        widgets.dispatch('custom:event')
      })

      it('does not call the widget handler', () => {
        expect(spy.called).not.to.be.ok()
      })
    })
  })

  describe('with a unless condition', () => {
    describe('that returns true', () => {
      beforeEach(() => {
        widgets('dummy', '.dummy', {on: 'custom:event', unless: () => true})

        widgets.dispatch('custom:event')
      })

      it('does not call the widget handler', () => {
        expect(spy.called).not.to.be.ok()
      })
    })

    describe('that returns false', () => {
      beforeEach(() => {
        widgets('dummy', '.dummy', {on: 'custom:event', unless: () => false})

        widgets.dispatch('custom:event')
      })

      it('calls the widget handler', () => {
        expect(spy.called).to.be.ok()
      })
    })
  })

  describe('with a media condition', () => {
    describe('that is not fulfilled at the widget creation', () => {
      beforeEach(() => {
        widgets('dummy', '.dummy', {on: 'init', media: {max: 768}})

        widget = widgets.widgetsFor(element, 'dummy')
      })

      it('does not activate the widget', () => {
        expect(widget.active).not.to.be.ok()
      })

      describe('when the window is resized so that the condition is matched', () => {
        it('now activates the widget', () => {
          resizeTo(500, 1024)

          expect(widget.active).to.be.ok()
        })
      })
    })

    describe('that is fulfilled at the widget creation', () => {
      beforeEach(() => {
        widgets('dummy', '.dummy', {on: 'init', media: {min: 768}})

        widget = widgets.widgetsFor(element, 'dummy')
      })

      it('does not activate the widget', () => {
        expect(widget.active).to.be.ok()
      })

      describe('when the window is resized so that the condition is matched', () => {
        it('now activates the widget', () => {
          resizeTo(500, 1024)

          expect(widget.active).not.to.be.ok()
        })
      })
    })
  })

  describe('that defines hooks', () => {
    beforeEach(() => {
      widgets.define('dummy', (element, options, widget) => {
        widget.onActivate = sinon.spy()
        widget.onDeactivate = sinon.spy()
        widget.onInitialize = sinon.spy()
        widget.onDispose = sinon.spy()
      })
      widgets('dummy', '.dummy', {on: 'init'})
      widget = widgets.widgetsFor(element, 'dummy')
    })

    it('calls the initialization and activation hooks on creation', () => {
      expect(widget.onInitialize.calledOn(widget)).to.be.ok()
      expect(widget.onActivate.calledOn(widget)).to.be.ok()
    })

    it('calls the deactivation hooks on deactivation', () => {
      widget.deactivate()
      expect(widget.onDeactivate.calledOn(widget)).to.be.ok()
    })

    it('calls the dispose hooks on disposal', () => {
      widget.dispose()
      expect(widget.onDispose.calledOn(widget)).to.be.ok()
    })
  })

  describe('.define()', () => {
    let proto
    describe('with an object instead of a function', () => {
      beforeEach(() => {
        proto = {
          initialize: sinon.spy(),
          activate: sinon.spy(),
          deactivate: sinon.spy(),
          dispose: sinon.spy()
        }

        widgets.delete('dummy')
        widgets.define('dummy', proto)

        widgets('dummy', '.dummy', {on: 'init'})

        widget = widgets.widgetsFor(element, 'dummy')
      })

      it('calls the object methods', () => {
        expect(proto.initialize.calledOn(widget)).to.be.ok()
        expect(proto.activate.calledOn(widget)).to.be.ok()
      })
    })
  })

  describe('.widgetsFor()', () => {
    describe('when called without a widget name', () => {
      it('returns all the widgets for the element', () => {
        widgets('dummy', '.dummy', {on: 'init'})
        const elementWidgets = widgets.widgetsFor(element)

        expect(elementWidgets).to.have.length(1)
      })
    })
  })

  describe('.dispose()', () => {
    it('removes the class on the target element', () => {
      widgets('dummy', '.dummy', {on: 'init'})
      widget = widgets.widgetsFor(element, 'dummy')
      widget.dispose()
      expect(element.classList.contains('dummy-handled')).not.to.be.ok()
    })

    describe('when the widget handler returns a disposable', () => {
      beforeEach(() => {
        spy = sinon.spy()
        widgets.define('dummy', () => new Disposable(spy))
        widgets('dummy', '.dummy', {on: 'init'})
        widget = widgets.widgetsFor(element, 'dummy')

        widget.dispose()
      })

      it('calls the disposable dispose method', () => {
        expect(spy.called).to.be.ok()
      })
    })
  })

  describe('.delete()', () => {
    it('deletes the widgets definition', () => {
      widgets.delete('dummy')
      expect(() => widgets('dummy', '.dummy', {on: 'init'})).to.throwError()
    })

    describe('when there is already instances of that widget', () => {
      it('does not disposes the instances', () => {
        widgets('dummy', '.dummy', {on: 'init'})
        widget = widgets.widgetsFor('dummy')

        widgets.delete('dummy')

        expect(widget.disposed).not.to.be.ok()
      })
    })
  })

  describe('.deactivate()', () => {
    let otherWidget

    beforeEach(() => {
      widgets.define('other-dummy', () => {})

      widgets('dummy', '.dummy', {on: 'init'})
      widgets('other-dummy', '.dummy', {on: 'init'})
      widget = widgets.widgetsFor(element, 'dummy')
      otherWidget = widgets.widgetsFor(element, 'other-dummy')
    })

    describe('called with any name', () => {
      it('deactivates all the instances of all widgets', () => {
        widgets('dummy', '.dummy', {on: 'init'})
        widgets.deactivate()

        expect(widget.active).not.to.be.ok()
        expect(otherWidget.active).not.to.be.ok()
      })
    })

    describe('called with a single name', () => {
      it('deactivates all the instances of the specified widget', () => {
        widgets.deactivate('other-dummy')

        expect(widget.active).to.be.ok()
        expect(otherWidget.active).not.to.be.ok()
      })
    })

    describe('called with several names', () => {
      it('deactivates all the instances of the specified widgets', () => {
        widgets.deactivate('other-dummy', 'dummy')

        expect(widget.active).not.to.be.ok()
        expect(otherWidget.active).not.to.be.ok()
      })
    })
  })

  describe('.activate()', () => {
    let otherWidget

    beforeEach(() => {
      widgets.define('other-dummy', () => {})

      widgets('dummy', '.dummy', {on: 'init'})
      widgets('other-dummy', '.dummy', {on: 'init'})
      widget = widgets.widgetsFor(element, 'dummy')
      otherWidget = widgets.widgetsFor(element, 'other-dummy')

      widgets.deactivate()
    })

    describe('called with any name', () => {
      it('activates all the instances of all widgets', () => {
        widgets.activate()

        expect(widget.active).to.be.ok()
        expect(otherWidget.active).to.be.ok()
      })
    })

    describe('called with a single name', () => {
      it('activates all the instances of the specified widget', () => {
        widgets.activate('dummy')

        expect(widget.active).to.be.ok()
        expect(otherWidget.active).not.to.be.ok()
      })
    })

    describe('called with several names', () => {
      it('activates all the instances of the specified widgets', () => {
        widgets.activate('other-dummy', 'dummy')

        expect(widget.active).to.be.ok()
        expect(otherWidget.active).to.be.ok()
      })
    })
  })

  describe('.release()', () => {
    let otherWidget

    beforeEach(() => {
      widgets.define('other-dummy', () => {})

      widgets('dummy', '.dummy', {on: 'init'})
      widgets('other-dummy', '.dummy', {on: 'init'})
      widget = widgets.widgetsFor(element, 'dummy')
      otherWidget = widgets.widgetsFor(element, 'other-dummy')
    })

    describe('called with any name', () => {
      it('disposes all the instances of all widgets', () => {
        widgets.release()

        expect(widget.disposed).to.be.ok()
        expect(otherWidget.disposed).to.be.ok()
      })
    })

    describe('called with a single name', () => {
      it('disposes all the instances of the specified widget', () => {
        widgets.release('dummy')

        expect(widget.disposed).to.be.ok()
        expect(otherWidget.disposed).not.to.be.ok()
      })
    })

    describe('called with several names', () => {
      it('disposes all the instances of the specified widgets', () => {
        widgets.release('other-dummy', 'dummy')

        expect(widget.disposed).to.be.ok()
        expect(otherWidget.disposed).to.be.ok()
      })
    })
  })
})
