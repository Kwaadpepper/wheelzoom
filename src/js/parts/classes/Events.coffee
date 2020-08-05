__whmodules.addClass 'Events',

  class Events

    constructor: (_whzImage) ->

      # Instance variables
      @previousEvent = null
      @whzImage = _whzImage
      @domImage = _whzImage.domImage
      @imgInfo = _whzImage.imgInfo
      @_events = {}

      # Init
      @initEvents()

    initEvents: =>
      @_events['wheelzoom.reset'] = (=> @whzImage.reset()).bind @
      @_events['wheelzoom.destroy'] = @destroy.bind @
      @_events['wheel'] = @onwheel.bind @
      @_events['mousedown'] = @draggable.bind @
      @_events['touchstart'] = @draggable.bind @
      @_events['touchmove'] = @drag.bind @
      @_events['touchend'] = @removeDrag.bind @
      @_events['mousemove'] = @drag.bind @
      @_events['mouseup'] = @removeDrag.bind @

      [ 'wheelzoom.reset',
        'wheelzoom.destroy',
        'wheel',
        'mousedown',
        'touchstart'
      ].forEach  ((evt) => @on @domImage, evt).bind @

    on: (element, evt) => element.addEventListener evt, @_events[evt]
    off: (element, evt) => element.removeEventListener evt, @_events[evt]
    trigger: (eventName, options) =>
      zoomTimer = null
      options = options or {}
      switch eventName
        when 'wheelzoom.dragend'
          window.triggerEvent @domImage, eventName, {
            x: @imgInfo.bgPosX - @imgInfo.initBgPosX,
            y: @imgInfo.bgPosY - @imgInfo.initBgPosY
          }
          break
        when 'wheelzoom.dragstart', 'wheelzoom.reset', 'wheelzoom.drag'
          window.triggerEvent @domImage, eventName, options
          break
        when 'wheelzoom.out', 'wheelzoom.in'
          # setTimeout to handle lot of events fired
          clearTimeout zoomTimer
          zoomTimer = setTimeout ((eventName, options) =>
            window.triggerEvent @domImage, eventName, options
          ).bind(@, eventName, options), 10
          break

    onwheel: (e) =>
      e.preventDefault()

      deltaY = 0

      # FireFox 17+ (IE9+, Chrome 31+?)
      if e.deltaY then deltaY = e.deltaY
      else if e.wheelDelta then deltaY = -e.wheelDelta

      @whzImage.zoom deltaY, true

    drag: (e) =>
      e.preventDefault()

      switch e.type
        when 'touchstart'
        , 'touchmove'
          __whmodules.globals['isPinched'] = e.touches.length == 2
          xShift = e.touches[0].pageX
          yShift = e.touches[0].pageY
          break
        else
          xShift = e.pageX
          yShift = e.pageY

      switch @previousEvent.type
        when 'touchstart'
        , 'touchmove'
          __whmodules.globals['isPinched'] = @previousEvent.touches.length == 2
          xShift -= @previousEvent.touches[0].pageX
          yShift -= @previousEvent.touches[0].pageY
          break
        else
          xShift -= @previousEvent.pageX
          yShift -= @previousEvent.pageY

      if __whmodules.globals['isPinched'] # Zoom if pinch
        dist = Math.sqrt(
          Math.pow(e.touches[1].pageX - e.touches[0].pageX, 2) +
          Math.pow(e.touches[1].pageY - e.touches[0].pageY, 2))
        prevDist = Math.sqrt(
          Math.pow(@previousEvent.touches[1].pageX - @previousEvent.touches[0].pageX, 2) +
          Math.pow(@previousEvent.touches[1].pageY - @previousEvent.touches[0].pageY, 2))
        deltaPinch = prevDist - dist

        @whzImage.zoom deltaPinch, true
        return

      x = @imgInfo.bgPosX + xShift
      y = @imgInfo.bgPosY + yShift

      @whzImage.drag x, y

      @trigger 'wheelzoom.drag', {
        bgPosX: @imgInfo.bgPosX,
        bgPosY: @imgInfo.bgPosY,
        xShift: xShift,
        yShift: yShift
      }

      @previousEvent = e
      @whzImage.updateBgStyle()

    draggable: (e) =>
      e.preventDefault()
      @trigger 'wheelzoom.dragend'
      @previousEvent = e
      if e.type == 'touchstart'
        @on document, 'touchmove'
        @on document, 'touchend'
      else
        @on document, 'mousemove'
        @on document, 'mouseup'

    removeDrag: (e) =>
      e.preventDefault()
      @trigger 'wheelzoom.dragend'
      @off document, 'touchmove'
      @off document, 'touchend'
      @off document, 'mousemove'
      @off document, 'mouseup'

    destroy: (e) =>
      @whzImage.destroy()
      @off @domImage, 'wheelzoom.reset'
      @off @domImage, 'wheelzoom.destroy'
      @off @domImage, 'wheel'
      @off @domImage, 'mousedown'
      @off @domImage, 'mouseup'
      @off @domImage, 'mousemove'
      @off @domImage, 'touchstart'
      @off @domImage, 'touchleave'
      @off @domImage, 'touchmove'

      delete @previousEvent
      delete @whzImage
      delete @domImage
      delete @imgInfo
      delete @_events
