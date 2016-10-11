import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import {Disposable} from 'widjet-disposables'
import {setPageContent, getTestRoot} from 'widjet-test-utils/dom'
import widgets from '../src/index'

let innerWidth, innerHeight, safeGetScreenSize

function resizeTo (w, h) {
  innerWidth = w
  innerHeight = h
  widgets.dispatch(window, 'resize', {}, {})
}

describe('widgets', () => {
  jsdom()

  let [spy, defineSpy, eventSpy, widget, element] = []

  beforeEach(() => {
    safeGetScreenSize = widgets.getScreenSize
    widgets.getScreenSize = function () {
      return [innerWidth, innerHeight]
    }
    widgets.reset()

    spy = sinon.spy()
    defineSpy = sinon.spy(options => spy)
    eventSpy = sinon.spy()

    resizeTo(1024, 768)

    setPageContent(`
      <div class="dummy"></div>
      <div class="dummy"></div>
    `)

    element = getTestRoot().querySelector('div')

    document.addEventListener('dummy:handled', eventSpy)

    widgets.define('dummy', defineSpy)
  })

  afterEach(() => {
    widgets.getScreenSize = safeGetScreenSize
  })

  it('raises an error when calling a widget that has not been defined', () => {
    expect(() => widgets('foo', '.dummy', {on: 'init'})).to.throwError()
  })

  describe('without on event', () => {
    beforeEach(() => {
      widgets('dummy', '.dummy')

      widget = widgets.widgetsFor(element, 'dummy')
    })

    it('initializes widgets on init', () => {
      expect(widget).not.to.be(null)
    })
  })

  describe('with an on event array', () => {
    beforeEach(() => {
      widgets('dummy', '.dummy', {on: ['load', 'resize']})

      widgets.dispatch(window, 'load')

      widget = widgets.widgetsFor(element, 'dummy')
    })

    it('initializes widgets on init', () => {
      expect(widget).not.to.be(null)
    })
  })

  describe('without any conditions', () => {
    beforeEach(() => {
      widgets('dummy', '.dummy', {on: 'load'})

      widgets.dispatch(window, 'load')

      widget = widgets.widgetsFor(element, 'dummy')
    })

    it('calls the definition function immediately', () => {
      expect(defineSpy.calledWith({})).to.be.ok()
      expect(defineSpy.callCount).to.eql(1)
    })

    it('calls the widget method and creates a widget', () => {
      expect(spy.calledOn(widget)).to.be.ok()
      expect(spy.callCount).to.eql(2)
      expect(spy.calledWith(element, widget)).to.be.ok()
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

    it('passes any extra options to the widget definition function', () => {
      setPageContent('<div class="dummy"></div>')
      element = getTestRoot().querySelector('div')

      widgets('dummy', '.dummy', {on: 'init', foo: 'bar', baz: 10})
      widget = widgets.widgetsFor(element, 'dummy')
      expect(defineSpy.calledWith({foo: 'bar', baz: 10})).to.be.ok()
      expect(spy.calledWith(element, widget)).to.be.ok()
    })

    it('calls the passed-in block when called with one', () => {
      spy = sinon.spy()

      setPageContent('<div class="dummy"></div>')
      element = getTestRoot().querySelector('div')

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

    describe('that is not a function', () => {
      beforeEach(() => {
        widgets('dummy', '.dummy', {on: 'custom:event', unless: true})

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

      it('activates the widget', () => {
        expect(widget.active).to.be.ok()
      })

      describe('when the window is resized so that the condition is no longer matched', () => {
        it('now deactivates the widget', () => {
          resizeTo(500, 1024)

          expect(widget.active).not.to.be.ok()
        })
      })
    })

    describe('that is a boolean value', () => {
      beforeEach(() => {
        widgets('dummy', '.dummy', {on: 'init', media: true})

        widget = widgets.widgetsFor(element, 'dummy')
      })

      it('activates the widget', () => {
        expect(widget.active).to.be.ok()
      })
    })

    describe('that is a function', () => {
      beforeEach(() => {
        widgets('dummy', '.dummy', {on: 'init', media: () => true})

        widget = widgets.widgetsFor(element, 'dummy')
      })

      it('activates the widget', () => {
        expect(widget.active).to.be.ok()
      })
    })
  })

  describe('with a target frame', () => {
    let targetFrame
    beforeEach(() => {
      setPageContent(`
        <iframe id='target-frame' width='100px' height='100px'></iframe>
      `)

      targetFrame = getTestRoot().querySelector('iframe')

      const doc = targetFrame.contentDocument ||
                  targetFrame.contentWindow.document

      doc.innerHTML = `
      <body>
        <div class="dummy"></div>
        <div class="dummy"></div>
      </body>
      `

      element = doc.querySelector('div')

      widgets('dummy', '.dummy', {on: 'init', targetFrame: '#target-frame'})

      widget = widgets.widgetsFor(element, 'dummy')
    })

    it('operates in the specified frame', () => {
      expect(widget).not.to.be(null)
    })
  })

  describe('that defines hooks', () => {
    beforeEach(() => {
      widgets.define('dummy', options => (element, widget) => {
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
        proto = options => ({
          initialize: sinon.spy(),
          activate: sinon.spy(),
          deactivate: sinon.spy(),
          dispose: sinon.spy()
        })

        widgets.delete('dummy')
        widgets.define('dummy', proto)

        widgets('dummy', '.dummy', {on: 'init'})

        widget = widgets.widgetsFor(element, 'dummy')
      })

      it('calls the object methods', () => {
        expect(widget.onInitialize.calledOn(widget)).to.be.ok()
        expect(widget.onActivate.calledOn(widget)).to.be.ok()
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
        widgets.define('dummy', () => () => new Disposable(spy))
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
      widgets.define('other-dummy', () => () => {})

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
      widgets.define('other-dummy', () => () => {})

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
      widgets.define('other-dummy', () => () => {})

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

  describe('.dispatch()', () => {
    it('uses the dispatchEvent method when available', () => {
      spy = sinon.spy()
      document.addEventListener('foo', spy)

      widgets.dispatch('foo')

      expect(spy.called).to.be.ok()
    })

    it('uses the fireEvent method when available', () => {
      const source = {
        fireEvent: sinon.spy()
      }
      widgets.dispatch(source, 'foo')

      expect(source.fireEvent.calledWith('onfoo')).to.be.ok()
    })
  })

  describe('.reset()', () => {
    beforeEach(() => {
      widgets.define('dummy2', (options) => (element) => {})
    })

    describe('without a name', () => {
      it('removes every widgets defined', () => {
        widgets.reset()

        expect(widgets.defined('dummy')).not.to.be.ok()
        expect(widgets.defined('dummy2')).not.to.be.ok()
      })
    })

    describe('with a name', () => {
      it('removes the widget defined with the specified name', () => {
        widgets.reset('dummy')

        expect(widgets.defined('dummy')).not.to.be.ok()
        expect(widgets.defined('dummy2')).to.be.ok()
      })
    })
  })

  describe('.getScreenSize()', () => {
    it('returns the window dimensions', () => {
      expect(safeGetScreenSize(window)).to.eql([
        window.innerWidth, window.innerHeight
      ])
    })
  })
})
