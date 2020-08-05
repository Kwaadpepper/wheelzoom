__whmodules.addClass 'ImageApi',

  class ImageApi

    constructor: (_whzImage) ->
      @whzImage = _whzImage
      @domImage = _whzImage.domImage
      @registerApiMethods()

    registerApiMethods: =>
      @domImage.doZoomIn = @doZoomIn.bind @
      @domImage.doZoomOut = @doZoomOut.bind @
      @domImage.doDrag = @doDrag.bind @

    destroy: =>
      delete @domImage.wz

    doZoomIn: => @whzImage.zoom -100, false
    doZoomOut: => @whzImage.zoom 100, false
    doDrag: (x, y) => @whzImage.drag x, y
