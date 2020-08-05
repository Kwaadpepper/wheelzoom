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
      ).bind(null, @domImage, load.bind(@)), 100

    isEqualTo: (img) -> img == @domImage

    load = ->
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

    updateBgStyle: ->
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

      # If image width is smaller than canvas width
      if imageBox.width < windowBox.width
        if imageBox.left < windowBox.left
          # do not overflow left
          @imgInfo.bgPosX = windowBox.left
        else if imageBox.right > windowBox.right
          # do not overflow right
          @imgInfo.bgPosX = windowBox.right - @imgInfo.bgWidth
      else # if image width is bigger than canvas width
        # force overflow left
        if imageBox.left > windowBox.left
          @imgInfo.bgPosX = windowBox.left
        else if imageBox.right < windowBox.right
          # force overflow right
          @imgInfo.bgPosX = windowBox.right - @imgInfo.bgWidth

      # If image height is smaller than canvas height
      if imageBox.height < windowBox.height
        if imageBox.top < windowBox.top
          # do not overflow top
          @imgInfo.bgPosY = windowBox.top
        else
          if imageBox.down > windowBox.down #endregion do not overflow down
            @imgInfo.bgPosY = windowBox.down - @imgInfo.bgHeight
      else # if image height is bigger than canvas height
        if imageBox.top > windowBox.top # force overflow top
          @imgInfo.bgPosY = windowBox.top
        else if imageBox.down < windowBox.down
          # force overflow down
          @imgInfo.bgPosY = windowBox.down - @imgInfo.bgHeight

      @domImage.style.backgroundSize = "#{@imgInfo.bgWidth}px #{@imgInfo.bgHeight}px"
      @domImage.style.backgroundPosition = "#{@imgInfo.bgPosX}px #{@imgInfo.bgPosY}px"

    reset: ->
      @imgInfo.bgWidth = @imgInfo.width
      @imgInfo.bgHeight = @imgInfo.height
      @imgInfo.bgPosX = @domImage.width / 2 - @imgInfo.width / 2
      @imgInfo.bgPosY = @domImage.height / 2 - @imgInfo.height / 2
      @updateBgStyle()

    setSrcToBackground: ->
      @domImage.style.backgroundImage = "url('#{@domImage.src}')"
      @domImage.style.backgroundRepeat = 'no-repeat'
      @canvas.width = @domImage.naturalWidth
      @canvas.height = @domImage.naturalHeight
      @imgInfo.cachedDataUrl = @canvas.toDataURL()
      @domImage.src = @imgInfo.cachedDataUrl

    zoom: (deltaY, propagate = false) ->
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

    drag: (x, y) ->
      @imgInfo.bgPosX = x
      @imgInfo.bgPosY = y
      @updateBgStyle()

    destroy: ->
      @domImage.style = @domImage.getAttribute('style')
      @domImage.src = @domImage.getAttribute('src')
      @wzImageApi.destroy()
      delete @wzImageApi
