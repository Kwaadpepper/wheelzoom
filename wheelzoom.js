/*!
	Wheelzoom 1.1.1
	license: MIT
	https://luperi.github.io/wheelzoom/
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
		img.wz = {};

		function setSrcToBackground(img) {
			img.style.backgroundImage = 'url("'+img.src+'")';
			img.style.backgroundRepeat = 'no-repeat';
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			img.wz.cachedDataUrl = canvas.toDataURL();
			img.src = img.wz.cachedDataUrl;
		}

		function updateBgStyle() {
			if (img.wz.bgPosX > 0) {
				img.wz.bgPosX = 0;
			} else if (img.wz.bgPosX < img.wz.width - img.wz.bgWidth) {
				img.wz.bgPosX = img.wz.width - img.wz.bgWidth;
			}

			if (img.wz.bgPosY > 0) {
				img.wz.bgPosY = 0;
			} else if (img.wz.bgPosY < img.wz.height - img.wz.bgHeight) {
				img.wz.bgPosY = img.wz.height - img.wz.bgHeight;
			}

			img.style.backgroundSize = img.wz.bgWidth+'px '+img.wz.bgHeight+'px';
			img.style.backgroundPosition = img.wz.bgPosX+'px '+img.wz.bgPosY+'px';
		}

		function reset() {
			img.wz.bgWidth = img.wz.width;
			img.wz.bgHeight = img.wz.height;
			img.wz.bgPosX = img.wz.bgPosY = 0;
			updateBgStyle();
		}

		img.doZoomIn = function(propagate) {
			if (typeof propagate === 'undefined') {
				propagate = false;
			}

			doZoom(-100, propagate);
		}

		img.doZoomOut = function(propagate) {
			if (typeof propagate === 'undefined') {
				propagate = false;
			}

			doZoom(100, propagate);
		}

		function doZoom (deltaY, propagate) {
			if (typeof propagate === 'undefined') {
				propagate = false;
			}

			// zoom always at the center of the image
			var offsetX = img.width/2;
			var offsetY = img.height/2;

			// Record the offset between the bg edge and the center of the image:
			var bgCenterX = offsetX - img.wz.bgPosX;
			var bgCenterY = offsetY - img.wz.bgPosY;
			// Use the previous offset to get the percent offset between the bg edge and the center of the image:
			var bgRatioX = bgCenterX/img.wz.bgWidth;
			var bgRatioY = bgCenterY/img.wz.bgHeight;

			// Update the bg size:
			if (deltaY < 0) {
				if (settings.maxZoom == -1 || (img.wz.bgWidth + img.wz.bgWidth*settings.zoom) / img.wz.width <= settings.maxZoom) {
					img.wz.bgWidth += img.wz.bgWidth*settings.zoom;
					img.wz.bgHeight += img.wz.bgHeight*settings.zoom;
				}
			} else {
				img.wz.bgWidth -= img.wz.bgWidth*settings.zoom;
				img.wz.bgHeight -= img.wz.bgHeight*settings.zoom;
			}

			// Take the percent offset and apply it to the new size:
			img.wz.bgPosX = offsetX - (img.wz.bgWidth * bgRatioX);
			img.wz.bgPosY = offsetY - (img.wz.bgHeight * bgRatioY);

			if (propagate) {
				if (deltaY < 0) {
					// setTimeout to handle lot of events fired
					setTimeout(function() {
						triggerEvent(img, 'wheelzoom.in', {
							zoom: img.wz.bgWidth/img.wz.width,
							bgPosX: img.wz.bgPosX,
							bgPosY: img.wz.bgPosY
						});
					}, 10);
				} else {
					// setTimeout to handle lot of events fired
					setTimeout(function() {
						triggerEvent(img, 'wheelzoom.out', {
							zoom: img.wz.bgWidth/img.wz.width,
							bgPosX: img.wz.bgPosX,
							bgPosY: img.wz.bgPosY
						});
					}, 10);
				}
			}

			// Prevent zooming out beyond the starting size
			if (img.wz.bgWidth <= img.wz.width || img.wz.bgHeight <= img.wz.height) {
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

			if (deltaY < 0) {
				img.doZoomIn(true);
			} else {
				img.doZoomOut(true);
			}
		}

		img.doDrag = function (x, y) {
			img.wz.bgPosX = x;
			img.wz.bgPosY = y;

			updateBgStyle();
		}

		function drag(e) {
			e.preventDefault();
			var xShift = e.pageX - img.wz.previousEvent.pageX;
			var yShift = e.pageY - img.wz.previousEvent.pageY;
			var x = img.wz.bgPosX + xShift;
			var y = img.wz.bgPosY + yShift;

			img.doDrag(x, y);

			triggerEvent(img, 'wheelzoom.drag', {
				bgPosX: img.wz.bgPosX,
				bgPosY: img.wz.bgPosY,
				xShift: xShift,
				yShift: yShift
			});

			img.wz.previousEvent = e;
			updateBgStyle();
		}

		function removeDrag() {
			triggerEvent(img, 'wheelzoom.dragend', {
				x: img.wz.bgPosX - img.wz.initBgPosX,
				y: img.wz.bgPosY - img.wz.initBgPosY
			});

			document.removeEventListener('mouseup', removeDrag);
			document.removeEventListener('mousemove', drag);
		}

		// Make the background draggable
		function draggable(e) {
			triggerEvent(img, 'wheelzoom.dragstart');

			e.preventDefault();
			img.wz.previousEvent = e;
			document.addEventListener('mousemove', drag);
			document.addEventListener('mouseup', removeDrag);
		}

		function load() {
			if (img.src === img.wz.cachedDataUrl) return;

			var computedStyle = window.getComputedStyle(img, null);

			img.wz.width = parseInt(computedStyle.width, 10);
			img.wz.height = parseInt(computedStyle.height, 10);
			img.wz.bgWidth = img.wz.width;
			img.wz.bgHeight = img.wz.height;
			img.wz.bgPosX = img.wz.bgPosY = img.wz.initBgPosX = img.wz.initBgPosY = 0;

			setSrcToBackground(img);

			img.style.backgroundSize =  img.wz.width+'px '+img.wz.height+'px';
			img.style.backgroundPosition = '0 0';

			img.addEventListener('wheelzoom.reset', reset);
			img.addEventListener('wheelzoom.destroy', destroy);
			img.addEventListener('wheel', onwheel);
			img.addEventListener('mousedown', draggable);
		}

		var destroy = function (originalProperties) {
			img.removeEventListener('wheelzoom.destroy', destroy);
			img.removeEventListener('wheelzoom.reset', reset);
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

		options = options || {};

		Object.keys(defaults).forEach(function(key){
			settings[key] = typeof options[key] !== 'undefined' ? options[key] : defaults[key];
		});

		var t = setInterval(function () {
			if (img.complete) {
				load();
			}

			clearInterval(t);
		}, 100);
	};

	// Do nothing in IE8
	if (typeof window.getComputedStyle !== 'function') {
		return function(elements) {
			return elements;
		};
	} else {
		return function(elements, options) {
			if (elements && elements.length) {
				for (var i=0;i<elements.length;i++) {
					main(elements[i], options);
				}
			} else if (elements && elements.nodeName) {
				main(elements, options);
			}

			return elements;
		};
	}
}());