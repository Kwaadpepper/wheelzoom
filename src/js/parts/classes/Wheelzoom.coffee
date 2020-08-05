__whmodules.addClass 'Wheelzoom',

  class Wheelzoom

    # private static
    wheelzoomSingleton = null
    wzImgs = []
    globals = __whmodules.globals

    # public methods
    constructor: (elements, options) ->
      @init(elements, options)
      if wheelzoomSingleton is not null then return wheelzoomSingleton
      else return wheelzoomSingleton = @

    init: (elements, options) ->
      # Do nothing in IE8
      if typeof window.getComputedStyle != 'function' then return elements
      if elements and elements.length then addImage(element, options) for element in elements
      else if (elements and elements.nodeName) then addImage(elements, options)
      return elements

    # private methods
    addImage = (img, options) ->
      if not img or not img.nodeName or img.nodeName != 'IMG' then return

      wzImg = new Image img, parseOptions(options)
      wzImgs.push wzImg

    parseOptions = (options) ->
      out = {}
      options = options or {}
      Object.keys(globals['defaults']).forEach (key) ->
        out[key] = if typeof options[key] != 'undefined' then options[key]
        else globals['defaults'][key]
      return out

    # public static methods
    @images = -> wzImgs
    @resetAll = -> wzImgs.forEach (wzImg) -> wzImg.reset()
    @destroyAll = ->
      while wzImgs.length
        wzImgs[0].destroy()
        wzImgs.splice(0, 1)
