import expect from 'expect.js';
import sinon from 'sinon';

import Hash from '../src/hash';

describe('Hash', () => {
  let hash, key;

  beforeEach(() => {
    hash = new Hash();
    key = {foo: 'bar'};
  });

  describe('#clear()', () => {
    beforeEach(() => { hash.set(key, 'foo'); });

    it('resets the hash', () => {
      hash.clear();

      expect(hash.get(key)).to.be(undefined);
    });
  });

  describe('#set()', () => {
    beforeEach(() => { hash.set(key, 'foo'); });

    it('registers a value with the given key', () => {
      expect(hash.get(key)).to.eql('foo');
      expect(hash.get({foo: 'bar'})).to.be(undefined);
    });

    it('updates the value at the given key', () => {
      hash.set(key, 'bar');

      expect(hash.get(key)).to.eql('bar');
    });
  });

  describe('#unset()', () => {
    it('unregisters a value with the given key', () => {
      hash.unset(key, 'foo');
      expect(hash.get(key)).to.be(undefined);
    });
  });

  describe('#hasKey()', () => {
    beforeEach(() => { hash.set(key, 'foo'); });

    it('returns true for existing keys', () => {
      expect(hash.hasKey(key)).to.be(true);
    });

    it('returns false for unregistered keys', () => {
      expect(hash.hasKey({foo: 'bar'})).to.be(false);
    });
  });

  describe('#getKey()', () => {
    beforeEach(() => { hash.set(key, 'foo'); });

    it('returns the key associated to a value', () => {
      expect(hash.getKey('foo')).to.be(key);
    });

    it('returns undefined for unknown values', () => {
      expect(hash.getKey('bar')).to.be(undefined);
    });
  });

  describe('#eachKey()', () => {
    beforeEach(() => { hash.set(key, 'foo'); });

    it('iterates over the hash keys', () => {
      const spy = sinon.spy();

      hash.eachKey(spy);

      expect(spy.callCount).to.eql(1);
      expect(spy.calledWith(key)).to.be(true);
    });

    it('does not fail when called without a block', () => {
      expect(() => hash.eachKey()).not.to.throwError();
    });
  });

  describe('#each()', () => {
    beforeEach(() => { hash.set(key, 'foo'); });

    it('iterates over the hash values', () => {
      const spy = sinon.spy();

      hash.each(spy);

      expect(spy.callCount).to.eql(1);
      expect(spy.calledWith('foo')).to.be(true);
    });

    it('does not fail when called without a block', () => {
      expect(() => hash.each()).not.to.throwError();
    });
  });

  describe('#eachPair()', () => {
    beforeEach(() => { hash.set(key, 'foo'); });

    it('iterates over the hash values', () => {
      const spy = sinon.spy();

      hash.eachPair(spy);

      expect(spy.callCount).to.eql(1);
      expect(spy.calledWith(key, 'foo')).to.be(true);
    });

    it('does not fail when called without a block', () => {
      expect(() => hash.eachPair()).not.to.throwError();
    });
  });
});
