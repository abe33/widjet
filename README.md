## widjet [![Build Status](https://travis-ci.org/abe33/widjet.svg?branch=master)](https://travis-ci.org/abe33/widjet)

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

// Defines a simple widget that adds a class to the element it recieves
widgets.define('my-widget-name', (element) => {
  element.classList.add('my-widget')
})

// Setup how and when the widget will be applied on the page
widgets('my-widget-name', '.widget-target-selector', {on: 'load'})
```

#### Widgets Definition

As seen above, a basic widget's definition is pretty straigtforward, but there's more to it than just a name and a function.

A widget's definition function will receive two more arguments: `options` and `widget` which hold respectively the options passed to the `widgets()` call and the `Widget` instance created for the target element. When called the function `this` object will refer to the `Widget` instance.

Inside the definition function, you can registers hooks for the widget lifecycle.

```js
import widgets from 'widjet'

widgets.define('my-widget-name', (element, options = {}, widget) => {
  // We're gonna use `widget` instead of `this` to register the lifecycle hooks
  // as we're using a fat arrow function
  widget.onInitialization = function () { console.log('initialized') }
  widget.onActivation = function () { console.log('activated') }
  widget.onDeactivation = function () { console.log('deactivated') }
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

In that example, the `onInitialization` hook is redundant since the definition function is executed during the widget initialization.

Another way, that is more convenient if you need to define all these lifecycle hooks, is to pass an object instead of a function:

```js
import widgets from 'widjet'

widgets.define('my-widget-name', {
  initialize: function () { console.log('initialized') },
  activate: function () { console.log('activated') },
  deactivate: function () { console.log('deactivated') },
  dispose: function () { console.log('disposed') }
})
```

The advantage of the former version is that you can benefit from the function closure for the various hooks. The latter version, on the other hand, promote a more OOP-like structure where you'll have to store on the object what you want to access in the various methods.

#### Widgets Consumption

Once defined, a widget isn't automatically applied to a page, before that it must be registered with some page elements. This is done using the `widgets` function like this:

```js
import widgets from 'widjet'

// Setup how and when the widget will be applied on the page
widgets('my-widget-name', '.widget-target-selector', {on: 'load'})
```

The first parameter is the name of the widget to register. The second argument is the CSS query (as supported by the `querySelector` and `querySelectorAll` methods) to match the element that will be affected by the widget. The last argument is an option object where you can specify the various conditions for the widget to apply.
