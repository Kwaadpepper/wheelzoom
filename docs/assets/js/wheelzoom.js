"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

//#! Wheelzoom 1.3.0
//  license: MIT
//  https://kwaadpepper.github.io/wheelzoom/
var Events, Image, ImageApi, Wheelzoom, __whmodules;

__whmodules = {
  globals: {},
  modules: [],
  add: function add(_module) {
    return __whmodules.modules.push(_module.bind(__whmodules.globals));
  },
  addClass: function addClass(_className, _class) {
    return __whmodules.globals[_className] = _class.bind(__whmodules.globals);
  },
  windowRegister: function windowRegister(_globalElement) {
    return _globalElement();
  },
  init: function init() {
    var _module, i, len, ref, results;

    ref = __whmodules.modules;
    results = [];

    for (i = 0, len = ref.length; i < len; i++) {
      _module = ref[i];
      results.push(_module.call(__whmodules.globals));
    }

    return results;
  }
};

__whmodules.add(function () {
  var fullscreenchangeHandler;

  fullscreenchangeHandler = function fullscreenchangeHandler() {
    return window.wheelzoom.resetAll();
  };

  if (document.addEventListener) {
    document.addEventListener('fullscreenchange', fullscreenchangeHandler, false);
    document.addEventListener('mozfullscreenchange', fullscreenchangeHandler, false);
    document.addEventListener('MSFullscreenChange', fullscreenchangeHandler, false);
    return document.addEventListener('webkitfullscreenchange', fullscreenchangeHandler, false);
  }
});

__whmodules.add(function () {
  var staticMethods;
  this.defaults = {
    zoom: 0.10,
    pinchSensibility: 0.3,
    maxZoom: -1
  };
  this.isPinched = false;
  staticMethods = ['images', 'resetAll', 'destroyAll'];
  return window.wheelzoom = function (elements, options) {
    var i, len, staticMethod, whz;
    whz = new Wheelzoom(elements, options);

    for (i = 0, len = staticMethods.length; i < len; i++) {
      staticMethod = staticMethods[i];
      window.wheelzoom[staticMethod] = Wheelzoom[staticMethod];
    }

    return whz;
  };
});

