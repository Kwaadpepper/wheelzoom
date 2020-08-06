__whmodules.addClass 'Image',

  class Image

    constructor: (_domImage, _options) ->

      # Instance variables
      @domImage = _domImage
      @canvas = document.createElement('canvas')
      @options = _options or {}
      @imgInfo = {}
      @wzEvents = new Events(@)
      @wzImageApi = new ImageApi(@)

      t = setInterval ((img, load) ->
        if img.complete
          load()
          clearInterval(t)
      ).bind(null, @domImage, @load.bind(@)), 100

    isEqualTo: (img) => img == @domImage

    load: =>
      if @domImage.src == @imgInfo.cachedDataUrl then return

      computedStyle = window.getComputedStyle(@domImage, null)

      width = parseInt(computedStyle.width, 10)
      height = parseInt(computedStyle.height, 10)
      bgPosX = (@domImage.width - width) / 2
      bgPosY = (@domImage.height - height) / 2

      @imgInfo.width = width
      @imgInfo.height = height
      @imgInfo.bgWidth = width
      @imgInfo.bgHeight = height
      @imgInfo.initBgPosX = bgPosX
      @imgInfo.initBgPosY = bgPosY
      @imgInfo.bgPosX = bgPosX
      @imgInfo.bgPosY = bgPosY


      @setSrcToBackground(@domImage)

      @domImage.style.backgroundSize = @imgInfo.width + 'px ' + @imgInfo.height + 'px'
      @domImage.style.backgroundPosition = @imgInfo.bgPosX + 'px ' + @imgInfo.bgPosY + 'px'

    updateBgStyle: =>
      windowBox = {
        left: 0,
        right: @domImage.width,
        top: 0,
        down: @domImage.height,
        width: @domImage.width,
        height: @domImage.height
      }

      imageBox = {
        left: @imgInfo.bgPosX,
        right: @imgInfo.bgPosX + @imgInfo.bgWidth,
        top: @imgInfo.bgPosY,
        down: @imgInfo.bgPosY + @imgInfo.bgHeight,
        width: @imgInfo.bgWidth,
        height: @imgInfo.bgHeight
      }

      cycl = (size, aSide, bSide, bgPos, bgSize) =>
        # If image size is smaller than canvas size
        if imageBox[size] < windowBox[size]
          if imageBox[aSide] < windowBox[aSide]
            # do not overflow left
            @imgInfo[bgPos] = windowBox[aSide]
          if imageBox[bSide] > windowBox[bSide]
            # do not overflow right
            @imgInfo[bgPos] = windowBox[bSide] - @imgInfo[bgSize]
        else # if image size is bigger than canvas size
          # force overflow aSide
          if imageBox[aSide] > windowBox[aSide]
            @imgInfo[bgPos] = windowBox[aSide]
          if imageBox[bSide] < windowBox[bSide]
            # force overflow bSide
            @imgInfo[bgPos] = windowBox[bSide] - @imgInfo[bgSize]

      cycl('width', 'left', 'right', 'bgPosX', 'bgWidth')
      cycl('height', 'top', 'down', 'bgPosY', 'bgHeight')

      @domImage.style.backgroundSize = "#{@imgInfo.bgWidth}px #{@imgInfo.bgHeight}px"
      @domImage.style.backgroundPosition = "#{@imgInfo.bgPosX}px #{@imgInfo.bgPosY}px"

    reset: =>
      @imgInfo.bgWidth = @imgInfo.width
      @imgInfo.bgHeight = @imgInfo.height
      @imgInfo.bgPosX = @domImage.width / 2 - @imgInfo.width / 2
      @imgInfo.bgPosY = @domImage.height / 2 - @imgInfo.height / 2
      @updateBgStyle()

    setSrcToBackground: =>
      @domImage.style.backgroundImage = "url('#{@domImage.src}')"
      @domImage.style.backgroundRepeat = 'no-repeat'
      @canvas.width = @domImage.naturalWidth
      @canvas.height = @domImage.naturalHeight
      @imgInfo.cachedDataUrl = @canvas.toDataURL()
      @domImage.src = @imgInfo.cachedDataUrl

    zoom: (deltaY, propagate = false) =>
      zoomSensibility = if __whmodules.globals['isPinched']
      then @options.zoom * @options.pinchSensibility
      else @options.zoom

      # zoom always at the center of the image
      offsetX = @domImage.width / 2
      offsetY = @domImage.height / 2

      # Record the offset between the bg edge and the center of the image:
      bgCenterX = offsetX - @imgInfo.bgPosX
      bgCenterY = offsetY - @imgInfo.bgPosY

      # Use the previous offset to get the percent offset between the bg edge
      # and the center of the image:
      bgRatioX = bgCenterX / @imgInfo.bgWidth
      bgRatioY = bgCenterY / @imgInfo.bgHeight

      # Update the bg size:
      if deltaY < 0
        if @options.maxZoom is -1 or
        ((@imgInfo.bgWidth + @imgInfo.bgWidth * zoomSensibility) /
        @imgInfo.width) <= @options.maxZoom
          @imgInfo.bgWidth += @imgInfo.bgWidth * zoomSensibility
          @imgInfo.bgHeight += @imgInfo.bgHeight * zoomSensibility
      else
        @imgInfo.bgWidth -= @imgInfo.bgWidth * zoomSensibility
        @imgInfo.bgHeight -= @imgInfo.bgHeight * zoomSensibility

      # Take the percent offset and apply it to the new size:
      @imgInfo.bgPosX = offsetX - (@imgInfo.bgWidth * bgRatioX)
      @imgInfo.bgPosY = offsetY - (@imgInfo.bgHeight * bgRatioY)

      if propagate
        if deltaY < 0 then @wzEvents.trigger 'wheelzoom.in', {
          zoom: @imgInfo.bgWidth / @imgInfo.width,
          bgPosX: @imgInfo.bgPosX,
          bgPosY: @imgInfo.bgPosY
        }
        else @wzEvents.trigger 'wheelzoom.out', {
          zoom: @imgInfo.bgWidth / @imgInfo.width,
          bgPosX: @imgInfo.bgPosX,
          bgPosY: @imgInfo.bgPosY
        }

      # Prevent zooming out beyond the starting size
      if @imgInfo.bgWidth <= @imgInfo.width or @imgInfo.bgHeight <= @imgInfo.height
        @wzEvents.trigger 'wheelzoom.reset'
      else @updateBgStyle()

    drag: (x, y) =>
      @imgInfo.bgPosX = x
      @imgInfo.bgPosY = y
      @updateBgStyle()

    destroy: =>
      @domImage.style = @domImage.getAttribute('style')
      @domImage.src = @domImage.getAttribute('src')
      @wzImageApi.destroy()
      delete @wzImageApi
