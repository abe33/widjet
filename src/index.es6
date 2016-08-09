import {domEvent, clone} from 'widjet-utils'
import {DisposableEvent} from 'widjet-disposables'
import Hash from './hash'
import Widget from './widget'

/**
 * The `WIDGETS` object stores all the registered widget factories.
 */
const WIDGETS = {}

/**
 * The `INSTANCES` object stores the returned instances of the various widgets,
 * stored by widget type and then mapped with their target DOM element as key.
 */
const INSTANCES = {}

/**
 * The `SUBSCRIPTIONS` object stores all the subscriptions object created
 * through the `widgets.subscribe` function.
 */
const SUBSCRIPTIONS = {}

/**
 * The `widgets` function is both the main module and the function
 * used to register the widgets to apply on a page.
 *
 * @param {string} name the name of the widget to apply
 * @param {string} selector the CSS selector for the targets of the widge
 * @param {Object} [options={}] the base options for this widget application.
 * @param {string|Array<string>} [options.on] the list of events that will
 *                                            trigger the application
 *                                            of the widget
 * @param {function():boolean} [options.if] a function use to define when
 *                                          to apply the widget
 * @param {function():boolean} [options.unless] a function use to define when
 *                                              to not apply the widget
 * @param {Object|function} [options.media] a media condition to apply
 *                                          to the widget
 * @param {Object|function} [options.media.min] the minimum screen width
 *                                              at which the widget will apply
 * @param {Object|function} [options.media.max] the maximum screen width
 *                                              at which the widget will apply
 * @param {function(el:HTMLElement):void} [block]
 */
export default function widgets (name, selector, options = {}, block) {
  if (WIDGETS[name] == null) {
    throw new Error(`Unable to find widget '${name}'`)
  }

  // The options specific to the widget registration and activation are
  // extracted from the options object.
  const ifCond = options.if
  const unlessCond = options.unless
  const targetFrame = options.targetFrame
  let events = options.on || 'init'
  let mediaCondition = options.media
  let mediaHandler

  delete options.on
  delete options.if
  delete options.unless
  delete options.media
  delete options.targetFrame

  const targetDocument = targetFrame
    ? document.querySelector(targetFrame).contentDocument
    : document

  const targetWindow = targetFrame
    ? document.querySelector(targetFrame).contentWindow
    : window

  // Events can be passed as a string with event names separated with spaces.
  if (typeof events === 'string') { events = events.split(/\s+/g) }

  // The widgets instances are stored in a Hash with the DOM element they
  // target as key. The instances hashes are stored per widget type.
  const instances = INSTANCES[name] || (INSTANCES[name] = new Hash())

  // This method execute a test condition for the given element. The condition
  // can be either a function or a value converted to boolean.
  function testCondition (condition, element) {
    return typeof condition === 'function' ? condition(element) : !!condition
  }

  // The DOM elements handled by a widget will receive a handled class
  // to differenciate them from unhandled elements.
  const handledClass = `${name}-handled`

  // This method will test if an element can be handled by the current widget.
  // It will test for both the handled class presence and the widget
  // conditions. Note that if both the `if` and `unless` conditions
  // are passed in the options object they will be tested as both part
  // of a single `&&` condition.
  function canBeHandled (element) {
    let res = !element.classList.contains(handledClass)
    res = ifCond ? res && testCondition(ifCond, element) : res
    res = unlessCond ? res && !testCondition(unlessCond, element) : res
    return res
  }

  // If a media condition have been specified, the widget activation will be
  // conditionned based on the result of this condition. The condition is
  // verified each time the `resize` event is triggered.
  if (mediaCondition) {
    // The media condition can be either a boolean value, a function, or,
    // to simply the setup, an object with `min` and `max` property containing
    // the minimal and maximal window width where the widget is activated.
    if (typeof mediaCondition === 'object') {
      const {min, max} = mediaCondition
      mediaCondition = function () {
        let res = true
        res = min != null ? res && targetWindow.innerWidth >= min : res
        res = max != null ? res && targetWindow.innerWidth <= max : res
        return res
      }
    }

    // The media handler is registered on the `resize` event of the `window`
    // object.
    mediaHandler = function (element, widget) {
      if (!widget) { return }

      const conditionMatched = testCondition(mediaCondition, element)

      if (conditionMatched && !widget.active) {
        widget.activate()
      } else if (!conditionMatched && widget.active) {
        widget.deactivate()
      }
    }

    widgets.subscribe(name, targetWindow, 'resize', () => {
      instances.eachPair((element, widget) => mediaHandler(element, widget))
    })
  }

  // The `handler` function is the function registered on specified event and
  // will proceed to the creation of the widgets if the conditions are met.
  const handler = function () {
    const elements = targetDocument.querySelectorAll(selector)

    Array.prototype.forEach.call(elements, function (element) {
      if (!canBeHandled(element)) { return }

      const widget = new Widget(
        element, WIDGETS[name], clone(options), handledClass
      )

      widget.init()

      instances.set(element, widget)

      // The widgets activation state are resolved at creation
      mediaCondition ? mediaHandler(element, widget) : widget.activate()

      widgets.dispatch(`${name}:handled`, {element, widget})

      block && block.call(element, element, widget)
    })
  }

  // For each event specified, the handler is registered as listener.
  // A special case is the `init` event that simply mean to trigger the
  // handler as soon a the function is called.
  events.forEach(function (event) {
    switch (event) {
      case 'init':
        handler()
        break
      case 'load':
      case 'resize':
        widgets.subscribe(name, targetWindow, event, handler)
        break
      default:
        widgets.subscribe(name, targetDocument, event, handler)
    }
  })
}