__whmodules.addClass('Events', Events = /*#__PURE__*/function () {
  function Events(_whzImage) {
    _classCallCheck(this, Events);

    this.initEvents = this.initEvents.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.trigger = this.trigger.bind(this);
    this.onwheel = this.onwheel.bind(this);
    this.drag = this.drag.bind(this);
    this.draggable = this.draggable.bind(this);
    this.removeDrag = this.removeDrag.bind(this);
    this.destroy = this.destroy.bind(this); // Instance variables

    this.previousEvent = null;
    this.whzImage = _whzImage;
    this.domImage = _whzImage.domImage;
    this.imgInfo = _whzImage.imgInfo;
    this._events = {}; // Init

    this.initEvents();
  }

  _createClass(Events, [{
    key: "initEvents",
    value: function initEvents() {
      var _this = this;

      this._events['wheelzoom.reset'] = function () {
        return _this.whzImage.reset();
      }.bind(this);

      this._events['wheelzoom.destroy'] = this.destroy.bind(this);
      this._events['wheel'] = this.onwheel.bind(this);
      this._events['mousedown'] = this.draggable.bind(this);
      this._events['touchstart'] = this.draggable.bind(this);
      this._events['touchmove'] = this.drag.bind(this);
      this._events['touchend'] = this.removeDrag.bind(this);
      this._events['mousemove'] = this.drag.bind(this);
      this._events['mouseup'] = this.removeDrag.bind(this);
      return ['wheelzoom.reset', 'wheelzoom.destroy', 'wheel', 'mousedown', 'touchstart'].forEach(function (evt) {
        return _this.on(_this.domImage, evt);
      }.bind(this));
    }
  }, {
    key: "on",
    value: function on(element, evt) {
      return element.addEventListener(evt, this._events[evt]);
    }
  }, {
    key: "off",
    value: function off(element, evt) {
      return element.removeEventListener(evt, this._events[evt]);
    }
  }, {
    key: "trigger",
    value: function trigger(eventName, options) {
      var _this2 = this;

      var zoomTimer;
      zoomTimer = null;
      options = options || {};

      switch (eventName) {
        case 'wheelzoom.dragend':
          window.triggerEvent(this.domImage, eventName, {
            x: this.imgInfo.bgPosX - this.imgInfo.initBgPosX,
            y: this.imgInfo.bgPosY - this.imgInfo.initBgPosY
          });
          break;

        case 'wheelzoom.dragstart':
        case 'wheelzoom.reset':
        case 'wheelzoom.drag':
          window.triggerEvent(this.domImage, eventName, options);
          break;

        case 'wheelzoom.out':
        case 'wheelzoom.in':
          // setTimeout to handle lot of events fired
          clearTimeout(zoomTimer);
          zoomTimer = setTimeout(function (eventName, options) {
            return window.triggerEvent(_this2.domImage, eventName, options);
          }.bind(this, eventName, options), 10);
          break;
      }
    }
  }, {
    key: "onwheel",
    value: function onwheel(e) {
      var deltaY;
      e.preventDefault();
      deltaY = 0; // FireFox 17+ (IE9+, Chrome 31+?)

      if (e.deltaY) {
        deltaY = e.deltaY;
      } else if (e.wheelDelta) {
        deltaY = -e.wheelDelta;
      }

      return this.whzImage.zoom(deltaY, true);
    }
  }, {
    key: "drag",
    value: function drag(e) {
      var deltaPinch, dist, prevDist, x, xShift, y, yShift;
      e.preventDefault();

      switch (e.type) {
        case 'touchstart':
        case 'touchmove':
          __whmodules.globals['isPinched'] = e.touches.length === 2;
          xShift = e.touches[0].pageX;
          yShift = e.touches[0].pageY;
          break;

        default:
          xShift = e.pageX;
          yShift = e.pageY;
      }

      switch (this.previousEvent.type) {
        case 'touchstart':
        case 'touchmove':
          __whmodules.globals['isPinched'] = this.previousEvent.touches.length === 2;
          xShift -= this.previousEvent.touches[0].pageX;
          yShift -= this.previousEvent.touches[0].pageY;
          break;

        default:
          xShift -= this.previousEvent.pageX;
          yShift -= this.previousEvent.pageY;
      }

      if (__whmodules.globals['isPinched']) {
        dist = Math.sqrt(Math.pow(e.touches[1].pageX - e.touches[0].pageX, 2) + Math.pow(e.touches[1].pageY - e.touches[0].pageY, 2));
        prevDist = Math.sqrt(Math.pow(this.previousEvent.touches[1].pageX - this.previousEvent.touches[0].pageX, 2) + Math.pow(this.previousEvent.touches[1].pageY - this.previousEvent.touches[0].pageY, 2));
        deltaPinch = prevDist - dist;
        this.whzImage.zoom(deltaPinch, true);
        return;
      }

      x = this.imgInfo.bgPosX + xShift;
      y = this.imgInfo.bgPosY + yShift;
      this.whzImage.drag(x, y);
      this.trigger('wheelzoom.drag', {
        bgPosX: this.imgInfo.bgPosX,
        bgPosY: this.imgInfo.bgPosY,
        xShift: xShift,
        yShift: yShift
      });
      this.previousEvent = e;
      return this.whzImage.updateBgStyle();
    }
  }, {
    key: "draggable",
    value: function draggable(e) {
      e.preventDefault();
      this.trigger('wheelzoom.dragend');
      this.previousEvent = e;

      if (e.type === 'touchstart') {
        this.on(document, 'touchmove');
        return this.on(document, 'touchend');
      } else {
        this.on(document, 'mousemove');
        return this.on(document, 'mouseup');
      }
    }
  }, {
    key: "removeDrag",
    value: function removeDrag(e) {
      e.preventDefault();
      this.trigger('wheelzoom.dragend');
      this.off(document, 'touchmove');
      this.off(document, 'touchend');
      this.off(document, 'mousemove');
      return this.off(document, 'mouseup');
    }
  }, {
    key: "destroy",
    value: function destroy(e) {
      this.whzImage.destroy();
      this.off(this.domImage, 'wheelzoom.reset');
      this.off(this.domImage, 'wheelzoom.destroy');
      this.off(this.domImage, 'wheel');
      this.off(this.domImage, 'mousedown');
      this.off(this.domImage, 'mouseup');
      this.off(this.domImage, 'mousemove');
      this.off(this.domImage, 'touchstart');
      this.off(this.domImage, 'touchleave');
      this.off(this.domImage, 'touchmove');
      delete this.previousEvent;
      delete this.whzImage;
      delete this.domImage;
      delete this.imgInfo;
      return delete this._events;
    }
  }]);

  return Events;
}());

