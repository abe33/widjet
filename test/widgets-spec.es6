import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import widgets from '../src/index'

describe('widgets', () => {
  jsdom()

  let [spy, widget, element] = []

  beforeEach(() => {
    spy = sinon.spy()

    document.body.innerHTML = '<div class="dummy"></div>'
    element = document.body.querySelector('div')

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
  })

  describe('with a if condition', () => {
    describe('that return true', () => {
      beforeEach(() => {
        widgets('dummy', '.dummy', {on: 'custom:event', if: () => true})

        widgets.dispatch('custom:event')
      })

      it('calls the widget handler', () => {
        expect(spy.called).to.be.ok()
      })
    })

    describe('that return false', () => {
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
    describe('that return true', () => {
      beforeEach(() => {
        widgets('dummy', '.dummy', {on: 'custom:event', unless: () => true})

        widgets.dispatch('custom:event')
      })

      it('does not call the widget handler', () => {
        expect(spy.called).not.to.be.ok()
      })
    })

    describe('that return false', () => {
      beforeEach(() => {
        widgets('dummy', '.dummy', {on: 'custom:event', unless: () => false})

        widgets.dispatch('custom:event')
      })

      it('calls the widget handler', () => {
        expect(spy.called).to.be.ok()
      })
    })
  })
})