/**
 * A helper function used to dispatch an event from a given `source` or from
 * the `document` if no source is provided.
 *
 * @param  {HTMLElement} source the element onto which dispatch the event
 * @param  {string} type the name of the event to dispatch
 * @param  {Object} [properties={}] the properties of the event to dispatch
 */
widgets.dispatch = function dispatch (source, type, properties = {}) {
  if (typeof source === 'string') {
    properties = type || {}
    type = source
    source = document
  }

  const event = domEvent(type, properties)
  if (source.dispatchEvent) {
    source.dispatchEvent(event)
  } else {
    if (console && console.log) {
      console.log('HTMLElement::dispatchEvent is not available on this platform. Unable to dispatch custom events on DOM nodes.')
    }
  }
}

/**
 * The `widgets.define` is used to create a new widget usable through the
 * `widgets` method. Basically, a widget is defined using a `name`, and a
 * either a function that will be called for each DOM elements targeted by
 * the widget or an object that will be used to define the widget prototype.
 *
 * The function should have the following signature:
 *
 * ```js
 * function (element : HTMLElement, options : Object) : Object
 * ```
 *
 * The `options` object will contains all the options passed to the `widgets`
 * method except the `on`, `if`, `unless` and `media` ones.
 *
 *
 * In case of an object, it should have the following structure:
 *
 * ```js
 * {
 *  initialize: function () { ... },
 *  activate: function () { ... },
 *  deactivate: function () { ... },
 *  dispose: function () { ... }
 * }
 * ```
 *
 * Each functions of the object correspond to the hooks available in a widget
 * handler function.
 *
 * @param {string} name the widget name
 * @param {Object|function} blockOrPrototype the widgets' block callback
 *                                           or an object to use as the widget
 *                                           prototype
 */
widgets.define = function (name, blockOrPrototype) {
  if (typeof blockOrPrototype === 'function') {
    WIDGETS[name] = blockOrPrototype
  } else {
    WIDGETS[name] = function (...args) {
      this.onInitialize = blockOrPrototype.initialize
      this.onActivate = blockOrPrototype.activate
      this.onDeactivate = blockOrPrototype.deactivate
      this.onDispose = blockOrPrototype.dispose
    }
  }
}