__whmodules.addClass('Image', Image = /*#__PURE__*/function () {
  function Image(_domImage, _options) {
    _classCallCheck(this, Image);

    var t;
    this.isEqualTo = this.isEqualTo.bind(this);
    this.load = this.load.bind(this);
    this.updateBgStyle = this.updateBgStyle.bind(this);
    this.reset = this.reset.bind(this);
    this.setSrcToBackground = this.setSrcToBackground.bind(this);
    this.zoom = this.zoom.bind(this);
    this.drag = this.drag.bind(this);
    this.destroy = this.destroy.bind(this); // Instance variables

    this.domImage = _domImage;
    this.canvas = document.createElement('canvas');
    this.options = _options || {};
    this.imgInfo = {};
    this.wzEvents = new Events(this);
    this.wzImageApi = new ImageApi(this);
    t = setInterval(function (img, load) {
      if (img.complete) {
        load();
        return clearInterval(t);
      }
    }.bind(null, this.domImage, this.load.bind(this)), 100);
  }

  _createClass(Image, [{
    key: "isEqualTo",
    value: function isEqualTo(img) {
      return img === this.domImage;
    }
  }, {
    key: "load",
    value: function load() {
      var bgPosX, bgPosY, computedStyle, height, width;

      if (this.domImage.src === this.imgInfo.cachedDataUrl) {
        return;
      }

      computedStyle = window.getComputedStyle(this.domImage, null);
      width = parseInt(computedStyle.width, 10);
      height = parseInt(computedStyle.height, 10);
      bgPosX = (this.domImage.width - width) / 2;
      bgPosY = (this.domImage.height - height) / 2;
      this.imgInfo.width = width;
      this.imgInfo.height = height;
      this.imgInfo.bgWidth = width;
      this.imgInfo.bgHeight = height;
      this.imgInfo.initBgPosX = bgPosX;
      this.imgInfo.initBgPosY = bgPosY;
      this.imgInfo.bgPosX = bgPosX;
      this.imgInfo.bgPosY = bgPosY;
      this.setSrcToBackground(this.domImage);
      this.domImage.style.backgroundSize = this.imgInfo.width + 'px ' + this.imgInfo.height + 'px';
      return this.domImage.style.backgroundPosition = this.imgInfo.bgPosX + 'px ' + this.imgInfo.bgPosY + 'px';
    }
  }, {
    key: "updateBgStyle",
    value: function updateBgStyle() {
      var imageBox, windowBox;
      windowBox = {
        left: 0,
        right: this.domImage.width,
        top: 0,
        down: this.domImage.height,
        width: this.domImage.width,
        height: this.domImage.height
      };
      imageBox = {
        left: this.imgInfo.bgPosX,
        right: this.imgInfo.bgPosX + this.imgInfo.bgWidth,
        top: this.imgInfo.bgPosY,
        down: this.imgInfo.bgPosY + this.imgInfo.bgHeight,
        width: this.imgInfo.bgWidth,
        height: this.imgInfo.bgHeight
      }; // If image width is smaller than canvas width

      if (imageBox.width < windowBox.width) {
        if (imageBox.left < windowBox.left) {
          // do not overflow left
          this.imgInfo.bgPosX = windowBox.left;
        } else if (imageBox.right > windowBox.right) {
          // do not overflow right
          this.imgInfo.bgPosX = windowBox.right - this.imgInfo.bgWidth; // if image width is bigger than canvas width
        }
      } else {
        // force overflow left
        if (imageBox.left > windowBox.left) {
          this.imgInfo.bgPosX = windowBox.left;
        } else if (imageBox.right < windowBox.right) {
          // force overflow right
          this.imgInfo.bgPosX = windowBox.right - this.imgInfo.bgWidth;
        }
      } // If image height is smaller than canvas height


      if (imageBox.height < windowBox.height) {
        if (imageBox.top < windowBox.top) {
          // do not overflow top
          this.imgInfo.bgPosY = windowBox.top;
        } else {
          if (imageBox.down > windowBox.down) {
            //endregion do not overflow down
            this.imgInfo.bgPosY = windowBox.down - this.imgInfo.bgHeight; // if image height is bigger than canvas height
          }
        }
      } else {
        if (imageBox.top > windowBox.top) {
          // force overflow top
          this.imgInfo.bgPosY = windowBox.top;
        } else if (imageBox.down < windowBox.down) {
          // force overflow down
          this.imgInfo.bgPosY = windowBox.down - this.imgInfo.bgHeight;
        }
      }

      this.domImage.style.backgroundSize = this.imgInfo.bgWidth + "px " + this.imgInfo.bgHeight + "px";
      return this.domImage.style.backgroundPosition = this.imgInfo.bgPosX + "px " + this.imgInfo.bgPosY + "px";
    }
  }, {
    key: "reset",
    value: function reset() {
      this.imgInfo.bgWidth = this.imgInfo.width;
      this.imgInfo.bgHeight = this.imgInfo.height;
      this.imgInfo.bgPosX = this.domImage.width / 2 - this.imgInfo.width / 2;
      this.imgInfo.bgPosY = this.domImage.height / 2 - this.imgInfo.height / 2;
      return this.updateBgStyle();
    }
  }, {
    key: "setSrcToBackground",
    value: function setSrcToBackground() {
      this.domImage.style.backgroundImage = "url('" + this.domImage.src + "')";
      this.domImage.style.backgroundRepeat = 'no-repeat';
      this.canvas.width = this.domImage.naturalWidth;
      this.canvas.height = this.domImage.naturalHeight;
      this.imgInfo.cachedDataUrl = this.canvas.toDataURL();
      return this.domImage.src = this.imgInfo.cachedDataUrl;
    }
  }, {
    key: "zoom",
    value: function zoom(deltaY) {
      var propagate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var bgCenterX, bgCenterY, bgRatioX, bgRatioY, offsetX, offsetY, zoomSensibility;
      zoomSensibility = __whmodules.globals['isPinched'] ? this.options.zoom * this.options.pinchSensibility : this.options.zoom; // zoom always at the center of the image

      offsetX = this.domImage.width / 2;
      offsetY = this.domImage.height / 2; // Record the offset between the bg edge and the center of the image:

      bgCenterX = offsetX - this.imgInfo.bgPosX;
      bgCenterY = offsetY - this.imgInfo.bgPosY; // Use the previous offset to get the percent offset between the bg edge
      // and the center of the image:

      bgRatioX = bgCenterX / this.imgInfo.bgWidth;
      bgRatioY = bgCenterY / this.imgInfo.bgHeight; // Update the bg size:

      if (deltaY < 0) {
        if (this.options.maxZoom === -1 || (this.imgInfo.bgWidth + this.imgInfo.bgWidth * zoomSensibility) / this.imgInfo.width <= this.options.maxZoom) {
          this.imgInfo.bgWidth += this.imgInfo.bgWidth * zoomSensibility;
          this.imgInfo.bgHeight += this.imgInfo.bgHeight * zoomSensibility;
        }
      } else {
        this.imgInfo.bgWidth -= this.imgInfo.bgWidth * zoomSensibility;
        this.imgInfo.bgHeight -= this.imgInfo.bgHeight * zoomSensibility;
      } // Take the percent offset and apply it to the new size:


      this.imgInfo.bgPosX = offsetX - this.imgInfo.bgWidth * bgRatioX;
      this.imgInfo.bgPosY = offsetY - this.imgInfo.bgHeight * bgRatioY;

      if (propagate) {
        if (deltaY < 0) {
          this.wzEvents.trigger('wheelzoom.in', {
            zoom: this.imgInfo.bgWidth / this.imgInfo.width,
            bgPosX: this.imgInfo.bgPosX,
            bgPosY: this.imgInfo.bgPosY
          });
        } else {
          this.wzEvents.trigger('wheelzoom.out', {
            zoom: this.imgInfo.bgWidth / this.imgInfo.width,
            bgPosX: this.imgInfo.bgPosX,
            bgPosY: this.imgInfo.bgPosY
          });
        }
      } // Prevent zooming out beyond the starting size


      if (this.imgInfo.bgWidth <= this.imgInfo.width || this.imgInfo.bgHeight <= this.imgInfo.height) {
        return this.wzEvents.trigger('wheelzoom.reset');
      } else {
        return this.updateBgStyle();
      }
    }
  }, {
    key: "drag",
    value: function drag(x, y) {
      this.imgInfo.bgPosX = x;
      this.imgInfo.bgPosY = y;
      return this.updateBgStyle();
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.domImage.style = this.domImage.getAttribute('style');
      this.domImage.src = this.domImage.getAttribute('src');
      this.wzImageApi.destroy();
      return delete this.wzImageApi;
    }
  }]);

  return Image;
}());

