## widjet [![Build Status](https://travis-ci.org/abe33/widjet.svg?branch=master)](https://travis-ci.org/abe33/widjet) [![codecov](https://codecov.io/gh/abe33/widjet/branch/master/graph/badge.svg)](https://codecov.io/gh/abe33/widjet)

A simple and lightweight widget helper for the web.

### Installation

```sh
npm install --save widjet
```

### Usage

The simplest example of how to define and use a widget is as follow:

```js
// Imports the widjet module
import widgets from 'widjet'

// Defines a simple widget that adds a class to the element it receives
widgets.define('my-widget-name', options => element => {
  element.classList.add('my-widget')
})

// Setup how and when the widget will be applied on the page
widgets('my-widget-name', '.widget-target-selector', {on: 'load'})
```

#### Widgets Definition

In the example above the first function is called the definition function, it's called on every use of the widget through the `widgets` function and it receives the options defined at that moment. It can either returns a function or an object.

The second function, returned by the definition function, is called the element handling function and will be called for every elements matched by the selector.
This function will receive two arguments, the target `element` and the `widget` instance created for the target element. When called the function `this` object will refer to the `Widget` instance.

Inside the element handling function, you can register hooks for the widget lifecycle.

```js
import widgets from 'widjet'

widgets.define('my-widget-name', options => (element, widget) => {
  // We're gonna use `widget` instead of `this` to register the lifecycle hooks
  // as we're using a fat arrow function
  widget.onInitialize = function () { console.log('initialized') }
  widget.onActivate = function () { console.log('activated') }
  widget.onDeactivate = function () { console.log('deactivated') }
  widget.onDispose = function () { console.log('disposed') }

  // ...

  // If the function returns a disposable-like object, it'll be used when
  // the widget will be disposed of
  return {
    dispose: function () {
      // dispose routine
    }
  }
})
```

In that example, the `onInitialize` hook is redundant since the definition function is executed during the widget initialization.

Another way, that is more convenient if you need to define all these lifecycle hooks, is to returns an object instead of a function in the definition function:

```js
import widgets from 'widjet'

widgets.define('my-widget-name', options => {
  initialize: function () { console.log('initialized') },
  activate: function () { console.log('activated') },
  deactivate: function () { console.log('deactivated') },
  dispose: function () { console.log('disposed') }
})
```

The advantage of the former version is that you can benefit from the function closure for the various hooks. The latter version, on the other hand, promotes a more OOP-like structure where you'll have to store on the object what you want to access in the various methods.

#### Widgets Consumption

Once defined, a widget isn't automatically applied to a page, before that it must be registered with some page elements. This is done using the `widgets` function like this:

```js
import widgets from 'widjet'

// Setup how and when the widget will be applied on the page
widgets('my-widget-name', '.widget-target-selector', {on: 'load'})
```

The first parameter is the name of the widget to register. The second argument is the CSS query (as supported by the `querySelector` and `querySelectorAll` methods) to match the elements that will be affected by the widget. The last argument is an option object where you can specify the various conditions for the widget to apply.

In the example above, the `on` option defines the events onto which the query will be performed to find elements fot this widget.

You can find the complete list of options below, any options that are not consumed by the `widgets` function will be passed to the widget.

|Option|Description|
|---|---|
|`on`| A space-separated list of events that will trigger a lookup for the widget. All events except `load` and `resize` are listened on `document`, `load` and `resize` being window's events they will be registered on the `window` object.<br/><br/>Example: `{on: 'foo bar baz'}`|
|`if`| A predicate that will make the widget apply when it returns `true`. The function receives the target `element` as the sole argument but can completely ignores it.<br/><br/>Example: `{if: () => someCondition}`|
|`unless`| A predicate that will make the widget apply when it returns `false`. The function receives the target `element` as the sole argument but can completely ignores it.<br/><br/>Example: `{unless: () => someCondition}`|
|`media`| Either a boolean, a function or an object with a `min` and/or `max` properties. Contrary to the `if` and `unless` options, the `media` option will determine the activation state of the widget, given it was initialized according to the `if` and `unless` options. If an object is passed, the `min` and `max` values are tested against the window's width as generally done with CSS media queries.<br/><br/>Example: `{media: {min: 768, max: 1024}}`|
|`targetFrame`| A selector to target a specific `iframe` in the page, this will allow a parent page to apply widgets on the content of a hosted frame, useful for editor's like that relies on frames. In the case the option is specified, all the events defined in the `on` option will be listened on the frame's `contentWindow` and `contentDocument`.<br/><br/>Example: `{targetFrame: '#frame-id'}`|

Any option that is not in the list above will be collected and passed to the widget as its options.

A widget can't be applied twice on the same element. This is ensured by adding a specific class to the widget's element that marks the element as handled. When the widget is disposed, the class is removed and the element can be targeted again.