/**
 * A shorthand method to register a jQuery widget.
 *
 * @param  {string} name the widget's name
 * @param  {string} [baseOptions={}] the base option for the jquery widget.
 *                                   It'll be used as default when creating
 *                                   the option object on a widget invocation.
 * @param  {function($element:JQuery):void} block the widgets' block callback
 */
widgets.$define = function (name, baseOptions = {}, block) {
  if (typeof baseOptions === 'function') {
    [baseOptions, block] = [{}, baseOptions]
  }

  if (!window.$.fn[name]) { throw new Error(`${name} jquery widget isn't defined`) }

  WIDGETS[name] = (element, options = {}) => {
    for (let k in baseOptions) { options[k] = options[k] || baseOptions[k] }
    const res = window.$(element)[name](options)
    block && block(res, options)
  }
}

/**
 * Deletes a widget definition.
 *
 * @param  {String} name the name of the widget to delete
 */
widgets.delete = function (name) {
  if (SUBSCRIPTIONS[name]) {
    SUBSCRIPTIONS[name].forEach(subscription => subscription.dispose())
  }
  widgets.release(name)
  delete WIDGETS[name]
}

/**
 * Resets parts of all of widgets by deleting their definitions
 *
 * If no name is passed, all the definitions are deleted.
 *
 * @param {...string} names the names of the wigets to delete
 */
widgets.reset = function (...names) {
  if (names.length === 0) { names = Object.keys(INSTANCES) }

  names.forEach(name => {
    widgets.delete(name)
    INSTANCES[name].clear()
    delete INSTANCES[name]
  })
}

/**
 * Returns all or a specific widget for a given `element`.
 *
 * If no `widget` is specified all the widgets registered for the passed-in
 * element are returned.
 *
 * @param  {HTMLElement} element the element for which retrieving the widgets
 * @param  {string} widget a name of a specific widget class to retrieve
 * @return {Array<Widget>|Widget} the widget(s) associated to the element
 */
widgets.widgetsFor = function (element, widget) {
  if (widget) {
    return INSTANCES[widget].get(element)
  } else {
    return Object.keys(INSTANCES)
    .map(key => INSTANCES[key])
    .filter(instances => instances.hasKey(element))
    .map(instances => instances.get(element))
    .reduce((memo, arr) => memo.concat(arr), [])
  }
}

/**
 * Subscribes an event listener to the specified events onto the specified
 * target and stores a subscription so that it can be unsubscribed later.
 *
 * @param  {string} name the name of the event making the subscription
 * @param  {HTMLElement} to the target element of the subscription
 * @param  {string} evt the target event of the subscription
 * @param  {function(e:Event):void} handler the listener of the subscription
 * @return {DisposableEvent} a disposable object to remove the subscription
 * @private
 */
widgets.subscribe = function (name, to, evt, handler) {
  SUBSCRIPTIONS[name] || (SUBSCRIPTIONS[name] = [])
  const subscription = new DisposableEvent(to, evt, handler)
  SUBSCRIPTIONS[name].push(subscription)
  return subscription
}

/**
 * The `widgets.release` method can be used to completely remove the widgets
 * of the given `name` from the page.
 * It's the widget responsibility to clean up its dependencies during
 * the `dispose` call.
 *
 * @param {...string} names
 */
widgets.release = function (...names) {
  if (names.length === 0) { names = Object.keys(INSTANCES) }
  names.forEach(name => {
    INSTANCES[name] && INSTANCES[name].each(value => value.dispose())
  })
}

/**
 * Activates all the widgets instances of type `name`.
 *
 * @param  {...string} names [description]
 */
widgets.activate = function (...names) {
  if (names.length === 0) { names = Object.keys(INSTANCES) }
  names.forEach(name => {
    INSTANCES[name] && INSTANCES[name].each(value => value.activate())
  })
}

/**
 * Deactivates all the widgets instances of type `name`.
 *
 * @param  {...string} names [description]
 */
widgets.deactivate = function (...names) {
  if (names.length === 0) { names = Object.keys(INSTANCES) }
  names.forEach(name => {
    INSTANCES[name] && INSTANCES[name].each(value => value.deactivate())
  })
}
