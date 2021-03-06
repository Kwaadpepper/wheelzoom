__whmodules.windowRegister ->
  CustomEvent = (event, params) ->
    params = params or { bubbles: false, cancelable: false, detail: undefined }
    evt = document.createEvent 'CustomEvent'
    evt.initCustomEvent event, params.bubbles, params.cancelable, params.detail
    return evt

  CustomEvent.prototype = window.Event.prototype
  window.CustomEvent = CustomEvent