__whmodules.addClass('ImageApi', ImageApi = /*#__PURE__*/function () {
  function ImageApi(_whzImage) {
    _classCallCheck(this, ImageApi);

    this.registerApiMethods = this.registerApiMethods.bind(this);
    this.destroy = this.destroy.bind(this);
    this.doZoomIn = this.doZoomIn.bind(this);
    this.doZoomOut = this.doZoomOut.bind(this);
    this.doDrag = this.doDrag.bind(this);
    this.whzImage = _whzImage;
    this.domImage = _whzImage.domImage;
    this.registerApiMethods();
  }

  _createClass(ImageApi, [{
    key: "registerApiMethods",
    value: function registerApiMethods() {
      this.domImage.doZoomIn = this.doZoomIn.bind(this);
      this.domImage.doZoomOut = this.doZoomOut.bind(this);
      return this.domImage.doDrag = this.doDrag.bind(this);
    }
  }, {
    key: "destroy",
    value: function destroy() {
      return delete this.domImage.wz;
    }
  }, {
    key: "doZoomIn",
    value: function doZoomIn() {
      return this.whzImage.zoom(-100, false);
    }
  }, {
    key: "doZoomOut",
    value: function doZoomOut() {
      return this.whzImage.zoom(100, false);
    }
  }, {
    key: "doDrag",
    value: function doDrag(x, y) {
      return this.whzImage.drag(x, y);
    }
  }]);

  return ImageApi;
}());

