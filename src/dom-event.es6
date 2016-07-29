export default function domEvent (type, data = {}, options = {}) {
  const {bubbles, cancelable} = options
  let event

  try {
    event = new window.Event(type, {
      bubbles: bubbles != null ? bubbles : true,
      cancelable: cancelable != null ? cancelable : true
    })
  } catch (e) {
    if ((document.createEvent != null)) {
      event = document.createEvent('Event')
      event.initEvent(
        type,
        bubbles != null ? bubbles : true,
        cancelable != null ? cancelable : true
      )
    } else if (document.createEventObject) {
      event = document.createEventObject()
      event.type = type
      for (var k in options) { event[k] = options[k] }
    }
  }

  event.data = data
  return event
}
