class Mouse {
	constructor() {
		this.pos = {x : 0, y: 0};
		this.offset = {x : 0, y : 0};
		this.size = {width: 0, height: 0};
		this.cursor = new Image();
		this.cursor.style.position = "absolute";
		document.body.appendChild(this.cursor);
		this.locked = null;
	}
	lock() {
		this.locked = true;
	}
	unlock() {
		this.locked = false;
	}
	isLocked() {
		return this.locked;
	}
	setSource(src){
		var basePath = "game/page/";
		this.cursor.src = basePath + src;
	}
	setPos({x , y}) {
		if(!isNaN(x)) {
			this.pos.x = x;
		}
		if(!isNaN(y)) {
			this.pos.y = y;
		}
	}
	setSize({width, height}) {
		this.size.width = width || 16;
		this.size.height = height || 16;
	}
	setOffset({offX, offY}) {
		if(!isNaN(offX)) {
			this.pos.x += offX;
		}
		if(!isNaN(offY)) {
			this.pos.y += offY;
		}		
	}
	setCursorOffset({offsetX , offsetY}) {
		if(!isNaN(offsetX)) {
			this.offset.x = offsetX;
		}
		if(!isNaN(offsetY)) {
			this.offset.y = offsetY;
		}
	}
	getSize() {
		return this.size;
	}
	getCursorOffset() {
		return this.offset;
	}
	getPos() {
		return this.pos;
	}
	updateCursor() {
		this.cursor.style.left = "" + this.pos.x + "px";
		this.cursor.style.top = "" + this.pos.y + "px";
	}
}
let mouse = new Mouse();



function validatePos(mouse, maxWidth, maxHeight) {
    let {x , y } = mouse.getPos();
	let {width, height} = mouse.getSize();
    if(x > maxWidth - width) {
		mouse.setPos({
			x : maxWidth - width
		});
    } else if(x < 0) {
		mouse.setPos({
			x : 0
		});
	}
    if(y > maxHeight - height) {
		mouse.setPos({
			y : maxHeight - height
		});
    } else if(y < 0) {
		mouse.setPos({
			y : 0
		});
    }
}

class Canvas {
	constructor() {
		
		this.instance = document.getElementById("canvas");
		this.sync();
	}
	getInstance() {
		return this.instance;
	}
	sync() {
		this.rect = this.instance.getBoundingClientRect();
	}
	getRect() {
		return this.rect;
	}

}
function toNumber(str) {
	return Number(str.match(/\d+/g).shift());
}
let canvas = new Canvas();
canvas.sync();

function setupCursor() {
	sc.Control.inject({
		getMouseX() {
			return (mouse.getPos().x - canvas.getInstance().offsetLeft 
			+ mouse.getCursorOffset().x) * 
			(ig.system.width/toNumber(canvas.getInstance().style.width))
		},
		getMouseY() {
			return (mouse.getPos().y - canvas.getInstance().offsetTop 
			+ mouse.getCursorOffset().y) 
			* (ig.system.height/toNumber(canvas.getInstance().style.height));
		}
	});

	Object.defineProperty(ig.input.mouse, 'x', {
		get() {
			return sc.control.getMouseX();
		},
		set(b) {
				this.value = b;
		}
	});

	Object.defineProperty(ig.input.mouse, 'y', {
		get() {
			return sc.control.getMouseY();
		},
		set(b) {
			this.value = b;
		}
	});
}


// check for cursor image updates
let gameDiv = document.getElementById('game');

let onCursorChange = function(mutationsList, observer) {
	let cursorCSS = $(gameDiv).css('cursor');
	let regexResult = cursorCSS.match(/img\/(?:.+).png/);
	if(regexResult) {
		let cursorPath = regexResult[0];
		
		mouse.setSource(cursorPath);
		
		let cursorSizeGeneral = Number(cursorPath.match(/\d+/g).shift()) * 16;
		let cursorSize = {width: cursorSizeGeneral, height : cursorSizeGeneral};
		if(cursorPath.length === "img/cursor-5.png".length) {
			// it is special
			cursorSize.width *= 45/80;
			cursorSize.height *= 60/80;
		}
		
		mouse.setSize(cursorSize);
		
		let cursorSettings = cursorCSS.substring(regexResult.index);
		let [offsetX, offsetY] = cursorSettings
										.match(/(\d+)(?:\s)(\d+)/)
										.splice(1)
										.map((n) => Number(n));
		

		mouse.setCursorOffset({
			offsetX,
			offsetY
		});	
	}

	
};
let cursorObserver = new MutationObserver(onCursorChange);


cursorObserver.observe(gameDiv, { attributes: true});



ig.module("impact.base.mouse-trap").requires("game.main").defines(function() {
	sc.CrossCode.inject({
		init() {
			this.parent();
			setupCursor();
			canvas.getInstance().addEventListener("click", function(e) {
				console.debug("Mouse clicked", mouse.isLocked());
				if(!mouse.isLocked()) {
					this.requestPointerLock();
					console.debug('Requesting lock');
					mouse.setPos({
						x: e.clientX,
						y: e.clientY
					});
					mouse.lock();
				}
			});
			window.addEventListener("blur", function() {
				document.exitPointerLock();
				mouse.unlock();
				console.debug("Released pointer lock.");
			});
			canvas.getInstance().addEventListener("mousemove", function(e) {
				if(!mouse.isLocked()) {
					mouse.setPos({
						x: e.clientX,
						y: e.clientY
					});
					return;
				}
				mouse.setOffset({
					offX: e.movementX,
					offY: e.movementY
				});
				validatePos(mouse, innerWidth, innerHeight);
				mouse.updateCursor();
			});
		}
	});
	
});
