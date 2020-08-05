__whmodules.add ->

  @defaults = {
    zoom: 0.10,
    pinchSensibility: 0.3,
    maxZoom: -1
  }
  @isPinched = false

  staticMethods = [
    'images', 'resetAll', 'destroyAll'
  ]

  window.wheelzoom = (elements, options) ->
    whz = new Wheelzoom(elements, options)
    for staticMethod in staticMethods
      window.wheelzoom[staticMethod] = Wheelzoom[staticMethod]
    return whz
    