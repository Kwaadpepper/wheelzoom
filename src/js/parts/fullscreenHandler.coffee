__whmodules.add ->
  fullscreenchangeHandler = -> window.wheelzoom.resetAll()

  if document.addEventListener
    document.addEventListener 'fullscreenchange', fullscreenchangeHandler, false
    document.addEventListener 'mozfullscreenchange', fullscreenchangeHandler, false
    document.addEventListener 'MSFullscreenChange', fullscreenchangeHandler, false
    document.addEventListener 'webkitfullscreenchange', fullscreenchangeHandler, false