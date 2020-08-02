/*! Wheelzoom 1.2.4
  license: MIT
  https://kwaadpepper.github.io/wheelzoom/
*/

// create CustomEvent to override window.Event in unsupported browsers
(function () {
  function CustomEvent (event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined }
    var evt = document.createEvent('CustomEvent')
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
    return evt
  }

  CustomEvent.prototype = window.Event.prototype
  window.CustomEvent = CustomEvent

  function fullscreenchangeHandler () {
    window.wheelzoom.resetAll()
  }

  if (document.addEventListener) {
    document.addEventListener('fullscreenchange', fullscreenchangeHandler, false)
    document.addEventListener('mozfullscreenchange', fullscreenchangeHandler, false)
    document.addEventListener('MSFullscreenChange', fullscreenchangeHandler, false)
    document.addEventListener('webkitfullscreenchange', fullscreenchangeHandler, false)
  }
})()

// create cross browser triggerEvent function
window.triggerEvent = function (target, eventName, params) {
  var e
  if (params) {
    e = new CustomEvent(eventName, {
      detail: params
    })
  } else {
    try {
      e = new Event(eventName)
    } catch (err) {
      e = new CustomEvent(eventName)
    }
  }

  return target.dispatchEvent(e, params)
}

window.wheelzoom = (function () {
  var defaults = {
    zoom: 0.10,
    pinchSensibility: 0.3,
    maxZoom: -1
  }

  var images = []
  var canvas = document.createElement('canvas')

  var main = function (img, options) {
    if (!img || !img.nodeName || img.nodeName !== 'IMG') { return }

    var settings = {}
    img.wz = {}

    function setSrcToBackground (img) {
      img.style.backgroundImage = 'url("' + img.src + '")'
      img.style.backgroundRepeat = 'no-repeat'
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      img.wz.cachedDataUrl = canvas.toDataURL()
      img.src = img.wz.cachedDataUrl
    }

    function updateBgStyle () {
      var windowBox = {
        left: 0,
        right: img.width,
        top: 0,
        down: img.height,
        width: img.width,
        height: img.height
      }

      var imageBox = {
        left: img.wz.bgPosX,
        right: img.wz.bgPosX + img.wz.bgWidth,
        top: img.wz.bgPosY,
        down: img.wz.bgPosY + img.wz.bgHeight,
        width: img.wz.bgWidth,
        height: img.wz.bgHeight
      }

      // If image width is smaller than canvas width
      if (imageBox.width < windowBox.width) {
        if (imageBox.left < windowBox.left) {
          // do not overflow left
          img.wz.bgPosX = windowBox.left
        } else if (imageBox.right > windowBox.right) {
          // do not overflow right
          img.wz.bgPosX = windowBox.right - img.wz.bgWidth
        }
      } else { // if image width is bigger than canvas width
        // force overflow left
        if (imageBox.left > windowBox.left) {
          img.wz.bgPosX = windowBox.left
        } else if (imageBox.right < windowBox.right) {
          // force overflow right
          img.wz.bgPosX = windowBox.right - img.wz.bgWidth
        }
      }
      // If image height is smaller than canvas height
      if (imageBox.height < windowBox.height) {
        if (imageBox.top < windowBox.top) {
          // do not overflow top
          img.wz.bgPosY = windowBox.top
        } else if (imageBox.down > windowBox.down) {
          // do not overflow down
          img.wz.bgPosY = windowBox.down - img.wz.bgHeight
        }
      } else { // if image height is bigger than canvas height
        // force overflow top
        if (imageBox.top > windowBox.top) {
          img.wz.bgPosY = windowBox.top
        } else if (imageBox.down < windowBox.down) {
          // force overflow down
          img.wz.bgPosY = windowBox.down - img.wz.bgHeight
        }
      }

      img.style.backgroundSize = img.wz.bgWidth + 'px ' + img.wz.bgHeight + 'px'
      img.style.backgroundPosition = img.wz.bgPosX + 'px ' + img.wz.bgPosY + 'px'
    }

    img.wz.reset = function () {
      img.wz.bgWidth = img.wz.width
      img.wz.bgHeight = img.wz.height
      img.wz.bgPosX = img.width / 2 - img.wz.width / 2
      img.wz.bgPosY = img.height / 2 - img.wz.height / 2
      updateBgStyle()
    }

    img.doZoomIn = function (propagate) {
      propagate = propagate || false
      doZoom(-100, propagate)
    }

    img.doZoomOut = function (propagate) {
      propagate = propagate || false
      doZoom(100, propagate)
    }

    function doZoom (deltaY, propagate) {
      propagate = propagate || false
      var zoomSensibility = settings.zoom * settings.pinchSensibility

      // zoom always at the center of the image
      var offsetX = img.width / 2
      var offsetY = img.height / 2

      // Record the offset between the bg edge and the center of the image:
      var bgCenterX = offsetX - img.wz.bgPosX
      var bgCenterY = offsetY - img.wz.bgPosY
      // Use the previous offset to get the percent offset between the bg edge and the center of the image:
      var bgRatioX = bgCenterX / img.wz.bgWidth
      var bgRatioY = bgCenterY / img.wz.bgHeight

      // Update the bg size:
      if (deltaY < 0) {
        if (settings.maxZoom === -1 || (img.wz.bgWidth + img.wz.bgWidth * zoomSensibility) / img.wz.width <= settings.maxZoom) {
          img.wz.bgWidth += img.wz.bgWidth * zoomSensibility
          img.wz.bgHeight += img.wz.bgHeight * zoomSensibility
        }
      } else {
        img.wz.bgWidth -= img.wz.bgWidth * zoomSensibility
        img.wz.bgHeight -= img.wz.bgHeight * zoomSensibility
      }

      // Take the percent offset and apply it to the new size:
      img.wz.bgPosX = offsetX - (img.wz.bgWidth * bgRatioX)
      img.wz.bgPosY = offsetY - (img.wz.bgHeight * bgRatioY)

      if (propagate) {
        if (deltaY < 0) {
          // setTimeout to handle lot of events fired
          setTimeout(function () {
            window.triggerEvent(img, 'wheelzoom.in', {
              zoom: img.wz.bgWidth / img.wz.width,
              bgPosX: img.wz.bgPosX,
              bgPosY: img.wz.bgPosY
            })
          }, 10)
        } else {
          // setTimeout to handle lot of events fired
          setTimeout(function () {
            window.triggerEvent(img, 'wheelzoom.out', {
              zoom: img.wz.bgWidth / img.wz.width,
              bgPosX: img.wz.bgPosX,
              bgPosY: img.wz.bgPosY
            })
          }, 10)
        }
      }

      // Prevent zooming out beyond the starting size
      if (img.wz.bgWidth <= img.wz.width || img.wz.bgHeight <= img.wz.height) {
        window.triggerEvent(img, 'wheelzoom.reset')
      } else {
        updateBgStyle()
      }
    }

    img.wz.onwheel = function (e) {
      var deltaY = 0

      e.preventDefault()

      if (e.deltaY) { // FireFox 17+ (IE9+, Chrome 31+?)
        deltaY = e.deltaY
      } else if (e.wheelDelta) {
        deltaY = -e.wheelDelta
      }

      if (deltaY < 0) {
        img.doZoomIn(true)
      } else {
        img.doZoomOut(true)
      }
    }

    img.doDrag = function (x, y) {
      img.wz.bgPosX = x
      img.wz.bgPosY = y

      updateBgStyle()
    }

    img.wz.drag = function (e) {
      e.preventDefault()
      var xShift, yShift, dist, prevDist, deltaPinch
      var isPinch = false

      switch (e.type) {
        case 'touchstart':
        case 'touchmove':
          isPinch = e.touches.length === 2
          xShift = e.touches[0].pageX
          yShift = e.touches[0].pageY
          break
        default:
          xShift = e.pageX
          yShift = e.pageY
      }

      switch (img.wz.previousEvent.type) {
        case 'touchstart':
        case 'touchmove':
          isPinch = img.wz.previousEvent.touches.length === 2
          xShift -= img.wz.previousEvent.touches[0].pageX
          yShift -= img.wz.previousEvent.touches[0].pageY
          break
        default:
          xShift -= img.wz.previousEvent.pageX
          yShift -= img.wz.previousEvent.pageY
      }

      if (isPinch) { // Zoom if pinch
        dist = Math.sqrt(
          Math.pow(e.touches[1].pageX - e.touches[0].pageX, 2) +
          Math.pow(e.touches[1].pageY - e.touches[0].pageY, 2))
        prevDist = Math.sqrt(
          Math.pow(img.wz.previousEvent.touches[1].pageX - img.wz.previousEvent.touches[0].pageX, 2) +
          Math.pow(img.wz.previousEvent.touches[1].pageY - img.wz.previousEvent.touches[0].pageY, 2))
        deltaPinch = prevDist - dist

        if (deltaPinch < 0) {
          img.doZoomIn(true)
        } else {
          img.doZoomOut(true)
        }
        return
      }

      var x = img.wz.bgPosX + xShift
      var y = img.wz.bgPosY + yShift

      img.doDrag(x, y)

      window.triggerEvent(img, 'wheelzoom.drag', {
        bgPosX: img.wz.bgPosX,
        bgPosY: img.wz.bgPosY,
        xShift: xShift,
        yShift: yShift
      })

      img.wz.previousEvent = e
      updateBgStyle()
    }

    img.wz.removeDrag = function () {
      window.triggerEvent(img, 'wheelzoom.dragend', {
        x: img.wz.bgPosX - img.wz.initBgPosX,
        y: img.wz.bgPosY - img.wz.initBgPosY
      })

      document.removeEventListener('mouseup', img.wz.removeDrag)
      document.removeEventListener('mousemove', img.wz.drag)
      document.removeEventListener('touchend', img.wz.removeDrag)
      document.removeEventListener('touchmove', img.wz.drag)
    }

    // Make the background draggable
    img.wz.draggable = function (e) {
      window.triggerEvent(img, 'wheelzoom.dragstart')

      e.preventDefault()
      img.wz.previousEvent = e

      if (e.type === 'touchstart') {
        document.addEventListener('touchmove', img.wz.drag)
        document.addEventListener('touchend', img.wz.removeDrag)
      } else {
      document.addEventListener('mousemove', img.wz.drag)
      document.addEventListener('mouseup', img.wz.removeDrag)
    }
    }

    function load () {
      if (img.src === img.wz.cachedDataUrl) return

      var computedStyle = window.getComputedStyle(img, null)

      img.wz.width = parseInt(computedStyle.width, 10)
      img.wz.height = parseInt(computedStyle.height, 10)
      img.wz.bgWidth = img.wz.width
      img.wz.bgHeight = img.wz.height
      img.wz.bgPosX = img.wz.initBgPosX = (img.width - img.wz.width) / 2
      img.wz.bgPosY = img.wz.initBgPosY = (img.height - img.wz.height) / 2

      setSrcToBackground(img)

      img.style.backgroundSize = img.wz.width + 'px ' + img.wz.height + 'px'
      img.style.backgroundPosition = img.wz.bgPosX + 'px ' + img.wz.bgPosY + 'px'

      img.addEventListener('wheelzoom.reset', img.wz.reset)
      img.addEventListener('wheelzoom.destroy', img.wz.destroy)
      img.addEventListener('wheel', img.wz.onwheel)
      img.addEventListener('mousedown', img.wz.draggable)
      img.addEventListener('touchstart', img.wz.draggable)
    }

    img.wz.destroy = function (img, originalProperties) {
      img.removeEventListener('wheelzoom.destroy', img.wz.destroy)
      img.removeEventListener('wheelzoom.reset', img.wz.reset)
      img.removeEventListener('mouseup', img.wz.removeDrag)
      img.removeEventListener('mousemove', img.wz.drag)
      img.removeEventListener('mousedown', img.wz.draggable)
      img.removeEventListener('touchleave', img.wz.removeDrag)
      img.removeEventListener('touchmove', img.wz.drag)
      img.removeEventListener('touchstart', img.wz.draggable)
      img.removeEventListener('wheel', img.wz.onwheel)

      img.style = originalProperties.style
      img.src = originalProperties.src

      for (var i = 0; i < images.length; i++) {
        if (images[i] === img) {
          images.splice(i, 1)
        }
      }
    }.bind(null, img, (function () {
      return {
        style: img.getAttribute('style'),
        src: img.getAttribute('src')
      }
    })())

    options = options || {}

    Object.keys(defaults).forEach(function (key) {
      settings[key] = typeof options[key] !== 'undefined' ? options[key] : defaults[key]
    })

    images.push(img)

    var t = setInterval(function () {
      if (img.complete) {
        load()
      }

      clearInterval(t)
    }, 100)
  }

  var wheelzoom = function (elements, options) {
    if (elements && elements.length) {
      for (var i = 0; i < elements.length; i++) {
        main(elements[i], options)
      }
    } else if (elements && elements.nodeName) {
      main(elements, options)
    }

    return elements
  }

  wheelzoom.images = function () {
    return images
  }

  wheelzoom.resetAll = function () {
    images.forEach(function (image) {
      image.wz.reset()
    })
  }

  wheelzoom.destroyAll = function () {
    while (images.length) {
      images[0].wz.destroy()
    }
  }

  // Do nothing in IE8
  if (typeof window.getComputedStyle !== 'function') {
    return function (elements) {
      return elements
    }
  } else {
    return wheelzoom
  }
}())
