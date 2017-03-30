/*!
	Wheelzoom 1.0.0
	license: MIT
	https://github.com/Luperi/wheelzoom
*/

// create CustomEvent to override window.Event in unsupported browsers
(function () {
	function CustomEvent ( event, params ) {
		params = params || { bubbles: false, cancelable: false, detail: undefined };
		var evt = document.createEvent( 'CustomEvent' );
		evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
		return evt;
	}

	CustomEvent.prototype = window.Event.prototype;
	window.CustomEvent = CustomEvent;
})();

// create cross browser triggerEvent function
window.triggerEvent = function(target, eventName, params) {
	if (params) {
		var e = new CustomEvent(eventName, {
			'detail': params
		});
	} else {
		try {
			var e = new Event(eventName);
		} catch (err) {
			var e = new CustomEvent(eventName);
		}
	}

	return target.dispatchEvent(e, params);
};

window.wheelzoom = (function(){
	var defaults = {
		zoom: 0.10,
		maxZoom: -1
	};

	var canvas = document.createElement('canvas');

	var main = function(img, options){
		if (!img || !img.nodeName || img.nodeName !== 'IMG') { return; }

		var settings = {};
		var width;
		var height;
		var bgWidth;
		var bgHeight;
		var bgPosX;
		var bgPosY;
		var previousEvent;
		var cachedDataUrl;

		function setSrcToBackground(img) {
			img.style.backgroundImage = 'url("'+img.src+'")';
			img.style.backgroundRepeat = 'no-repeat';
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			cachedDataUrl = canvas.toDataURL();
			img.src = cachedDataUrl;
		}

		function updateBgStyle() {
			if (bgPosX > 0) {
				bgPosX = 0;
			} else if (bgPosX < width - bgWidth) {
				bgPosX = width - bgWidth;
			}

			if (bgPosY > 0) {
				bgPosY = 0;
			} else if (bgPosY < height - bgHeight) {
				bgPosY = height - bgHeight;
			}

			img.style.backgroundSize = bgWidth+'px '+bgHeight+'px';
			img.style.backgroundPosition = bgPosX+'px '+bgPosY+'px';
		}

		function reset() {
			bgWidth = width;
			bgHeight = height;
			bgPosX = bgPosY = 0;
			updateBgStyle();
		}

		img.doZoom = function (deltaY, offsetX, offsetY, propagate) {
			if (typeof propagate === 'undefined') {
				propagate = true;
			}

			// Record the offset between the bg edge and cursor:
			var bgCursorX = offsetX - bgPosX;
			var bgCursorY = offsetY - bgPosY;
			// Use the previous offset to get the percent offset between the bg edge and cursor:
			var bgRatioX = bgCursorX/bgWidth;
			var bgRatioY = bgCursorY/bgHeight;

			// Update the bg size:
			if (deltaY < 0) {
				if (settings.maxZoom == -1 || (bgWidth + bgWidth*settings.zoom) / width <= settings.maxZoom) {
					bgWidth += bgWidth*settings.zoom;
					bgHeight += bgHeight*settings.zoom;
				}
			} else {
				bgWidth -= bgWidth*settings.zoom;
				bgHeight -= bgHeight*settings.zoom;
			}

			// Take the percent offset and apply it to the new size:
			bgPosX = offsetX - (bgWidth * bgRatioX);
			bgPosY = offsetY - (bgHeight * bgRatioY);

			if (propagate) {
				if (deltaY < 0) {
					// setTimeout to handle lot of events fired
					setTimeout(function() {
						triggerEvent(img, 'wheelzoom.in', {
							bgWidth: bgWidth,
							bgHeight: bgHeight,
							bgPosX: bgPosX,
							bgPosY: bgPosY,
							width: width,
							height: height,
							bgCursorX: bgCursorX,
							bgCursorY: bgCursorY
						});
					}, 10);
				} else {
					// setTimeout to handle lot of events fired
					setTimeout(function() {
						triggerEvent(img, 'wheelzoom.out', {
							bgWidth: bgWidth,
							bgHeight: bgHeight,
							bgPosX: bgPosX,
							bgPosY: bgPosY,
							width: width,
							height: height,
							bgCursorX: bgCursorX,
							bgCursorY: bgCursorY
						});
					}, 10);
				}
			}

			// Prevent zooming out beyond the starting size
			if (bgWidth <= width || bgHeight <= height) {
				triggerEvent(img, 'wheelzoom.reset');
			} else {
				updateBgStyle();
			}
		}

		function onwheel(e) {
			var deltaY = 0;

			e.preventDefault();

			if (e.deltaY) { // FireFox 17+ (IE9+, Chrome 31+?)
				deltaY = e.deltaY;
			} else if (e.wheelDelta) {
				deltaY = -e.wheelDelta;
			}

			// As far as I know, there is no good cross-browser way to get the cursor position relative to the event target.
			// We have to calculate the target element's position relative to the document, and subtrack that from the
			// cursor's position relative to the document.
			var rect = img.getBoundingClientRect();
			var offsetX = e.pageX - rect.left - window.pageXOffset;
			var offsetY = e.pageY - rect.top - window.pageYOffset;

			img.doZoom(deltaY, offsetX, offsetY);
		}

		img.doDrag = function (xShift, yShift) {
			bgPosX += xShift;
			bgPosY += yShift;

			updateBgStyle();
		}

		function drag(e) {
			e.preventDefault();
			var xShift = e.pageX - previousEvent.pageX;
			var yShift = e.pageY - previousEvent.pageY;

			img.doDrag(xShift, yShift);

			triggerEvent(img, 'wheelzoom.drag', {
				bgPosX: bgPosX,
				bgPosY: bgPosY,
				xShift: xShift,
				yShift: yShift
			});

			previousEvent = e;
			updateBgStyle();
		}

		function removeDrag() {
			document.removeEventListener('mouseup', removeDrag);
			document.removeEventListener('mousemove', drag);
		}

		// Make the background draggable
		function draggable(e) {
			e.preventDefault();
			previousEvent = e;
			document.addEventListener('mousemove', drag);
			document.addEventListener('mouseup', removeDrag);
		}

		function load() {
			if (img.src === cachedDataUrl) return;

			var computedStyle = window.getComputedStyle(img, null);

			width = parseInt(computedStyle.width, 10);
			height = parseInt(computedStyle.height, 10);
			bgWidth = width;
			bgHeight = height;
			bgPosX = 0;
			bgPosY = 0;

			setSrcToBackground(img);

			img.style.backgroundSize =  width+'px '+height+'px';
			img.style.backgroundPosition = '0 0';
			img.addEventListener('wheelzoom.reset', reset);
			img.addEventListener('wheelzoom.destroy', destroy);

			img.addEventListener('wheel', onwheel);
			img.addEventListener('mousedown', draggable);
		}

		var destroy = function (originalProperties) {
			img.removeEventListener('wheelzoom.destroy', destroy);
			img.removeEventListener('wheelzoom.reset', reset);
			img.removeEventListener('load', load);
			img.removeEventListener('mouseup', removeDrag);
			img.removeEventListener('mousemove', drag);
			img.removeEventListener('mousedown', draggable);
			img.removeEventListener('wheel', onwheel);

			img.style.backgroundImage = originalProperties.backgroundImage;
			img.style.backgroundRepeat = originalProperties.backgroundRepeat;
			img.src = originalProperties.src;
		}.bind(null, {
			backgroundImage: img.style.backgroundImage,
			backgroundRepeat: img.style.backgroundRepeat,
			src: img.src
		});

		img.addEventListener('wheelzoom.destroy', destroy);

		options = options || {};

		Object.keys(defaults).forEach(function(key){
			settings[key] = typeof options[key] !== 'undefined' ? options[key] : defaults[key];
		});

		if (img.complete) {
			load();
		}

		img.addEventListener('load', load);
	};

	// Do nothing in IE8
	if (typeof window.getComputedStyle !== 'function') {
		return function(elements) {
			return elements;
		};
	} else {
		return function(elements, options) {
			if (elements && elements.length) {
				Array.prototype.forEach.call(elements, main, options);
			} else if (elements && elements.nodeName) {
				main(elements, options);
			}
			return elements;
		};
	}
}());