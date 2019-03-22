import expect from 'expect.js';
import sinon from 'sinon';
import jsdom from 'mocha-jsdom';

import Widget from '../src/widget';

describe('Widget', () => {
  jsdom({url: 'http://localhost/'});

  let widget;

  beforeEach(() => {
    widget = new Widget(
      document.createElement('div'),
      function handler(el) {
        this.onActivate = sinon.spy();
        this.onDeactivate = sinon.spy();
        this.onInitialize = sinon.spy();
        this.onDispose = sinon.spy();
      },
      {},
      'dummy-handled'
    );
    widget.init();
  });

  describe('#init()', () => {
    it('calls the onInitialize hook', () => {
      expect(widget.onInitialize.called).to.be.ok();
    });

    it('calls the onInitialize only once', () => {
      widget.init();
      expect(widget.onInitialize.callCount).to.eql(1);
    });
  });

  describe('#activate()', () => {
    beforeEach(() => { widget.activate(); });

    it('calls the onActivate hook', () => {
      expect(widget.onActivate.called).to.be.ok();
    });

    it('calls the onActivate only once', () => {
      widget.activate();
      expect(widget.onActivate.callCount).to.eql(1);
    });
  });

  describe('#deactivate()', () => {
    beforeEach(() => {
      widget.activate();
      widget.deactivate();
    });

    it('calls the onDeactivate hook', () => {
      expect(widget.onDeactivate.called).to.be.ok();
    });

    it('calls the onDeactivate only once', () => {
      widget.deactivate();
      expect(widget.onDeactivate.callCount).to.eql(1);
    });
  });

  describe('#dispose()', () => {
    beforeEach(() => { widget.dispose(); });

    it('calls the onDispose hook', () => {
      expect(widget.onDispose.called).to.be.ok();
    });

    it('calls the onDispose only once', () => {
      widget.dispose();
      expect(widget.onDispose.callCount).to.eql(1);
    });
  });
});