__whmodules.addClass('Wheelzoom', Wheelzoom = function () {
  var addImage, globals, parseOptions, wheelzoomSingleton, wzImgs;

  var Wheelzoom = /*#__PURE__*/function () {
    // public methods
    function Wheelzoom(elements, options) {
      _classCallCheck(this, Wheelzoom);

      this.init(elements, options);

      if (wheelzoomSingleton === !null) {
        return wheelzoomSingleton;
      } else {
        return wheelzoomSingleton = this;
      }
    }

    _createClass(Wheelzoom, [{
      key: "init",
      value: function init(elements, options) {
        var element, i, len; // Do nothing in IE8

        if (typeof window.getComputedStyle !== 'function') {
          return elements;
        }

        if (elements && elements.length) {
          for (i = 0, len = elements.length; i < len; i++) {
            element = elements[i];
            addImage(element, options);
          }
        } else if (elements && elements.nodeName) {
          addImage(elements, options);
        }

        return elements;
      } // public static methods

    }], [{
      key: "images",
      value: function images() {
        return wzImgs;
      }
    }, {
      key: "resetAll",
      value: function resetAll() {
        return wzImgs.forEach(function (wzImg) {
          return wzImg.reset();
        });
      }
    }, {
      key: "destroyAll",
      value: function destroyAll() {
        var results;
        results = [];

        while (wzImgs.length) {
          wzImgs[0].destroy();
          results.push(wzImgs.splice(0, 1));
        }

        return results;
      }
    }]);

    return Wheelzoom;
  }();

  ; // private static

  wheelzoomSingleton = null;
  wzImgs = [];
  globals = __whmodules.globals; // private methods

  addImage = function addImage(img, options) {
    var wzImg;

    if (!img || !img.nodeName || img.nodeName !== 'IMG') {
      return;
    }

    wzImg = new Image(img, parseOptions(options));
    return wzImgs.push(wzImg);
  };

  parseOptions = function parseOptions(options) {
    var out;
    out = {};
    options = options || {};
    Object.keys(globals['defaults']).forEach(function (key) {
      return out[key] = typeof options[key] !== 'undefined' ? options[key] : globals['defaults'][key];
    });
    return out;
  };

  return Wheelzoom;
}.call(undefined));

__whmodules.windowRegister(function () {
  var CustomEvent;

  CustomEvent = function CustomEvent(event, params) {
    var evt;
    params = params || {
      bubbles: false,
      cancelable: false,
      detail: void 0
    };
    evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  };

  CustomEvent.prototype = window.Event.prototype;
  return window.CustomEvent = CustomEvent;
}); // create cross browser triggerEvent function


__whmodules.windowRegister(function () {
  return window.triggerEvent = function (target, eventName, params) {
    var e, err;

    if (params) {
      e = new CustomEvent(eventName, {
        detail: params
      });
    } else {
      try {
        e = new Event(eventName);
      } catch (error) {
        err = error;
        e = new CustomEvent(eventName);
      }
    }

    return target.dispatchEvent(e, params);
  };
});

(function () {
  return __whmodules.init();
})();
//# sourceMappingURL=wheelzoom.js.map
