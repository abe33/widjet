import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import {Disposable} from 'widjet-disposables'
import widgets from '../src/index'

describe('widgets', () => {
  jsdom()

  let [spy, eventSpy, widget, element] = []

  beforeEach(() => {
    spy = sinon.spy()
    eventSpy = sinon.spy()

    document.body.innerHTML = '<div class="dummy"></div>'
    element = document.body.querySelector('div')

    document.addEventListener('dummy:handled', eventSpy)

    widgets.define('dummy', spy)
  })

  afterEach(() => widgets.reset())

  describe('without any conditions', () => {
    beforeEach(() => {
      widgets('dummy', '.dummy', {on: 'custom:event'})

      widgets.dispatch('custom:event')

      widget = widgets.widgetsFor(element, 'dummy')
    })

    it('calls the widget method and creates a widget', () => {
      expect(spy.calledOn(widget)).to.be.ok()
      expect(spy.calledWith(element)).to.be.ok()
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

      expect(spy.getCall(1).args[0]).to.eql(element)
      expect(spy.getCall(1).args[1]).to.eql({foo: 'bar', baz: 10})
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

  describe('.dispose()', () => {
    beforeEach(() => {
      widgets('dummy', '.dummy', {on: 'init'})
      widget = widgets.widgetsFor(element, 'dummy')
      widget.dispose()
    })
    it('removes the class on the target element', () => {
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
})
