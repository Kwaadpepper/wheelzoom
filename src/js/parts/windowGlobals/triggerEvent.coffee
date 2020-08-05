# create cross browser triggerEvent function
__whmodules.windowRegister ->
  window.triggerEvent = (target, eventName, params) ->
    if params
      e = new CustomEvent eventName, { detail: params }
    else
      try
        e = new Event(eventName)
      catch err
        e = new CustomEvent(eventName)
    return target.dispatchEvent(e, params)
