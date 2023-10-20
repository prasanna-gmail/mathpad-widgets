//Javascript document

function pngVis(sf) {
	if (un(sf)) sf = 1;

	var ctx = newctx({vis:false});
	
	var obj = container.childNodes;
	for (var o = 0; o < obj.length; o++) {
		if (obj[o].nodeType !== 1) continue;
		if (obj[o].nodeName.toLowerCase() !== 'canvas') continue;
		var dims = obj[o].getBoundingClientRect();
		var left = roundToNearest(xWindowToCanvas(dims.left),1);
		var top = roundToNearest(yWindowToCanvas(dims.top),1);
		flattenCanvases(ctx.canvas,obj[o],left,top);
	}
	
	if (sf !== 1) {
		var w = mainCanvasWidth*sf;
		var h = mainCanvasHeight*sf;	
		var ctx2 = newctx({rect:[0,0,w,h],vis:false});
		ctx2.drawImage(ctx.canvas,0,0,w,h);
		var imgURL = canvasToPNG(ctx2.canvas);
	} else {
		var imgURL = canvasToPNG(ctx.canvas);
	}
	
	var dlLink = document.createElement('a');
	dlLink.download = 'dl.png';
	dlLink.href = imgURL;
	dlLink.dataset.downloadurl = ["image/png", dlLink.download, dlLink.href].join(':');
	document.body.appendChild(dlLink);
	dlLink.click();
	document.body.removeChild(dlLink);
}

var dropMenus = [];
function dropMenu(obj) {
	obj.open = false;
	obj.selected = -1;
	obj.buttonColor = def([obj.buttonColor,obj.selectedColor,'#3FF']);
	obj.selectedColor = def([obj.selectedColor,'#3FF']);
	obj.unselectedColor = def([obj.unselectedColor,'#CFF']);
	obj.z = def([obj.z,100000000]);
	obj.listShowMax = def([obj.listShowMax,-1]);
	obj.overflow = false;
	obj.fullWidth = clone(obj.listRect[2]);

	obj.canvas1 = createCanvas(obj.buttonRect[0],obj.buttonRect[1],obj.buttonRect[2],obj.buttonRect[3],true,false,true,obj.z);
	obj.canvas1.parent = obj;
	obj.canvas1.click = function() {
		var obj = this.parent;
		obj.open = !obj.open;
		if (obj.open == true) {
			showObj(obj.canvas2);
			showObj(obj.canvas3);
			if (obj.overflow) showScroller(obj.scroller);
			addListenerMove(window,obj.move);
			addListener(obj.canvas2,obj.click);
			addListenerStart(window,obj.windowClickClose);
			if (obj.overflow == true) window.addEventListener("mousewheel", obj.mouseWheelHandler, false);
		} else {
			obj.close();
		}
	}
	obj.canvas1.draw = function() {
		var obj = this.parent;
		var ctx = this.ctx;
		var w = obj.buttonRect[2];
		var h = obj.buttonRect[3];
		ctx.clearRect(0,0,w,h);
		text({ctx:obj.canvas1.ctx,text:[obj.title],left:2,top:2,width:w-4,height:h-4,align:'center',vertAlign:'middle',box:{type:'loose',color:obj.buttonColor,borderWidth:4}});
		ctx.fillStyle = '#000';
		ctx.lineJoin = 'round';
		ctx.lineCap = 'round';
		var l = w-15;
		var t = h/2;
		ctx.beginPath();
		ctx.moveTo(l-8,t-4);
		ctx.lineTo(l+8,t-4);
		ctx.lineTo(l,t+8);
		ctx.lineTo(l-8,t-4);
		ctx.fill();
	}
	obj.canvas1.draw();
	addListener(obj.canvas1,obj.canvas1.click);
	obj.windowClickClose = function(e) {
		for (var i = 0; i < dropMenus.length; i++) {
			if (dropMenus[i].open == true) {
				var obj = dropMenus[i];
				if (e.target !== obj.canvas1 && e.target !== obj.canvas2 && (un(obj.scroller) || (e.target !== obj.scroller.canvas && e.target !== obj.scroller.sliderCanvas))) {
					obj.close();
				}				
			}
		}
	}
	obj.close = function() {
		var obj = this;
		hideObj(obj.canvas2);
		hideObj(obj.canvas3);
		hideScroller(obj.scroller);		
		removeListenerMove(window,obj.move);
		removeListener(obj.canvas2,obj.click);
		removeListener(window,obj.windowClickClose);
		if (obj.overflow == true) window.removeEventListener("mousewheel", obj.mouseWheelHandler, false);		
		obj.selected = -1;
		obj.open = false;
		obj.draw();
	}
		
	obj.canvas2 = createCanvas(obj.listRect[0],obj.listRect[1],obj.listRect[2],obj.listRect[3],false,false,true,obj.z); // text - drawn once
	obj.canvas2.parent = obj;
	obj.canvas3 = createCanvas(obj.listRect[0],obj.listRect[1],obj.listRect[2],obj.listRect[3],false,false,false,obj.z+1); // colors
	obj.canvas3.parent = obj;
	obj.scroller = createScroller({
		rect:[obj.listRect[0]+obj.listRect[2]-20,obj.listRect[1],20,obj.listRect[3]*obj.listShowMax],
		z:obj.z+2,
		min:0,
		max:obj.data.length - obj.listShowMax,
		inc:1,
		sliderHeight:(obj.listRect[3]*obj.listShowMax-2*20)*(obj.listShowMax/obj.data.length),
		funcMove:function(value){
			var obj = this.parent;
			value = roundToNearest(value,1);
			obj.draw(value);
		removeListenerMove(window,obj.move);
		removeListener(obj.canvas2,obj.click);
		removeListener(window,obj.windowClickClose);				
		},
		funcStop:function(value){
			var obj = this.parent;
			value = roundToNearest(value,1);
			obj.draw(value);
			addListenerMove(window,obj.move);
			addListener(obj.canvas2,obj.click);
			addListener(window,obj.windowClickClose);				
		}		
	});
	obj.scroller.parent = obj;
	obj.mouseWheelHandler = function(e) {
		// cross-browser wheel delta
		var e = window.event || e; // old IE support
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		for (var i = 0; i < dropMenus.length; i++) {
			if (dropMenus[i].open == true) {
				var obj = dropMenus[i];
				setScrollerValue(obj.scroller,obj.scrollPos-delta,true);
				break;
			}
		}
	}
	hideScroller(obj.scroller);
	obj.updateData = function() {
		var obj = this;		
		var height = this.listRect[3]*this.data.length;
		if (this.listShowMax !== -1 && this.listShowMax < this.data.length) {
			this.overflow = true;
			this.listRect[2] = this.fullWidth - 20;
			height = this.listRect[3]*this.listShowMax;
			var s = this.scroller;
			s.max = this.data.length - this.listShowMax;
			s.sliderHeight = (height-2*20)*(this.listShowMax/this.data.length);
			s.incDist = (s.rect[3]-2*20 - s.sliderHeight)/((s.max-s.min)/s.inc);
			s.sliderRect[3] = s.sliderHeight;
			s.sliderCanvas.data[100] = s.sliderRect[0];
			s.sliderCanvas.data[101] = s.sliderRect[1];
			s.sliderCanvas.data[102] = s.sliderRect[2];
			s.sliderCanvas.data[103] = s.sliderRect[3];
			resizeCanvas(s.sliderCanvas,s.sliderCanvas.data[100],s.sliderCanvas.data[101],s.sliderCanvas.data[102],s.sliderCanvas.data[103]);
			setScrollerValue(s,0,true);
		} else {
			this.overflow = false;
			this.listRect[2] = this.fullWidth;
		}
		this.scrollPos = 0;
		this.canvas2.data[102] = this.listRect[2];
		this.canvas2.width = this.listRect[2];
		this.canvas2.data[103] = height;
		this.canvas2.height = height;
		resizeCanvas(this.canvas2,this.listRect[0],this.listRect[1],this.listRect[2],height);
		this.canvas3.data[102] = this.listRect[2];
		this.canvas3.width = this.listRect[2];
		this.canvas3.data[103] = height;
		this.canvas3.height = height;
		resizeCanvas(this.canvas3,this.listRect[0],this.listRect[1],this.listRect[2],height);
		obj.drawListText();
		obj.draw();

	}
	obj.drawListText = function() {
		var obj = this;
		var top = 0;
		if (obj.overflow) top -= obj.scrollPos*obj.listRect[3];
		var ctx = obj.canvas3.ctx;
		for (var d = 0; d < obj.data.length; d++) {
			text({ctx:ctx,text:['<<fontSize:16>>'+obj.data[d]],left:0,top:top,width:obj.listRect[2],height:obj.listRect[3],align:'left',vertAlign:'middle',box:{color:'none',borderWidth:0.01}});
			top += obj.listRect[3];
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(0,top);
			ctx.lineTo(obj.listRect[2],top);
			ctx.stroke();
		}
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(0,0);
		ctx.lineTo(obj.listRect[2],0);
		ctx.moveTo(0,0);
		ctx.lineTo(0,top);
		ctx.moveTo(obj.listRect[2],0);
		ctx.lineTo(obj.listRect[2],top);	
		ctx.stroke();		
	}
	obj.draw = function(newScrollPos) {
		var obj = this;		
		var ctx = this.canvas2.ctx;
		if (this.overflow == true) {
			if (!un(newScrollPos) && newScrollPos !== obj.scrollPos) {
				obj.scrollPos = newScrollPos;
				var ctx2 = this.canvas3.ctx;
				ctx2.clearRect(0,0,this.listRect[0],this.listRect[1]*this.listShowMax);
				obj.drawListText();
			}
			ctx.fillStyle = this.unselectedColor;
			ctx.fillRect(0,0-this.scrollPos*this.listRect[3],this.listRect[2],this.listRect[3]*this.data.length);
			ctx.fillStyle = this.selectedColor;
			ctx.fillRect(0,this.listRect[3]*this.selected-this.scrollPos*this.listRect[3],this.listRect[2],this.listRect[3]);
		} else {
			ctx.fillStyle = this.unselectedColor;
			ctx.fillRect(0,0,this.listRect[2],this.listRect[3]*this.data.length);
			ctx.fillStyle = this.selectedColor;
			ctx.fillRect(0,this.listRect[3]*this.selected,this.listRect[2],this.listRect[3]);			
		}
	}
	obj.updateData();
	obj.move = function(e) {
		updateMouse(e);
		var found = false;
		for (var i = 0; i < dropMenus.length; i++) {
			if (dropMenus[i].open == true) {
				obj = dropMenus[i];
				var found = true;
				break;
			}
		}
		if (found == false) return;
		if (mouse.x < obj.listRect[0] || mouse.x > obj.listRect[0]+obj.listRect[2] || mouse.y < obj.listRect[1] || mouse.y > obj.listRect[1]+obj.data.length*obj.listRect[3]) {
			if (obj.selected !== -1) {
				obj.selected = -1;
				obj.draw();
			}
		} else {
			var sel = Math.floor((mouse.y - obj.listRect[1]) / obj.listRect[3]);
			if (obj.overflow == true) sel += obj.scrollPos;
			if (obj.selected !== sel) {
				obj.selected = sel;
				obj.draw();
			}
		}
	}
	obj.click = function() {
		var obj = this.parent;
		if (!un(obj.func)) obj.func.apply();
		obj.close();
	}
	resize();
	obj.index = dropMenus.length;
	dropMenus.push(obj); // place in global array
	return obj;
}

function drawTable(context, lineWidth, lineColor, l, t, hLines, vLines) {
	context.save();
	context.beginPath();
	context.lineWidth = lineWidth;
	context.strokeStyle = lineColor;
	context.lineCap = 'round';
	// draw horizontal lines
	for (h = 0; h < hLines.length; h++) {
		context.moveTo(l + vLines[0], t + hLines[h]);
		context.lineTo(l + vLines[vLines.length - 1], t + hLines[h]);
	}
	// draw vertical lines
	for (v = 0; v < vLines.length; v++) {
		context.moveTo(l + vLines[v], t + hLines[0]);
		context.lineTo(l + vLines[v], t + hLines[hLines.length - 1]);
	}
	context.stroke();
	context.restore();
}
function calcTable2(object) {
	var left = object.left;
	var top = object.top;
	var cells = object.cells;
	
	var minCellWidth = object.minCellWidth || 80;
	var maxCellWidth = object.maxCellWidth || 150;
	var minCellHeight = object.minCellHeight || 100;
	var minCellPadding = object.minCellPadding || 10;
	var horizAlign = object.horizAlign || object.align || 'center';
	if (typeof object.text == 'object') {
		var font = object.text.font || 'Arial';
		var fontSize = object.text.size || 32;
		var textColor = object.text.color || '#000';
	} else {
		var font = 'Arial';
		var fontSize = 32;
		var textColor = '#000';
	}
	
	var numRows = cells.length;
	var numCols = 0;
	for (var i = 0; i < cells.length; i++) {
		numCols = Math.max(cells[i].length,numCols);
	}
	var cellHeights = [];
	for (var i = 0; i < numRows; i++) {
		cellHeights[i] = minCellHeight;	
	}
	var cellWidths = [];
	for (var j = 0; j < numCols; j++) {
		cellWidths[j] = minCellWidth;	
	}
	var totalWidth = 0;
	var totalHeight = 0;
	
	for (var i = 0; i < cells.length; i++) {
		var maxHeight = minCellHeight;
		for (var j = 0; j < cells[i].length; j++) {
			if (typeof cells[i][j] == 'object') {
				if (typeof cells[i][j].text !== 'object') cells[i][j].text = [];
				if (typeof cells[i][j].minWidth !== 'number') cells[i][j].minWidth = 0;
				if (typeof cells[i][j].minHeight !== 'number') cells[i][j].minHeight = 0;				
				cells[i][j].text.unshift('<<font:'+font+'>><<fontSize:'+fontSize+'>><<color:'+textColor+'>>');
				cells[i][j].text = reduceTags(cells[i][j].text);
				var dims = drawMathsText(ctx,cells[i][j].text,fontSize,0,0,false,[],horizAlign,'middle',text.color,'measure');
				maxHeight = Math.max(dims[1]+2*minCellPadding,cells[i][j].minHeight,maxHeight);
				cellWidths[j] = Math.max(dims[0]+2*minCellPadding,cells[i][j].minWidth,cellWidths[j]);
			}
		}
		cellHeights[i] = Math.max(maxHeight,cellHeights[i]);
		totalHeight += cellHeights[i];
	}
	for (var j = 0; j < cellWidths.length; j++) {
		totalWidth += cellWidths[j];
	}
	
	var horizPos = [left];
	for (var i = 0; i < cellWidths.length; i++) {
		horizPos.push(horizPos[horizPos.length-1]+cellWidths[i])
	}
	
	var vertPos = [top];
	for (var i = 0; i < cellHeights.length; i++) {
		vertPos.push(vertPos[vertPos.length-1]+cellHeights[i])
	}
	
	var cellDims = [];
		
	var topPos = top;
	for (var i = 0; i < cells.length; i++) {
		var leftPos = left; 
		cellDims[i] = [];
		for (var j = 0; j < cells[i].length; j++) {
			cellDims[i][j] = {
				left:leftPos+2,
				top:topPos+1,
				width:cellWidths[j]-9,
				height:cellHeights[i]-8,
				border:false,
				offset:[-40,0.5*(cellHeights[i]-8)-20],
				fontSize:fontSize,
				leftPoint:minCellPadding,
				textColor:textColor,
				textAlign:horizAlign,
				fontSize:fontSize
			};
			leftPos += cellWidths[j];
		}
		topPos += cellHeights[i];
	}	
	
	return {cell:cellDims,xPos:horizPos,yPos:vertPos};
}
function drawTable2(object) {
	/* EXAMPLE USAGE:
	var j0001table1 = drawTable2({
		ctx:j0001buttonctx[0],
		left:100,
		top:150,
		minCellWidth:80,
		minCellHeight:50,
		horizAlign:'center',
		text:{font:'Arial',size:32,color:'#000'},
		outerBorder:{show:true,width:4,color:'#000'},
		innerBorder:{show:true,width:2,color:'#666',dash:[5,5]},
		cells:[
			[    // row 0
				{text:['<<fontSize:36>><<font:algebra>>x'],color:'#CCF',minWidth:100,minHeight:70},
				{text:['<<fontSize:36>><<font:algebra>>y'],color:'#CCF',minWidth:100,minHeight:70},
				{text:['<<fontSize:36>><<font:algebra>><<color:#F00>>z'],color:'#CCF',minWidth:100,minHeight:70},
			], [ // row 1
				{},
				{text:['2']},
				{text:['<<color:#F00>>3']},			
			], [ // row 2
				{text:['4']},
				{},
				{text:['<<color:#F00>>6']},		
			],
		]
	});
	
	// CAN EASILY USE IN CONJUNCTION WITH INPUTS()...	
	inputs({
		inputs:[
			// j0001table1.cell[row][col] - nb. start counting from zero
			j0001table1.cell[1][0],
			j0001table1.cell[2][1]
		],
		checkFuncs:[
			function(input) {
				if (input.stringJS == '1') {
					return true;
				} else {
					return false;
				}
			},
			function(input) {
				if (input.stringJS == '5') {
					return true;
				} else {
					return false;
				}
			},
		]
	});
	*/

	if (typeof object.sf !== 'undefined') {
		var sf = object.sf;
	} else {
		var sf = 1;
	}
	var ctx = object.ctx || object.context;
	var left = object.left*sf;
	var top = object.top*sf;
	var cells = object.cells;

	var minCellWidth = object.minCellWidth*sf || 80*sf;
	var maxCellWidth = object.maxCellWidth*sf || Math.max(1200*sf,object.minCellWidth*sf);
	var minCellHeight = object.minCellHeight*sf || 100*sf;
	var minCellPadding = object.minCellPadding*sf || 7*sf;
	var paddingH = minCellPadding;
	var paddingV = minCellPadding;
	if (typeof object.paddingH == 'number') paddingH = object.paddingH*sf;
	if (typeof object.paddingV == 'number') paddingV = object.paddingV*sf;
	var horizAlign = object.horizAlign || object.align || 'center';
	if (typeof object.text == 'object') {
		var font = object.text.font || 'Arial';
		var fontSize = object.text.size || 32;
		var textColor = object.text.color || '#000';
	} else {
		var font = 'Arial';
		var fontSize = 32;
		var textColor = '#000';
	}
	if (typeof object.alpha == 'number') {
		var alpha = object.alpha;
	} else {
		var alpha = 1;
	}
	var lineJoin = object.lineJoin || object.lineCap || 'round';
	var lineCap = object.lineCap || object.lineJoin || 'round';
	var outerBorder = {};
	if (typeof object.outerBorder == 'object') {
		outerBorder.show = boolean(object.outerBorder.show,true);
		outerBorder.width = object.outerBorder.width*sf || 4*sf;
		if (typeof object.outerBorder.color == 'undefined') {
			outerBorder.color = colorA('#000',alpha);
		} else {
			outerBorder.color = colorA(object.outerBorder.color,alpha);
		}
		outerBorder.dash = object.outerBorder.dash || [];
	} else {
		outerBorder.show = true;
		outerBorder.width = 4*sf;
		outerBorder.color = colorA('#000',alpha);
		outerBorder.dash = [];
	}
	outerBorder.dash = enlargeDash(outerBorder.dash,sf);	
	var innerBorder = {};
	if (typeof object.innerBorder == 'object') {
		innerBorder.show = boolean(object.innerBorder.show,true);
		innerBorder.width = object.innerBorder.width*sf || 4*sf;
		if (typeof object.innerBorder.color == 'undefined') {
			innerBorder.color = colorA('#000',alpha);
		} else {
			innerBorder.color = colorA(object.innerBorder.color,alpha);
		}
		innerBorder.dash = object.innerBorder.dash || [];
	} else {
		innerBorder.show = true;
		innerBorder.width = 4*sf;
		innerBorder.color = colorA('#000',alpha);
		innerBorder.dash = [20,15];
	}
	innerBorder.dash = enlargeDash(innerBorder.dash,sf);	
	var tableAlignHoriz = object.tableAlignHoriz || 'left'; // is the whole table centred on [left,top]?
	var tableAlignVert = object.tableAlignVert || 'top';
	
	var numRows = cells.length;
	var numCols = 0;
	for (var i = 0; i < cells.length; i++) {
		numCols = Math.max(cells[i].length,numCols);
	}
	var cellHeights = [];
	for (var i = 0; i < numRows; i++) {
		cellHeights[i] = minCellHeight;	
	}
	var cellWidths = [];
	for (var j = 0; j < numCols; j++) {
		cellWidths[j] = minCellWidth;	
	}
	var totalWidth = 0;
	var totalHeight = 0;
	
	if (typeof hiddenCanvas == 'undefined') {
		var hiddenCanvas = document.createElement('canvas');
		hiddenCanvas.width = mainCanvasWidth*sf;
		hiddenCanvas.height = mainCanvasHeight*sf;
		hiddenCanvas.ctx = hiddenCanvas.getContext('2d');
	}
	
	for (var r = 0; r < cells.length; r++) {
		var maxHeight = minCellHeight;
		for (var c = 0; c < cells[r].length; c++) {
			if (typeof cells[r][c] == 'object') {
				if (typeof cells[r][c].text !== 'object') {
					cells[r][c].text = [];
				} else {
					cells[r][c].text = clone(cells[r][c].text);
				}
				if (typeof cells[r][c].color !== 'string') cells[r][c].color = 'none';
				if (typeof cells[r][c].minWidth !== 'number') cells[r][c].minWidth = 0;
				if (typeof cells[r][c].minHeight !== 'number') cells[r][c].minHeight = 0;
				var font2 = font;
				var fontSize2 = fontSize;
				var textColor2 = textColor;
				if (!un(cells[r][c].font)) font2 = cells[r][c].font;
				if (!un(cells[r][c].fontSize)) fontSize2 = cells[r][c].fontSize;
				if (!un(cells[r][c].textColor)) textColor2 = cells[r][c].textColor;
				if (un(cells[r][c].styled)) {
					cells[r][c].text.unshift('<<font:'+font2+'>><<fontSize:'+fontSize2+'>><<color:'+textColor2+'>>');
					cells[r][c].styled = true;
				}
				//var dims = drawMathsText(ctx,cells[r][c].text,fontSize,0,0,false,[],horizAlign,'middle',text.color,'measure');
				//maxHeight = Math.max(dims[1]+2*minCellPadding,cells[r][c].minHeight,maxHeight);
				//cellWidths[c] = Math.max(dims[0]+2*minCellPadding,cells[r][c].minWidth,cellWidths[c]);
				
				var cellText = text({
					ctx:hiddenCanvas.ctx,
					left:0,
					top:0,
					width:maxCellWidth,
					textArray:cells[r][c].text,
					minTightWidth:5,
					minTightHeight:5,
					box:cells[r][c].box,
					sf:sf
				});
				maxHeight = Math.max(cellText.tightRect[3]+2*paddingV,cells[r][c].minHeight*sf,maxHeight);
				cellWidths[c] = Math.max(cellText.tightRect[2]+3*paddingH,cells[r][c].minWidth*sf,cellWidths[c]);				
			}
		}
		cellHeights[r] = Math.max(maxHeight,cellHeights[r]);
		totalHeight += cellHeights[r];
	}
	for (var j = 0; j < cellWidths.length; j++) {
		totalWidth += cellWidths[j];
	}
	
	if (tableAlignHoriz == 'center') {
		left = left - totalWidth/2;
	} else if (tableAlignHoriz == 'right') {
		left = left - totalWidth;
	}
	
	if (tableAlignVert == 'middle') {
		top = top - totalHeight/2;
	} else if (tableAlignVert == 'bottom') {
		top = top - totalHeight;
	}	
	
	ctx.save();
	ctx.lineCap = lineCap;
	ctx.lineJoin = lineJoin;

	var cellDims = [];
	
	var horizPos = [left];
	for (var i = 0; i < cellWidths.length; i++) {
		horizPos.push(horizPos[horizPos.length-1]+cellWidths[i])
	}
	
	var vertPos = [top];
	for (var i = 0; i < cellHeights.length; i++) {
		vertPos.push(vertPos[vertPos.length-1]+cellHeights[i])
	}
		
	// write text to each cell
	var topPos = top;
	for (var i = 0; i < cells.length; i++) {
		var leftPos = left; 
		cellDims[i] = [];
		for (var j = 0; j < cells[i].length; j++) {
			cellDims[i][j] = {
				left:leftPos+2,
				top:topPos+1,
				width:cellWidths[j]-9,
				height:cellHeights[i]-8,
				border:false,
				offset:[-40,0.5*(cellHeights[i]-8)-20],
				fontSize:fontSize,
				leftPoint:paddingH,
				textColor:textColor,
				textAlign:horizAlign,
				fontSize:fontSize
			};
			if (cells[i][j].highlight == true) {
				if (typeof cells[i][j].color == 'undefined' || cells[i][j].color !== 'none') {
					ctx.fillStyle = colorA(invertColor(cells[i][j].color),alpha);
				} else {
					ctx.fillStyle = colorA(invertColor('#FFC'),alpha);
				}
				ctx.fillRect(leftPos,topPos,cellWidths[j],cellHeights[i]);
			} else if (typeof cells[i][j].color == 'undefined' || cells[i][j].color !== 'none') {
				ctx.fillStyle = colorA(cells[i][j].color,alpha);
				ctx.fillRect(leftPos,topPos,cellWidths[j],cellHeights[i]);	
			}
			/*if (horizAlign == 'left') {
				var dims = drawMathsText(ctx,cells[i][j].text,fontSize,leftPos+minCellPadding,topPos+0.5*cellHeights[i],false,[],horizAlign,'middle',textColor);
			} else if (horizAlign == 'center') {
				var dims = drawMathsText(ctx,cells[i][j].text,fontSize,leftPos+0.5*cellWidths[j],topPos+0.5*cellHeights[i],false,[],horizAlign,'middle',textColor);
			} else if (horizAlign == 'right') {
				var dims = drawMathsText(ctx,cells[i][j].text,fontSize,leftPos+cellWidths[j]-minCellPadding,topPos+0.5*cellHeights[i],false,[],horizAlign,'middle',textColor);
			}*/
			var align = horizAlign;
			if (!un(cells[i][j].align)) align = cells[i][j].align;
			var cellText = text({
				ctx:ctx,
				left:leftPos+paddingH,
				top:topPos+paddingV,
				width:cellWidths[j]-2*paddingH,
				height:cellHeights[i]-2*paddingV,
				textArray:cells[i][j].text,
				textAlign:align,
				vertAlign:'middle',
				padding:0.001,
				box:cells[i][j].box,
				sf:sf
				//box:{type:'tight'}
			});
			//console.log(cellText.tightRect[2],cellText.tightRect[3]);
			leftPos += cellWidths[j];			
		}
		topPos += cellHeights[i];
	}
	
	// draw inner border
	if (innerBorder.show == true) {
		ctx.strokeStyle = innerBorder.color;
		ctx.lineWidth = innerBorder.width;
		if (!ctx.setLineDash) {ctx.setLineDash = function () {}}
		ctx.setLineDash(innerBorder.dash);
		var leftPos = left;
		for (var i = 0; i < cellWidths.length - 1; i++) {
			leftPos += cellWidths[i];
			ctx.beginPath();
			ctx.moveTo(leftPos,top);
			ctx.lineTo(leftPos,top+totalHeight);
			ctx.stroke();
		}
		var topPos = top;
		for (var i = 0; i < cellHeights.length - 1; i++) {
			topPos += cellHeights[i];
			ctx.beginPath();
			ctx.moveTo(left,topPos);
			ctx.lineTo(left+totalWidth,topPos);
			ctx.stroke();
		}		
	}
	
	// draw outer border
	if (outerBorder.show == true) {
		ctx.strokeStyle = outerBorder.color;
		ctx.lineWidth = outerBorder.width;
		if (!ctx.setLineDash) {ctx.setLineDash = function () {}}
		ctx.setLineDash(outerBorder.dash);
		ctx.beginPath();
		ctx.strokeRect(left,top,totalWidth,totalHeight);
	}
	
	ctx.restore();
	
	return {cell:cellDims,xPos:horizPos,yPos:vertPos};
}
function drawTable3(object) { // faster than drawTable2 - has fixed widths & heights and doesn't draw text
	if (typeof object.sf !== 'undefined') {
		var sf = object.sf;
	} else {
		var sf = 1;
	}
	var ctx = object.ctx || object.context;
	var left = object.left*sf;
	var top = object.top*sf;
	var cells = object.cells;

	var widths = clone(object.widths);
	var heights = clone(object.heights);
	if (sf !== 1) {
		for (var w = 0; w < widths.length; w++) widths[w] = widths[w]*sf;
		for (var h = 0; h < heights.length; h++) heights[h] = heights[h]*sf;	
	}
	var minCellPadding = object.minCellPadding*sf || 7*sf;
	var paddingH = minCellPadding;
	var paddingV = minCellPadding;
	if (typeof object.paddingH == 'number') paddingH = object.paddingH*sf;
	if (typeof object.paddingV == 'number') paddingV = object.paddingV*sf;
	var horizAlign = object.horizAlign || object.align || 'center';
	if (typeof object.alpha == 'number') {
		var alpha = object.alpha;
	} else {
		var alpha = 1;
	}
	var lineJoin = object.lineJoin || object.lineCap || 'round';
	var lineCap = object.lineCap || object.lineJoin || 'round';
	var outerBorder = {};
	if (typeof object.outerBorder == 'object') {
		outerBorder.show = boolean(object.outerBorder.show,true);
		outerBorder.width = object.outerBorder.width*sf || 4*sf;
		if (typeof object.outerBorder.color == 'undefined') {
			outerBorder.color = colorA('#000',alpha);
		} else {
			outerBorder.color = colorA(object.outerBorder.color,alpha);
		}
		outerBorder.dash = object.outerBorder.dash || [];
	} else {
		outerBorder.show = true;
		outerBorder.width = 4*sf;
		outerBorder.color = colorA('#000',alpha);
		outerBorder.dash = [];
	}
	outerBorder.dash = enlargeDash(outerBorder.dash,sf);	
	var innerBorder = {};
	if (typeof object.innerBorder == 'object') {
		innerBorder.show = boolean(object.innerBorder.show,true);
		innerBorder.width = object.innerBorder.width*sf || 4*sf;
		if (typeof object.innerBorder.color == 'undefined') {
			innerBorder.color = colorA('#000',alpha);
		} else {
			innerBorder.color = colorA(object.innerBorder.color,alpha);
		}
		innerBorder.dash = object.innerBorder.dash || [];
	} else {
		innerBorder.show = true;
		innerBorder.width = 4*sf;
		innerBorder.color = colorA('#000',alpha);
		innerBorder.dash = [20,15];
	}
	innerBorder.dash = enlargeDash(innerBorder.dash,sf);	
	var tableAlignHoriz = object.tableAlignHoriz || 'left'; // is the whole table centred on [left,top]?
	var tableAlignVert = object.tableAlignVert || 'top';
	
	var totalWidth = arraySum(widths);
	var totalHeight = arraySum(heights);
	
	if (tableAlignHoriz == 'center') {
		left = left - totalWidth/2;
	} else if (tableAlignHoriz == 'right') {
		left = left - totalWidth;
	}
	
	if (tableAlignVert == 'middle') {
		top = top - totalHeight/2;
	} else if (tableAlignVert == 'bottom') {
		top = top - totalHeight;
	}	
	
	ctx.save();
	ctx.lineCap = lineCap;
	ctx.lineJoin = lineJoin;

	var cellDims = [];
	
	var horizPos = [left];
	for (var i = 0; i < widths.length; i++) {
		horizPos.push(horizPos[horizPos.length-1]+widths[i])
	}
	
	var vertPos = [top];
	for (var i = 0; i < heights.length; i++) {
		vertPos.push(vertPos[vertPos.length-1]+heights[i])
	}
		
	// color cells
	var topPos = top;
	for (var i = 0; i < cells.length; i++) {
		var leftPos = left; 
		cellDims[i] = [];
		for (var j = 0; j < cells[i].length; j++) {
			cellDims[i][j] = {
				left:leftPos+2,
				top:topPos+1,
				width:widths[j]-9,
				height:heights[i]-8,
				border:false,
				offset:[-40,0.5*(heights[i]-8)-20],
				leftPoint:paddingH,
			};
			if (cells[i][j].highlight == true) {
				if (typeof cells[i][j].color !== 'undefined' && cells[i][j].color !== 'none') {
					ctx.fillStyle = colorA(invertColor(cells[i][j].color),alpha);
				} else {
					ctx.fillStyle = colorA(invertColor('#FFC'),alpha);
				}
				ctx.fillRect(leftPos,topPos,widths[j],heights[i]);
			} else if (typeof cells[i][j].color !== 'undefined' && cells[i][j].color !== 'none') {
				ctx.fillStyle = colorA(cells[i][j].color,alpha);
				ctx.fillRect(leftPos,topPos,widths[j],heights[i]);	
			}
			leftPos += widths[j];			
		}
		topPos += heights[i];
	}
	
	// draw inner border
	if (innerBorder.show == true) {
		ctx.strokeStyle = innerBorder.color;
		ctx.lineWidth = innerBorder.width;
		if (un(ctx.setLineDash)) {ctx.setLineDash = function () {}}
		ctx.setLineDash(innerBorder.dash);
		var leftPos = left;
		for (var i = 0; i < widths.length - 1; i++) {
			leftPos += widths[i];
			ctx.beginPath();
			ctx.moveTo(leftPos,top);
			ctx.lineTo(leftPos,top+totalHeight);
			ctx.stroke();
		}
		var topPos = top;
		for (var i = 0; i < heights.length - 1; i++) {
			topPos += heights[i];
			ctx.beginPath();
			ctx.moveTo(left,topPos);
			ctx.lineTo(left+totalWidth,topPos);
			ctx.stroke();
		}		
	}
	
	// draw outer border
	if (outerBorder.show == true) {
		ctx.strokeStyle = outerBorder.color;
		ctx.lineWidth = outerBorder.width;
		if (un(ctx.setLineDash)) {ctx.setLineDash = function () {}}
		ctx.setLineDash(outerBorder.dash);
		ctx.beginPath();
		ctx.strokeRect(left,top,totalWidth,totalHeight);
	}
	
	ctx.restore();
	
	return {cell:cellDims,xPos:horizPos,yPos:vertPos};
}
function createScrollTable(object) {
	var left = object.left;
	var top = object.top;
	var z = object.z || object.zIndex || 2;
	
	var padding = 2; // padding for canvas
	var fullRect = [0,0,100,100];
	var visRect = [left,top,100,100]; 
	var topRowRect = [left,top,100,100]; 
	var scrollRect = [left,top,25,10]; 
	
	var ctxVis = newctx({rect:visRect,z:z});
	var ctxTopRow = newctx({rect:topRowRect,z:z});
	var ctxInvis = newctx({rect:fullRect,vis:false});
	
	var topRowFreeze = boolean(object.topRowFreeze,true);
	
	var scrollMax = 10;
	var scrollDiff = 5;
	
	var scroll = createScroller({
		rect:scrollRect,
		max:scrollMax,
		zIndex:z,
		funcMove:function(value) {
			this.table.scrollPos = (value/this.table.scrollMax)*this.table.scrollDiff;
			this.table.redraw();
		},
		funcStop:function(value) {
			this.table.scrollPos = (value/this.table.scrollMax)*this.table.scrollDiff;
			this.table.redraw();
		}
	});
	
	if (!un(object.funcMove)) {
		ctxVis.canvas.style.pointerEvents = 'auto';
		ctxVis.data[6] = true;
		ctxVis.data[106] = true;
		addListenerMove(ctxVis.canvas,function(e) {
			updateMouse(e);
			var r = -1, c = -1;
			for (var x = 0; x < this.table.xPos.length-1; x++) {
				if (mouse.x >= this.table.xPos[x] + this.table.ctxVis.data[100] && mouse.x <= this.table.xPos[x+1] + this.table.ctxVis.data[100]) {
					c = x;
					break;
				}
			}
			if (this.table.topRowFreeze && mouse.y <= this.table.yPos[1] + this.table.ctxVis.data[101]) {
				r = 0;
			} else {
				for (var y = 0; y < this.table.yPos.length-1; y++) {
					if (mouse.y + this.table.scrollPos >= this.table.yPos[y] + this.table.ctxVis.data[101] && mouse.y + this.table.scrollPos <= this.table.yPos[y+1] + this.table.ctxVis.data[101]) {
						r = y;
						break;
					}
				}
			}			
			this.table.funcMove(r,c);
		});
	} else {
		object.funcMove = function(){};
	}
	if (!un(object.funcClick)) {
		ctxVis.canvas.style.pointerEvents = 'auto';
		ctxVis.data[6] = true;
		ctxVis.data[106] = true;
		addListener(ctxVis.canvas,function(e) {
			updateMouse(e);
			var r = -1, c = -1, xProp = 0, yProp = 0;
			for (var x = 0; x < this.table.xPos.length-1; x++) {
				if (mouse.x >= this.table.xPos[x] + this.table.ctxVis.data[100] && mouse.x <= this.table.xPos[x+1] + this.table.ctxVis.data[100]) {
					c = x;
					xProp = (mouse.x - (this.table.xPos[x] + this.table.ctxVis.data[100])) / (this.table.xPos[x+1] - this.table.xPos[x]);
					break;
				}
			}
			if (this.table.topRowFreeze && mouse.y <= this.table.yPos[1] + this.table.ctxVis.data[101]) {
				r = 0;
			} else {
				for (var y = 0; y < this.table.yPos.length-1; y++) {
					if (mouse.y + this.table.scrollPos >= this.table.yPos[y] + this.table.ctxVis.data[101] && mouse.y + this.table.scrollPos <= this.table.yPos[y+1] + this.table.ctxVis.data[101]) {
						r = y;
						yProp = (mouse.y - (this.table.yPos[y] + this.table.ctxVis.data[101])) / (this.table.yPos[y+1] - this.table.yPos[y]);
						break;
					}
				}
			}			
			this.table.funcClick(r,c,xProp,yProp);
		});
	} else {
		object.funcClick = function(){};
	}

	object.ctxVis = ctxVis;
	object.ctxInvis = ctxInvis;
	object.ctxTopRow = ctxTopRow;
	object.padding = padding;
	object.scroller = scroll;
	object.scrollPos = 0;
	object.scrollMax = scrollMax;
	object.scrollDiff = scrollDiff;
	object.topRowFreeze = topRowFreeze;
	object.redraw = function() {
		this.ctxVis.clearRect(0,0,this.ctxVis.canvas.data[102],this.ctxVis.canvas.data[103]);
		this.ctxVis.drawImage(this.ctxInvis.canvas,0,-this.scrollPos);				
	};

	object.scroller.table = object;
	object.ctxVis.canvas.table = object;
	
	if (!un(object.additionalDraw)) {
		object.additionalDraw();
	}	
	object.refreshCells = function() {
		var sf = def([this.sf,1]);
		
		var left = this.left*sf;
		var top = this.top*sf;
		var cells = this.cells;
		var z = this.z || this.zIndex || 2;

		var minCellWidth = this.minCellWidth*sf || 80*sf;
		var maxCellWidth = this.maxCellWidth*sf || Math.max(1200*sf,this.minCellWidth*sf);
		var minCellHeight = this.minCellHeight*sf || 100*sf;
		var minCellPadding = this.minCellPadding*sf || 7*sf;
		var paddingH = minCellPadding;
		var paddingV = minCellPadding;
		if (typeof this.paddingH == 'number') paddingH = this.paddingH*sf;
		if (typeof this.paddingV == 'number') paddingV = this.paddingV*sf;
		var horizAlign = this.horizAlign || this.align || 'center';
		if (typeof this.text == 'this') {
			var font = this.text.font || 'Arial';
			var fontSize = this.text.size || 32;
			var textColor = this.text.color || '#000';
		} else {
			var font = 'Arial';
			var fontSize = 32;
			var textColor = '#000';
		}
		if (typeof this.alpha == 'number') {
			var alpha = this.alpha;
		} else {
			var alpha = 1;
		}
		var lineJoin = this.lineJoin || this.lineCap || 'round';
		var lineCap = this.lineCap || this.lineJoin || 'round';
		var outerBorder = {};
		if (typeof this.outerBorder == 'object') {
			outerBorder.show = boolean(this.outerBorder.show,true);
			outerBorder.width = this.outerBorder.width*sf || 4*sf;
			if (typeof this.outerBorder.color == 'undefined') {
				outerBorder.color = colorA('#000',alpha);
			} else {
				outerBorder.color = colorA(this.outerBorder.color,alpha);
			}
			outerBorder.dash = this.outerBorder.dash || [];
		} else {
			outerBorder.show = true;
			outerBorder.width = 4*sf;
			outerBorder.color = colorA('#000',alpha);
			outerBorder.dash = [];
		}
		outerBorder.dash = enlargeDash(outerBorder.dash,sf);	
		var innerBorder = {};
		if (typeof this.innerBorder == 'object') {
			innerBorder.show = boolean(this.innerBorder.show,true);
			innerBorder.width = this.innerBorder.width*sf || 4*sf;
			if (typeof this.innerBorder.color == 'undefined') {
				innerBorder.color = colorA('#000',alpha);
			} else {
				innerBorder.color = colorA(this.innerBorder.color,alpha);
			}
			innerBorder.dash = this.innerBorder.dash || [];
		} else {
			innerBorder.show = true;
			innerBorder.width = 4*sf;
			innerBorder.color = colorA('#000',alpha);
			innerBorder.dash = [20,15];
		}
		innerBorder.dash = enlargeDash(innerBorder.dash,sf);	
		var tableAlignHoriz = this.tableAlignHoriz || 'left'; // is the whole table centred on [left,top]?
		var tableAlignVert = this.tableAlignVert || 'top';

		var numRows = cells.length;
		var numCols = 0;
		for (var i = 0; i < cells.length; i++) {
			numCols = Math.max(cells[i].length,numCols);
		}
		var cellHeights = [];
		for (var i = 0; i < numRows; i++) {
			cellHeights[i] = minCellHeight;	
		}
		var cellWidths = [];
		for (var j = 0; j < numCols; j++) {
			cellWidths[j] = minCellWidth;	
		}
		var totalWidth = 0;
		var totalHeight = 0;	
		
		var cellHeights = [];
		for (var i = 0; i < numRows; i++) {
			cellHeights[i] = minCellHeight;	
		}
		var cellWidths = [];
		for (var j = 0; j < numCols; j++) {
			cellWidths[j] = minCellWidth;	
		}
		var totalWidth = 0;
		var totalHeight = 0;
		
		if (typeof hiddenCanvas == 'undefined') {
			var hiddenCanvas = document.createElement('canvas');
			hiddenCanvas.width = mainCanvasWidth*sf;
			hiddenCanvas.height = mainCanvasHeight*sf;
			hiddenCanvas.ctx = hiddenCanvas.getContext('2d');
		}
		
		for (var r = 0; r < cells.length; r++) {
			var maxHeight = minCellHeight;
			for (var c = 0; c < cells[r].length; c++) {
				if (typeof cells[r][c] == 'this') {
					if (typeof cells[r][c].text !== 'this') {
						cells[r][c].text = [];
					} else {
						cells[r][c].text = clone(cells[r][c].text);
					}
					if (typeof cells[r][c].color !== 'string') cells[r][c].color = 'none';
					if (typeof cells[r][c].minWidth !== 'number') cells[r][c].minWidth = 0;
					if (typeof cells[r][c].minHeight !== 'number') cells[r][c].minHeight = 0;
					var font2 = font;
					var fontSize2 = fontSize;
					var textColor2 = textColor;
					if (!un(cells[r][c].font)) font2 = cells[r][c].font;
					if (!un(cells[r][c].fontSize)) fontSize2 = cells[r][c].fontSize;
					if (!un(cells[r][c].textColor)) textColor2 = cells[r][c].textColor;
					if (un(cells[r][c].styled)) {
						cells[r][c].text.unshift('<<font:'+font2+'>><<fontSize:'+fontSize2+'>><<color:'+textColor2+'>>');
						cells[r][c].styled = true;
					}
					//var dims = drawMathsText(ctx,cells[r][c].text,fontSize,0,0,false,[],horizAlign,'middle',text.color,'measure');
					//maxHeight = Math.max(dims[1]+2*minCellPadding,cells[r][c].minHeight,maxHeight);
					//cellWidths[c] = Math.max(dims[0]+2*minCellPadding,cells[r][c].minWidth,cellWidths[c]);
					
					var cellText = text({
						ctx:hiddenCanvas.ctx,
						left:0,
						top:0,
						width:maxCellWidth,
						textArray:cells[r][c].text,
						minTightWidth:5,
						minTightHeight:5,
						box:cells[r][c].box,
						sf:sf
					});
					maxHeight = Math.max(cellText.tightRect[3]+2*paddingV,cells[r][c].minHeight*sf,maxHeight);
					cellWidths[c] = Math.max(cellText.tightRect[2]+3*paddingH,cells[r][c].minWidth*sf,cellWidths[c]);				
				}
			}
			cellHeights[r] = Math.max(maxHeight,cellHeights[r]);
			totalHeight += cellHeights[r];
		}
		for (var j = 0; j < cellWidths.length; j++) {
			totalWidth += cellWidths[j];
		}
		
		if (tableAlignHoriz == 'center') {
			left = left - totalWidth/2;
		} else if (tableAlignHoriz == 'right') {
			left = left - totalWidth;
		}
		
		if (tableAlignVert == 'middle') {
			top = top - totalHeight/2;
		} else if (tableAlignVert == 'bottom') {
			top = top - totalHeight;
		}
		
		var maxHeight = this.maxHeight;
		var padding = def([this.padding,this.outerBorder.width/2]); // padding for canvas
		if (totalHeight+2*padding < maxHeight) {
			var hasScroll = true;
		} else {
			var hasScroll = false;
		}
		var fullRect = [0,0,totalWidth+2*padding,totalHeight+2*padding];
		var visRect = [left,top,totalWidth+2*padding,maxHeight]; 
		var topRowRect = [left,top,totalWidth+2*padding,maxHeight]; 
		var scrollRect = [left+totalWidth+4*padding,top,25,maxHeight]; 
		
		var ctxInvis = this.ctxInvis;
		var ctxVis = this.ctxVis;
		var ctxTopRow = this.ctxTopRow;
		ctxInvis.data[102] = fullRect[2];
		ctxInvis.canvas.width = fullRect[2];
		ctxInvis.data[103] = fullRect[3];
		ctxInvis.canvas.height = fullRect[3];		
		ctxVis.data[100] = visRect[0];
		ctxVis.data[101] = visRect[1];
		ctxVis.data[102] = visRect[2];
		ctxVis.canvas.width = visRect[2];		
		ctxVis.data[103] = visRect[3];
		ctxVis.canvas.height = visRect[3];				
		ctxTopRow.data[100] = topRowRect[0];
		ctxTopRow.data[101] = topRowRect[1];
		ctxTopRow.data[102] = topRowRect[2];
		ctxTopRow.canvas.width = topRowRect[2];
		ctxTopRow.data[103] = topRowRect[3];
		ctxTopRow.canvas.height = topRowRect[3];				
		resizeCanvas(ctxInvis.canvas,0,0,fullRect[2],fullRect[3]);
		resizeCanvas(ctxVis.canvas,visRect[0],visRect[1],visRect[2],visRect[3]);
		resizeCanvas(ctxTopRow.canvas,topRowRect[0],topRowRect[1],topRowRect[2],topRowRect[3]);
		ctxInvis.clear();
		ctxVis.clear();
		ctxTopRow.clear();
			
		var left = padding;
		var top = padding;

		ctxInvis.save();
		ctxInvis.lineCap = lineCap;
		ctxInvis.lineJoin = lineJoin;

		var cellDims = [];
		
		var horizPos = [left];
		for (var i = 0; i < cellWidths.length; i++) {
			horizPos.push(horizPos[horizPos.length-1]+cellWidths[i])
		}
		
		var vertPos = [top];
		for (var i = 0; i < cellHeights.length; i++) {
			vertPos.push(vertPos[vertPos.length-1]+cellHeights[i])
		}
			
		// write text to each cell
		var topPos = top;
		for (var i = 0; i < cells.length; i++) {
			var leftPos = left; 
			cellDims[i] = [];
			for (var j = 0; j < cells[i].length; j++) {
				cellDims[i][j] = {
					left:leftPos+2,
					top:topPos+1,
					width:cellWidths[j]-9,
					height:cellHeights[i]-8,
					border:false,
					offset:[-40,0.5*(cellHeights[i]-8)-20],
					fontSize:fontSize,
					leftPoint:paddingH,
					textColor:textColor,
					textAlign:horizAlign,
					fontSize:fontSize
				};
				if (cells[i][j].highlight == true) {
					if (typeof cells[i][j].color !== 'undefined' && cells[i][j].color !== 'none') {
						ctxInvis.fillStyle = colorA(invertColor(cells[i][j].color),alpha);
					} else {
						ctxInvis.fillStyle = colorA(invertColor('#FFC'),alpha);
					}
					ctxInvis.fillRect(leftPos,topPos,cellWidths[j],cellHeights[i]);
				} else if (typeof cells[i][j].color !== 'undefined' && cells[i][j].color !== 'none') {
					ctxInvis.fillStyle = colorA(cells[i][j].color,alpha);
					ctxInvis.fillRect(leftPos,topPos,cellWidths[j],cellHeights[i]);	
				}
				var align = horizAlign;
				if (!un(cells[i][j].align)) align = cells[i][j].align;
				var cellText = text({
					ctx:ctxInvis,
					left:leftPos+paddingH,
					top:topPos+paddingV,
					width:cellWidths[j]-2*paddingH,
					height:cellHeights[i]-2*paddingV,
					textArray:cells[i][j].text,
					textAlign:align,
					vertAlign:'middle',
					padding:0.001,
					box:cells[i][j].box,
					sf:sf
				});
				/*console.log(cellText.tightRect[2],cellText.tightRect[3],{
					ctx:ctxInvis,
					left:leftPos+paddingH,
					top:topPos+paddingV,
					width:cellWidths[j]-2*paddingH,
					height:cellHeights[i]-2*paddingV,
					textArray:cells[i][j].text,
					textAlign:align,
					vertAlign:'middle',
					padding:0.001,
					box:cells[i][j].box,
					sf:sf
				});*/
				leftPos += cellWidths[j];			
			}
			topPos += cellHeights[i];
		}
		
		// draw inner border
		if (innerBorder.show == true) {
			ctxInvis.strokeStyle = innerBorder.color;
			ctxInvis.lineWidth = innerBorder.width;
			if (!ctxInvis.setLineDash) {ctxInvis.setLineDash = function () {}}
			ctxInvis.setLineDash(innerBorder.dash);
			var leftPos = left;
			for (var i = 0; i < cellWidths.length - 1; i++) {
				leftPos += cellWidths[i];
				ctxInvis.beginPath();
				ctxInvis.moveTo(leftPos,top);
				ctxInvis.lineTo(leftPos,top+totalHeight);
				ctxInvis.stroke();
			}
			var topPos = top;
			for (var i = 0; i < cellHeights.length - 1; i++) {
				topPos += cellHeights[i];
				ctxInvis.beginPath();
				ctxInvis.moveTo(left,topPos);
				ctxInvis.lineTo(left+totalWidth,topPos);
				ctxInvis.stroke();
			}		
		}
		
		// draw outer border
		if (outerBorder.show == true) {
			ctxInvis.strokeStyle = outerBorder.color;
			ctxInvis.lineWidth = outerBorder.width;
			if (!ctxInvis.setLineDash) {ctxInvis.setLineDash = function () {}}
			ctxInvis.setLineDash(outerBorder.dash);
			ctxInvis.beginPath();
			ctxInvis.strokeRect(left,top,totalWidth,totalHeight);
		}
		
		ctxInvis.restore();

		this.cell = cellDims;
		this.xPos = horizPos;
		this.yPos = vertPos;
		
		if (!un(this.additionalDraw)) {
			this.additionalDraw();
		}
		
		//this.scroller.max = totalHeight/maxHeight;
		//this.scroller.rect = scrollRect;
		this.scroller.reposition(totalHeight/maxHeight,scrollRect);
		setScrollerValue(this.scroller,0,true);
		this.scrollPos = 0;
		this.scrollMax = scrollMax;
		this.scrollDiff = totalHeight-maxHeight+2*padding;		
		
		this.redraw();
		
		if (totalHeight+2*padding > this.maxHeight) {
			this.hasScroll = true;
			//this.scrollPos = 0;
			//this.scrollMax = totalHeight/maxHeight;
			//this.scrollDiff = totalHeight-maxHeight+2*padding;
			//this.scroller.max = totalHeight/maxHeight;
			//this.scroller.value = 0;
			//this.scroller = updateScrollerDims(this.scroller);
			showScroller(this.scroller);
			if (this.topRowFreeze) {
				showObj(ctxTopRow.canvas);
				ctxTopRow.data[3] = ctxTopRow.data[103] = padding+vertPos[1];
				ctxTopRow.canvas.width = ctxTopRow.data[102];
				ctxTopRow.canvas.height = ctxTopRow.data[103];
				resize();
				ctxTopRow.drawImage(ctxInvis.canvas,0,0);
			} else {
				hideObj(ctxTopRow.canvas);
			}		
		} else {
			this.hasScroll = false;
			hideScroller(this.scroller);
			hideObj(ctxTopRow.canvas);
		}		
	}
	object.refreshCells();
	
	object.move = function(left,top) {
		var relLeft = this.scroller.rect[0] - this.ctxVis.canvas.data[100];
		this.left = left;
		this.top = top;
		this.ctxVis.canvas.data[100] = left;
		this.ctxVis.canvas.data[101] = top;
		resizeCanvas3(this.ctxVis.canvas);
		this.ctxTopRow.canvas.data[100] = left;
		this.ctxTopRow.canvas.data[101] = top;
		resizeCanvas3(this.ctxTopRow.canvas);
		this.scroller.rect[0] = left+relLeft;
		this.scroller.rect[1] = top;
		this.scroller.reposition();		
	}
	
	return object;
}
function drawScrollTable(object) {
	/* EXAMPLE USAGE:
	var j0001table1 = drawScrollTable({
		left:100,
		top:150,
		minCellWidth:80,
		minCellHeight:50,
		horizAlign:'center',
		text:{font:'Arial',size:32,color:'#000'},
		outerBorder:{show:true,width:4,color:'#000'},
		innerBorder:{show:true,width:2,color:'#666'},
		cells:[
			[    // row 0
				{text:['<<fontSize:36>><<font:algebra>>x'],color:'#CCF',minWidth:100,minHeight:70},
				{text:['<<fontSize:36>><<font:algebra>>y'],color:'#CCF',minWidth:100,minHeight:70},
				{text:['<<fontSize:36>><<font:algebra>><<color:#F00>>z'],color:'#CCF',minWidth:100,minHeight:70},
			], [ // row 1
				{},
				{text:['2']},
				{text:['<<color:#F00>>3']},			
			], [ // row 2
				{text:['4']},
				{},
				{text:['<<color:#F00>>6']},		
			],
		],
		maxHeight:300,
		moveFunc:function(r,c) {console.log(r,c)),
		clickFunc:function(r,c) {console.log(r,c)),
		padding:2 // def: outerBorder.width/2
	});
	*/

	if (typeof object.sf !== 'undefined') {
		var sf = object.sf;
	} else {
		var sf = 1;
	}
	
	var left = object.left*sf;
	var top = object.top*sf;
	var cells = object.cells;
	var z = object.z || object.zIndex || 2;

	var minCellWidth = object.minCellWidth*sf || 80*sf;
	var maxCellWidth = object.maxCellWidth*sf || Math.max(1200*sf,object.minCellWidth*sf);
	var minCellHeight = object.minCellHeight*sf || 100*sf;
	var minCellPadding = object.minCellPadding*sf || 7*sf;
	var paddingH = minCellPadding;
	var paddingV = minCellPadding;
	if (typeof object.paddingH == 'number') paddingH = object.paddingH*sf;
	if (typeof object.paddingV == 'number') paddingV = object.paddingV*sf;
	var horizAlign = object.horizAlign || object.align || 'center';
	if (typeof object.text == 'object') {
		var font = object.text.font || 'Arial';
		var fontSize = object.text.size || 32;
		var textColor = object.text.color || '#000';
	} else {
		var font = 'Arial';
		var fontSize = 32;
		var textColor = '#000';
	}
	if (typeof object.alpha == 'number') {
		var alpha = object.alpha;
	} else {
		var alpha = 1;
	}
	var lineJoin = object.lineJoin || object.lineCap || 'round';
	var lineCap = object.lineCap || object.lineJoin || 'round';
	var outerBorder = {};
	if (typeof object.outerBorder == 'object') {
		outerBorder.show = boolean(object.outerBorder.show,true);
		outerBorder.width = object.outerBorder.width*sf || 4*sf;
		if (typeof object.outerBorder.color == 'undefined') {
			outerBorder.color = colorA('#000',alpha);
		} else {
			outerBorder.color = colorA(object.outerBorder.color,alpha);
		}
		outerBorder.dash = object.outerBorder.dash || [];
	} else {
		outerBorder.show = true;
		outerBorder.width = 4*sf;
		outerBorder.color = colorA('#000',alpha);
		outerBorder.dash = [];
	}
	outerBorder.dash = enlargeDash(outerBorder.dash,sf);	
	var innerBorder = {};
	if (typeof object.innerBorder == 'object') {
		innerBorder.show = boolean(object.innerBorder.show,true);
		innerBorder.width = object.innerBorder.width*sf || 4*sf;
		if (typeof object.innerBorder.color == 'undefined') {
			innerBorder.color = colorA('#000',alpha);
		} else {
			innerBorder.color = colorA(object.innerBorder.color,alpha);
		}
		innerBorder.dash = object.innerBorder.dash || [];
	} else {
		innerBorder.show = true;
		innerBorder.width = 4*sf;
		innerBorder.color = colorA('#000',alpha);
		innerBorder.dash = [20,15];
	}
	innerBorder.dash = enlargeDash(innerBorder.dash,sf);	
	var tableAlignHoriz = object.tableAlignHoriz || 'left'; // is the whole table centred on [left,top]?
	var tableAlignVert = object.tableAlignVert || 'top';
	
	var numRows = cells.length;
	var numCols = 0;
	for (var i = 0; i < cells.length; i++) {
		numCols = Math.max(cells[i].length,numCols);
	}
	var cellHeights = [];
	for (var i = 0; i < numRows; i++) {
		cellHeights[i] = minCellHeight;	
	}
	var cellWidths = [];
	for (var j = 0; j < numCols; j++) {
		cellWidths[j] = minCellWidth;	
	}
	var totalWidth = 0;
	var totalHeight = 0;
	//calcTableDims(object);
	
	if (typeof hiddenCanvas == 'undefined') {
		var hiddenCanvas = document.createElement('canvas');
		hiddenCanvas.width = mainCanvasWidth*sf;
		hiddenCanvas.height = mainCanvasHeight*sf;
		hiddenCanvas.ctx = hiddenCanvas.getContext('2d');
	}
	
	for (var r = 0; r < cells.length; r++) {
		var maxHeight = minCellHeight;
		for (var c = 0; c < cells[r].length; c++) {
			if (typeof cells[r][c] == 'object') {
				if (typeof cells[r][c].text !== 'object') {
					cells[r][c].text = [];
				} else {
					cells[r][c].text = clone(cells[r][c].text);
				}
				if (typeof cells[r][c].color !== 'string') cells[r][c].color = 'none';
				if (typeof cells[r][c].minWidth !== 'number') cells[r][c].minWidth = 0;
				if (typeof cells[r][c].minHeight !== 'number') cells[r][c].minHeight = 0;
				var font2 = font;
				var fontSize2 = fontSize;
				var textColor2 = textColor;
				if (!un(cells[r][c].font)) font2 = cells[r][c].font;
				if (!un(cells[r][c].fontSize)) fontSize2 = cells[r][c].fontSize;
				if (!un(cells[r][c].textColor)) textColor2 = cells[r][c].textColor;
				if (un(cells[r][c].styled)) {
					cells[r][c].text.unshift('<<font:'+font2+'>><<fontSize:'+fontSize2+'>><<color:'+textColor2+'>>');
					cells[r][c].styled = true;
				}
				//var dims = drawMathsText(ctx,cells[r][c].text,fontSize,0,0,false,[],horizAlign,'middle',text.color,'measure');
				//maxHeight = Math.max(dims[1]+2*minCellPadding,cells[r][c].minHeight,maxHeight);
				//cellWidths[c] = Math.max(dims[0]+2*minCellPadding,cells[r][c].minWidth,cellWidths[c]);
				
				var cellText = text({
					ctx:hiddenCanvas.ctx,
					left:0,
					top:0,
					width:maxCellWidth,
					textArray:cells[r][c].text,
					minTightWidth:5,
					minTightHeight:5,
					box:cells[r][c].box,
					sf:sf
				});
				maxHeight = Math.max(cellText.tightRect[3]+2*paddingV,cells[r][c].minHeight*sf,maxHeight);
				cellWidths[c] = Math.max(cellText.tightRect[2]+3*paddingH,cells[r][c].minWidth*sf,cellWidths[c]);				
			}
		}
		cellHeights[r] = Math.max(maxHeight,cellHeights[r]);
		totalHeight += cellHeights[r];
	}
	for (var j = 0; j < cellWidths.length; j++) {
		totalWidth += cellWidths[j];
	}
	
	if (tableAlignHoriz == 'center') {
		left = left - totalWidth/2;
	} else if (tableAlignHoriz == 'right') {
		left = left - totalWidth;
	}
	
	if (tableAlignVert == 'middle') {
		top = top - totalHeight/2;
	} else if (tableAlignVert == 'bottom') {
		top = top - totalHeight;
	}	
	
	// now the table dims are known, create canvases
	var maxHeight = object.maxHeight;
	if (totalHeight+2*padding < maxHeight) {
		var hasScroll = true;
	} else {
		var hasScroll = false;
	}
	var padding = def([object.padding,object.outerBorder.width/2]); // padding for canvas
	var fullRect = [0,0,totalWidth+2*padding,totalHeight+2*padding];
	var visRect = [left,top,totalWidth+2*padding,maxHeight]; 
	var topRowRect = [left,top,totalWidth+2*padding,maxHeight]; 
	var scrollRect = [left+totalWidth+4*padding,top,25,maxHeight]; 
	
	var ctxVis = newctx({rect:visRect,z:z});
	var ctxTopRow = newctx({rect:topRowRect,z:z});
	var ctxInvis = newctx({rect:fullRect,vis:false});
	
	var left = padding;
	var top = padding;
	
	ctxInvis.save();
	ctxInvis.lineCap = lineCap;
	ctxInvis.lineJoin = lineJoin;

	var cellDims = [];
	
	var horizPos = [left];
	for (var i = 0; i < cellWidths.length; i++) {
		horizPos.push(horizPos[horizPos.length-1]+cellWidths[i])
	}
	
	var vertPos = [top];
	for (var i = 0; i < cellHeights.length; i++) {
		vertPos.push(vertPos[vertPos.length-1]+cellHeights[i])
	}
		
	// write text to each cell
	var topPos = top;
	for (var i = 0; i < cells.length; i++) {
		var leftPos = left; 
		cellDims[i] = [];
		for (var j = 0; j < cells[i].length; j++) {
			cellDims[i][j] = {
				left:leftPos+2,
				top:topPos+1,
				width:cellWidths[j]-9,
				height:cellHeights[i]-8,
				border:false,
				offset:[-40,0.5*(cellHeights[i]-8)-20],
				fontSize:fontSize,
				leftPoint:paddingH,
				textColor:textColor,
				textAlign:horizAlign,
				fontSize:fontSize
			};
			if (cells[i][j].highlight == true) {
				if (typeof cells[i][j].color == 'undefined' || cells[i][j].color !== 'none') {
					ctxInvis.fillStyle = colorA(invertColor(cells[i][j].color),alpha);
				} else {
					ctxInvis.fillStyle = colorA(invertColor('#FFC'),alpha);
				}
				ctxInvis.fillRect(leftPos,topPos,cellWidths[j],cellHeights[i]);
			} else if (typeof cells[i][j].color == 'undefined' || cells[i][j].color !== 'none') {
				ctxInvis.fillStyle = colorA(cells[i][j].color,alpha);
				ctxInvis.fillRect(leftPos,topPos,cellWidths[j],cellHeights[i]);	
			}
			var align = horizAlign;
			if (!un(cells[i][j].align)) align = cells[i][j].align;
			var cellText = text({
				ctx:ctxInvis,
				left:leftPos+paddingH,
				top:topPos+paddingV,
				width:cellWidths[j]-2*paddingH,
				height:cellHeights[i]-2*paddingV,
				textArray:cells[i][j].text,
				textAlign:align,
				vertAlign:'middle',
				padding:0.001,
				box:cells[i][j].box,
				sf:sf
			});
			//console.log(cellText.tightRect[2],cellText.tightRect[3]);
			leftPos += cellWidths[j];			
		}
		topPos += cellHeights[i];
	}
	
	// draw inner border
	if (innerBorder.show == true) {
		ctxInvis.strokeStyle = innerBorder.color;
		ctxInvis.lineWidth = innerBorder.width;
		if (!ctxInvis.setLineDash) {ctxInvis.setLineDash = function () {}}
		ctxInvis.setLineDash(innerBorder.dash);
		var leftPos = left;
		for (var i = 0; i < cellWidths.length - 1; i++) {
			leftPos += cellWidths[i];
			ctxInvis.beginPath();
			ctxInvis.moveTo(leftPos,top);
			ctxInvis.lineTo(leftPos,top+totalHeight);
			ctxInvis.stroke();
		}
		var topPos = top;
		for (var i = 0; i < cellHeights.length - 1; i++) {
			topPos += cellHeights[i];
			ctxInvis.beginPath();
			ctxInvis.moveTo(left,topPos);
			ctxInvis.lineTo(left+totalWidth,topPos);
			ctxInvis.stroke();
		}		
	}
	
	// draw outer border
	if (outerBorder.show == true) {
		ctxInvis.strokeStyle = outerBorder.color;
		ctxInvis.lineWidth = outerBorder.width;
		if (!ctxInvis.setLineDash) {ctxInvis.setLineDash = function () {}}
		ctxInvis.setLineDash(outerBorder.dash);
		ctxInvis.beginPath();
		ctxInvis.strokeRect(left,top,totalWidth,totalHeight);
	}
	
	ctxInvis.restore();

	var topRowFreeze = boolean(object.topRowFreeze,true);
	
	var scrollMax = totalHeight/maxHeight;
	var scrollDiff = totalHeight-maxHeight+2*padding;
	//console.log(scrollMax,scrollDiff);
	
	var scroll = createScroller({
		rect:scrollRect,
		max:scrollMax,
		zIndex:z,
		funcMove:function(value) {
			this.table.scrollPos = (value/this.table.scrollMax)*this.table.scrollDiff;
			this.table.redraw();
		},
		funcStop:function(value) {
			this.table.scrollPos = (value/this.table.scrollMax)*this.table.scrollDiff;
			this.table.redraw();
		}
	});
	
	if (!un(object.funcMove)) {
		ctxVis.canvas.style.pointerEvents = 'auto';
		ctxVis.data[6] = true;
		ctxVis.data[106] = true;
		addListenerMove(ctxVis.canvas,function(e) {
			updateMouse(e);
			var r = -1, c = -1;
			for (var x = 0; x < this.table.xPos.length-1; x++) {
				if (mouse.x >= this.table.xPos[x] + this.table.ctxVis.data[100] && mouse.x <= this.table.xPos[x+1] + this.table.ctxVis.data[100]) {
					c = x;
					break;
				}
			}
			if (this.table.topRowFreeze && mouse.y <= this.table.yPos[1] + this.table.ctxVis.data[101]) {
				r = 0;
			} else {
				for (var y = 0; y < this.table.yPos.length-1; y++) {
					if (mouse.y + this.table.scrollPos >= this.table.yPos[y] + this.table.ctxVis.data[101] && mouse.y + this.table.scrollPos <= this.table.yPos[y+1] + this.table.ctxVis.data[101]) {
						r = y;
						break;
					}
				}
			}			
			this.table.funcMove(r,c);
		});
	} else {
		object.funcMove = function(){};
	}
	if (!un(object.funcClick)) {
		ctxVis.canvas.style.pointerEvents = 'auto';
		ctxVis.data[6] = true;
		ctxVis.data[106] = true;
		addListener(ctxVis.canvas,function(e) {
			updateMouse(e);
			var r = -1, c = -1, xProp = 0, yProp = 0;
			for (var x = 0; x < this.table.xPos.length-1; x++) {
				if (mouse.x >= this.table.xPos[x] + this.table.ctxVis.data[100] && mouse.x <= this.table.xPos[x+1] + this.table.ctxVis.data[100]) {
					c = x;
					xProp = (mouse.x - (this.table.xPos[x] + this.table.ctxVis.data[100])) / (this.table.xPos[x+1] - this.table.xPos[x]);
					break;
				}
			}
			if (this.table.topRowFreeze && mouse.y <= this.table.yPos[1] + this.table.ctxVis.data[101]) {
				r = 0;
			} else {
				for (var y = 0; y < this.table.yPos.length-1; y++) {
					if (mouse.y + this.table.scrollPos >= this.table.yPos[y] + this.table.ctxVis.data[101] && mouse.y + this.table.scrollPos <= this.table.yPos[y+1] + this.table.ctxVis.data[101]) {
						r = y;
						yProp = (mouse.y - (this.table.yPos[y] + this.table.ctxVis.data[101])) / (this.table.yPos[y+1] - this.table.yPos[y]);
						break;
					}
				}
			}			
			this.table.funcClick(r,c,xProp,yProp);
		});
	} else {
		object.funcClick = function(){};
	}
		
	var returnObj = clone(object);
	
	returnObj.ctxVis = ctxVis;
	returnObj.ctxInvis = ctxInvis;
	returnObj.ctxTopRow = ctxTopRow;
	returnObj.cell = cellDims;
	returnObj.xPos = horizPos;
	returnObj.yPos = vertPos;
	returnObj.padding = padding;
	returnObj.hasScroll = hasScroll;
	returnObj.scroller = scroll;
	returnObj.scrollPos = 0;
	returnObj.scrollMax = scrollMax;
	returnObj.scrollDiff = scrollDiff;
	returnObj.topRowFreeze = topRowFreeze;
	returnObj.redraw = function() {
		this.ctxVis.clearRect(0,0,this.ctxVis.canvas.data[102],this.ctxVis.canvas.data[103]);
		this.ctxVis.drawImage(this.ctxInvis.canvas,0,-this.scrollPos);				
	};

	returnObj.scroller.table = returnObj;
	returnObj.ctxVis.canvas.table = returnObj;
	
	if (!un(returnObj.additionalDraw)) {
		returnObj.additionalDraw();
	}	
	
	returnObj.redraw();

	if (topRowFreeze) {
		ctxTopRow.data[3] = ctxTopRow.data[103] = padding+vertPos[1];
		ctxTopRow.canvas.width = ctxTopRow.data[102];
		ctxTopRow.canvas.height = ctxTopRow.data[103];
		resizeCanvas2(ctxTopRow.canvas,ctxTopRow.data[102],ctxTopRow.data[103]);
		resize();
		ctxTopRow.drawImage(ctxInvis.canvas,0,0);
	} else {
		hideObj(ctxTopRow.canvas);
	}

	return returnObj;
}
function updateScrollTable(object) { // update previously drawn scrollTable with changed cell data
	var sf = def([object.sf,1]);
	
	var left = object.left*sf;
	var top = object.top*sf;
	var cells = object.cells;
	var z = object.z || object.zIndex || 2;

	///console.log(object);
	
	var minCellWidth = object.minCellWidth*sf || 80*sf;
	var maxCellWidth = object.maxCellWidth*sf || Math.max(1200*sf,object.minCellWidth*sf);
	var minCellHeight = object.minCellHeight*sf || 100*sf;
	var minCellPadding = object.minCellPadding*sf || 7*sf;
	var paddingH = minCellPadding;
	var paddingV = minCellPadding;
	if (typeof object.paddingH == 'number') paddingH = object.paddingH*sf;
	if (typeof object.paddingV == 'number') paddingV = object.paddingV*sf;
	var horizAlign = object.horizAlign || object.align || 'center';
	if (typeof object.text == 'object') {
		var font = object.text.font || 'Arial';
		var fontSize = object.text.size || 32;
		var textColor = object.text.color || '#000';
	} else {
		var font = 'Arial';
		var fontSize = 32;
		var textColor = '#000';
	}
	if (typeof object.alpha == 'number') {
		var alpha = object.alpha;
	} else {
		var alpha = 1;
	}
	var lineJoin = object.lineJoin || object.lineCap || 'round';
	var lineCap = object.lineCap || object.lineJoin || 'round';
	var outerBorder = {};
	if (typeof object.outerBorder == 'object') {
		outerBorder.show = boolean(object.outerBorder.show,true);
		outerBorder.width = object.outerBorder.width*sf || 4*sf;
		if (typeof object.outerBorder.color == 'undefined') {
			outerBorder.color = colorA('#000',alpha);
		} else {
			outerBorder.color = colorA(object.outerBorder.color,alpha);
		}
		outerBorder.dash = object.outerBorder.dash || [];
	} else {
		outerBorder.show = true;
		outerBorder.width = 4*sf;
		outerBorder.color = colorA('#000',alpha);
		outerBorder.dash = [];
	}
	outerBorder.dash = enlargeDash(outerBorder.dash,sf);	
	var innerBorder = {};
	if (typeof object.innerBorder == 'object') {
		innerBorder.show = boolean(object.innerBorder.show,true);
		innerBorder.width = object.innerBorder.width*sf || 4*sf;
		if (typeof object.innerBorder.color == 'undefined') {
			innerBorder.color = colorA('#000',alpha);
		} else {
			innerBorder.color = colorA(object.innerBorder.color,alpha);
		}
		innerBorder.dash = object.innerBorder.dash || [];
	} else {
		innerBorder.show = true;
		innerBorder.width = 4*sf;
		innerBorder.color = colorA('#000',alpha);
		innerBorder.dash = [20,15];
	}
	innerBorder.dash = enlargeDash(innerBorder.dash,sf);	
	var tableAlignHoriz = object.tableAlignHoriz || 'left'; // is the whole table centred on [left,top]?
	var tableAlignVert = object.tableAlignVert || 'top';

	var numRows = cells.length;
	var numCols = 0;
	for (var i = 0; i < cells.length; i++) {
		numCols = Math.max(cells[i].length,numCols);
	}
	var cellHeights = [];
	for (var i = 0; i < numRows; i++) {
		cellHeights[i] = minCellHeight;	
	}
	var cellWidths = [];
	for (var j = 0; j < numCols; j++) {
		cellWidths[j] = minCellWidth;	
	}
	var totalWidth = 0;
	var totalHeight = 0;	
	
	var cellHeights = [];
	for (var i = 0; i < numRows; i++) {
		cellHeights[i] = minCellHeight;	
	}
	var cellWidths = [];
	for (var j = 0; j < numCols; j++) {
		cellWidths[j] = minCellWidth;	
	}
	var totalWidth = 0;
	var totalHeight = 0;
	
	if (typeof hiddenCanvas == 'undefined') {
		var hiddenCanvas = document.createElement('canvas');
		hiddenCanvas.width = mainCanvasWidth*sf;
		hiddenCanvas.height = mainCanvasHeight*sf;
		hiddenCanvas.ctx = hiddenCanvas.getContext('2d');
	}
	
	for (var r = 0; r < cells.length; r++) {
		var maxHeight = minCellHeight;
		for (var c = 0; c < cells[r].length; c++) {
			if (typeof cells[r][c] == 'object') {
				if (typeof cells[r][c].text !== 'object') {
					cells[r][c].text = [];
				} else {
					cells[r][c].text = clone(cells[r][c].text);
				}
				if (typeof cells[r][c].color !== 'string') cells[r][c].color = 'none';
				if (typeof cells[r][c].minWidth !== 'number') cells[r][c].minWidth = 0;
				if (typeof cells[r][c].minHeight !== 'number') cells[r][c].minHeight = 0;
				var font2 = font;
				var fontSize2 = fontSize;
				var textColor2 = textColor;
				if (!un(cells[r][c].font)) font2 = cells[r][c].font;
				if (!un(cells[r][c].fontSize)) fontSize2 = cells[r][c].fontSize;
				if (!un(cells[r][c].textColor)) textColor2 = cells[r][c].textColor;
				if (un(cells[r][c].styled)) {
					cells[r][c].text.unshift('<<font:'+font2+'>><<fontSize:'+fontSize2+'>><<color:'+textColor2+'>>');
					cells[r][c].styled = true;
				}
				//var dims = drawMathsText(ctx,cells[r][c].text,fontSize,0,0,false,[],horizAlign,'middle',text.color,'measure');
				//maxHeight = Math.max(dims[1]+2*minCellPadding,cells[r][c].minHeight,maxHeight);
				//cellWidths[c] = Math.max(dims[0]+2*minCellPadding,cells[r][c].minWidth,cellWidths[c]);
				
				var cellText = text({
					ctx:hiddenCanvas.ctx,
					left:0,
					top:0,
					width:maxCellWidth,
					textArray:cells[r][c].text,
					minTightWidth:5,
					minTightHeight:5,
					box:cells[r][c].box,
					sf:sf
				});
				maxHeight = Math.max(cellText.tightRect[3]+2*paddingV,cells[r][c].minHeight*sf,maxHeight);
				cellWidths[c] = Math.max(cellText.tightRect[2]+3*paddingH,cells[r][c].minWidth*sf,cellWidths[c]);				
			}
		}
		cellHeights[r] = Math.max(maxHeight,cellHeights[r]);
		totalHeight += cellHeights[r];
	}
	for (var j = 0; j < cellWidths.length; j++) {
		totalWidth += cellWidths[j];
	}
	
	if (tableAlignHoriz == 'center') {
		left = left - totalWidth/2;
	} else if (tableAlignHoriz == 'right') {
		left = left - totalWidth;
	}
	
	if (tableAlignVert == 'middle') {
		top = top - totalHeight/2;
	} else if (tableAlignVert == 'bottom') {
		top = top - totalHeight;
	}
	
	//update canvases
	var maxHeight = object.maxHeight;
	var padding = def([object.padding,object.outerBorder.width/2]); // padding for canvas
	var fullRect = [0,0,totalWidth+2*padding,totalHeight+2*padding];
	var visRect = [left,top,totalWidth+2*padding,maxHeight]; 
	var topRowRect = [left,top,totalWidth+2*padding,maxHeight]; 
	var scrollRect = [left+totalWidth+4*padding,top,25,maxHeight]; 
	
	var ctxInvis = object.ctxInvis;
	var ctxVis = object.ctxVis;
	var ctxTopRow = object.ctxTopRow;
	ctxInvis.clear();
	ctxVis.clear();
	ctxTopRow.clear();	
	ctxInvis.data[102] = fullRect[2];
	ctxInvis.data[103] = fullRect[3];
	ctxInvis.canvas.width = fullRect[2];
	ctxInvis.canvas.height = fullRect[3];
	ctxVis.data[100] = visRect[0];
	ctxVis.data[101] = visRect[1];
	ctxVis.data[102] = visRect[2];
	ctxVis.data[103] = visRect[3];
	ctxVis.canvas.width = visRect[2];
	ctxVis.canvas.height = visRect[3];
	ctxTopRow.data[100] = topRowRect[0];
	ctxTopRow.data[101] = topRowRect[1];
	ctxTopRow.data[102] = topRowRect[2];
	ctxTopRow.data[103] = topRowRect[3];
	ctxTopRow.canvas.width = visRect[2];
	ctxTopRow.canvas.height = visRect[3];	
	resize();		
		
	var left = padding;
	var top = padding;

	ctxInvis.save();
	ctxInvis.lineCap = lineCap;
	ctxInvis.lineJoin = lineJoin;

	var cellDims = [];
	
	var horizPos = [left];
	for (var i = 0; i < cellWidths.length; i++) {
		horizPos.push(horizPos[horizPos.length-1]+cellWidths[i])
	}
	
	var vertPos = [top];
	for (var i = 0; i < cellHeights.length; i++) {
		vertPos.push(vertPos[vertPos.length-1]+cellHeights[i])
	}
		
	// write text to each cell
	var topPos = top;
	for (var i = 0; i < cells.length; i++) {
		var leftPos = left; 
		cellDims[i] = [];
		for (var j = 0; j < cells[i].length; j++) {
			cellDims[i][j] = {
				left:leftPos+2,
				top:topPos+1,
				width:cellWidths[j]-9,
				height:cellHeights[i]-8,
				border:false,
				offset:[-40,0.5*(cellHeights[i]-8)-20],
				fontSize:fontSize,
				leftPoint:paddingH,
				textColor:textColor,
				textAlign:horizAlign,
				fontSize:fontSize
			};
			if (cells[i][j].highlight == true) {
				if (typeof cells[i][j].color == 'undefined' || cells[i][j].color !== 'none') {
					ctxInvis.fillStyle = colorA(invertColor(cells[i][j].color),alpha);
				} else {
					ctxInvis.fillStyle = colorA(invertColor('#FFC'),alpha);
				}
				ctxInvis.fillRect(leftPos,topPos,cellWidths[j],cellHeights[i]);
			} else if (typeof cells[i][j].color == 'undefined' || cells[i][j].color !== 'none') {
				ctxInvis.fillStyle = colorA(cells[i][j].color,alpha);
				ctxInvis.fillRect(leftPos,topPos,cellWidths[j],cellHeights[i]);	
			}
			var align = horizAlign;
			if (!un(cells[i][j].align)) align = cells[i][j].align;
			var cellText = text({
				ctx:ctxInvis,
				left:leftPos+paddingH,
				top:topPos+paddingV,
				width:cellWidths[j]-2*paddingH,
				height:cellHeights[i]-2*paddingV,
				textArray:cells[i][j].text,
				textAlign:align,
				vertAlign:'middle',
				padding:0.001,
				box:cells[i][j].box,
				sf:sf
			});
			/*console.log(cellText.tightRect[2],cellText.tightRect[3],{
				ctx:ctxInvis,
				left:leftPos+paddingH,
				top:topPos+paddingV,
				width:cellWidths[j]-2*paddingH,
				height:cellHeights[i]-2*paddingV,
				textArray:cells[i][j].text,
				textAlign:align,
				vertAlign:'middle',
				padding:0.001,
				box:cells[i][j].box,
				sf:sf
			});*/
			leftPos += cellWidths[j];			
		}
		topPos += cellHeights[i];
	}
	
	// draw inner border
	if (innerBorder.show == true) {
		ctxInvis.strokeStyle = innerBorder.color;
		ctxInvis.lineWidth = innerBorder.width;
		if (!ctxInvis.setLineDash) {ctxInvis.setLineDash = function () {}}
		ctxInvis.setLineDash(innerBorder.dash);
		var leftPos = left;
		for (var i = 0; i < cellWidths.length - 1; i++) {
			leftPos += cellWidths[i];
			ctxInvis.beginPath();
			ctxInvis.moveTo(leftPos,top);
			ctxInvis.lineTo(leftPos,top+totalHeight);
			ctxInvis.stroke();
		}
		var topPos = top;
		for (var i = 0; i < cellHeights.length - 1; i++) {
			topPos += cellHeights[i];
			ctxInvis.beginPath();
			ctxInvis.moveTo(left,topPos);
			ctxInvis.lineTo(left+totalWidth,topPos);
			ctxInvis.stroke();
		}		
	}
	
	// draw outer border
	if (outerBorder.show == true) {
		ctxInvis.strokeStyle = outerBorder.color;
		ctxInvis.lineWidth = outerBorder.width;
		if (!ctxInvis.setLineDash) {ctxInvis.setLineDash = function () {}}
		ctxInvis.setLineDash(outerBorder.dash);
		ctxInvis.beginPath();
		ctxInvis.strokeRect(left,top,totalWidth,totalHeight);
	}
	
	ctxInvis.restore();

	object.cell = cellDims;
	object.xPos = horizPos;
	object.yPos = vertPos;
	
	if (!un(object.additionalDraw)) {
		object.additionalDraw();
	}
	
	object.redraw();
	
	if (totalHeight+2*padding > object.maxHeight) {
		moveScroller(object.scroller,object.left+object.xPos.last(),object.top+object.yPos[0]);
		object.hasScroll = true;
		object.scrollPos = 0;
		object.scrollMax = totalHeight/maxHeight;
		object.scrollDiff = totalHeight-maxHeight+2*padding;
		object.scroller.max = totalHeight/maxHeight;
		object.scroller.value = 0;
		object.scroller = updateScrollerDims(object.scroller);
		showScroller(object.scroller);
		if (object.topRowFreeze) {
			showObj(ctxTopRow.canvas);
			ctxTopRow.data[3] = ctxTopRow.data[103] = padding+vertPos[1];
			ctxTopRow.canvas.width = ctxTopRow.data[102];
			ctxTopRow.canvas.height = ctxTopRow.data[103];
			resizeCanvas3(ctxTopRow.canvas);
			ctxTopRow.drawImage(ctxInvis.canvas,0,0);
		} else {
			hideObj(ctxTopRow.canvas);
		}		
	} else {
		object.hasScroll = false;
		hideScroller(object.scroller);
		hideObj(ctxTopRow.canvas);
	}

	return object;
}
function moveScrollTable(object,left,top) {
	var relLeft = object.scroller.rect[0] - object.ctxVis.canvas.data[100];
	object.left = left;
	object.top = top;
	object.ctxVis.canvas.data[100] = left;
	object.ctxVis.canvas.data[101] = top;
	resizeCanvas3(object.ctxVis.canvas);
	object.ctxTopRow.canvas.data[100] = left;
	object.ctxTopRow.canvas.data[101] = top;
	resizeCanvas3(object.ctxTopRow.canvas);
	object.scroller.rect[0] = left+relLeft;
	object.scroller.rect[1] = top;
	object.scroller.reposition();
}
function showScrollTable(object,includeTopRow) {
	showObj(object.ctxVis.canvas);
	if (boolean(includeTopRow,true)) showObj(object.ctxTopRow.canvas);
	/*if (object.hasScroll == true)*/ showScroller(object.scroller);	
}
function hideScrollTable(object) {
	hideObj(object.ctxVis.canvas);
	hideObj(object.ctxTopRow.canvas);
	hideScroller(object.scroller);
}

function createSlider(object) {
	var id = object.id || slider[taskId].length;
	if (typeof object.gridDetails == 'undefined') object.gridDetails = {};
	var left = object.left || object.l || (object.gridDetails.left-10);
	var top = object.top || object.t || (object.gridDetails.top + object.gridDetails.height);
	var width = object.width || object.w || (object.gridDetails.width + 20);
	var height = object.height || object.h || 60;
	var bottom = top + height;
	var min,max;
	if (typeof object.min == 'number') {
		min = object.min;
	} else {
		min = object.gridDetails.xMin;
	}
	if (typeof object.max == 'number') {
		max = object.max;
	} else {
		max = object.gridDetails.xMax;
	}
	var vari = object.vari || "a";
	var linkedVar = object.linkedVar || taskTag+vari;
	var varChangeListener = object.varChangeListener;
	var startNum = min;
	if (typeof object.startNum == 'number') startNum = object.startNum;
	var inc = object.inc || 1;
	var label = true;
	if (typeof object.label == 'boolean') label = object.label;
	var labelFont = object.labelFont || "24px Arial";
	var labelColor = object.labelColor || '#000';
	var visible = boolean(object.visible,true);
	var zIndex = object.zIndex || 2;
	var handleColor = object.handleColor || '#00F';
	var handleStyle = object.handleStyle || 'rect'; // rect or circle
	var discrete = false;
	if (typeof object.discrete == 'boolean') discrete = object.discrete;
	var stepNum = 1;
	if (typeof object.stepNum == 'number') stepNum = object.stepNum;	
	var snap = false;
	if (typeof object.snap == 'boolean') snap = object.snap;
	var snapNum = 1;
	if (typeof object.snapNum == 'number') snapNum = object.snapNum;	
	var vert = boolean(object.vertical,false);

	if (vert == false) {
		var sliderWidth = 20;
		if (handleStyle == 'circle') sliderWidth = 40;
		var sliderHeight = 40;
	} else {
		var sliderHeight = 20;
		if (handleStyle == 'circle') sliderHeight = 40;
		var sliderWidth = 40;		
	}
	
	var backCanvas = document.createElement('canvas');
	backCanvas.width = width;
	backCanvas.height = height*1.5;
	backCanvas.setAttribute('id', taskTag+'slider'+id);
	backCanvas.setAttribute('position', 'absolute');
	backCanvas.setAttribute('cursor', 'auto');
	backCanvas.setAttribute('draggable', 'false');
	backCanvas.setAttribute('class', 'buttonClass');
	backCanvas.style.pointerEvents = 'none';
	backCanvas.style.zIndex = zIndex;
	if (visible == true) container.appendChild(backCanvas);
	taskObject[taskId].push(backCanvas);
	var backCtx = backCanvas.getContext('2d');
	var backCanvasData = [left, top, width, height*1.5, visible, false, false, zIndex];
	for (var i = 0; i < 8; i++) {backCanvasData[100+i] = backCanvasData[i];}
	backCanvasData[130] = visible;
	taskObjectData[taskId].push(backCanvasData);
	
	backCtx.lineWidth = 5;
	backCtx.strokeStyle = object.backColor || '#666';
	backCtx.lineCap = 'round';
	backCtx.lineJoin = 'round';
	backCtx.beginPath();
	if (vert == false) {
		backCtx.moveTo(0.5*sliderWidth, 0.5*height);
		backCtx.lineTo(width-0.5*sliderWidth, 0.5*height); 
	} else {
		backCtx.moveTo(0.5*width, 0.5*sliderHeight);
		backCtx.lineTo(0.5*width, height - 0.5*sliderHeight); 
	}	
	backCtx.closePath();
	backCtx.stroke();
	if (!un(object.scale)) {
		var step = def([object.scale.step,1]);
		var xInc = (width-20) / ((max-min)/step);
		var color = def([object.scale.color,backCtx.strokeStyle]);
		backCtx.lineWidth = 2;
		backCtx.strokeStyle = color;
		backCtx.beginPath();
		var l = 10;
		for (var i = min; i <= max; i += step) {
			backCtx.moveTo(l,0.5*height);
			backCtx.lineTo(l,0.85*height);
			text({ctx:backCtx,left:l-50,top:0.85*height,width:100,height:height,align:'center',color:color,textArray:['<<fontSize:20>>'+i]});
			l += xInc;
		}
		backCtx.stroke();
	}
	
	var sliderCanvas = document.createElement('canvas');
	sliderCanvas.width = sliderWidth;
	sliderCanvas.height = sliderHeight;
	sliderCanvas.setAttribute('id', taskTag+'slider'+id);
	sliderCanvas.setAttribute('position', 'absolute');
	sliderCanvas.setAttribute('cursor', 'auto');
	sliderCanvas.setAttribute('draggable', 'false');
	sliderCanvas.setAttribute('class', 'buttonClass');
	sliderCanvas.style.zIndex = zIndex;
	if (visible == true) container.appendChild(sliderCanvas);
	taskObject[taskId].push(sliderCanvas);
	var sliderCtx = sliderCanvas.getContext('2d');
	if (vert == false) {
		var leftPos = left + (startNum - min) * (width - sliderWidth) / (max - min);
		var sliderCanvasData = [leftPos, top+0.5*height-0.5*sliderHeight, sliderWidth, sliderHeight, visible, false, true, zIndex];
	} else {
		var topPos = bottom - sliderHeight - (startNum - min) * (height - sliderHeight) / (max - min);
		var sliderCanvasData = [left+0.5*width-0.5*sliderWidth, topPos, sliderWidth, sliderHeight, visible, false, true, zIndex];		
	}
	for (var i = 0; i < 8; i++) {sliderCanvasData[100+i] = sliderCanvasData[i];}
	sliderCanvasData[130] = visible;
	taskObjectData[taskId].push(sliderCanvasData);
	addListenerStart(sliderCanvas,sliderDragStart);
	
	sliderCtx.fillStyle = handleColor;
	if (handleStyle == 'rect') {
		sliderCtx.fillRect(0,0,sliderWidth,sliderHeight);
	} else if (handleStyle == 'circle') {
		sliderCtx.beginPath();
		sliderCtx.arc(0.5*sliderWidth,0.5*sliderHeight,0.5*sliderHeight-2,0,2*Math.PI);
		sliderCtx.closePath();
		sliderCtx.fill();
	}
	
	var labelCanvas = document.createElement('canvas');
	labelCanvas.width = width;
	labelCanvas.height = parseInt(labelFont) * 2;
	labelCanvas.setAttribute('id', taskTag+'slider'+id);
	labelCanvas.setAttribute('position', 'absolute');
	labelCanvas.setAttribute('cursor', 'auto');
	labelCanvas.setAttribute('draggable', 'false');
	labelCanvas.setAttribute('class', 'buttonClass');
	labelCanvas.style.pointerEvents = 'none';
	labelCanvas.style.zIndex = zIndex;	
	if (label == true && visible == true) {
		container.appendChild(labelCanvas);
	}
	taskObject[taskId].push(labelCanvas);
	var labelCtx = labelCanvas.getContext('2d');
	var labelCanvasData = [left, top+height, width, height, visible, false, false, zIndex];
	for (var i = 0; i < 8; i++) {labelCanvasData[100+i] = labelCanvasData[i];}
	
	labelCanvasData[130] = visible;
	taskObjectData[taskId].push(labelCanvasData);	
	
	if (label == true) {
		labelCtx.fillStyle = labelColor;
		labelCtx.font = "24px Arial";
		labelCtx.textAlign = 'center';
		labelCtx.textBaseline = 'middle';
		labelCtx.fillText(vari+" = "+startNum,0.5*width,parseInt(labelFont));
	}
	
	resize();

	slider[taskId][id] = {
		id:id,
		backCanvas:backCanvas,
		backctx:backCtx,
		backData:backCanvasData,
		sliderCanvas:sliderCanvas,
		sliderctx:sliderCtx,
		sliderData:sliderCanvasData,
		labelCanvas:labelCanvas,
		labelctx:labelCtx,
		labelData:labelCanvasData,
		left:left,
		top:top,
		width:width,
		height:height,
		bottom:bottom,
		sliderWidth:sliderWidth,
		sliderHeight:sliderHeight,
		min:min,
		max:max,
		startNum:startNum,
		currNum:startNum,
		vari:vari,
		linkedVar:linkedVar,
		varChangeListener:varChangeListener,
		inc:inc,
		label:label,
		labelFont:labelFont,
		labelColor:labelColor,
		visible:visible,
		zIndex:zIndex,
		discrete:discrete,
		stepNum:stepNum,
		snap:snap,
		snapNum:snapNum,
		vert:vert
	};
	
	return slider[taskId][id];
}
function showSlider(slider) {
	showObj(slider.backCanvas,slider.backData);
	showObj(slider.sliderCanvas,slider.sliderData);
	showObj(slider.labelCanvas,slider.labelData);	
}
function hideSlider(slider) {
	hideObj(slider.backCanvas,slider.backData);
	hideObj(slider.sliderCanvas,slider.sliderData);
	hideObj(slider.labelCanvas,slider.labelData);	
}
function setSliderValue(slider,value) {
	var val = Math.min(Math.max(slider.min,value),slider.max);
	if (slider.vert == false) {
		var left = slider.left + ((val - slider.min) / (slider.max - slider.min)) * (slider.width - slider.sliderWidth);
		slider.sliderData[100] = left;
	} else {
		var top = slider.bottom - slider.sliderHeight - ((val - slider.min) / (slider.max - slider.min)) * (slider.height - slider.sliderHeight);
		slider.sliderData[101] = top;		
	}
	slider.currNum = val;
	if (slider.label == true) {
		slider.labelctx.clearRect(0,0,slider.width,mainCanvasHeight);
		slider.labelctx.fillStyle = slider.labelColor;
		slider.labelctx.font = slider.labelFont;
		slider.labelctx.textAlign = 'center';
		slider.labelctx.textBaseline = 'middle';
		slider.labelctx.fillText(slider.vari+" = "+roundToNearest(val, 0.01),0.5*slider.width,parseInt(slider.labelFont));
	}
	resizeCanvas2(slider.sliderCanvas,slider.sliderData[100],slider.sliderData[101]);
	eval(slider.linkedVar+"="+val);
	eval(slider.varChangeListener+"()");
}
function sliderDragStart(e) {
	for (var i = 0; i < slider[taskNum].length; i++) {
		if (slider[taskNum][i].sliderCanvas == e.target) {
			currSlider = i;
			break;
		}
	}
	removeListenerStart(e.target, sliderDragStart)
	addListenerMove(window, sliderDragMove);
	addListenerEnd(window, sliderDragStop);
}
function sliderDragMove(e) {
	var s = slider[taskNum][currSlider];
	if (s.vert == false) {
		var left = Math.min(Math.max(mouse.x, s.left), s.left + s.width - s.sliderWidth);
		slider[taskNum][currSlider].sliderData[100] = left;
		var val = s.min + (left - s.left) * (s.max - s.min) / (s.width - s.sliderWidth);
	} else {
		var top = Math.min(Math.max(mouse.y, s.top), s.bottom - s.sliderHeight);
		slider[taskNum][currSlider].sliderData[101] = top;
		var val = s.min + (s.bottom - s.sliderHeight - top) * (s.max - s.min) / (s.height - s.sliderHeight);
	}	
	if (s.discrete == true) {
		val = roundToNearest(val, s.stepNum);
	}
	s.currNum = val;
	eval(s.linkedVar+"="+val);
	eval(s.varChangeListener+"()");
	if (s.label == true) {
		s.labelctx.clearRect(0,0,s.width,mainCanvasHeight);
		s.labelctx.fillStyle = s.labelColor;
		s.labelctx.font = s.labelFont;
		s.labelctx.textAlign = 'center';
		s.labelctx.textBaseline = 'middle';
		s.labelctx.fillText(s.vari+" = "+roundToNearest(val, 0.01),0.5*s.width,parseInt(s.labelFont));
	}
	resize();
}
function sliderDragStop(e) {
	removeListenerMove(window, sliderDragMove);
	removeListenerEnd(window, sliderDragStop);
	// snap slider to position
	var s = slider[taskNum][currSlider];
	if (s.snap == true) {
		if (s.vert == false) {
			var left = Math.min(Math.max(mouse.x, s.left), s.left + s.width - s.sliderWidth);
			var val = s.min + (left - s.left) * (s.max - s.min) / (s.width - s.sliderWidth);
		} else {
			var top = Math.min(Math.max(mouse.y, s.top), s.bottom - s.sliderHeight);
			var val = s.min + (s.bottom - s.sliderHeight - top) * (s.max - s.min) / (s.height - s.sliderHeight);
		}
		if (s.discrete == true) {
			val = roundToNearest(val, s.stepNum);
		} else if (s.snap == true) {
			val = roundToNearest(val, s.snapNum);
		} else {
			val = roundToNearest(val, s.inc);
		}
		s.currNum = val;
		eval(s.linkedVar+"="+val);	
		eval(s.varChangeListener+"()");
		if (s.vert == false) {
			var leftSnap = s.left + (val - s.min) * (s.width - s.sliderWidth) / (s.max - s.min);
			slider[taskNum][currSlider].sliderData[100] = leftSnap;
		} else {
			var topSnap = s.bottom - s.sliderHeight - (val - s.min) * (s.height - s.sliderHeight) / (s.max - s.min);
			slider[taskNum][currSlider].sliderData[101] = topSnap;
		}		
		resize();
	}
	addListenerStart(slider[taskNum][currSlider].sliderCanvas, sliderDragStart)	
}

var currScroller;
function createScroller(obj) {
	var rect = obj.rect;
	var z = obj.zIndex || obj.z || 2;
	var min = obj.min || 0;
	var max = obj.max;
	var colors = obj.colors || ['#3FF','#00F','#333','#CCC'];
	var sliderHeight = obj.sliderHeight || (rect[3] - rect[2]*2) / (max-min);
	var inc = obj.inc || 1;
	var incDist = (rect[3]-2*rect[2] - sliderHeight)/((max-min)/inc);
	var sliderRect = [rect[0],rect[1]+rect[2],rect[2],sliderHeight];
	var scroller = {
		rect:rect,zIndex:z,min:min,max:max,value:min,colors:colors,sliderRect:sliderRect,sliderHeight:sliderHeight,inc:inc,incDist:incDist
	};
	if (typeof obj.funcMove == 'function') scroller.funcMove = obj.funcMove;
	if (typeof obj.funcStop == 'function') scroller.funcStop = obj.funcStop;
	scroller.canvas = newcanvas({rect:scroller.rect,pE:true,z:scroller.zIndex});
	scroller.canvas.scroller = scroller;
	scroller.ctx = scroller.canvas.ctx;
	scroller.slider = {};
	scroller.sliderCanvas = newcanvas({rect:sliderRect,pE:true,z:scroller.zIndex+1});
	scroller.sliderCanvas.scroller = scroller;
	scroller.sliderctx = scroller.sliderCanvas.ctx;
	scroller.sliderctx.fillStyle = colors[1];
	scroller.sliderctx.fillRect(0,0,sliderRect[2],sliderRect[3]);
	scroller.reposition = function(newMax,newRect) {
		if (!un(newMax)) this.max = newMax;
		if (!un(newRect)) this.rect = newRect;
		this.canvas.data[100] = this.rect[0];
		this.canvas.data[101] = this.rect[1];
		this.canvas.data[102] = this.rect[2];
		this.canvas.data[103] = this.rect[3];
		resizeCanvas(this.canvas,this.rect[0],this.rect[1],this.rect[2],this.rect[3]);
		this.canvas.width = this.rect[2];
		this.canvas.height = this.rect[3];
		this.sliderHeight = (this.rect[3] - this.rect[2]*2) / (this.max-this.min);
		this.sliderRect = [this.rect[0],this.rect[1]+this.rect[2],this.rect[2],this.sliderHeight];
		this.sliderCanvas.data[100] = this.sliderRect[0];
		this.sliderCanvas.data[101] = this.sliderRect[1];
		this.sliderCanvas.data[102] = this.sliderRect[2];
		this.sliderCanvas.data[103] = this.sliderRect[3];
		resizeCanvas(this.sliderCanvas,this.sliderRect[0],this.sliderRect[1],this.sliderRect[2],this.sliderRect[3]);
		this.sliderCanvas.width = this.sliderRect[2];
		this.sliderCanvas.height = this.sliderRect[3];
		this.draw();
		this.value = 0;
		this.sliderRect[1] = this.rect[1]+this.rect[2]+(this.rect[3]-2*this.rect[2]-this.sliderHeight)*((this.value-this.min)/(this.max-this.min));
		resizeCanvas(this.sliderCanvas,this.sliderRect[0],this.sliderRect[1]);
	}
	scroller.draw = function() {
		var ctx = this.ctx;
		var w = this.rect[2];
		var h = this.rect[3];
		ctx.clearRect(0,0,w,h);
		var lineColor = this.colors[2] || '#000';
		var lineWidth = this.lineWidth || 4;
		var fillColor = this.colors[0] || '#3FF';
		var fillColor2 = this.colors[3] || '#CCC';
		var radius = this.radius || 4;
		roundedRect(ctx,lineWidth/2,lineWidth/2,w-lineWidth,h-lineWidth,radius,lineWidth,lineColor,fillColor2);	
		roundedRect(ctx,lineWidth/2,lineWidth/2,w-lineWidth,w-lineWidth,radius,lineWidth,lineColor,fillColor);	
		roundedRect(ctx,lineWidth/2,h-w,w-lineWidth,w-lineWidth,radius,lineWidth,lineColor,fillColor);	
		ctx.fillStyle = lineColor;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.beginPath();
		ctx.moveTo(w*14/50,w*34/50);
		ctx.lineTo(w*25/50,w*16/50);
		ctx.lineTo(w*36/50,w*34/50);
		ctx.lineTo(w*14/50,w*34/50);
		ctx.fill();	
		ctx.beginPath();
		ctx.moveTo(w*14/50,h-w+w*16/50);
		ctx.lineTo(w*25/50,h-w+w*34/50);
		ctx.lineTo(w*36/50,h-w+w*16/50);
		ctx.lineTo(w*14/50,h-w+w*16/50);
		ctx.fill();
		var colors = this.colors || ['#3FF','#00F','#333','#CCC'];
		this.sliderctx.fillStyle = colors[1];
		this.sliderctx.fillRect(0,0,this.sliderRect[2],this.sliderHeight);				
	}
	scroller.draw();
	addListener(scroller.canvas,function(e){
		updateMouse(e);
		var scroller = this.scroller;
		if (mouse.y < scroller.sliderRect[1]) {
			scroller.update(-1);
		} else if (mouse.y > scroller.sliderRect[1]+scroller.sliderRect[3]) {
			scroller.update(1);
		}
	});
	addListenerStart(scroller.sliderCanvas,scrollerMoveStart);
	scroller.update = function(change) {
		var newValue = Math.min(this.max,Math.max(this.min,this.value+change));
		if (newValue == this.value) return;
		this.value = newValue;
		this.sliderRect[1] = this.rect[1]+this.rect[2]+(this.rect[3]-2*this.rect[2]-this.sliderHeight)*((this.value-this.min)/(this.max-this.min));
		resizeCanvas(this.sliderCanvas,this.sliderRect[0],this.sliderRect[1]);
		if (typeof this.funcStop == 'function') {
			this.funcStop(this.value);
		} else if (typeof this.funcMove == 'function') {
			this.funcMove(this.value);
		}
	}
	return scroller;
}
function updateScrollerDims(s) { // update max
	s.sliderHeight = (s.rect[3] - s.rect[2]*2) / (s.max-s.min);
	s.incDist = (s.rect[3]-2*s.rect[2] - s.sliderHeight)/((s.max-s.min)/s.inc);
	s.sliderRect[3] = s.sliderHeight;
	s.sliderCanvas.data[100] = s.sliderRect[0];
	s.sliderCanvas.data[101] = s.sliderRect[1];
	s.sliderCanvas.data[102] = s.sliderRect[2];
	s.sliderCanvas.data[103] = s.sliderRect[3];
	resizeCanvas3(s.sliderCanvas);
	setScrollerValue(s,s.value,true);
	return s;
}
function scrollerMoveStart(e) {
	updateMouse(e);
	currScroller = e.target.scroller;
	currScroller.dragStartPos = mouse.y;
	currScroller.dragStartValue = currScroller.value;
	currScroller.dragStartY = currScroller.sliderRect[1];
	currScroller.dragOffset = mouse.y - currScroller.sliderRect[1];
	currScroller.dragMinY = currScroller.rect[1] + currScroller.rect[2]; 
	currScroller.dragMaxY = currScroller.rect[1] + currScroller.rect[3] - currScroller.rect[2] - currScroller.sliderRect[3]; 
	addListenerMove(window,scrollerMoveMove);
	addListenerEnd(window,scrollerMoveStop);
}
function scrollerMoveMove(e) {
	updateMouse(e);
	var dy = mouse.y - currScroller.dragStartPos;
	var newY = Math.min(Math.max(currScroller.dragStartY+dy,currScroller.dragMinY),currScroller.dragMaxY);
	if (newY == currScroller.sliderRect[1]) return;
	currScroller.sliderRect[1] = newY;
	resizeCanvas(currScroller.sliderCanvas,currScroller.sliderRect[0],currScroller.sliderRect[1]);
	currScroller.value = currScroller.min + (currScroller.max - currScroller.min) * (currScroller.sliderRect[1] - currScroller.dragMinY) / (currScroller.dragMaxY - currScroller.dragMinY);
	if (typeof currScroller.funcMove == 'function') currScroller.funcMove(currScroller.value);
};
function scrollerMoveStop(e) {
	if (typeof currScroller.funcStop == 'function') currScroller.funcStop(currScroller.value);	
	currScroller = null;
	removeListenerMove(window,scrollerMoveMove);
	removeListenerEnd(window,scrollerMoveStop);		
};
function setScrollerValue(scroller,value,applyFunc) {
	var newValue = Math.min(Math.max(scroller.min,value),scroller.max);
	//if (newValue == scroller.value) return;
	scroller.value = newValue;
	scroller.sliderRect[1] = scroller.rect[1]+scroller.rect[2]+(scroller.rect[3]-2*scroller.rect[2]-scroller.sliderHeight)*((scroller.value-scroller.min)/(scroller.max-scroller.min));
	resizeCanvas(scroller.sliderCanvas,scroller.sliderRect[0],scroller.sliderRect[1]);
	scroller.update(0);
	if (!applyFunc && applyFunc == false) return;
	if (typeof scroller.funcStop == 'function') {
		scroller.funcStop(scroller.value);
	} else if (typeof scroller.funcMove == 'function') {
		scroller.funcMove(scroller.value);
	}	
}
function moveScroller(scroller,left,top) {
	var relTop = scroller.sliderCanvas.data[101] - scroller.canvas.data[100];
	scroller.sliderRect[0] = left;
	scroller.sliderRect[1] = top + relTop;
	scroller.rect[0] = left;
	scroller.rect[1] = top;
	scroller.canvas.data[100] = left;
	scroller.canvas.data[101] = top;
	resizeCanvas3(scroller.canvas);
	scroller.sliderCanvas.data[100] = left;
	scroller.sliderCanvas.data[101] = top + relTop;
	resizeCanvas3(scroller.sliderCanvas);
}
function hideScroller(scroller) {
	if (un(scroller)) return;
	hideObj(scroller.canvas);
	hideObj(scroller.sliderCanvas);
}
function showScroller(scroller) {
	if (un(scroller)) return;
	showObj(scroller.canvas);
	showObj(scroller.sliderCanvas);
}

function drawArrow(object) {
	var context = object.context || object.ctx;
	var startX = object.startX;
	var startY = object.startY;
	var finX = object.finX || startX;
	var finY = object.finY || startY;

	var doubleEnded;
	if (typeof object.doubleEnded == 'boolean') {doubleEnded = object.doubleEnded} else {doubleEnded = false}	
	var arrowLength = object.arrowLength || 30;
	var angleBetweenLinesRads = object.angleBetweenLinesRads || 0.5;
	var fillArrow = boolean(object.fillArrow,false);
	var showLine = boolean(object.showLine,true);	
	var dash = object.dash || [];
	
	context.save();
	context.strokeStyle = object.color || '#000';
	context.fillStyle = object.color || '#000';
	context.lineWidth = object.lineWidth || 4;

	if (showLine == true) {
		//draw line
		if (typeof context.setLineDash == 'undefined') context.setLineDash = function(){};
		context.setLineDash(dash);
		context.beginPath();
		context.moveTo(startX, startY);
		context.lineTo(finX, finY);
		context.stroke();
	}
		
	context.lineWidth = object.arrowLineWidth || object.lineWidth || 4;
	context.beginPath();	
	if (typeof context.setLineDash == 'undefined') context.setLineDash = function(){};
	context.setLineDash([]);
	context.lineJoin = 'round';
	context.lineCap = 'round';
	
	var posX;
	var posY; 
	var otherX; 
	var otherY;	
	var endToDraw = "fin";

	do {
		if (endToDraw == "fin") {
			posX = finX;
			posY = finY;
			otherX = startX;
			otherY = startY;	
		} else if (endToDraw == "start") {
			posX = startX;
			posY = startY;
			otherX = finX;
			otherY = finY;	
		}
		
		var nGradient = (-1 * (posY - otherY)) / (posX - otherX);
				
		var angleToHorizontal = Math.abs(Math.atan(nGradient));
		var remainingAngle  = Math.PI / 2  - angleBetweenLinesRads -  angleToHorizontal;
		
		var narrowX1,narrowX2,narrowY1,narrowY2;
		
		if (nGradient == Infinity) {
			//first half of arrow
			narrowX1 = Math.sin(remainingAngle) * arrowLength;
			narrowY1 = Math.cos(remainingAngle) * arrowLength;
			context.moveTo(posX, posY);
			context.lineTo(posX + narrowX1, posY + narrowY1);
			
			// second half of arrow
			narrowX2 = Math.cos(angleBetweenLinesRads - angleToHorizontal) * arrowLength;
			narrowY2 = Math.sin(angleBetweenLinesRads - angleToHorizontal) * arrowLength;
			context.moveTo(posX, posY);
			context.lineTo(posX + narrowX2, posY - narrowY2);			

			if (fillArrow == true) context.lineTo(posX + narrowX1, posY + narrowY1);			
		} else if (nGradient == -Infinity) {
			//first half of arrow
			narrowX1 = Math.sin(remainingAngle) * arrowLength;
			narrowY1 = Math.cos(remainingAngle) * arrowLength;
			context.moveTo(posX, posY);
			context.lineTo(posX + narrowX1, posY - narrowY1);
			
			// second half of arrow
			narrowX2 = Math.cos(angleBetweenLinesRads - angleToHorizontal) * arrowLength;
			narrowY2 = Math.sin(angleBetweenLinesRads - angleToHorizontal) * arrowLength;
			context.moveTo(posX, posY);
			context.lineTo(posX + narrowX2, posY + narrowY2);			

			if (fillArrow == true) context.lineTo(posX + narrowX1, posY - narrowY1);			
		} else
		
		///case 1 - arrow is pointing up and to the left
		if (nGradient < 0 && posY < otherY) {
			
			//first half of arrow
			narrowX1 = Math.sin(remainingAngle) * arrowLength;
			narrowY1 = Math.cos(remainingAngle) * arrowLength;
			context.moveTo(posX, posY);
			context.lineTo(posX + narrowX1, posY + narrowY1);
			
			// second half of arrow
			narrowX2 = Math.cos(angleBetweenLinesRads - angleToHorizontal) * arrowLength;
			narrowY2 = Math.sin(angleBetweenLinesRads - angleToHorizontal) * arrowLength;
			context.moveTo(posX, posY);
			context.lineTo(posX + narrowX2, posY - narrowY2);
			
			if (fillArrow == true) context.lineTo(posX + narrowX1, posY + narrowY1);
		} else 

			///case 2 - arrow is pointing up and to the right
		if (nGradient > 0 && posY <  otherY) {
			
			//first half of arrow
			narrowX1 = Math.sin(remainingAngle) * arrowLength;
			narrowY1 = Math.cos(remainingAngle) * arrowLength;
			context.moveTo(posX, posY);
			context.lineTo(posX - narrowX1, posY + narrowY1);
			
			// second half of arrow
			narrowX2 = Math.cos(angleBetweenLinesRads - angleToHorizontal)*arrowLength;
			narrowY2 = Math.sin(angleBetweenLinesRads - angleToHorizontal)*arrowLength;
			context.moveTo(posX, posY);
			context.lineTo(posX - narrowX2, posY - narrowY2);		
			
			if (fillArrow == true) context.lineTo(posX - narrowX1, posY + narrowY1);			
		} else
			
		//gradient is 0 and pointing right
		if (nGradient == 0 && posX > otherX) {
			
			//first half of arrow
			narrowX1 = Math.sin(remainingAngle)*arrowLength
			narrowY1 = Math.cos(remainingAngle)*arrowLength
			context.moveTo( posX  , posY )
			context.lineTo( posX - narrowX1, posY + narrowY1 )
			
			// second half of arrow
			narrowX2 = Math.cos(angleBetweenLinesRads - angleToHorizontal)*arrowLength
			narrowY2 = Math.sin(angleBetweenLinesRads - angleToHorizontal)*arrowLength
			context.moveTo( posX  , posY )
			context.lineTo( posX - narrowX2, posY - narrowY2 )
			
			if (fillArrow == true) context.lineTo(posX - narrowX1, posY + narrowY1);			
		} else
			
			
		// gradient is 0 and pointing left
		if (nGradient == 0 && posX < otherX) {
			
			//first half of arrow
			narrowX1 = Math.sin(remainingAngle)*arrowLength
			narrowY1 = Math.cos(remainingAngle)*arrowLength
			context.moveTo( posX  , posY )
			context.lineTo( posX + narrowX1, posY + narrowY1 )
			
			// second half of arrow
			narrowX2 = Math.cos(angleBetweenLinesRads - angleToHorizontal)*arrowLength
			narrowY2 = Math.sin(angleBetweenLinesRads - angleToHorizontal)*arrowLength
			context.moveTo( posX  , posY )
			context.lineTo( posX + narrowX2, posY - narrowY2 )
			
			if (fillArrow == true) context.lineTo(posX + narrowX1, posY + narrowY1);			
		} else 
			
		///case 3 - arrow is pointing down and to the right
		if (nGradient < 0 && posY >  otherY) {
			
			angleBetweenLinesRads = Math.PI - angleBetweenLinesRads
			remainingAngle  = Math.PI / 2  - angleBetweenLinesRads -  angleToHorizontal;
		
			//first half of arrow
			narrowX1 = Math.sin(remainingAngle)*arrowLength
			narrowY1 = Math.cos(remainingAngle)*arrowLength
			context.moveTo( posX  , posY )
			context.lineTo( posX + narrowX1, posY + narrowY1 )
			
			// second half of arrow
			narrowX2 = Math.cos(angleBetweenLinesRads - angleToHorizontal)*arrowLength
			narrowY2 = Math.sin(angleBetweenLinesRads - angleToHorizontal)*arrowLength		
			context.moveTo( posX  , posY )
			context.lineTo( posX + narrowX2, posY - narrowY2 )
			
			if (fillArrow == true) context.lineTo(posX + narrowX1, posY + narrowY1);			
		} else
			
		///case 4 - arrow is pointing down and to the left
		if (nGradient > 0 && posY >  otherY) {
			
			angleBetweenLinesRads = Math.PI - angleBetweenLinesRads
			remainingAngle  = Math.PI / 2  - angleBetweenLinesRads -  angleToHorizontal;
		
			//first half of arrow	
			narrowX1 = Math.sin(remainingAngle)*arrowLength
			narrowY1 = Math.cos(remainingAngle)*arrowLength
			context.moveTo( posX  , posY )
			context.lineTo( posX - narrowX1, posY + narrowY1 )
			
			// second half of arrow
			narrowX2 = Math.cos(angleBetweenLinesRads - angleToHorizontal)*arrowLength
			narrowY2 = Math.sin(angleBetweenLinesRads - angleToHorizontal)*arrowLength
			context.moveTo( posX  , posY )
			context.lineTo( posX - narrowX2, posY - narrowY2 )

			if (fillArrow == true) context.lineTo(posX - narrowX1, posY + narrowY1);			
		}	
		
		if (doubleEnded == true && endToDraw == "fin") {
			endToDraw = "start";
		} else {
			endToDraw = "none";
		}
	} while (endToDraw !== "none");
	
		
	context.closePath();
	context.stroke();
	if (fillArrow == true) context.fill();
	context.restore();
			
}
function drawVector (vectorCtx, lineEndPointX1 , lineEndPointY1, lineEndPointX2, lineEndPointY2, arrowLength, angleBetweenLinesInRadians,opt_color, opt_lineWidth) {
	
	if (typeof opt_color == 'undefined') {vectorCtx.strokeStyle="#000";}
	if (typeof opt_lineWidth == 'undefined') {vectorCtx.lineWidth = 5;}  
	

		
			
		//draw line
		
		vectorCtx.beginPath();
		vectorCtx.moveTo(lineEndPointX1, lineEndPointY1);
		vectorCtx.lineTo(lineEndPointX2, lineEndPointY2);
		
		//draw Arrow
		var nMidpointX = (lineEndPointX1 + lineEndPointX2) / 2
		var nMidpointY = (lineEndPointY1 + lineEndPointY2) / 2
		
		var nGradient = (-1 * (lineEndPointY2 - lineEndPointY1) ) / ( lineEndPointX2 - lineEndPointX1 );
		
		var angleToHorizontal = Math.abs(Math.atan(nGradient));
		var remainingAngle  = Math.PI / 2  - angleBetweenLinesInRadians -  angleToHorizontal;
		
		var narrowX;
		var narrowY;
		
		///case 1 - arrow is pointing up and to the left
		if (nGradient < 0 && lineEndPointY2 <  lineEndPointY1) {
			
			//first half of arrow
			
			narrowX = Math.sin(remainingAngle)*arrowLength
			narrowY = Math.cos(remainingAngle)*arrowLength
			
			vectorCtx.moveTo( nMidpointX  , nMidpointY )
			vectorCtx.lineTo( nMidpointX + narrowX, nMidpointY + narrowY )
			
			// second half of arrow
			
			narrowX = Math.cos(angleBetweenLinesInRadians - angleToHorizontal)*arrowLength
			narrowY = Math.sin(angleBetweenLinesInRadians - angleToHorizontal)*arrowLength
			
			vectorCtx.moveTo( nMidpointX  , nMidpointY )
			vectorCtx.lineTo( nMidpointX + narrowX, nMidpointY - narrowY )
			
			
			}
			
			
		///case 2 - arrow is pointing up and to the right
		if (nGradient > 0 && lineEndPointY2 <  lineEndPointY1) {
			
			//first half of arrow
			
			narrowX = Math.sin(remainingAngle)*arrowLength
			narrowY = Math.cos(remainingAngle)*arrowLength
			
			vectorCtx.moveTo( nMidpointX  , nMidpointY )
			vectorCtx.lineTo( nMidpointX - narrowX, nMidpointY + narrowY )
			
			// second half of arrow
			
			narrowX = Math.cos(angleBetweenLinesInRadians - angleToHorizontal)*arrowLength
			narrowY = Math.sin(angleBetweenLinesInRadians - angleToHorizontal)*arrowLength
			
			vectorCtx.moveTo( nMidpointX  , nMidpointY )
			vectorCtx.lineTo( nMidpointX - narrowX, nMidpointY - narrowY )
			
			}	
			
		//gradient is 0 and pointing right
		
			
		
		if (nGradient == 0 && lineEndPointX2 > lineEndPointX1) {
			
			//first half of arrow
			
			narrowX = Math.sin(remainingAngle)*arrowLength
			narrowY = Math.cos(remainingAngle)*arrowLength
			
			vectorCtx.moveTo( nMidpointX  , nMidpointY )
			vectorCtx.lineTo( nMidpointX - narrowX, nMidpointY + narrowY )
			
			// second half of arrow
			
			narrowX = Math.cos(angleBetweenLinesInRadians - angleToHorizontal)*arrowLength
			narrowY = Math.sin(angleBetweenLinesInRadians - angleToHorizontal)*arrowLength
			
			vectorCtx.moveTo( nMidpointX  , nMidpointY )
			vectorCtx.lineTo( nMidpointX - narrowX, nMidpointY - narrowY )
			
			}	
			
			
		// gradient is - and pointing left
		
		if (nGradient == 0 && lineEndPointX2 < lineEndPointX1) {
			
			//first half of arrow
			
			narrowX = Math.sin(remainingAngle)*arrowLength
			narrowY = Math.cos(remainingAngle)*arrowLength
			
			vectorCtx.moveTo( nMidpointX  , nMidpointY )
			vectorCtx.lineTo( nMidpointX + narrowX, nMidpointY + narrowY )
			
			// second half of arrow
			
			narrowX = Math.cos(angleBetweenLinesInRadians - angleToHorizontal)*arrowLength
			narrowY = Math.sin(angleBetweenLinesInRadians - angleToHorizontal)*arrowLength
			
			vectorCtx.moveTo( nMidpointX  , nMidpointY )
			vectorCtx.lineTo( nMidpointX + narrowX, nMidpointY - narrowY )
			
			}		
				
			
			
		///case 3 - arrow is pointing down and to the right
		if (nGradient < 0 && lineEndPointY2 >  lineEndPointY1) {
			
			angleBetweenLinesInRadians = Math.PI - angleBetweenLinesInRadians
			remainingAngle  = Math.PI / 2  - angleBetweenLinesInRadians -  angleToHorizontal;
		
			
			//first half of arrow
			
			narrowX = Math.sin(remainingAngle)*arrowLength
			narrowY = Math.cos(remainingAngle)*arrowLength
			
			vectorCtx.moveTo( nMidpointX  , nMidpointY )
			vectorCtx.lineTo( nMidpointX + narrowX, nMidpointY + narrowY )
			
			// second half of arrow
			
			narrowX = Math.cos(angleBetweenLinesInRadians - angleToHorizontal)*arrowLength
			narrowY = Math.sin(angleBetweenLinesInRadians - angleToHorizontal)*arrowLength
			
			vectorCtx.moveTo( nMidpointX  , nMidpointY )
			vectorCtx.lineTo( nMidpointX + narrowX, nMidpointY - narrowY )
				
			}	
			
		///case 4 - arrow is pointing down and to the left
		if (nGradient > 0 && lineEndPointY2 >  lineEndPointY1) {
			
			angleBetweenLinesInRadians = Math.PI - angleBetweenLinesInRadians
			remainingAngle  = Math.PI / 2  - angleBetweenLinesInRadians -  angleToHorizontal;
		
		
			//first half of arrow
			
			narrowX = Math.sin(remainingAngle)*arrowLength
			narrowY = Math.cos(remainingAngle)*arrowLength
			
			vectorCtx.moveTo( nMidpointX  , nMidpointY )
			vectorCtx.lineTo( nMidpointX - narrowX, nMidpointY + narrowY )
			
			// second half of arrow
			
			narrowX = Math.cos(angleBetweenLinesInRadians - angleToHorizontal)*arrowLength
			narrowY = Math.sin(angleBetweenLinesInRadians - angleToHorizontal)*arrowLength
			
			vectorCtx.moveTo( nMidpointX  , nMidpointY )
			vectorCtx.lineTo( nMidpointX - narrowX, nMidpointY - narrowY )
			
			}	
				
		
			
		vectorCtx.closePath();
    	vectorCtx.stroke();
			
}
function measureAngle(object) {
	// REQUIRED
	var aPos = object.a; // array: [x,y]
	var bPos = object.b; // array: [x,y]
	var cPos = object.c; // array: [x,y]
	
	// OPTIONAL
	var angleType = object.angleType || 'radians';

	// Work out the angles seperately - measured in radians anti-clockwise from north
	var m1 = (bPos[1]-aPos[1])/(aPos[0]-bPos[0]);
	var angle1 = (Math.PI/2 - Math.atan(m1));
	if (aPos[0] <= bPos[0]) angle1 += Math.PI;	
	if (aPos[0] == bPos[0]) { // if infinite gradient
		if (aPos[1] < bPos[1]) {
			angle1 = 0;	
		} else {
			angle1 = Math.PI;
		}
	}
	
	var m2 = (cPos[1]-bPos[1])/(bPos[0]-cPos[0]);
	var angle2 = (Math.PI/2 - Math.atan(m2));
	if (bPos[0] >= cPos[0]) angle2 += Math.PI;	
	if (bPos[0] == cPos[0]) { // if infinite gradient
		if (bPos[1] > cPos[1]) {
			angle2 = 0;	
		} else {
			angle2 = Math.PI;
		}
	}
	
	var angleDiff = angle2 - angle1;
	if (angle1 > angle2) angleDiff = angle2 - (angle1 - 2 * Math.PI);
	if (angleType == 'degrees') angleDiff = angleDiff * 180 / Math.PI; 
	
	return angleDiff;
}
function drawAngle(object) {
	// REQUIRED
	var ctx = object.ctx || object.context;
	var aPos = object.a; // array: [x,y]
	var bPos = object.b; // array: [x,y]
	var cPos = object.c; // array: [x,y]
	
	// OPTIONAL
	if (typeof object.sf !== 'undefined') {
		var sf = object.sf;
	} else {
		var sf = 1;
	}
	if (sf !== 1) {
		aPos = [aPos[0]*sf,aPos[1]*sf];
		bPos = [bPos[0]*sf,bPos[1]*sf];
		cPos = [cPos[0]*sf,cPos[1]*sf];
	}
	var labelCtx = object.labelCtx || ctx;
	var radius = object.angleRadius*sf || object.radius*sf || 35*sf;
	var squareForRight = boolean(object.squareForRight, true);
	var labelIfRight = boolean(object.labelIfRight, false)
	
	var drawLines = boolean(object.drawLines, false);
	var lineWidth = object.lineWidth*sf || 4*sf;
	var lineColor = object.lineColor || '#000';

	var numOfCurves = object.numOfCurves || 1;
	var curveGap = object.curveGap || 4*sf+lineWidth;
	
	var drawCurve = boolean(object.drawCurve, true);
	var curveWidth = object.curveWidth*sf || lineWidth;
	var curveColor = object.curveColor || lineColor;
	
	var fill = boolean(object.fill, false);
	var fillColor = object.fillColor || '#CCF';
	if (fillColor == 'none') fill = false;
	
	var label = object.label || [''];
	var labelFont = object.labelFont || 'Arial';
	var labelFontSize = object.labelFontSize*sf || 30*sf;
	var labelColor = object.labelColor || '#000';
	var labelRadius = object.labelRadius*sf || radius * 1.1;
	var labelBox = object.labelBox || {type:'none'};
	if (boolean(object.labelBackFill,false) === true) {
		labelBox = {type:'tight',color:mainCanvasFillStyle,borderColor:mainCanvasFillStyle,padding:0.1};
	}
	
	var labelMeasure = boolean(object.labelMeasure, false);
	var measureRoundTo = object.measureRoundTo || 1;
	var angleType = object.angleType || 'degrees';
	
	function lowerCaseTest(string) {
		var upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789lkhfdb'.split('');
		for (var i = 0; i < upperCase.length; i++) {
			if (string.indexOf(upperCase[i]) > -1) return false;
		}
		return true;
	}	
	
	// Work out the angles required - measured in radians anti-clockwise from north
	var m1 = (bPos[1]-aPos[1])/(aPos[0]-bPos[0]);
	var angle1 = (Math.PI/2 - Math.atan(m1));
	if (aPos[0] <= bPos[0]) angle1 += Math.PI;	
	if (aPos[0] == bPos[0]) { // if infinite gradient
		if (aPos[1] < bPos[1]) {
			angle1 = 0;	
		} else {
			angle1 = Math.PI;
		}
	}
	
	var m2 = (cPos[1]-bPos[1])/(bPos[0]-cPos[0]);
	var angle2 = (Math.PI/2 - Math.atan(m2));
	if (bPos[0] >= cPos[0]) angle2 += Math.PI;	
	if (bPos[0] == cPos[0]) { // if infinite gradient
		if (bPos[1] > cPos[1]) {
			angle2 = 0;	
		} else {
			angle2 = Math.PI;
		}
	}
	
	var angleDiff = angle2 - angle1;
	if (angle1 > angle2) angleDiff = angle2 - (angle1 - 2 * Math.PI);	
	
	
	// test if right-angled
	if  (squareForRight == true && roundToNearest(angleDiff*180/Math.PI, measureRoundTo) == 90) {
		var dAngle = angle1 + 0.5 * angleDiff;
		if (angle1 > angle2) {
			dAngle = (angle1 - 2 * Math.PI) + 0.5 * angleDiff;	
		}
		var dPos = [bPos[0] + radius * Math.cos(dAngle-Math.PI/2), bPos[1] + radius * Math.sin(dAngle-Math.PI/2)];
		
		// other vertices of the square
		var abLength = Math.sqrt(Math.pow(bPos[0]-aPos[0],2)+Math.pow(bPos[1]-aPos[1],2));
		var aPos2 = [bPos[0]+(aPos[0]-bPos[0])*radius/(abLength*Math.sqrt(2)), bPos[1]+(aPos[1]-bPos[1])*radius/(abLength*Math.sqrt(2))];
	
		var bcLength = Math.sqrt(Math.pow(bPos[0]-cPos[0],2)+Math.pow(bPos[1]-cPos[1],2));
		var cPos2 = [bPos[0]+(cPos[0]-bPos[0])*radius/(bcLength*Math.sqrt(2)), bPos[1]+(cPos[1]-bPos[1])*radius/(bcLength*Math.sqrt(2))];		
		
		if (fill == true) {
			ctx.fillStyle = fillColor;
			ctx.beginPath();
			ctx.moveTo(bPos[0],bPos[1]);
			ctx.lineTo(aPos2[0],aPos2[1]);
			ctx.lineTo(dPos[0],dPos[1]);
			ctx.lineTo(cPos2[0],cPos2[1]);
			ctx.closePath();
			ctx.fill();
		}
		
		if (drawCurve == true) {
			ctx.strokeStyle = curveColor;
			ctx.lineWidth = curveWidth;
			ctx.beginPath();
			ctx.moveTo(aPos2[0],aPos2[1]);
			ctx.lineTo(dPos[0],dPos[1]);
			ctx.lineTo(cPos2[0],cPos2[1]);			
			ctx.stroke();
		}
	
		if (drawLines == true) {
			ctx.strokeStyle = lineColor;
			ctx.lineWidth = lineWidth;
			ctx.beginPath();
			ctx.joinCap = 'round';
			ctx.moveTo(aPos[0],aPos[1]);
			ctx.lineTo(bPos[0],bPos[1]);
			ctx.lineTo(cPos[0],cPos[1]);
			ctx.stroke();
		}	
		
		if (labelIfRight == true) {
			if (labelMeasure == true) {
				var angleDiff2 = angleDiff;
				if (angleType == 'degrees') angleDiff2 = angleDiff2 * 180 / Math.PI; 
				angleDiff2 = roundToNearest(angleDiff2, measureRoundTo);	
				label = [String(angleDiff2)];
				if (angleType == 'degrees') {label = [String(angleDiff2) + String.fromCharCode(0x00B0)]}; 
			}
	
			// work out label position
			// d is midPoint of ac
			var dAngle = angle1 + 0.5 * angleDiff;
			if (angle1 > angle2) {
				dAngle = (angle1 - 2 * Math.PI) + 0.5 * angleDiff;	
			}
			var dPos = [bPos[0] + 1.85 * radius * Math.cos(dAngle-Math.PI/2), bPos[1] + 1.85 * radius * Math.sin(dAngle-Math.PI/2)];		
	
			if (labelCtx == ctx) {
				drawMathsText(labelCtx, label, labelFontSize, dPos[0], dPos[1]+0.5*labelFontSize, true, [], 'center', 'bottom');
			} else {
				var labelCanvas = labelCtx.canvas;
				var labelWidth = labelCanvas.width;
				var labelHeight = labelCanvas.height;
				var canvasNum = taskObject[taskId].indexOf(labelCanvas);
				var labelData = taskObjectData[taskId][canvasNum];
				
				labelCtx.clearRect(0,0,labelWidth,labelHeight);
				
				drawMathsText(labelCtx, label, labelFontSize, 0.5*labelWidth, 0.5*labelHeight+0.5*labelFontSize, true, [], 'center', 'bottom');
				labelData[100] = dPos[0] - 0.5 * labelWidth;
				labelData[101] = dPos[1] - 0.5 * labelHeight;
				resize();			
			}
		} else if (labelCtx !== ctx) {
			var labelCanvas = labelCtx.canvas;
			var labelWidth = labelCanvas.width;
			var labelHeight = labelCanvas.height;
			labelCtx.clearRect(0,0,labelWidth,labelHeight);
		}
		
	} else {
		// points at the end of the arc drawn for the angle
		var abLength = Math.sqrt(Math.pow(bPos[0]-aPos[0],2)+Math.pow(bPos[1]-aPos[1],2));
		var aPos2 = [bPos[0]+(aPos[0]-bPos[0])*radius/abLength, bPos[1]+(aPos[1]-bPos[1])*radius/abLength];
	
		var bcLength = Math.sqrt(Math.pow(bPos[0]-cPos[0],2)+Math.pow(bPos[1]-cPos[1],2));
		var cPos2 = [bPos[0]+(cPos[0]-bPos[0])*radius/bcLength, bPos[1]+(cPos[1]-bPos[1])*radius/bcLength];

		if (labelMeasure == true) {
			var angleDiff2 = angleDiff;
			if (angleType == 'degrees') angleDiff2 = angleDiff2 * 180 / Math.PI; 
			angleDiff2 = roundToNearest(angleDiff2, measureRoundTo);	
			label = [String(angleDiff2)];
			if (angleType == 'degrees') {label = [String(angleDiff2) + String.fromCharCode(0x00B0)]}; 
		}

		// work out label position
		// d is midPoint of ac
		var dAngle = angle1 + 0.5 * angleDiff;
		if (angle1 > angle2) {
			dAngle = (angle1 - 2 * Math.PI) + 0.5 * angleDiff;	
		}
		
		var labelRadiusFactor = 1.5 + 0.11 * (removeTags(label[0]).length - 1);
		var lowerCaseOnly = lowerCaseTest(removeTags(label[0]));
		var lcHeightAdjust = 0;
		if (lowerCaseOnly == true) lcHeightAdjust = labelFontSize / 5;

		if (dAngle < Math.PI/6 || dAngle > 11*Math.PI/6 || (dAngle > 5*Math.PI/6 &&dAngle < 7*Math.PI/6)) {
			labelRadiusFactor = labelRadiusFactor * 0.9;
		} else if (dAngle < Math.PI/4 || dAngle > 7*Math.PI/4 || (dAngle > 3*Math.PI/4 &&dAngle < 5*Math.PI/4)) {
			labelRadiusFactor = labelRadiusFactor * 0.95;
		}
		
		var dPos = [bPos[0] + labelRadiusFactor * labelRadius * Math.cos(dAngle-Math.PI/2), bPos[1] + labelRadiusFactor * labelRadius * Math.sin(dAngle-Math.PI/2) - lcHeightAdjust];
		
		/* draw a dot at dPos (for testing angle label position
		ctx.fillStyle = '#F00';
		ctx.beginPath();
		ctx.arc(dPos[0],dPos[1],8,0,2*Math.PI);
		ctx.closePath();
		ctx.fill();
		//*/

		label.unshift('<<color:'+labelColor+'>><<fontSize:'+labelFontSize+'>><<font:'+labelFont+'>>');
		
		if (fill == true) {
			ctx.fillStyle = fillColor;
			ctx.beginPath();
			ctx.moveTo(bPos[0],bPos[1]);
			ctx.lineTo(aPos2[0],aPos2[1]);
			ctx.arc(bPos[0],bPos[1],radius,angle1-0.5*Math.PI,angle2-0.5*Math.PI);
			ctx.lineTo(cPos2[0],cPos2[1]);
			ctx.closePath();
			ctx.fill();
		}
		
		if (drawCurve == true) {
			ctx.strokeStyle = curveColor;
			ctx.lineWidth = curveWidth;
			if (numOfCurves == 1) {
				ctx.beginPath();
				ctx.moveTo(aPos2[0],aPos2[1]);
				ctx.arc(bPos[0],bPos[1],radius,angle1-0.5*Math.PI,angle2-0.5*Math.PI);
				ctx.stroke();			
			} else if (numOfCurves == 2) {
				ctx.beginPath();
				ctx.arc(bPos[0],bPos[1],radius-curveGap/2,angle1-0.5*Math.PI,angle2-0.5*Math.PI);
				ctx.stroke();							
				ctx.beginPath();
				ctx.arc(bPos[0],bPos[1],radius+curveGap/2,angle1-0.5*Math.PI,angle2-0.5*Math.PI);
				ctx.stroke();							
			} else if (numOfCurves == 3) {
				ctx.beginPath();
				ctx.arc(bPos[0],bPos[1],radius-curveGap,angle1-0.5*Math.PI,angle2-0.5*Math.PI);
				ctx.stroke();							
				ctx.beginPath();
				ctx.arc(bPos[0],bPos[1],radius,angle1-0.5*Math.PI,angle2-0.5*Math.PI);
				ctx.stroke();			
				ctx.beginPath();
				ctx.arc(bPos[0],bPos[1],radius+curveGap,angle1-0.5*Math.PI,angle2-0.5*Math.PI);				
				ctx.stroke();							
			}
		}

		if (drawLines == true) {
			ctx.strokeStyle = lineColor;
			ctx.lineWidth = lineWidth;
			ctx.joinCap = 'round';
			ctx.beginPath();	
			ctx.moveTo(aPos[0],aPos[1]);
			ctx.lineTo(bPos[0],bPos[1]);
			ctx.lineTo(cPos[0],cPos[1]);
			ctx.stroke();
		}		

		if (labelCtx == ctx) {
			//drawMathsText(labelCtx, label, labelFontSize, dPos[0], dPos[1]+0.5*labelFontSize, true, [], 'center', 'bottom');
			text({ctx:labelCtx,left:dPos[0]-200,top:dPos[1]-200,width:400,height:400,textArray:label,align:'center',vertAlign:'middle',box:labelBox,minTightWidth:1,minTightHeight:1});
		} else {
			var labelCanvas = labelCtx.canvas;
			var labelWidth = labelCanvas.width;
			var labelHeight = labelCanvas.height;
			var canvasNum = taskObject[taskId].indexOf(labelCanvas);
			var labelData = taskObjectData[taskId][canvasNum];
			
			labelCtx.clearRect(0,0,labelWidth,labelHeight);
			
			drawMathsText(labelCtx, label, labelFontSize, 0.5*labelWidth, 0.5*labelHeight+0.5*labelFontSize, true, [], 'center', 'bottom');
			labelData[100] = dPos[0] - 0.5 * labelWidth;
			labelData[101] = dPos[1] - 0.5 * labelHeight;
			resize();
					
		}
	}
}
function drawPolygon(obj) {
	// required
	var ctx = obj.ctx;
	var points = obj.points;
	
	// optional
	var fillColor = obj.fillColor || false;
	var lineColor = obj.lineColor || obj.color || false;
	var lineWidth = obj.lineWidth || obj.thickness || false;
	var closed = boolean(obj.closed,true);
	var lineDecoration = obj.lineDecoration || [];
	var angles = obj.angles || [];
	var outerAngles = obj.outerAngles || [];
	var exteriorAngles = obj.exteriorAngles || [];
	var clockwise = boolean(obj.clockwise,true)
	var sf = obj.sf || 1;
	
	//console.log(ctx,points,lineColor,lineWidth,closed);
	
	ctx.save();
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	
	ctx.beginPath();
	
	if (closed == true && fillColor !== false && fillColor !== 'none') {
		ctx.moveTo(points[0][0],points[0][1]);
		for (var i = 1; i < points.length; i++) {
			ctx.lineTo(points[i][0],points[i][1]);
		}
		ctx.closePath();
		ctx.fillStyle = fillColor;
		ctx.fill();
	}
	
	for (var i = 0; i < angles.length; i++) {
		if (typeof angles[i] == 'object' && angles[i] !== null) {
			angles[i].ctx = ctx;
			angles[i].b = points[i];
			if (clockwise == false) {
				angles[i].a = points[(i+1)%(points.length)];
				if (i == 0) {
					angles[i].c = points[points.length-1];
				} else {
					angles[i].c = points[i-1];
				}
			} else {
				angles[i].c = points[(i+1)%(points.length)];
				if (i == 0) {
					angles[i].a = points[points.length-1];
				} else {
					angles[i].a = points[i-1];
				}
			}
			angles[i].drawLines = false;
			if (typeof angles[i].lineWidth == 'undefined') angles[i].lineWidth = ctx.lineWidth;
			if (typeof angles[i].lineColor == 'undefined') angles[i].lineColor = ctx.lineWidth;
			if (typeof angles[i].labelColor == 'undefined') angles[i].labelColor = ctx.strokeStyle;		
			drawAngle(angles[i]);
		}
	}
	
	for (var i = 0; i < outerAngles.length; i++) {
		if (typeof outerAngles[i] == 'object' && outerAngles[i] !== null) {
			outerAngles[i].ctx = ctx;
			outerAngles[i].b = points[i];
			if (clockwise == true) {
				outerAngles[i].a = points[(i+1)%(points.length)];
				if (i == 0) {
					outerAngles[i].c = points[points.length-1];
				} else {
					outerAngles[i].c = points[i-1];
				}
			} else {
				outerAngles[i].c = points[(i+1)%(points.length)];
				if (i == 0) {
					outerAngles[i].a = points[points.length-1];
				} else {
					outerAngles[i].a = points[i-1];
				}
			}
			outerAngles[i].drawLines = false;
			if (typeof outerAngles[i].lineWidth == 'undefined') outerAngles[i].lineWidth = ctx.lineWidth;
			if (typeof outerAngles[i].lineColor == 'undefined') outerAngles[i].lineColor = ctx.lineWidth;
			if (typeof outerAngles[i].labelColor == 'undefined') outerAngles[i].labelColor = ctx.strokeStyle;		
			drawAngle(outerAngles[i]);
		}
	}
	
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';	
	
	if (lineColor !== false) {
		ctx.strokeStyle = lineColor;
	}
	if (lineWidth !== false) {
		ctx.lineWidth = lineWidth;
	}	
	
	for (var i = 0; i < exteriorAngles.length; i++) {
		if (typeof exteriorAngles[i] == 'object') {
			var ext = exteriorAngles[i];
			if (!un(ext.a1) && ext.a1 !== null) {
				ext.a1.ctx = ctx;
				ext.a1.c = points[(i+1)%(points.length)];
				ext.a1.b = points[i];
				ext.a1.a = ext.line2.pos;
				ext.a1.drawLines = false;
				if (un(ext.a1.lineWidth)) ext.a1.lineWidth = ctx.lineWidth;
				if (un(ext.a1.lineColor)) ext.a1.lineColor = ctx.lineWidth;
				if (un(ext.a1.labelColor)) ext.a1.labelColor = ctx.strokeStyle;		
				drawAngle(ext.a1);
			}
			if (!un(ext.a2) && ext.a2 !== null) {
				ext.a2.ctx = ctx;
				ext.a2.c = ext.line2.pos;
				ext.a2.b = points[i];
				ext.a2.a = ext.line1.pos;
				ext.a2.drawLines = false;
				if (un(ext.a2.lineWidth)) ext.a2.lineWidth = ctx.lineWidth;
				if (un(ext.a2.lineColor)) ext.a2.lineColor = ctx.lineWidth;
				if (un(ext.a2.labelColor)) ext.a2.labelColor = ctx.strokeStyle;		
				drawAngle(ext.a2);
			}
			if (!un(ext.a3) && ext.a3 !== null) {
				ext.a3.ctx = ctx;
				ext.a3.c = ext.line1.pos;
				ext.a3.b = points[i];
				if (i > 0) {
					ext.a3.a = points[i-1];
				} else {
					ext.a3.a = points[points.length-1];
				}
				ext.a3.drawLines = false;
				if (un(ext.a3.lineWidth)) ext.a3.lineWidth = ctx.lineWidth;
				if (un(ext.a3.lineColor)) ext.a3.lineColor = ctx.lineWidth;
				if (un(ext.a3.labelColor)) ext.a3.labelColor = ctx.strokeStyle;		
				drawAngle(ext.a3);
			}
			if (boolean(ext.line1.show,false)) {
				ctx.save();
				ctx.moveTo(points[i][0],points[i][1]);
				ctx.lineTo(ext.line1.pos[0],ext.line1.pos[1]);
				ctx.stroke();
				ctx.restore();
			}
			if (boolean(ext.line2.show,false)) {
				ctx.save();
				ctx.moveTo(points[i][0],points[i][1]);
				ctx.lineTo(ext.line2.pos[0],ext.line2.pos[1]);
				ctx.stroke();
				ctx.restore();
			}			
		}
	}		
	
	if (!un(obj.solidType)) {
		if (obj.solidType == 'prism') {
			var prismVector = obj.prismVector || [40,-40];
			var vectorAngle = getVectorAngle(prismVector);
			var points2 = [];
			var points2Vis = [];
			var angles2 = [];
			for (var p = 0; p < points.length; p++) {
				points2[p] = pointAddVector(points[p],prismVector);
				var prev = p - 1;
				if (prev < 0) prev = obj.points.length-1;
				var next = p + 1;
				if (next > obj.points.length -1) next = 0;
				angles2[p] = [
					posToAngle(obj.points[prev][0],obj.points[prev][1],obj.points[p][0],obj.points[p][1]),
					posToAngle(obj.points[next][0],obj.points[next][1],obj.points[p][0],obj.points[p][1])
				];
				if (anglesInOrder(angles2[p][1],vectorAngle,angles2[p][0]) == true) {
					points2Vis[p] = false;
				} else {
					points2Vis[p] = true;
				}				
			}
			if (closed == true && fillColor !== false && fillColor !== 'none') {
				for (var p = 0; p < points.length; p++) { // fill polygons
					var next = (p+1)%(points.length);
					ctx.moveTo(points[p][0],points[p][1]);
					ctx.lineTo(points2[p][0],points2[p][1]);
					ctx.lineTo(points2[next][0],points2[next][1]);
					ctx.lineTo(points[next][0],points[next][1]);
					ctx.closePath();
					ctx.fillStyle = fillColor;
					ctx.fill();
				}
			}
			for (var p = 0; p < points.length; p++) { // draw lines
				ctx.save();
				if (points2Vis[p] == false) ctx.strokeStyle = getShades(ctx.strokeStyle)[12];
				ctx.beginPath();
				ctx.moveTo(points[p][0],points[p][1]);
				ctx.lineTo(points2[p][0],points2[p][1]);
				ctx.stroke();
				ctx.restore();
				ctx.save();
				if (points2Vis[p] == false || points2Vis[(p+1)%(points.length)] == false) ctx.strokeStyle = getShades(ctx.strokeStyle)[12];
				ctx.beginPath();
				ctx.moveTo(points2[p][0],points2[p][1]);
				ctx.lineTo(points2[(p+1)%(points.length)][0],points2[(p+1)%(points.length)][1]);
				ctx.stroke();				
				ctx.restore();
			}
		}
	}
	ctx.beginPath();
	ctx.moveTo(points[0][0],points[0][1]);
	for (var i = 1; i < points.length; i++) {
		ctx.lineTo(points[i][0],points[i][1]);
	}
	if (closed == true) {
		ctx.closePath();
	}
	ctx.stroke();	
	
	for (var i = 0; i < lineDecoration.length; i++) {
		if (typeof lineDecoration[i] == 'object' && lineDecoration[i] !== null) {
			switch (lineDecoration[i].type) {
				case 'dash':
					var dashLength = lineDecoration[i].length || 8*sf;
					var number = lineDecoration[i].number || 1;
					if (number == 1) {
						drawDash(ctx,points[i][0],points[i][1],points[(i+1)%(points.length)][0],points[(i+1)%(points.length)][1],dashLength);
					} else if (number == 2) {
						drawDoubleDash(ctx,points[i][0],points[i][1],points[(i+1)%(points.length)][0],points[(i+1)%(points.length)][1],dashLength);
					}
					break;
				case 'arrow':
					var arrowLength = lineDecoration[i].length || 12*sf;
					var number = lineDecoration[i].number || 1;
					var direction = lineDecoration[i].direction || 1;
					ctx.save();
					if (direction == 1) {
						drawParallelArrow({context:ctx,startX:points[i][0],startY:points[i][1],finX:points[(i+1)%(points.length)][0],finY:points[(i+1)%(points.length)][1],arrowLength:arrowLength,lineWidth:ctx.lineWidth,numOfArrows:number,color:ctx.strokeStyle});
					} else if (direction == -1) {
						drawParallelArrow({context:ctx,finX:points[i][0],finY:points[i][1],startX:points[(i+1)%(points.length)][0],startY:points[(i+1)%(points.length)][1],arrowLength:arrowLength,lineWidth:ctx.lineWidth,numOfArrows:number,color:ctx.strokeStyle});
					}
					ctx.restore();
					break;
				default:
					break;
			};
		}
	}
	
	ctx.restore();
}
function drawRegularPolygon(obj) {
	var ctx = obj.ctx;
	var c = obj.center || obj.c;
	var r = obj.radius || obj.r;
	var p = obj.points || obj.p || 3;
	var s = obj.step || obj.s || 1;
	var startAngle = -Math.PI/2;
	if (typeof obj.startAngle == 'number') startAngle = obj.startAngle;
	var vertices = [];
	for (var i = 0; i < p; i++) {
		var angle = startAngle+i*(2*Math.PI)/p;
		vertices.push([c[0]+r*Math.cos(angle),c[1]+r*Math.sin(angle)]);
	}
	ctx.moveTo(vertices[0][0],vertices[0][1]);
	for (var i = p; i >= 0; i--) {
		ctx.lineTo(vertices[(i*s)%p][0],vertices[(i*s)%p][1]);
	}
}
function drawStar(obj) {
	var ctx = obj.ctx;
	var c = obj.center || obj.c;
	var r = obj.radius || obj.r;
	var p = obj.points || obj.p || 5;
	var s = obj.step || obj.s || 2;
	var vertices = [];
	for (var i = 0; i < p; i++) {
		var angle = -Math.PI/2+i*(2*Math.PI)/p;
		vertices.push([c[0]+r*Math.cos(angle),c[1]+r*Math.sin(angle)]);
	}
	ctx.moveTo(vertices[0][0],vertices[0][1]);
	for (var i = p; i >= 0; i--) {
		ctx.lineTo(vertices[(i*s)%p][0],vertices[(i*s)%p][1]);
	}
}
function drawAnglesAroundPoint(obj) {
	/* eg.
		drawAnglesAroundPoint({
			ctx:ctx1,
			center:[400,300],
			points:[[300,300],[400,200],[450,250],[480,320]],
			lineColor:'#000',
			thickness:4,
			angles:[
				{fill:true,fillColor:"#CFC",lineWidth:2,labelFontSize:25,labelMeasure:true,labelRadius:33,radius:30},
				{fill:false,fillColor:"#CFC",lineWidth:2,labelFontSize:25,labelMeasure:true,labelRadius:33,radius:30},
				{fill:true,fillColor:"#CFC",lineWidth:2,labelFontSize:25,labelMeasure:true,labelRadius:33,radius:30},
				{fill:false,fillColor:"#CFC",lineWidth:2,labelFontSize:25,labelMeasure:true,labelRadius:33,radius:30}
			]
		});	
	*/

	// required
	var ctx = obj.ctx;
	var points = obj.points;
	var center = obj.center;
	
	// optional
	var lineColor = obj.lineColor || obj.color || false;
	var lineWidth = obj.lineWidth || obj.thickness || false;
	var angles = obj.angles || [];
		
	ctx.save();
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	ctx.lineWidth = lineWidth;
	ctx.strokeStye = lineColor;		
		
	for (var i = 0; i < points.length; i++) {
		if (typeof angles[i] == 'object' && angles[i] !== null) {
			angles[i].ctx = ctx;
			angles[i].b = center;
			angles[i].a = points[i];
			if (i == points.length-1) {
				angles[i].c = points[0];
			} else {
				angles[i].c = points[i+1];
			}
			angles[i].drawLines = false;
			if (typeof angles[i].lineWidth == 'undefined') angles[i].lineWidth = ctx.lineWidth;
			if (typeof angles[i].lineColor == 'undefined') angles[i].lineColor = ctx.lineWidth;
			if (typeof angles[i].labelColor == 'undefined') angles[i].labelColor = ctx.strokeStyle;		
			drawAngle(angles[i]);
		}
	}
	
	ctx.lineWidth = lineWidth;
	ctx.strokeStye = lineColor;	
	ctx.beginPath();
	for (var p = 0; p < points.length; p++) {
		ctx.moveTo(center[0],center[1]);
		ctx.lineTo(points[p][0],points[p][1]);
	}
	ctx.stroke();
	ctx.restore();
}
function drawCylinder(obj) {
	var ctx = obj.ctx;
	var pos = obj.pos; // position of centre of base
	var h = obj.h || obj.height;
	var r = obj.r || obj.radius;
	
	var direction  = obj.direction || obj.dir || 'vert'; // 'vert', 'horiz1' or 'horiz2'
	var angle = obj.angle || Math.PI/6; // for 'horiz2' only
	
	var lineWidth = obj.lineWidth || obj.thickness || false;
	var lineColor = obj.lineColor || obj.color || false;
	var lineDash = obj.lineDash || [];

	ctx.save();
	if (lineWidth !== false) ctx.lineWidth = lineWidth;
	if (lineColor !== false) ctx.strokeStyle = lineColor;
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';		

	var transparent = boolean(obj.transparent,true);
	var backLineWidth = obj.lineWidth;
	var backLineColor = obj.backLineWidth || getShades(ctx.strokeStyle)[8];
	var backLineDash = obj.backLineDash || [7,10];	
	
	var fill = boolean(obj.fill,false);
	if (typeof obj.fillColors !== 'undefined') {
		var fillColors = obj.fillColors;
	} else if (typeof obj.fillColor !== 'undefined') {
		var fillColors = [obj.fillColor,obj.fillColor];
	} else {
		var fillColors = ['#FCC','#CFC'];
	}
	
	ctx.translate(pos[0],pos[1]);
	
	if (direction == 'vert') {
		ctx.scale(1,0.4);
		
		// draw back of bottom ellipse
		if (transparent == true && fill == false) {
			ctx.save();
			ctx.lineWidth = backLineWidth;
			ctx.strokeStyle = backLineColor;
			ctx.setLineDash(backLineDash);
			ctx.beginPath();
			ctx.arc(0,0,r,Math.PI,2*Math.PI);
			ctx.stroke();
			ctx.restore();			
		}
		
		// draw front
		ctx.beginPath();
		ctx.moveTo(r,0);
		ctx.arc(0,0,r,0,Math.PI);
		ctx.lineTo(-r,-h/0.4);
		ctx.arc(0,-h/0.4,r,Math.PI,0,true);
		ctx.lineTo(r,0);
		if (fill == true) {
			ctx.fillStyle = fillColors[0];
			ctx.fill();
		}
		ctx.stroke();
		
		// draw top 
		ctx.beginPath();
		ctx.arc(0,-h/0.4,r,0,2*Math.PI);
		if (fill == true && typeof fillColors[1] !== 'undefined' && fillColors[1] !== 'none' && fillColors[1] !== false) {
			ctx.fillStyle = fillColors[1];
			ctx.fill();
		}
		ctx.stroke();
	} else if (direction == 'horiz1') {
		ctx.scale(0.4,1);
		
		// draw back of right ellipse
		if (transparent == true && fill == false) {
			ctx.save();
			ctx.lineWidth = backLineWidth;
			ctx.strokeStyle = backLineColor;
			ctx.setLineDash(backLineDash);
			ctx.beginPath();
			ctx.arc(0,0,r,0.5*Math.PI,1.5*Math.PI);
			ctx.stroke();
			ctx.restore();			
		}
		
		// draw front
		ctx.beginPath();
		ctx.moveTo(0,r);
		ctx.arc(0,0,r,0.5*Math.PI,1.5*Math.PI,true);
		ctx.lineTo(-h/0.4,-r);
		ctx.arc(-h/0.4,0,r,1.5*Math.PI,0.5*Math.PI);
		ctx.lineTo(0,r);
		if (fill == true) {
			ctx.fillStyle = fillColors[0];
			ctx.fill();
		}
		ctx.stroke();
		
		// draw left ellipse
		ctx.beginPath();
		ctx.arc(-h/0.4,0,r,0,2*Math.PI);
		if (fill == true && typeof fillColors[1] !== 'undefined' && fillColors[1] !== 'none' && fillColors[1] !== false) {
			ctx.fillStyle = fillColors[1];
			ctx.fill();
		}
		ctx.stroke();		
	} else if (direction == 'horiz2') {
		var pos2 = [h*Math.cos(angle),-h*Math.sin(angle)];
		var angle1 = Math.PI/2-angle;
		var angle2 = -angle-0.5*Math.PI;
		var a = [r*Math.cos(angle1),r*Math.sin(angle1)];
		var b = [r*Math.cos(angle2),r*Math.sin(angle2)];
		var c = [pos2[0]+r*Math.cos(angle1),pos2[1]+r*Math.sin(angle1)];
		var d = [pos2[0]+r*Math.cos(angle2),pos2[1]+r*Math.sin(angle2)];

		// draw back of right circle
		if (transparent == true && fill == false) {
			ctx.save();
			ctx.lineWidth = backLineWidth;
			ctx.strokeStyle = backLineColor;
			ctx.setLineDash(backLineDash);
			ctx.beginPath();
			ctx.arc(pos2[0],pos2[1],r,angle1,angle2);
			ctx.stroke();
			ctx.restore();			
		}
		
		// front
		ctx.beginPath();
		ctx.moveTo(d[0],d[1]);
		ctx.arc(pos2[0],pos2[1],r,angle2,angle1);
		ctx.lineTo(a[0],a[1]);		
		ctx.arc(0,0,r,angle1,angle2,true);		
		ctx.lineTo(d[0],d[1]);
		if (fill == true) {
			ctx.fillStyle = fillColors[0];
			ctx.fill();
		}		
		ctx.stroke();
		
		// front circle
		ctx.beginPath();
		ctx.arc(0,0,r,0,2*Math.PI);
		if (fill == true && typeof fillColors[1] !== 'undefined' && fillColors[1] !== 'none' && fillColors[1] !== false) {
			ctx.fillStyle = fillColors[1];
			ctx.fill();
		}		
		ctx.stroke();
	}
	
	ctx.restore();
}
function drawCuboid(obj) {
	var ctx = obj.ctx;
	var x = obj.x || obj.pos[0];
	var y = obj.y || obj.pos[1];
	var z = obj.z || obj.pos[2];
	var xd = obj.xd || obj.dims[0];
	var yd = obj.yd || obj.dims[1];
	var zd = obj.zd || obj.dims[2];
	
	var labels = obj.labels;
	var unitBaseVectors = obj.unitBaseVectors || [[Math.sqrt(3)/2,-1/2],[-Math.sqrt(3)/2,-1/2],[0,-1]];
	var unitLength = obj.unitLength || 15;
	var baseVector = obj.baseVector || obj.baseVectors || [[unitLength*unitBaseVectors[0][0],unitLength*unitBaseVectors[0][1]],[unitLength*unitBaseVectors[1][0],unitLength*unitBaseVectors[1][1]],[unitLength*unitBaseVectors[2][0],unitLength*unitBaseVectors[2][1]]];
	var origin = obj.origin || [0,700];
	var mag = obj.mag || 15;

	var lineWidth = obj.lineWidth || obj.thickness || false;
	var lineColor = obj.lineColor || obj.color || false;
	var lineDash = obj.lineDash || [];
	
	var showUnitCubes = boolean(obj.showUnitCubes,false);	

	ctx.save();
	if (lineWidth !== false) ctx.lineWidth = lineWidth;
	if (lineColor !== false) ctx.strokeStyle = lineColor;
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';	
	
	var transparent = boolean(obj.transparent,true);
	var backLineWidth = obj.lineWidth;
	var backLineColor = obj.backLineWidth || getShades(ctx.strokeStyle)[8];
	var backLineDash = obj.backLineDash || [7,10];

	var fill = boolean(obj.fill,false);
	if (typeof obj.fillColors !== 'undefined') {
		var fillColors = obj.fillColors
	} else if (typeof obj.fillColor !== 'undefined') {
		var fillColors = [obj.fillColor,obj.fillColor,obj.fillColor];
	} else {
		var fillColors = ['#FCC','#CFC','#CCF'];
	}
	
	var cuboid = [[x,y,z],[x+xd,y,z],[x+xd,y+yd,z],[x,y+yd,z],[x,y,z+zd],[x+xd,y,z+zd],[x+xd,y+yd,z+zd],[x,y+yd,z+zd]];	
	var cuboidPos = [];
	for (var v = 0; v < cuboid.length; v++) {
		cuboidPos[v] = [];
		
		cuboidPos[v][0] = origin[0];
		cuboidPos[v][0] += cuboid[v][0] * baseVector[0][0];
		cuboidPos[v][0] += cuboid[v][1] * baseVector[1][0];
		cuboidPos[v][0] += cuboid[v][2] * baseVector[2][0];
		
		cuboidPos[v][1] = origin[1];
		cuboidPos[v][1] += cuboid[v][0] * baseVector[0][1];
		cuboidPos[v][1] += cuboid[v][1] * baseVector[1][1];
		cuboidPos[v][1] += cuboid[v][2] * baseVector[2][1];		
	}
		
	if (fill == true) {
		ctx.fillStyle = fillColors[0];	
		if (baseVector[0][0]*baseVector[2][1]-baseVector[0][1]*baseVector[2][0] > 0) {
			ctx.beginPath();
			ctx.moveTo(cuboidPos[3][0], cuboidPos[3][1]);
			ctx.lineTo(cuboidPos[2][0], cuboidPos[2][1]);
			ctx.lineTo(cuboidPos[6][0], cuboidPos[6][1]);
			ctx.lineTo(cuboidPos[7][0], cuboidPos[7][1]);
			ctx.lineTo(cuboidPos[3][0], cuboidPos[3][1]);
			ctx.closePath();	
			ctx.fill();
			ctx.stroke();
		} else {
			ctx.beginPath();
			ctx.moveTo(cuboidPos[0][0], cuboidPos[0][1]);
			ctx.lineTo(cuboidPos[1][0], cuboidPos[1][1]);
			ctx.lineTo(cuboidPos[5][0], cuboidPos[5][1]);
			ctx.lineTo(cuboidPos[4][0], cuboidPos[4][1]);
			ctx.lineTo(cuboidPos[0][0], cuboidPos[0][1]);
			ctx.closePath();	
			ctx.fill();
			ctx.stroke();
		}

		ctx.fillStyle = fillColors[1];	
		if (baseVector[0][0]*baseVector[1][1]-baseVector[0][1]*baseVector[1][0] > 0) {
			ctx.beginPath();
			ctx.moveTo(cuboidPos[0][0], cuboidPos[0][1]);
			ctx.lineTo(cuboidPos[1][0], cuboidPos[1][1]);
			ctx.lineTo(cuboidPos[2][0], cuboidPos[2][1]);
			ctx.lineTo(cuboidPos[3][0], cuboidPos[3][1]);
			ctx.lineTo(cuboidPos[0][0], cuboidPos[0][1]);
			ctx.closePath();	
			ctx.fill();
			ctx.stroke();		
		} else {
			ctx.beginPath();
			ctx.moveTo(cuboidPos[4][0], cuboidPos[4][1]);
			ctx.lineTo(cuboidPos[5][0], cuboidPos[5][1]);
			ctx.lineTo(cuboidPos[6][0], cuboidPos[6][1]);
			ctx.lineTo(cuboidPos[7][0], cuboidPos[7][1]);
			ctx.lineTo(cuboidPos[4][0], cuboidPos[4][1]);
			ctx.closePath();	
			ctx.fill();
			ctx.stroke();
		}

		ctx.fillStyle = fillColors[2];
		if (baseVector[2][0]*baseVector[1][1]-baseVector[2][1]*baseVector[1][0] > 0) {
			ctx.beginPath();
			ctx.moveTo(cuboidPos[2][0], cuboidPos[2][1]);
			ctx.lineTo(cuboidPos[1][0], cuboidPos[1][1]);
			ctx.lineTo(cuboidPos[5][0], cuboidPos[5][1]);
			ctx.lineTo(cuboidPos[6][0], cuboidPos[6][1]);
			ctx.lineTo(cuboidPos[2][0], cuboidPos[2][1]);
			ctx.closePath();	
			ctx.fill();
			ctx.stroke();		
		} else {
			ctx.beginPath();
			ctx.moveTo(cuboidPos[0][0], cuboidPos[0][1]);
			ctx.lineTo(cuboidPos[3][0], cuboidPos[3][1]);
			ctx.lineTo(cuboidPos[7][0], cuboidPos[7][1]);
			ctx.lineTo(cuboidPos[4][0], cuboidPos[4][1]);
			ctx.lineTo(cuboidPos[0][0], cuboidPos[0][1]);
			ctx.closePath();	
			ctx.fill();
			ctx.stroke();		
		}
	}
	
	if (fill == false && transparent == true) {
		ctx.save();
		ctx.lineWidth = backLineWidth;
		ctx.strokeStyle = backLineColor;
		ctx.setLineDash(backLineDash);
		ctx.beginPath();
		ctx.moveTo(cuboidPos[1][0],cuboidPos[1][1]);
		ctx.lineTo(cuboidPos[2][0],cuboidPos[2][1]);
		ctx.moveTo(cuboidPos[2][0],cuboidPos[2][1]);
		ctx.lineTo(cuboidPos[3][0],cuboidPos[3][1]);
		ctx.moveTo(cuboidPos[2][0],cuboidPos[2][1]);
		ctx.lineTo(cuboidPos[6][0],cuboidPos[6][1]);
		ctx.stroke();
		ctx.restore();
	}
	
	ctx.beginPath();
	//base
	ctx.moveTo(cuboidPos[0][0], cuboidPos[0][1]);
	ctx.lineTo(cuboidPos[1][0], cuboidPos[1][1]);
	ctx.moveTo(cuboidPos[0][0], cuboidPos[0][1]);
	ctx.lineTo(cuboidPos[3][0], cuboidPos[3][1]);	
	//sides
	ctx.moveTo(cuboidPos[0][0], cuboidPos[0][1]);
	ctx.lineTo(cuboidPos[4][0], cuboidPos[4][1]);
	ctx.moveTo(cuboidPos[1][0], cuboidPos[1][1]);
	ctx.lineTo(cuboidPos[5][0], cuboidPos[5][1]);	
	ctx.moveTo(cuboidPos[3][0], cuboidPos[3][1]);
	ctx.lineTo(cuboidPos[7][0], cuboidPos[7][1]);
	//top
	ctx.moveTo(cuboidPos[4][0], cuboidPos[4][1]);
	ctx.lineTo(cuboidPos[5][0], cuboidPos[5][1]);
	ctx.lineTo(cuboidPos[6][0], cuboidPos[6][1]);
	ctx.lineTo(cuboidPos[7][0], cuboidPos[7][1]);
	ctx.lineTo(cuboidPos[4][0], cuboidPos[4][1]);
	ctx.closePath();
	ctx.stroke();

	/*
	ctx.fillStyle = '#FFC';
	ctx.fillRect(0.5*(cuboidPos[0][0]+cuboidPos[1][0])+8,0.5*(cuboidPos[0][1]+cuboidPos[1][1])-5,19,40);
	ctx.fillRect(0.5*(cuboidPos[0][0]+cuboidPos[3][0])-8,0.5*(cuboidPos[0][1]+cuboidPos[3][1])-5,-19,40);
	ctx.fillRect(0.5*(cuboidPos[3][0]+cuboidPos[7][0])-8,0.5*(cuboidPos[3][1]+cuboidPos[7][1])-5,-79,40);
	*/

	if (showUnitCubes == true) {
		ctx.beginPath();
		
		for (var i = 1; i < xd; i++) {
			var pos1 = interpolateTwoPoints(cuboidPos[0],cuboidPos[1],i/xd);
			var pos2 = interpolateTwoPoints(cuboidPos[4],cuboidPos[5],i/xd);
			ctx.moveTo(pos1[0],pos1[1]);
			ctx.lineTo(pos2[0],pos2[1]);
			
			var pos1 = interpolateTwoPoints(cuboidPos[4],cuboidPos[5],i/xd);
			var pos2 = interpolateTwoPoints(cuboidPos[7],cuboidPos[6],i/xd);
			ctx.moveTo(pos1[0],pos1[1]);
			ctx.lineTo(pos2[0],pos2[1]);			
		}

		for (var i = 1; i < yd; i++) {
			var pos1 = interpolateTwoPoints(cuboidPos[3],cuboidPos[0],i/yd);
			var pos2 = interpolateTwoPoints(cuboidPos[7],cuboidPos[4],i/yd);
			ctx.moveTo(pos1[0],pos1[1]);
			ctx.lineTo(pos2[0],pos2[1]);
			
			var pos1 = interpolateTwoPoints(cuboidPos[6],cuboidPos[5],i/yd);
			var pos2 = interpolateTwoPoints(cuboidPos[7],cuboidPos[4],i/yd);
			ctx.moveTo(pos1[0],pos1[1]);
			ctx.lineTo(pos2[0],pos2[1]);			
		}

		for (var i = 1; i < zd; i++) {
			var pos1 = interpolateTwoPoints(cuboidPos[0],cuboidPos[4],i/zd);
			var pos2 = interpolateTwoPoints(cuboidPos[1],cuboidPos[5],i/zd);
			ctx.moveTo(pos1[0],pos1[1]);
			ctx.lineTo(pos2[0],pos2[1]);
			
			var pos1 = interpolateTwoPoints(cuboidPos[0],cuboidPos[4],i/zd);
			var pos2 = interpolateTwoPoints(cuboidPos[3],cuboidPos[7],i/zd);
			ctx.moveTo(pos1[0],pos1[1]);
			ctx.lineTo(pos2[0],pos2[1]);			
		}		
		
		ctx.stroke();
	}	
	
	if (typeof labels !== 'undefined') {
		text({
			ctx:ctx,
			left:0.5*(cuboidPos[0][0]+cuboidPos[1][0])+10,
			top:0.5*(cuboidPos[0][1]+cuboidPos[1][1])-5,
			width:200,
			textArray:labels[0]
		});
		
		text({
			ctx:ctx,
			left:0.5*(cuboidPos[0][0]+cuboidPos[3][0])-210,
			top:0.5*(cuboidPos[0][1]+cuboidPos[3][1])-5,
			width:200,
			align:'right',
			textArray:labels[1]
		});	

		text({
			ctx:ctx,
			left:0.5*(cuboidPos[3][0]+cuboidPos[7][0])-210,
			top:0.5*(cuboidPos[3][1]+cuboidPos[7][1])-5,
			width:200,
			align:'right',
			textArray:labels[2]
		});
	}
	ctx.restore();
}
function drawTreeDiagram(obj) {
	var ctx = obj.ctx;
	var left = obj.left;
	var top = obj.top;
	var width = obj.width;
	var height = obj.height;
	var branches = obj.branches || [2,2];
	
	/*
	var endLabelFontSize = obj.endLabelFontSize || obj.fontSize || width/20;
	var midLabelFontSize = obj.midLabelFontSize || obj.fontSize || width/20
	var labels = obj.labels || [[['win','lose']],[['win','lose],['win','lose']]];
	var probabilities = obj.probabilities || [[[[1,2],[1,2]]],[[[1,3],[2,3]],[[3,4],[1,4]]]];
	var branchColors = obj.branchColors || [[['#000','#000']],[[['#F00','#00F'],['#000','#000']]]];
	var endLabelColors = obj.endLabelColors || [[['#000','#000']],[[['#F00','#00F'],['#000','#000']]]];
	var midLabelColors = obj.midLabelColors || [[['#000','#000']],[[['#F00','#00F'],['#000','#000']]]];
	var branchLineWidths = obj.branchLineWidths || [[[3]],[[3,3],[3,3]]];
	*/
	
	var labels = obj.labels || [['<<fontSize:30>>win'],['<<fontSize:30>>draw'],['<<fontSize:30>>lose']]
	var probabilities = obj.probabilities || [['<<fontSize:30>>',['frac',['1'],['4']]],['<<fontSize:30>>',['frac',['1'],['2']]],['<<fontSize:30>>',['frac',['1'],['4']]]];
	
	var hiddenCanvas = document.createElement('canvas');
	var ctx2 = hiddenCanvas.getContext('2d');	
	var labelTightRects = [];
	var maxLabelWidth = 0;
	for (var i = 0; i < labels.length; i++) {
		labelTightRects[i] = text({ctx:ctx2,textArray:labels[i],measureOnly:true}).tightRect;
		maxLabelWidth = Math.max(maxLabelWidth,labelTightRects[i][2]+15);
	}
	
	var branchWidth = (width-maxLabelWidth*branches.length)/branches.length; 
	
	ctx.save();
	ctx.lineWidth = 3;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	
	for (var i = 0; i < branches.length; i++) { // each vertical set of branches
		var forkPoints = 1;
		if (i > 0) {
			for (var j = 0; j < i; j++) {
				forkPoints = forkPoints * branches[j];
			}
		}
		var startX = left + i * branchWidth + i * maxLabelWidth;
		var finX = startX + branchWidth;
		var h = height / forkPoints; // height of surrouding rect for this fork point;
		for (var j = 0; j < forkPoints; j++) {
			var t = top + j * h;
			var startY = t + 0.5 * h;
			for (var k = 0; k < branches[i]; k++) { // each branch emanating from the fork point
				if (branches[i] == 2) {
					var finY = t + ((2*k+1)/4) * h;
				} else if (branches[i] == 3) {
					var finY = t + ((2*k+1)/6) * h;
				}
				//draw branch
				ctx.beginPath();	
				ctx.moveTo(startX,startY);
				ctx.lineTo(finX,finY);
				ctx.stroke();
				//draw endLabel
				text({ctx:ctx,textArray:labels[k],left:finX,top:finY-labelTightRects[k][3]/2,width:maxLabelWidth,height:labelTightRects[k][3],align:'center',horizAlign:'middle',box:{type:'none',borderColor:'#00F',padding:0.001}});
				//draw midLabel
				var prob = probabilities[k];
				var measure = text({ctx:ctx2,textArray:prob,measureOnly:true}).tightRect;
				var l2 = (startX+finX)/2-measure[2]/2;
				if (k < branches[i]-1) {
					var t2 = (startY+finY)/2-measure[3]*1.1;
				} else {
					var t2 = (startY+finY)/2;;
				}
				text({ctx:ctx,textArray:prob,left:l2,top:t2,width:measure[2],height:measure[3],align:'center',horizAlign:'middle',box:{type:'none',borderColor:'#F00',padding:0.001}});
			}
		}
	}
	ctx.restore();
}
function drawSpinner(context,center,radius,sectorAngles,sectorColors,arrowAngle,showArrow) {
	if (typeof arrowAngle == 'undefined') arrowAngle = -Math.PI/4;
	var show = boolean(showArrow,true);
	
	//work out angles in radians;
	var vals = [];
	var total = 0;
	for (var val = 0; val < sectorAngles.length; val++) {
		total += sectorAngles[val];
	}
	var angles = [0]; // cumulative angle array
	for (var val = 0; val < sectorAngles.length; val++) {
		angles.push(angles[val]+(sectorAngles[val]/total)*2*Math.PI);
	}
	
	context.lineWidth = 4;
	context.strokeStyle = '#000';
	for (var val = 0; val < sectorAngles.length; val++) {
		// draw a sector
		context.fillStyle = sectorColors[val];
		context.beginPath();
		context.moveTo(center[0],center[1]);
		context.arc(center[0],center[1],radius,angles[val],angles[val+1]);
		context.lineTo(center[0],center[1]);
		context.closePath();
		context.fill();
		context.stroke();
	}
	
	if (show == true) {
		context.strokeStyle = "#000";
		context.lineWidth = 4;
		context.beginPath();
		context.moveTo(center[0],center[1]);
		context.lineTo(center[0]+0.75*radius*Math.cos(arrowAngle),center[1]+0.75*radius*Math.sin(arrowAngle));
		context.stroke();
		drawArrow({context:context,startX:center[0],startY:center[1],finX:center[0]+0.75*radius*Math.cos(arrowAngle),finY:center[1]+0.75*radius*Math.sin(arrowAngle),arrowLength:13,color:"#000000",lineWidth:4,arrowLineWidth:4,fillArrow:true});
		context.fillStyle = "#000";
		context.beginPath();
		context.arc(center[0],center[1],5,0,2*Math.PI);
		context.fill();
	}
}
function vennDiagram(obj) {
	var ctx = obj.ctx;
	var l = obj.left || obj.l || 0;
	var t = obj.top || obj.t || 0;
	var w = obj.width || obj.w || 400;
	var h = obj.height || obj.h || w*0.65;
	var radius = obj.radius || obj.r || w*0.25;
	var centerA = obj.centerA || [l+w*0.35,t+h/2];
	var centerB = obj.centerB || [l+w*0.65,t+h/2];
	var lineWidth = obj.lineWidth || 4;
	var lineDash = obj.lineDash || [];
	var strokeStyle = obj.strokeStyle || '#000';
	var colorA = obj.colorA || strokeStyle;
	var colorB = obj.colorB || strokeStyle;
	var labelA = obj.labelA || ['<<fontSize:'+(w/12)+'>>A'];
	var labelB = obj.labelB || ['<<fontSize:'+(w/12)+'>>B'];
	var fillStyle = obj.fillStyle || '#FCF';
	var shade = obj.shade || [false,false,false,false];
	
	ctx.save();
	if (typeof ctx.setLineDash == 'undefined') ctx.setLineDash = function(){};
	ctx.setLineDash(lineDash);
	ctx.strokeStyle = strokeStyle;
	ctx.lineWidth = lineWidth;
	ctx.strokeRect(l,t,w,h);
	
	ctx.beginPath();
	ctx.strokeStyle = colorA;	
	ctx.arc(centerA[0],centerA[1],radius,0,2*Math.PI);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.strokeStyle = colorB;
	ctx.arc(centerB[0],centerB[1],radius,0,2*Math.PI);
	ctx.stroke();	

	var xy = [centerA[0]-(radius*1.25)*Math.cos(Math.PI/4),centerA[1]-(radius*1.25)*Math.cos(Math.PI/4)];
	text({ctx:ctx,textArray:labelA,left:xy[0]-100,width:200,top:xy[1]-100,height:200,textAlign:'center',vertAlign:'middle',padding:0.1,/*box:{type:'tight',color:mainCanvasFillStyle,borderColor:mainCanvasFillStyle}*/});

	var xy = [centerB[0]+(radius*1.25)*Math.cos(Math.PI/4),centerB[1]-(radius*1.25)*Math.cos(Math.PI/4)];
	text({ctx:ctx,textArray:labelB,left:xy[0]-100,width:200,top:xy[1]-100,height:200,textAlign:'center',vertAlign:'middle',padding:0.1,/*box:{type:'tight',color:mainCanvasFillStyle,borderColor:mainCanvasFillStyle}*/});
	
	ctx.restore();
	
	return {ctx:ctx,left:l,top:t,width:w,height:h,radius:radius,centerA:centerA,centerB:centerB,lineWidth:lineWidth,lineDash:lineDash,strokeStyle:strokeStyle,labelA:labelA,labelB:labelB,fillStyle:fillStyle,shade:shade};
}
function vennDiagram3(obj) {
	var ctx = obj.ctx;
	var l = obj.left || obj.l || 0;
	var t = obj.top || obj.t || 0;
	var w = obj.width || obj.w || 400;
	var h = obj.height || obj.h || w;
	var radius = obj.radius || obj.r || w*0.27;
	var centerA = obj.centerA || [l+w*0.5+0.6*radius*Math.cos(Math.PI*(1/2+2/3)),t+h*0.47+0.6*radius*Math.sin(Math.PI*(1/2+2/3))];
	var centerB = obj.centerB || [l+w*0.5+0.6*radius*Math.cos(Math.PI*(1/2+4/3)),t+h*0.47+0.6*radius*Math.sin(Math.PI*(1/2+4/3))];
	var centerC = obj.centerC || [l+w*0.5+0.6*radius*Math.cos(Math.PI*(1/2)),t+h*0.47+0.6*radius*Math.sin(Math.PI*(1/2))];
	var lineWidth = obj.lineWidth || 4;
	var lineDash = obj.lineDash || [];
	var strokeStyle = obj.strokeStyle || '#000';
	var colorA = obj.colorA || strokeStyle;
	var colorB = obj.colorB || strokeStyle;
	var colorC = obj.colorC || strokeStyle;	
	var labelA = obj.labelA || ['<<fontSize:'+(w/10)+'>>A'];
	var labelB = obj.labelB || ['<<fontSize:'+(w/10)+'>>B'];
	var labelC = obj.labelC || ['<<fontSize:'+(w/10)+'>>C'];
	var fillStyle = obj.fillStyle || '#FCF';
	var shade = obj.shade || [false,false,false,false,false,false,false,false];
	
	ctx.save();
	if (typeof ctx.setLineDash == 'undefined') ctx.setLineDash = function(){};
	ctx.setLineDash(lineDash);
	ctx.strokeStyle = strokeStyle;
	ctx.lineWidth = lineWidth;
	ctx.strokeRect(l,t,w,h);
	
	ctx.beginPath();
	ctx.strokeStyle = colorA;	
	ctx.arc(centerA[0],centerA[1],radius,0,2*Math.PI);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.strokeStyle = colorB;
	ctx.arc(centerB[0],centerB[1],radius,0,2*Math.PI);
	ctx.stroke();

	ctx.beginPath();
	ctx.strokeStyle = colorC;
	ctx.arc(centerC[0],centerC[1],radius,0,2*Math.PI);
	ctx.stroke();	

	var xy = [centerA[0]-(radius*1.25)*Math.cos(Math.PI/4),centerA[1]-(radius*1.25)*Math.cos(Math.PI/4)];
	text({ctx:ctx,textArray:labelA,left:xy[0]-100,width:200,top:xy[1]-100,height:200,textAlign:'center',vertAlign:'middle',padding:0.1,/*box:{type:'tight',color:mainCanvasFillStyle,borderColor:mainCanvasFillStyle}*/});

	var xy = [centerB[0]+(radius*1.25)*Math.cos(Math.PI/4),centerB[1]-(radius*1.25)*Math.cos(Math.PI/4)];
	text({ctx:ctx,textArray:labelB,left:xy[0]-100,width:200,top:xy[1]-100,height:200,textAlign:'center',vertAlign:'middle',padding:0.1,/*box:{type:'tight',color:mainCanvasFillStyle,borderColor:mainCanvasFillStyle}*/});
	
	var xy = [centerC[0]+(radius*1.25)*Math.cos(Math.PI/4),centerC[1]+(radius*1.25)*Math.cos(Math.PI/4)];
	text({ctx:ctx,textArray:labelC,left:xy[0]-100,width:200,top:xy[1]-100,height:200,textAlign:'center',vertAlign:'middle',padding:0.1,/*box:{type:'tight',color:mainCanvasFillStyle,borderColor:mainCanvasFillStyle}*/});	
	
	ctx.restore();
	
	return {ctx:ctx,left:l,top:t,width:w,height:h,radius:radius,centerA:centerA,centerB:centerB,centerC:centerC,lineWidth:lineWidth,lineDash:lineDash,strokeStyle:strokeStyle,labelA:labelA,labelB:labelB,labelC:labelC,fillStyle:fillStyle,shade:shade};
}
function drawIsometricDotty(object) {
	// required
	var ctx = object.ctx || object.context;
	
	// options
	var left = object.left || object.l || 0;
	var top = object.top || object.t || 100;
	var width = object.width || object.w || 1200;
	var height = object.height || object.h || 700;
	var spacingFactor = object.spacingFactor || 15;
	var color = object.color || '#AAA';
	var origin = object.origin || [left+0.5*width,top+0.5*height];
	var radius = object.radius || 5;
	
	var baseVector = [[5*(Math.sqrt(3)/2),-5*(1/2)],[-5*(Math.sqrt(3)/2),-5*(1/2)],[0,-5]];
	var points = [];
	var x, y;
	
	for (var i = 0; i < 2; i++) {
		x = origin[0];
		y = origin[1];
		while (x >= left && y >= top && x <= left + width && y <= top + height) {
			points.push([x,y]);
			x += spacingFactor * baseVector[i][0];
			y += spacingFactor * baseVector[i][1];
		}
	}
	
	for (var i = 0, lim = points.length; i < lim; i++) {
		x = points[i][0];
		y = points[i][1];
		while (x >= left && y >= top && x <= left + width && y <= top + height) {
			points.push([x,y]);
			x += spacingFactor * baseVector[2][0];
			y += spacingFactor * baseVector[2][1];
		}
		x = points[i][0];
		y = points[i][1];
		while (x >= left && y >= top && x <= left + width && y <= top + height) {
			points.push([x,y]);
			x -= spacingFactor * baseVector[2][0];
			y -= spacingFactor * baseVector[2][1];
		}
	}
	
	// remove out-of-range and duplicate points
	for (var i = points.length - 1; i >= 0; i--) {
		for (var j = i - 1; j >= 0; j--) {
			if (arraysEqual(points[i],points[j]) == true) {
				points.splice(i,1);
				break;
			}
		}
	}
	
	ctx.save();
	ctx.fillStyle = color;
	for (var i = 0; i < points.length; i++) {
		ctx.beginPath();
		ctx.arc(points[i][0],points[i][1],radius,0,2*Math.PI);
		ctx.fill();	
	}
	ctx.restore();
	return points;
}
function drawSquareDotty(object) {
	// required
	var ctx = object.ctx || object.context;
	
	// options
	var left = object.left || object.l || 0;
	var top = object.top || object.t || 100;
	var width = object.width || object.w || 1200;
	var height = object.height || object.h || 700;
	var spacingFactor = object.spacingFactor || 80;
	var color = object.color || '#AAA';
	var origin = object.origin || [left+0.5*width,top+0.5*height];
	var radius = object.radius || 5;
	
	var points = [];
	var x, y;
	
	x = origin[0];
	y = origin[1];
	while (x >= left && y >= top && x <= left + width && y <= top + height) {
		points.push([x,y]);
		x += spacingFactor;
	}
	
	x = origin[0] - spacingFactor;
	while (x >= left && y >= top && x <= left + width && y <= top + height) {
		points.push([x,y]);
		x -= spacingFactor;
	}	
	
	for (var i = 0, lim = points.length; i < lim; i++) {
		x = points[i][0];
		y = points[i][1] + spacingFactor;
		while (x >= left && y >= top && x <= left + width && y <= top + height) {
			points.push([x,y]);
			y += spacingFactor;
		}
		y = points[i][1] - spacingFactor;
		while (x >= left && y >= top && x <= left + width && y <= top + height) {
			points.push([x,y]);
			y -= spacingFactor;
		}	}
	
	// remove duplicate points
	for (var i = points.length - 1; i >= 0; i--) {
		for (var j = i - 1; j >= 0; j--) {
			if (arraysEqual(points[i],points[j]) == true) {
				points.splice(i,1);
				break;
			}
		}
	}
	
	ctx.save();
	ctx.fillStyle = color;
	for (var i = 0; i < points.length; i++) {
		ctx.beginPath();
		ctx.arc(points[i][0],points[i][1],radius,0,2*Math.PI);
		ctx.fill();	
	}
	ctx.restore();
	return points;
}
function drawNumberLine(object) {
	var context = object.context;
	var left = object.left;
	var top = object.top;
	var width = object.width;
	var height = object.height;	
	var min = object.min;
	var max = object.max;
	var majorStep = object.majorStep;
	var minorStep = object.minorStep;
	
	var minorYPos = [0.5,0.75];
	if (typeof object.minorYPos == 'object') minorYPos = object.minorYPos;
	var majorYPos = [0.25,0.75];
	if (typeof object.majorYPos == 'object') majorYPos = object.majorYPos;
	var minorWidth = object.minorWidth || 1.2;
	var majorWidth = object.majorWidth || 2;
	var minorColor = object.minorColor || '#CCC';
	var majorColor = object.majorColor || '#000';
	var lineWidth = object.lineWidth || 4;
	var lineColor = object.lineColor || '#000';

	var autoLabel = boolean(object.autoLabel,true);
	var labels = object.labels;
	var font = object.font || 'Arial';
	var fontSize = object.fontSize || 24;
	var textColor = object.textColor || majorColor;
	
	var minorSpacing = (width * minorStep) / (max - min);
	var majorSpacing = (width * majorStep) / (max - min);	

	// draw minor markings
	context.strokeStyle = minorColor;
	context.lineWidth = minorWidth;
	context.beginPath();
	var startValue = Math.abs(min % minorStep);
	var axisPos = left + startValue * minorSpacing;	
	while (axisPos <= left + width) {
		context.moveTo(axisPos, top + minorYPos[0] * height);
		context.lineTo(axisPos, top + minorYPos[1] * height);
		axisPos += minorSpacing;
	}
	context.stroke();
	// draw major markings	
	context.strokeStyle = majorColor;
	context.lineWidth = majorWidth;
	var startValue = Math.abs(min % majorStep);
	var axisPos = left + startValue * majorSpacing;
	var num = min + startValue;
	var count = 0;
	while (axisPos <= left + width) {
		context.moveTo(axisPos, top + majorYPos[0] * height);
		context.lineTo(axisPos, top + majorYPos[1] * height);
		if (autoLabel == true) {
			text({
				context:context,
				left:axisPos-100,
				width:200,
				top:top+0.75*height,
				textArray:['<<align:center>><<font:'+font+'>><<fontSize:'+fontSize+'>><<color:'+textColor+'>>'+num]
			})
		} else if (typeof labels == 'object' && typeof labels[count] !== 'undefined') {
			text({
				context:context,
				left:axisPos-100,
				width:200,
				top:top+0.75*height,
				textArray:['<<align:center>><<font:'+font+'>><<fontSize:'+fontSize+'>><<color:'+textColor+'>>'+labels[count]]
			})			
		}
		count++;
		num += majorStep;
		axisPos += majorSpacing;
	}
	context.stroke();
	context.strokeStyle = lineColor;
	context.lineWidth = lineWidth;
	context.moveTo(left,top+0.5*height);
	context.lineTo(left+width,top+0.5*height);	
	context.stroke();
}
function isPointBetweenAngles(center,p1,p2,p3,cw) {
	var a1 = posToAngle(p1[0],p1[1],center[0],center[1]);
	var a2 = posToAngle(p2[0],p2[1],center[0],center[1]);
	var a3 = posToAngle(p3[0],p3[1],center[0],center[1]);
	if (anglesInOrder(a1,a2,a3),cw) {
		return false;
	} else {
		return true;
	}	
}
function anglesInOrder(a1,a2,a3,cw) { // test if three angles are in order
	if (boolean(cw,true) == true) {
		if ((a1 <= a2 && a2 <= a3) || //123
			(a2 <= a3 && a3 <= a1) || //231
			(a3 <= a1 && a1 <= a2)) { //312
			return true;
		} else {
			return false;
		}
	} else {
		if ((a3 <= a2 && a2 <= a1) || //321
			(a2 <= a1 && a1 <= a3) || //213
			(a1 <= a3 && a3 <= a2)) { //132
			return true;
		} else {
			return false;
		}
	}
}

function roundedRect(context, left, top, width, height, roundingSize, lineThickness, lineColor, fillColor, dash) {
	context.save();
	if (lineThickness) {context.lineWidth = lineThickness};
	if (lineColor) {context.strokeStyle = lineColor};
	if (fillColor) {context.fillStyle = fillColor};
	if (typeof dash == 'undefined') dash = [];
	if (typeof dash == 'object') {
		if (!context.setLineDash) {context.setLineDash = function () {}}
		context.setLineDash(dash);
	}
	context.beginPath();
	context.moveTo(left + roundingSize, top);
	context.lineTo(left + width - roundingSize, top);
	context.arc(left + width - roundingSize, top + roundingSize, roundingSize, 1.5 * Math.PI, 2 * Math.PI);
	context.lineTo(left + width, top + height - roundingSize);
	context.arc(left + width - roundingSize, top + height - roundingSize, roundingSize, 0, 0.5 * Math.PI);
	context.lineTo(left + roundingSize, top + height);
	context.arc(left + roundingSize, top + height - roundingSize, roundingSize, 0.5 * Math.PI, Math.PI);	
	context.lineTo(left, top + roundingSize);
	context.arc(left + roundingSize, top + roundingSize, roundingSize, Math.PI, 1.5 * Math.PI);
	context.closePath();
	context.stroke();
	if (typeof fillColor == 'string' && fillColor !== 'none') {context.fill()};
	context.restore();
}
function drawPath(object) {
	var ctx = object.ctx;
	var path = object.path;
	ctx.save();
	if (typeof object.lineColor !== 'undefined') {ctx.strokeStyle = object.lineColor};
	if (typeof object.lineWidth !== 'undefined') {ctx.lineWidth = object.lineWidth};
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.beginPath();
	ctx.moveTo(path[0][0],path[0][1]);
	for (var i = 1; i < path.length; i++) {
		ctx.lineTo(path[i][0],path[i][1]);
	}
	if (typeof object.fillColor !== 'undefined' || object.closed == true) {ctx.closePath()};	
	if (typeof object.fillColor !== 'undefined') {
		ctx.fillStyle = object.fillColor;
		ctx.fill();
	}
	ctx.stroke();
	ctx.restore();
}
function dashedLine(object) {
	var context = object.context;
	var startX = object.startX;
	var startY = object.startY;
	var finX = object.finX;
	var finY = object.finY;
	
	if (startX > finX) {
		var x1 = startX;
		var y1 = startY;
		var x2 = finX;
		var y2 = finY;
		startX = x2;
		startY = y2;
		finX  = x1;
		finY = y1;			
	}
	
	var dashSize = object.dashSize || 20;
	var gapSize = object.gapSize || 10;
	var color = object.color || '#000';
	var lineWidth = object.lineWidth || 2;
	
	var totalLength = Math.sqrt(Math.pow((finX - startX),2)+Math.pow((finY-startY),2));
	var numOfIncs = totalLength / (dashSize + gapSize);
	
	var dx = (finX - startX) / numOfIncs;
	var dxDash = dx * dashSize / (dashSize + gapSize);
	var dxGap = dx * gapSize / (dashSize + gapSize);

	var dy = (finY - startY) / numOfIncs;
	var dyDash = dy * dashSize / (dashSize + gapSize);
	var dyGap = dy * gapSize / (dashSize + gapSize);
	
	var xPos = startX;
	var yPos = startY;
	var incCount = 0;
	
	context.save();
	context.strokeStyle = color;
	context.lineWidth = lineWidth;
	context.beginPath();
	do {
		context.moveTo(xPos,yPos);
		xPos += dxDash;
		yPos += dyDash;
		context.lineTo(xPos,yPos);
		xPos += dxGap;
		yPos += dyGap;
		incCount++;
	} while (incCount <= numOfIncs - 1)
	if ((startX < finX && xPos < finX) || (startX > finX && xPos > finX) || (startY < finY && yPos < finY) || (startY > finY && yPos > finY)) {
		context.moveTo(xPos,yPos);
		context.lineTo(finX,finY);
	}
	context.closePath();
	context.stroke();
	context.restore();
}
function drawParallelArrow(object) {
	// required
	var context = object.context || object.ctx;
	var startX = object.startX;	
	var startY = object.startY;
	var finX = object.finX;
	var finY = object.finY;
	
	// optional
	var numOfArrows = object.numOfArrows || 1;
	var arrowLength = object.arrowLength || 25;
	var arrowAngle = object.arrowAngle || 0.5;
	var color = object.color || '#000';
	var lineWidth = object.lineWidth || 2;
	var fillArrow = boolean(object.fillArrow,false);
	
	context.save();
	if (numOfArrows == 1) {
		
		var fracPos = 0.5 + 0.5 * arrowLength * Math.cos(arrowAngle) / Math.sqrt(Math.pow((finX-startX),2)+Math.pow((finY-startY),2))
		drawArrow({context:context,startX:startX,startY:startY,finX:startX+fracPos*(finX-startX),finY:startY+fracPos*(finY-startY),arrowLength:arrowLength,angleBetweenLinesRads:arrowAngle,color:color,lineWidth:0.1,arrowLineWidth:lineWidth});
		
	} else if (numOfArrows == 2) {
		
		var fracPos1 = 0.5 + 0.75 * arrowLength * (Math.cos(arrowAngle) + 0.5) / Math.sqrt(Math.pow((finX-startX),2)+Math.pow((finY-startY),2))
		var fracPos2 = fracPos1 - 1 * arrowLength / Math.sqrt(Math.pow((finX-startX),2)+Math.pow((finY-startY),2))
				
		drawArrow({context:context,startX:startX,startY:startY,finX:startX+fracPos1*(finX-startX),finY:startY+fracPos1*(finY-startY),arrowLength:arrowLength,angleBetweenLinesRads:arrowAngle,color:color,lineWidth:0.1,showLine:false,arrowLineWidth:lineWidth});
		drawArrow({context:context,startX:startX,startY:startY,finX:startX+fracPos2*(finX-startX),finY:startY+fracPos2*(finY-startY),arrowLength:arrowLength,angleBetweenLinesRads:arrowAngle,color:color,lineWidth:0.1,showLine:false,arrowLineWidth:lineWidth});	
	}
	context.restore();
}
function labelLine(posA,posB,obj) {
	var ctx = obj.ctx;
	if (typeof hiddenCanvas == 'undefined') hiddenCanvas = newcanvas({vis:false});
	obj.ctx = hiddenCanvas.ctx;
	obj.measureOnly = true;
	var textDims = text(obj);
	var w = textDims.tightRect[2];
	var h = textDims.tightRect[3];
	if (typeof obj.box == 'undefined' || obj.box.type !== 'tight') w += 20;
	var x1 = posA[0], y1 = posA[1], x2 = posB[0], y2 = posB[1], x4, y4;
	var x3 = (x1+x2)/2;
	var y3 = (y1+y2)/2;
	if (y1 == y2) {
		x4 = x3 - w/2;
		if (x1 < x2) {
			y4 = y3;
		} else {
			y4 = y3 - h;
		}
	} else if (x1 == x2) {
		y4 = y3 - h/2;
		if (y1 < y2) {
			x4 = x3 - w;
		} else {
			x4 = x3;
		}
	} else if (x1 < x2) {
		if (y1 < y2) {
			x4 = x3-w;
			y4 = y3;
		} else {
			x4 = x3;
			y4 = y3;
		}		
	} else if (x3 > x2) {
		if (y3 < y2) {
			x4 = x3-w;
			y4 = y3-h;
		} else {

			x4 = x3;
			y4 = y3-h;
		}		
	}
	obj.ctx = ctx;
	obj.measureOnly = false;
	obj.left = x4-10;
	obj.top = y4-10;	
	obj.width = w+20;
	obj.height = h+20;
	obj.align = 'center';
	obj.vertAlign = 'middle';
	text(obj);
}
function drawDash(context,x1,y1,x2,y2,length) {
	if (typeof length !== 'number') length = 10;
	var grad = -(x2-x1)/(y2-y1);
	var midX = (x1+x2)/2;
	var midY = (y1+y2)/2;
	var end1X = midX - length * Math.cos(Math.atan(grad));
	var end1Y = midY - length * Math.sin(Math.atan(grad));
	var end2X = midX + length * Math.cos(Math.atan(grad));
	var end2Y = midY + length * Math.sin(Math.atan(grad));
	
	context.beginPath();
	context.moveTo(end1X,end1Y);
	context.lineTo(end2X,end2Y);
	context.stroke();		
}
function drawDoubleDash(context,x1,y1,x2,y2,length,separation) {
	if (typeof length !== 'number') length = 10;
	var sep = separation/2 || context.lineWidth+2 || 4;
	var grad = -(x2-x1)/(y2-y1);
		
	// [unitX,unitY] is a unit vector in the direction of the line
	var unitX = (x2-x1)/Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
	var unitY = (y2-y1)/Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
	
	var midX = (x1+x2)/2;
	var midY = (y1+y2)/2;
	
	var dashX1 = midX-sep*unitX;
	var dashX2 = midX+sep*unitX;	
	var dashY1 = midY-sep*unitY;
	var dashY2 = midY+sep*unitY;	
	
	var end1X = dashX1 - length * Math.cos(Math.atan(grad));
	var end1Y = dashY1 - length * Math.sin(Math.atan(grad));
	var end2X = dashX1 + length * Math.cos(Math.atan(grad));
	var end2Y = dashY1 + length * Math.sin(Math.atan(grad));
	
	var end3X = dashX2 - length * Math.cos(Math.atan(grad));
	var end3Y = dashY2 - length * Math.sin(Math.atan(grad));
	var end4X = dashX2 + length * Math.cos(Math.atan(grad));
	var end4Y = dashY2 + length * Math.sin(Math.atan(grad));	
	
	context.beginPath();
	context.moveTo(end1X,end1Y);
	context.lineTo(end2X,end2Y);
	context.moveTo(end3X,end3Y);
	context.lineTo(end4X,end4Y);	
	context.stroke();		
}

CanvasRenderingContext2D.prototype.setStroke = function (obj) {
	var lineWidth = obj.lineWidth || obj.width || obj.w || obj.thickness || this.lineWidth;
	var strokeStyle = obj.color || obj.strokeStyle || obj.style || this.strokeStyle;
	var dash = obj.dash || obj.lineDash || this.getLineDash();
	var lineCap = obj.lineCap || obj.cap || 'round';
	var lineJoin = obj.lineJoin || obj.join || obj.cap || 'round';
	this.lineWidth = lineWidth;
	this.strokeStyle = strokeStyle;
	this.setLineDash(dash);
	this.lineCap = lineCap;
	this.lineJoin = lineJoin;
}
CanvasRenderingContext2D.prototype.setFill = function (obj) {
	var color = obj.color || this.fillStyle;
	this.fillStyle = obj.color;
}
CanvasRenderingContext2D.prototype.path = function (pathArray, close, obj) {
	if (typeof obj == 'undefined')
		obj = {};
	this.beginPath();
	this.moveTo(pathArray[0][0], pathArray[0][1]);
	for (var i = 1; i < pathArray.length; i++) {
		this.lineTo(pathArray[i][0], pathArray[i][1]);
	}
	if (boolean(close, false) === true) {
		this.lineTo(pathArray[0][0], pathArray[0][1]);
	}
	if (typeof obj.fill !== 'undefined') {
		this.setFill(obj.fill);
		this.fill();
	}
	if (typeof obj.lineDec !== 'undefined') {}
	if (typeof obj.intAngles !== 'undefined') {
		if (typeof obj.intAngles.show == 'undefined') {
			obj.intAngles.show = [];
			for (var i = 0; i < pathArray.length; i++)
				obj.intAngles.show.push(true);
		}
		var angle = {
			ctx: this
		};
		angle.radius = obj.intAngles.radius || obj.intAngles.r || undefined;
		angle.squareForRight = boolean(obj.intAngles.squareForRight, true);
		angle.labelIfRight = boolean(obj.intAngles.labelIfRight, false);
		angle.drawLines = boolean(obj.intAngles.drawLines, false);
		angle.lineWidth = obj.intAngles.lineWidth || obj.intAngles.width || obj.intAngles.w || undefined;
		angle.lineColor = obj.intAngles.lineColor || obj.intAngles.color || undefined;
		angle.drawCurve = boolean(obj.intAngles.drawCurve, true);
		angle.curveWidth = obj.intAngles.curveWidth || angle.lineWidth;
		angle.curveColor = obj.intAngles.curveColor || angle.lineColor;
		if (typeof obj.intAngles.fill == 'string') {
			angle.fill = true;
			angle.fillColor = obj.intAngles.fill;
		} else {
			angle.fill = boolean(obj.intAngles.fill, false);
			angle.fillColor = obj.intAngles.fillColor || undefined;
		}
		angle.label = obj.intAngles.label || obj.intAngles.text || undefined;
		angle.labelFont = obj.intAngles.labelFont || obj.intAngles.font || undefined;
		angle.labelFontSize = obj.intAngles.labelFontSize || obj.intAngles.fontSize || undefined;
		angle.labelColor = obj.intAngles.labelColor || angle.lineColor || undefined;
		angle.labelRadius = obj.intAngles.labelRadius || undefined;
		angle.labelMeasure = boolean(obj.intAngles.labelMeasure, false);
		angle.measureRoundTo = obj.intAngles.measureRoundTo || obj.intAngles.roundTo || undefined;
		angle.angleType = obj.intAngles.angleType || undefined;
		for (var i = 0; i < pathArray.length; i++) {
			if (obj.intAngles.show[i] === true) {
				if (i === 0) {
					angle.a = pathArray[pathArray.length - 1]
				} else {
					angle.a = pathArray[i - 1]
				};
				angle.b = pathArray[i];
				if (i === pathArray.length - 1) {
					angle.c = pathArray[0]
				} else {
					angle.c = pathArray[i + 1]
				};
				if (typeof obj.intAngles.r == 'object')
					angle.radius = obj.intAngles.r[i];
				if (typeof obj.intAngles.radius == 'object')
					angle.radius = obj.intAngles.radius[i];
				if (typeof obj.intAngles.squareForRight == 'object')
					angle.squareForRight = boolean(obj.intAngles.squareForRight[i], true);
				if (typeof obj.intAngles.labelIfRight == 'object')
					angle.labelIfRight = boolean(obj.intAngles.labelIfRight[i], false);
				if (typeof obj.intAngles.drawLines == 'object')
					angle.drawLines = boolean(obj.intAngles.drawLines[i], false);
				if (typeof obj.intAngles.lineWidth == 'object')
					angle.lineWidth = obj.intAngles.lineWidth[i];
				if (typeof obj.intAngles.width == 'object')
					angle.lineWidth = obj.intAngles.width[i];
				if (typeof obj.intAngles.w == 'object')
					angle.lineWidth = obj.intAngles.w[i];
				if (typeof obj.intAngles.lineColor == 'object')
					angle.lineColor = obj.intAngles.lineColor[i];
				if (typeof obj.intAngles.color == 'object')
					angle.lineWidth = obj.intAngles.color[i];
				if (typeof obj.intAngles.drawCurve == 'object')
					angle.drawCurve = boolean(obj.intAngles.drawCurve[i], true);
				if (typeof obj.intAngles.lineWidth == 'object')
					angle.curveWidth = obj.intAngles.lineWidth[i];
				if (typeof obj.intAngles.curveWidth == 'object')
					angle.curveWidth = obj.intAngles.curveWidth[i];
				if (typeof obj.intAngles.curveColor == 'object')
					angle.curveColor = obj.intAngles.curveColor[i];
				if (typeof obj.intAngles.fill == 'object') {
					if (typeof obj.intAngles.fill[i] == 'string') {
						angle.fill = true;
						angle.fillColor = obj.intAngles.fill[i];
					} else {
						angle.fill = boolean(obj.intAngles.fill[i], false);
						if (typeof obj.intAngles.fillColor == 'object')
							angle.fillColor = obj.intAngles.fillColor[i];
					}
				}
				if (typeof obj.intAngles.label == 'object')
					angle.label = obj.intAngles.label[i];
				if (typeof obj.intAngles.text == 'object')
					angle.label = obj.intAngles.text[i];
				if (typeof obj.intAngles.labelFont == 'object')
					angle.labelFont = obj.intAngles.curveColor[i];
				if (typeof obj.intAngles.font == 'object')
					angle.labelFont = obj.intAngles.font[i];
				if (typeof obj.intAngles.labelFontSize == 'object')
					angle.labelFontSize = obj.intAngles.labelFontSize[i];
				if (typeof obj.intAngles.fontSize == 'object')
					angle.labelFontSize = obj.intAngles.fontSize[i];
				if (typeof obj.intAngles.lineColor == 'object')
					angle.labelColor = obj.intAngles.lineColor[i];
				if (typeof obj.intAngles.labelColor == 'object')
					angle.labelColor = obj.intAngles.labelColor[i];
				if (typeof obj.intAngles.labelRadius == 'object')
					angle.labelRadius = obj.intAngles.labelRadius[i];
				if (typeof obj.intAngles.labelMeasure == 'object')
					angle.labelMeasure = boolean(obj.intAngles.labelMeasure[i], false);
				if (typeof obj.intAngles.measureRoundTo == 'object')
					angle.measureRoundTo = obj.intAngles.measureRoundTo[i];
				if (typeof obj.intAngles.roundTo == 'object')
					angle.measureRoundTo = obj.intAngles.roundTo[i];
				drawAngle(angle);
			}
		}
	}
	if (typeof obj.vertexLabels !== 'undefined') {
		if (typeof obj.vertexLabels.show == 'undefined') {
			obj.vertexLabels.show = [];
			for (var i = 0; i < pathArray.length; i++)
				obj.vertexLabels.show.push(true);
		}
		var angle = {
			ctx: this
		};
		angle.labelIfRight = true;
		angle.drawLines = false;
		angle.drawCurve = false;
		angle.fill = false;
		angle.label = obj.vertexLabels.label || obj.vertexLabels.text || undefined;
		angle.labelFont = obj.vertexLabels.labelFont || obj.vertexLabels.font || undefined;
		angle.labelFontSize = obj.vertexLabels.labelFontSize || obj.vertexLabels.fontSize || undefined;
		angle.labelColor = obj.vertexLabels.labelColor || angle.lineColor || undefined;
		angle.labelRadius = obj.vertexLabels.labelRadius || obj.vertexLabels.radius || obj.vertexLabels.r || undefined;
		angle.labelMeasure = false;
		for (var i = 0; i < pathArray.length; i++) {
			if (obj.vertexLabels.show[i] === true) {
				if (i === 0) {
					angle.c = pathArray[pathArray.length - 1]
				} else {
					angle.c = pathArray[i - 1]
				};
				angle.b = pathArray[i];
				if (i === pathArray.length - 1) {
					angle.a = pathArray[0]
				} else {
					angle.a = pathArray[i + 1]
				};
				if (typeof obj.vertexLabels.label == 'object')
					angle.label = obj.vertexLabels.label[i];
				if (typeof obj.vertexLabels.text == 'object')
					angle.label = obj.vertexLabels.text[i];
				if (typeof obj.vertexLabels.labelFont == 'object')
					angle.labelFont = obj.vertexLabels.curveColor[i];
				if (typeof obj.vertexLabels.font == 'object')
					angle.labelFont = obj.vertexLabels.font[i];
				if (typeof obj.vertexLabels.labelFontSize == 'object')
					angle.labelFontSize = obj.vertexLabels.labelFontSize[i];
				if (typeof obj.vertexLabels.fontSize == 'object')
					angle.labelFontSize = obj.vertexLabels.fontSize[i];
				if (typeof obj.vertexLabels.lineColor == 'object')
					angle.labelColor = obj.vertexLabels.lineColor[i];
				if (typeof obj.vertexLabels.labelColor == 'object')
					angle.labelColor = obj.vertexLabels.labelColor[i];
				if (typeof obj.vertexLabels.radius == 'object')
					angle.labelRadius = obj.vertexLabels.radius[i];
				if (typeof obj.vertexLabels.r == 'object')
					angle.labelRadius = obj.vertexLabels.r[i];
				if (typeof obj.vertexLabels.labelRadius == 'object')
					angle.labelRadius = obj.vertexLabels.labelRadius[i];
				drawAngle(angle);
			}
		}
	}
	if (typeof obj.edgeLabels !== 'undefined') {
		if (typeof obj.edgeLabels.show == 'undefined') {
			obj.edgeLabels.show = [];
			for (var i = 0; i < pathArray.length; i++)
				obj.edgeLabels.show.push(true);
		}
		var label = {
			ctx: this
		};
		label.font = obj.edgeLabels.font || undefined;
		label.fontSize = obj.edgeLabels.fontSize || undefined;
		label.width = 1200;
		for (var i = 0; i < pathArray.length; i++) {
			if (obj.edgeLabels.show[i] === true) {
				var a = pathArray[i];
				var b = pathArray[(i + 1) % pathArray.length];
				label.textArray = obj.edgeLabels.text[i];
				labelLine(a, b, label);
			}
		}
	}
	if (typeof obj.stroke !== 'undefined') {
		this.beginPath();
		this.moveTo(pathArray[0][0], pathArray[0][1]);
		for (var i = 1; i < pathArray.length; i++) {
			this.lineTo(pathArray[i][0], pathArray[i][1]);
		}
		if (boolean(close, false) === true) {
			this.lineTo(pathArray[0][0], pathArray[0][1]);
		}
		this.setStroke(obj.stroke);
		this.stroke();
	}
}
CanvasRenderingContext2D.prototype.rect2 = function (obj) {
	var obj = clone(obj);
	if (un(obj.sf)) obj.sf = 1;
	this.save();
	this.lineWidth = def([obj.lineWidth,obj.thickness,this.lineWidth]) * obj.sf;
	this.strokeStyle = def([obj.lineColor,obj.color,obj.strokeStyle,obj.thickness,this.strokeStyle]);
	var fill = false;
	if (!un(obj.fillColor) && obj.fillColor !== 'none') {
		fill = true;
		this.fillStyle = obj.fillColor;
	} else if (!un(obj.fillStyle) && obj.fillStyle !== 'none') {
		fill = true;
		this.fillStyle = obj.fillStyle;
	}
	var dash = enlargeDash(def([obj.dash,this.getLineDash(),[]]),this.sf);
	if (!this.setLineDash) {this.setLineDash = function () {}}
	this.setLineDash(dash);
	if (!un(obj.rect)) {
		obj.left = obj.rect[0];
		obj.top = obj.rect[1];
		obj.width = obj.rect[2];
		obj.height = obj.rect[3];
	}
	var left = (obj.left || obj.l) * obj.sf;
	var top = (obj.top || obj.t) * obj.sf;
	var width = (obj.width || obj.w) * obj.sf;
	var height = (obj.height || obj.h) * obj.sf;
	this.beginPath();
	if (!un(obj.radius)) { 
		var radius = obj.radius*obj.sf;
		this.moveTo(left+radius,top);
		this.lineTo(left+width-radius,top);
		this.arc(left+width-radius,top+radius,radius,1.5*Math.PI,2*Math.PI);
		this.lineTo(left+width,top+height-radius);
		this.arc(left+width-radius,top+height-radius,radius,0,0.5*Math.PI);
		this.lineTo(left+radius,top+height);
		this.arc(left+radius,top+height-radius,radius,0.5*Math.PI,Math.PI);	
		this.lineTo(left,top+radius);
		this.arc(left+radius,top+radius,radius,Math.PI,1.5*Math.PI);
		this.closePath();
		if (fill == true) this.fill();
		this.stroke();
	} else {
		if (fill == true) this.fillRect(left,top,width,height);
		this.strokeRect(left,top,width,height);
	}
	this.restore();	
}
CanvasRenderingContext2D.prototype.clear = function () {
	this.clearRect(0, 0, this.data[102], this.data[103]);
}
HTMLCanvasElement.prototype.setLeft = function (left) {
	this.data[100] = left;
	resizeCanvas2(this, this.data[100], this.data[101]);
}
HTMLCanvasElement.prototype.setTop = function (top) {
	this.data[101] = top;
	resizeCanvas2(this, this.data[100], this.data[101]);
}
HTMLCanvasElement.prototype.setPos = function (left, top) {
	this.data[100] = left;
	this.data[101] = top;
	resizeCanvas2(this, this.data[100], this.data[101]);
}
HTMLCanvasElement.prototype.setWidth = function (width) {
	this.data[102] = width;
	resizeCanvas(this, this.data[100], this.data[101], this.data[102], this.data[103]);
}
HTMLCanvasElement.prototype.setHeight = function (height) {
	this.data[103] = height;
	resizeCanvas(this, this.data[100], this.data[101], this.data[102], this.data[103]);
}
HTMLCanvasElement.prototype.setDims = function (width, height) {
	this.data[102] = width;
	this.data[103] = height;
	resizeCanvas(this, this.data[100], this.data[101], this.data[102], this.data[103]);
}
HTMLCanvasElement.prototype.setVis = function (vis) {
	if (typeof vis == 'undefined') {
		this.data[104] = !this.data[104];
	} else {
		this.data[104] = vis;
	}
	if (this.data[104] == true) {
		showObj(this);
	} else {
		hideObj(this);
	}
}
HTMLCanvasElement.prototype.setPE = function (point) {
	if (typeof point == 'undefined') {
		this.data[106] = !this.data[106];
	} else {
		this.data[106] = point;
	}
	if (this.data[106] == true) {
		this.style.pointerEvents = 'auto';
	} else {
		this.style.pointerEvents = 'none';
	}
}
HTMLCanvasElement.prototype.setZ = function (z) {
	this.data[107] = z;
	this.style.zIndex = z;
}
HTMLCanvasElement.prototype.setCursor = function (cursor) {
	this.style.cursor = cursor || 'pointer';
}
HTMLCanvasElement.prototype.setOpacity = function (opacity) {
	this.style.opacity = opacity;
}

function playButton(left,top,width,func,options) {
	//visible,zIndex,fillColor,lineColor,lineWidth,radius
	if (typeof options == 'undefined') var options = {};
	var zIndex = options.zIndex || 2;
	var button = createButton(0,left,top,width,width,boolean(options.visible,true),false,true,zIndex);
	button.lineColor = options.lineColor || '#000';
	button.lineWidth = options.lineWidth || 6;
	button.fillColor = options.fillColor || '#3FF';
	button.radius = options.radius || 6;
	button.direction = 'right';
	if (options.dir == 'left') button.direction = 'left';
	button.width = width;
	button.left = left;
	button.top = top;
	button.draw = function() {
		var ctx = this.ctx;
		roundedRect(ctx,this.lineWidth/2,this.lineWidth/2,this.width-this.lineWidth,this.width-this.lineWidth,this.radius,this.lineWidth,this.lineColor,this.fillColor);
		ctx.fillStyle = this.lineColor;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.beginPath();
		if (this.direction == 'right') {
			ctx.moveTo(this.width*16/50,this.width*14/50);
			ctx.lineTo(this.width*34/50,this.width*25/50);
			ctx.lineTo(this.width*16/50,this.width*36/50);
			ctx.lineTo(this.width*16/50,this.width*14/50);
		} else {
			ctx.moveTo(this.width*34/50,this.width*14/50);
			ctx.lineTo(this.width*16/50,this.width*25/50);
			ctx.lineTo(this.width*34/50,this.width*36/50);
			ctx.lineTo(this.width*34/50,this.width*14/50);		
		}
		ctx.fill();
	}
	button.draw();
	if (typeof func !== 'undefined') {
		addListener(button,func);
	}
	return button;
}
function drawCalcAllowedButton(ctx,l,t,size,allowed,backColor) {
	var w = size || 20;
	var h = size || 20;
	var color = backColor || '#FFC';
	ctx.save();
	ctx.strokeStyle = '#000';
	ctx.fillStyle = '#000';
	roundedRect(ctx,l,t,w,h,2,3,'#000',color);
	roundedRect(ctx,l+0.3*w,t+0.2*h,w*0.4,h*0.6,1,3,'#000','#000');
	roundedRect(ctx,l+0.35*w,t+0.25*h,w*0.3,h*0.15,0.01,3,'#000',color);
	for (var i = 0; i < 3; i++) {
		for (var j = 0; j < 3; j++) {
			roundedRect(ctx,l+0.35*w+0.12*j*w,t+0.45*h+0.12*i*h,w*0.08,h*0.08,0.01,3,'#000',color);
		}
	}
	if (boolean(allowed,true) == false) {
		ctx.lineWidth = 0.1*w;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.beginPath();			
		ctx.strokeStyle = '#F00';
		ctx.moveTo(l+0.85*w,t+0.15*h);
		ctx.lineTo(l+0.15*w,t+0.85*h);				
		ctx.stroke();
	}
	ctx.restore();
}
function drawCalcAllowedButton2(ctx,l,t,size,allowed,backColor,calcColor) {
	var w = size || 20;
	var h = size || 20;
	var color = backColor || '#FFC';
	var color2 = calcColor || '#333';
	ctx.save();
	ctx.strokeStyle = color2;
	ctx.fillStyle = color2;
	roundedRect(ctx,l,t,w,h,2,3,'#000',color);
	roundedRect(ctx,l+0.3*w,t+0.2*h,w*0.4,h*0.6,1,3,color2,color2);
	roundedRect(ctx,l+0.35*w,t+0.25*h,w*0.3,h*0.15,0.01,3,color2,color);
	for (var i = 0; i < 3; i++) {
		for (var j = 0; j < 3; j++) {
			roundedRect(ctx,l+0.35*w+0.12*j*w,t+0.45*h+0.12*i*h,w*0.08,h*0.08,0.01,3,color2,color);
		}
	}
	if (boolean(allowed,true) == false) {
		ctx.lineWidth = 0.08*w;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.beginPath();			
		ctx.strokeStyle = '#900';
		ctx.arc(l+0.5*w,t+0.5*h,0.45*w,0,2*Math.PI);
		ctx.stroke();
		ctx.beginPath();
		ctx.lineWidth = 0.12*w;
		ctx.moveTo(l+0.5*w+(1/Math.sqrt(2))*0.42*w,t+0.5*h-(1/Math.sqrt(2))*0.42*h);
		ctx.lineTo(l+0.5*w-(1/Math.sqrt(2))*0.42*w,t+0.5*h+(1/Math.sqrt(2))*0.42*h);
		//ctx.moveTo(l+0.15*w,t+0.15*h);
		//ctx.lineTo(l+0.85*w,t+0.85*h);		
		ctx.stroke();
		
	}
	ctx.restore();
}
function drawRefreshButton(ctx,l,t,size,backColor) {
	var w = size || 20;
	var h = size || 20;
	var color = backColor || '#FFC';	
	ctx.save();
	ctx.strokeStyle = '#000';
	ctx.fillStyle = '#000';
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	roundedRect(ctx,l,t,w,h,4,6,'#000',color);
	ctx.lineWidth = 0.08*w;
	ctx.beginPath();
	ctx.arc(l+0.5*w,t+0.5*h,0.22*w,-1.8*Math.PI,-0.2*Math.PI);
	ctx.stroke();
	ctx.beginPath();
	var l2 = l+0.77*w;
	var t2 = t+0.47*h;
	var arrowLength = 0.28*w;
	ctx.moveTo(l2,t2);
	ctx.lineTo(l2+arrowLength*Math.sin(1.06*Math.PI),t2+arrowLength*Math.cos(1.06*Math.PI));
	ctx.lineTo(l2+arrowLength*Math.cos(1.03*Math.PI),t2-arrowLength*Math.sin(1.03*Math.PI));
	ctx.lineTo(l2,t2);
	ctx.fill();
	ctx.restore();	
}
function drawRangeLabel(ctx,l,t,w,h,direction) {
	var dir = 'bottom'; // default;
	if (typeof direction == 'string') dir = direction;
	switch (dir) {
		case 'bottom' :
			var p1 = [l,t];
			var p2 = [l+w/2,t+h];
			var p3 = [l+w,t];
			var c1 = [l+w*(1/12),t+h*1.3];
			var c2 = [l+w*(13/40),t+h*(-0.7)];
			var c3 = [l+w*(27/40),t+h*(-0.7)];
			var c4 = [l+w*(11/12),t+h*1.3];
			break;
		case 'top' :
			var p1 = [l,t+h];
			var p2 = [l+w/2,t];
			var p3 = [l+w,t+h];
			var c1 = [l+w*(1/12),t+h-h*1.3];
			var c2 = [l+w*(13/40),t+h-h*(-0.7)];
			var c3 = [l+w*(27/40),t+h-h*(-0.7)];
			var c4 = [l+w*(11/12),t+h-h*1.3];
			break;
		case 'right' :
			var p1 = [l,t];
			var p2 = [l+w,t+h/2];
			var p3 = [l,t+h];
			var c1 = [l+w*1.3,t+h*(1/12)];
			var c2 = [l+w*(-0.7),t+h*(13/40)];
			var c3 = [l+w*(-0.7),t+h*(27/40)];
			var c4 = [l+w*1.3,t+h*(11/12)];			
			break;
		case 'left' :
			var p1 = [l+w,t];
			var p2 = [l,t+h/2];
			var p3 = [l+w,t+h];
			var c1 = [l+w-w*1.3,t+h*(1/12)];
			var c2 = [l+w-w*(-0.7),t+h*(13/40)];
			var c3 = [l+w-w*(-0.7),t+h*(27/40)];
			var c4 = [l+w-w*1.3,t+h*(11/12)];				
			break;			
	}
	ctx.beginPath();
	ctx.moveTo(p1[0],p1[1]);
	ctx.bezierCurveTo(c1[0],c1[1],c2[0],c2[1],p2[0],p2[1]);
	ctx.bezierCurveTo(c3[0],c3[1],c4[0],c4[1],p3[0],p3[1]);
	ctx.stroke();
}

var JSONfn;
if (!JSONfn) JSONfn = {};
(function () {
  JSONfn.stringify = function(obj) {
    return JSON.stringify(obj,function(key, value){
            return (typeof value === 'function' ) ? value.toString() : value;
        });
  }
  JSONfn.parse = function(str) {
    return JSON.parse(str,function(key, value){
        if(typeof value != 'string') return value;
        return ( value.substring(0,8) == 'function') ? eval('('+value+')') : value;
    });
  }
}());

function replaceAll(string, find, replace) {
  return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function removeSpaces(string, opt_mathsInput) {
	string = string.replace(/\s/g, "");
	if (typeof opt_mathsInput !== 'undefined') setMathsInputText(opt_mathsInput, string, 0);
	return string;
}
function stringTo2dArray(string, elemType) {
	if (!elemType) elemType = 'string';
	var start = string.indexOf("[");
	
	// replace commas with semi-colons inside array (level 1)
	var bracket = 0;
	for (j = start; j < string.length; j++) {
		if (string.charAt(j) == "[") bracket++;
		if (string.charAt(j) == "]") bracket--;
		if (string.charAt(j) == "," && bracket == 1) {
			string = string.slice(0, j) + ";" + string.slice(j + 1);
		}
	}

	var bracket = 0;
	var fin; 
	for (j = start; j < string.length; j++) {
		if (string.charAt(j) == "[") bracket++;
		if (string.charAt(j) == "]") bracket--;
		if (bracket == 0) {
			fin = j + 1;
			break; 
		}
	}
	
	string = string.slice(start + 1, fin - 1);
	var array = string.split(";");
	
	for (j = 0; j < array.length; j++) {
		var str = array[j];
		array[j] = array[j].slice(1,-1);
		array[j] = array[j].split(',');
		for (k = 0; k < array[j].length; k++) {
			if (elemType == 'number') array[j][k] = Number(array[j][k]);	
		}
	}
	
	return array;
}
function textArrayReplace(textArray,findStr,replaceStr) {
	if (typeof replaceStr == 'object') {
		return textArrayReplace2(textArray,findStr,replaceStr);
	}
	replaceStr = String(replaceStr);
	for (var i = 0; i < textArray.length; i++) {
		if (typeof textArray[i] == 'string') {
			textArray[i] = textStringReplace(textArray[i],findStr,replaceStr);
		} else if (typeof textArray[i] == 'object') {
			textArray[i] = textArrayReplace(textArray[i],findStr,replaceStr);
		}
	}
	return textArray;
}
function textStringReplace(string,findStr,replaceStr) {
	var re = new RegExp(findStr, "gi");
	return string.replace(re,replaceStr);
}
function textArrayReplace2(textArray,findStr,replacement) {
	// replace string with array
	for (var i = 0; i < textArray.length; i++) {
		if (typeof textArray[i] == 'string') {
			var pos = textArray[i].indexOf(findStr);
			if (pos > -1) {
				var newElems = clone(replacement);
				newElems.unshift(textArray[i].slice(0,pos));
				newElems.push(textArray[i].slice(pos+findStr.length));
				textArray.splice(i,1);
				textArray.splice.apply(textArray,[i,0].concat(newElems));
				break;
			}
		} else if (typeof textArray[i] == 'object') {
			textArray[i] = textArrayReplace2(textArray[i],findStr,replacement);
		}
	}
	return textArray;
}

function getArrayCount(testArray, testValue) {
	var count = 0;
	for (var j = 0; j < testArray.length; j++) {
		if(testArray[j] == testValue) {
			count++;
		}
	}
	return count;
}
function getArrayLessThanCount(testArray, testValue) {
	var count = 0;
	for (var j = 0; j < testArray.length; j++) {
		if(testArray[j] < testValue) {
			count++;
		}
	}
	return count;
}
function shuffleArray(array) {
	var newArray = [];
	do {
		var randomPos = Math.floor(Math.random() * array.length);
		newArray.push(array[randomPos]);
		array.splice(randomPos, 1);			
	} while (array.length > 0);
	return newArray;
}
function buildArray (array, dim0, dim1, dim2, dim3, dim4, dim5) {
	if ((typeof dim0 !== 'undefined') && (typeof array[dim0] == 'undefined')) {
		array[dim0] = [];
	}
	if ((typeof dim1 !== 'undefined') && (typeof array[dim0][dim1] == 'undefined')) {
		array[dim0][dim1] = [];
	}
	if ((typeof dim2 !== 'undefined') && (typeof array[dim0][dim1][dim2] == 'undefined')) {
		array[dim0][dim1][dim2] = [];
	}
	if ((typeof dim3 !== 'undefined') && (typeof array[dim0][dim1][dim2][dim3] == 'undefined')) {
		array[dim0][dim1][dim2][dim3] = [];
	}
	if ((typeof dim4 !== 'undefined') && (typeof array[dim0][dim1][dim2][dim3][dim4] == 'undefined')) {
		array[dim0][dim1][dim2][dim3][dim4] = [];
	}
	if ((typeof dim5 !== 'undefined') && (typeof array[dim0][dim1][dim2][dim3][dim4][dim5] == 'undefined')) {
		array[dim0][dim1][dim2][dim3][dim4][dim5] = [];
	}
}
function arraySum(array) {
	var sum = 0;
	for (var a = 0, aMax = array.length; a < aMax; a++) {
		sum += Number(array[a]);
	}
	return sum;
}
Array.prototype.alphanumSort = function(caseInsensitive) {
  for (var z = 0, t; t = this[z]; z++) {
    this[z] = [], x = 0, y = -1, n = 0, i, j;

    while (i = (j = t.charAt(x++)).charCodeAt(0)) {
      var m = (i == 46 || (i >=48 && i <= 57));
      if (m !== n) {
        this[z][++y] = "";
        n = m;
      }
      this[z][y] += j;
    }
  }

  this.sort(function(a, b) {
    for (var x = 0, aa, bb; (aa = a[x]) && (bb = b[x]); x++) {
      if (caseInsensitive) {
        aa = aa.toLowerCase();
        bb = bb.toLowerCase();
      }
      if (aa !== bb) {
        var c = Number(aa), d = Number(bb);
        if (c == aa && d == bb) {
          return c - d;
        } else return (aa > bb) ? 1 : -1;
      }
    }
    return a.length - b.length;
  });

  for (var z = 0; z < this.length; z++)
    this[z] = this[z].join("");
}
function compareVersion(data0, data1, levels) {
    function getVersionHash(version) {
        var value = 0;
        version = version.split(".").map(function (a) {
            var n = parseInt(a);
            var letter = a.replace(n, "");
            if (letter) {
                return n + letter[0].charCodeAt() / 0xFF;
            } else {
                return n;
            }
        });
        for (var i = 0; i < version.length; ++i) {
            if (levels === i) break;
            value += version[i] / 0xFF * Math.pow(0xFF, levels - i + 1);
        }
        return value;
    };
    var v1 = getVersionHash(data0);
    var v2 = getVersionHash(data1);
    return v1 === v2 ? -1 : v1 > v2 ? 0 : 1;
};

function mouseHitRect(l,t,w,h) {
	var x = mouse.x;
	var y = mouse.y;
	if (x >= l && x <= (l+w) && y >= t && y <= (t+h)) {
		return true;
	} else {
		return false;
	}
}
function hitTestMouseOver(obj) {
	if (un(obj)) return;
	if (un(taskObject[taskNum])) return;
	var objNum = taskObject[taskNum].indexOf(obj);
	var objBoundingRect = obj.getBoundingClientRect();	
	var x = xCanvasToWindow(mouse.x);
	var y = yCanvasToWindow(mouse.y);
	if (x > objBoundingRect.left && x < objBoundingRect.right && y > objBoundingRect.top && y < objBoundingRect.bottom) {
		// test polygon mouse over
		if (typeof taskObjectData[taskNum][objNum][41] == "undefined") {
			return true;
		} else {
			// get (canvas) mouse coordinates relative to left & top of canvas2
			var left = xWindowToCanvas(Number(String(obj.style.left).slice(0, -2)) + Number(String(canvas.style.left).slice(0, -2)));
			var top = yWindowToCanvas(Number(String(obj.style.top).slice(0, -2)) + 0.5 * (window.innerHeight - Number(String(canvas.style.height).slice(0, -2))));
			var x = mouse.x - left;
			var y = mouse.y - top;
			
			// split n-agon into (n-2) triangles and test if (x,y) is in each triangle
			var inPolygon = false;
			var x1 = taskObjectData[taskNum][objNum][41][0][0];
			var y1 = taskObjectData[taskNum][objNum][41][0][1];
			for (iii = 1; iii <= taskObjectData[taskNum][objNum][41].length - 2; iii++) {
				var x2 = taskObjectData[taskNum][objNum][41][iii][0];
				var y2 = taskObjectData[taskNum][objNum][41][iii][1];
				var x3 = taskObjectData[taskNum][objNum][41][iii+1][0];
				var y3 = taskObjectData[taskNum][objNum][41][iii+1][1];
				// work out the barycentric coordinates for the triangle
				// iff all are positive, (x, y) is in the triangle
				var alpha = ((y2-y3)*(x-x3)+(x3-x2)*(y-y3))/((y2-y3)*(x1-x3)+(x3-x2)*(y1-y3));
				var beta = ((y3-y1)*(x-x3)+(x1-x3)*(y-y3))/((y2-y3)*(x1-x3)+(x3-x2)*(y1-y3));
				var gamma = 1 - alpha - beta;
				if (alpha > 0 && beta > 0 && gamma > 0) {inPolygon = true};
			}
			
			return inPolygon;
		}
	} else {
		return false;
	}	
}
function hitTestTwoObjects(obj1, obj2) {
	var obj1BoundingRect = obj1.getBoundingClientRect();
	var obj2BoundingRect = obj2.getBoundingClientRect();
	if (obj1BoundingRect.left < obj2BoundingRect.right && obj1BoundingRect.top < obj2BoundingRect.bottom && obj1BoundingRect.right > obj2BoundingRect.left && obj1BoundingRect.bottom > obj2BoundingRect.top) {
		return true
	} else {
		if (obj1BoundingRect.right > obj2BoundingRect.left && obj1BoundingRect.top < obj2BoundingRect.bottom && obj1BoundingRect.left < obj2BoundingRect.right && obj1BoundingRect.bottom > obj2BoundingRect.top) {
			return true;
		} else {
			if (obj2BoundingRect.left < obj1BoundingRect.right && obj2BoundingRect.top < obj1BoundingRect.bottom && obj2BoundingRect.right > obj1BoundingRect.left && obj2BoundingRect.bottom > obj1BoundingRect.top) {
				return true
			} else {
				if (obj2BoundingRect.right > obj1BoundingRect.left && obj2BoundingRect.top < obj1BoundingRect.bottom && obj2BoundingRect.left < obj1BoundingRect.right && obj2BoundingRect.bottom > obj1BoundingRect.top) {
					return true;
				} else {
			 		return false
				}
			}
		}
	}
}
function hitTestRect(obj, left, top, width, height) {
	var objBoundingRect = obj.getBoundingClientRect();
	var right = left + width;
	var bottom = top + height;
	left = xCanvasToWindow(left);
	right = xCanvasToWindow(right);
	top = yCanvasToWindow(top);
	bottom = yCanvasToWindow(bottom);	
	if (objBoundingRect.left < right && objBoundingRect.top < bottom && objBoundingRect.right > left && objBoundingRect.bottom > top) {
		return true;
	} else {
		if (objBoundingRect.right > left && objBoundingRect.top < bottom && objBoundingRect.left < right && objBoundingRect.bottom > top) {
			return true;
		} else {
			if (left < objBoundingRect.right && top < objBoundingRect.bottom && right > objBoundingRect.left && bottom > objBoundingRect.top) {
				return true;
			} else {
				if (right > objBoundingRect.left && top < objBoundingRect.bottom && left < objBoundingRect.right && bottom > objBoundingRect.top) {
					return true;
				} else {
			 		return false;
				}
			}
		}
	}
}
function hitTestRect2(obj, left, top, width, height) { // tests if center of obj is in rect
	var objBoundingRect = obj.getBoundingClientRect();
	var objX = objBoundingRect.left + 0.5 * (objBoundingRect.right - objBoundingRect.left);
	var objY = objBoundingRect.top + 0.5 * (objBoundingRect.bottom - objBoundingRect.top);
	var right = left + width;
	var bottom = top + height;
	left = xCanvasToWindow(left);
	right = xCanvasToWindow(right);
	top = yCanvasToWindow(top);
	bottom = yCanvasToWindow(bottom);
	if (objX < right && objY < bottom && objX > left && objY > top) {
		return true;
	} else {
		return false;
	}
}
function hitTestTwoRects(rect1,rect2) {
	var xHit = false;
	var yHit = false;
	if (
		(rect2[0] <= rect1[0] 			&& rect2[0]+rect2[2] >= rect1[0]) ||
		(rect2[0] <= rect1[0]+rect1[2] 	&& rect2[0]+rect2[2] >= rect1[0]+rect1[2]) ||
		(rect2[0] >= rect1[0] 			&& rect2[0]+rect2[2] <= rect1[0]+rect1[2])
	) {xHit = true;};
	if (
		(rect2[1] <= rect1[1] 			&& rect2[1]+rect2[3] >= rect1[1]) ||
		(rect2[1] <= rect1[1]+rect1[3] 	&& rect2[1]+rect2[3] >= rect1[1]+rect1[3]) ||
		(rect2[1] >= rect1[1] 			&& rect2[1]+rect2[3] <= rect1[1]+rect1[3])
	) {yHit = true;};
	return (xHit && yHit);
}
function hitTestMouseOverRect(left, top, width, height) { // tests if mouse is in rect - REQUIRES mouse coords to have been updated
	if (mouse.x < left + width && mouse.y < top + height && mouse.x > left && mouse.y > top) {
		return true;
	} else {
		return false;
	}
}
function hitTestCircle(obj, centreX, centreY, radius) {
	var objBoundingRect = obj.getBoundingClientRect();
	centreX = xCanvasToWindow(centreX);
	centreY = yCanvasToWindow(centreY);
	if ((window.innerWidth / window.innerHeight) > (12 / 7)) {
		radius = (radius / canvas.height) * window.innerHeight;
	} else {
		radius = (radius / canvas.width) * window.innerWidth;				
	}
	var testPoint = [];
	testPoint[0] = Math.pow((objBoundingRect.left - centreX), 2) + Math.pow((objBoundingRect.top - centreY), 2);
	testPoint[1] = Math.pow((objBoundingRect.left - centreX), 2) + Math.pow((objBoundingRect.bottom - centreY), 2);
	testPoint[2] = Math.pow((objBoundingRect.right - centreX), 2) + Math.pow((objBoundingRect.top - centreY), 2);
	testPoint[3] = Math.pow((objBoundingRect.right - centreX), 2) + Math.pow((objBoundingRect.bottom - centreY), 2);
	testPoint[4] = Math.pow((objBoundingRect.left - centreX), 2) + Math.pow(((objBoundingRect.top + objBoundingRect.bottom) / 2 - centreY), 2);
	testPoint[5] = Math.pow((objBoundingRect.right - centreX), 2) + Math.pow(((objBoundingRect.top + objBoundingRect.bottom) / 2 - centreY), 2);
	testPoint[6] = Math.pow(((objBoundingRect.left + objBoundingRect.right) / 2 - centreX), 2) + Math.pow((objBoundingRect.top - centreY), 2);
	testPoint[7] = Math.pow(((objBoundingRect.left + objBoundingRect.right) / 2 - centreX), 2) + Math.pow((objBoundingRect.bottom - centreY), 2);
	
	if (getArrayLessThanCount(testPoint, Math.pow(radius, 2)) > 0) {
		return true
	} else {
		return false
	}
}
function hitTestCircle2(obj, centreX, centreY, radius) { // this one just requires the center of the object to be within the circle
	var objBoundingRect = obj.getBoundingClientRect();
	centreX = xCanvasToWindow(centreX);
	centreY = yCanvasToWindow(centreY);
	if ((window.innerWidth / window.innerHeight) > (12 / 7)) {
		radius = (radius / canvas.height) * window.innerHeight;
	} else {
		radius = (radius / canvas.width) * window.innerWidth;				
	}
	var objX = objBoundingRect.left + 0.5 * objBoundingRect.width;
	var objY = objBoundingRect.top + 0.5 * objBoundingRect.height;
	if (Math.pow((objX - centreX), 2) + Math.pow((objY - centreY), 2) <= Math.pow(radius, 2)) {
		return true
	} else {
		return false
	}
}
function hitTestMouseOverPolygon(verticesArray) {
	var x = mouse.x;
	var y = mouse.y;
	
	// split n-agon into (n-2) triangles and test if (x,y) is in each triangle
	var x1 = verticesArray[0][0];
	var y1 = verticesArray[0][1];
	
	for (var i = 1; i <= verticesArray.length - 2; i++) {
		var x2 = verticesArray[i][0];
		var y2 = verticesArray[i][1];
		var x3 = verticesArray[i+1][0];
		var y3 = verticesArray[i+1][1];
		// work out the barycentric coordinates for the triangle
		// iff all are positive, (x, y) is in the triangle
		var alpha = ((y2-y3)*(x-x3)+(x3-x2)*(y-y3))/((y2-y3)*(x1-x3)+(x3-x2)*(y1-y3));
		var beta = ((y3-y1)*(x-x3)+(x1-x3)*(y-y3))/((y2-y3)*(x1-x3)+(x3-x2)*(y1-y3));
		var gamma = 1 - alpha - beta;
		if (alpha > 0 && beta > 0 && gamma > 0) {
			return true;
		}
	}
	return false;
}
function hitTestPolygon(point,verticesArray) {
	var x = point[0];
	var y = point[1];
	
	// split n-agon into (n-2) triangles and test if (x,y) is in each triangle
	var x1 = verticesArray[0][0];
	var y1 = verticesArray[0][1];
	
	for (var i = 1; i <= verticesArray.length - 2; i++) {
		var x2 = verticesArray[i][0];
		var y2 = verticesArray[i][1];
		var x3 = verticesArray[i+1][0];
		var y3 = verticesArray[i+1][1];
		// work out the barycentric coordinates for the triangle
		// iff all are positive, (x, y) is in the triangle
		var alpha = ((y2-y3)*(x-x3)+(x3-x2)*(y-y3))/((y2-y3)*(x1-x3)+(x3-x2)*(y1-y3));
		var beta = ((y3-y1)*(x-x3)+(x1-x3)*(y-y3))/((y2-y3)*(x1-x3)+(x3-x2)*(y1-y3));
		var gamma = 1 - alpha - beta;
		if (alpha > 0 && beta > 0 && gamma > 0) {
			return true;
		}
	}
	return false;
}

function motionPath(canvasData, startX, startY, finX, finY, rateType, rate) { // eg. rateType='time', rate=2000 (time in ms to complete motion) or rateType='speed', rate=200 (speed of motion in (canvas) pixels per second)
	var xDistance = finX - startX;
	var yDistance = finY - startY;
	var distance = Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
	var time;
	if (rateType == 'speed') {time = 1000 * distance / rate};
	if (rateType == 'time') {time = rate};
	var dx = xDistance * 40 / time;
	var dy = yDistance * 40 / time;
	var frameCount = 0;
	var totalFrames = Math.floor(time / 40);
	var motion = setInterval(function() {
		canvasData[100] += dx;
		canvasData[101] += dy;
		resize();
		frameCount++;
		if (frameCount >= totalFrames) {
			canvasData[100] = finX;
			canvasData[101] = finY;
			resize();
			clearInterval(motion)};
	}, 40);
}
function motionResize(canvasData, newWidth, newHeight, time, coeX, coeY) {
	//if not present, the coe will default to the centre of the object
	if (!coeX) {coeX = canvasData[100] + 0.5 * canvasData[102]};
	if (!coeY) {coeY = canvasData[101] + 0.5 * canvasData[103]};
	var dw = (newWidth - canvasData[102]) * 40 / time;
	var dh = (newHeight - canvasData[103]) * 40 / time;
	var dx = 0.5 * (canvasData[102] - newWidth) * 40 / time;
	var dy = 0.5 * (canvasData[103] - newHeight) * 40 / time;
	var finX = canvasData[100] + 0.5 * (canvasData[102] - newWidth);
	var finY = canvasData[101] + 0.5 * (canvasData[103] - newHeight);
	var frameCount = 0;
	var totalFrames = Math.floor(time / 40);
	var motion = setInterval(function() {
		canvasData[100] += dx;
		canvasData[101] += dy;
		canvasData[102] += dw;
		canvasData[103] += dh;
		resize();
		frameCount++;
		if (frameCount >= totalFrames) {
			canvasData[100] = finX;
			canvasData[101] = finY;
			canvasData[102] = newWidth;
			canvasData[103] = newHeight;
			resize();
			clearInterval(motion)};
	}, 40);
}

function ceiling(number, toNearest) {
	// get the place value of toNearest
	var decPointPos;
	if (String(toNearest).indexOf('.') !== -1) {
		decPointPos = String(toNearest).indexOf('.');
	} else {
		decPointPos = String(toNearest).length - 1;	
	}
	var placeValue;
	for (ii = 0; ii < String(toNearest).length; ii++) {
		if (String(toNearest).charAt(ii) !== "0" && String(toNearest).charAt(ii) !== ".") {
			placeValue = decPointPos - ii;
		}
	}
	// divide number and toNearesr by 10^placevalue
	number = number / (Math.pow(10, placeValue));
	toNearest = toNearest / (Math.pow(10, placeValue));
	// divide number by toNearest
	number = number / toNearest;
	number = Math.ceil(number);
	number = number * toNearest;
	number = number * (Math.pow(10, placeValue));
	number = Math.round(number*1000000000)/1000000000;
	return number;
}
function truncate(number, decPlaces) {
	return +(Math.floor(number * Math.pow(10, decPlaces)) / Math.pow(10, decPlaces)).toFixed(decPlaces);	
}
function round2(number, decPlaces) {
	return +(Math.round(number * Math.pow(10, decPlaces)) / Math.pow(10, decPlaces)).toFixed(decPlaces);	
}
/*function roundToNearest(number, toNearest) {
	if (un(toNearest)) toNearest = 1;
	var testLog = Math.log(toNearest)/Math.log(10);
	if (Math.abs(testLog - Math.round(testLog)) < 0.000001) { // powers of 10
		return round(number, toNearest);
	} else {
		// get the place value of toNearest
		var decPointPos;
		if (String(toNearest).indexOf('.') !== -1) {
			decPointPos = String(toNearest).indexOf('.');
		} else {
			decPointPos = String(toNearest).length - 1;	
		}
		var placeValue;
		for (ii = 0; ii < String(toNearest).length; ii++) {
			if (String(toNearest).charAt(ii) !== "0" && String(toNearest).charAt(ii) !== ".") {
				placeValue = decPointPos - ii;
			}
		}
		// divide number and toNearesr by 10^placevalue
		number = number / (Math.pow(10, placeValue));
		toNearest = toNearest / (Math.pow(10, placeValue));
		// divide number by toNearest
		number = number / toNearest;
		number = Math.round(number);
		number = number * toNearest;
		number = number * (Math.pow(10, placeValue));
		number = Math.round(number*1000000000)/1000000000;
		return number;
	}
}*/
function roundToNearest(number, toNearest) {
	if (un(toNearest)) toNearest = 1;
	var testLog = Math.log(toNearest) / Math.log(10);
	if (Math.abs(testLog - Math.round(testLog)) < 0.000001) { // powers of 10
		return round(number, toNearest);
	} else {
		// get the place value of toNearest
		var decPointPos;
		if (String(toNearest).indexOf('.') !== -1) {
			decPointPos = String(toNearest).indexOf('.');
		} else {
			decPointPos = String(toNearest).length - 1;
		}
		var placeValue;
		for (var i = 0; i < String(toNearest).length; i++) {
			if (String(toNearest).charAt(i) !== "0" && String(toNearest).charAt(i) !== ".") {
				placeValue = decPointPos - i;
			}
		}
		number = number / (Math.pow(10, placeValue));
		toNearest = toNearest / (Math.pow(10, placeValue));
		number = number / toNearest;
		number = Math.round(number);
		number = number * toNearest;
		number = number * (Math.pow(10, placeValue));
		number = Math.round(number * 1000000000) / 1000000000;
		return number;
	}
}
function roundSF(number, sigFigs, showAllZeros) {
	if (un(sigFigs)) sigFigs = 1;
	var negative = number < 0 ? true : false;
	number = Math.abs(number);
	var pv = Math.floor(Math.log(number)/Math.log(10)) - (sigFigs-1);
	var toNearest = Math.pow(10,pv);
	var rounded = String(roundToNearest(number,toNearest));
	
	if (isNaN(rounded)) return '0';
	var sfCount = 0; // check number of sf in answer
	var dpPassed = false;
	for (var d = 0; d < rounded.length; d++) {
		if (rounded[d] == '-') continue;
		if (rounded[d] == '.') {
			if (sfCount >= sigFigs) {
				rounded = rounded.slice(0,d);
				break;
			} else {
				dpPassed = true;
				continue;
			}
		}
		if (sfCount == 0 && rounded[d] == '0') continue;
		sfCount++;
		if (dpPassed == true && sfCount == sigFigs) {
			rounded = rounded.slice(0,d+1);
			break;
		}
	}
	if (negative == true) rounded = '-'+rounded;
	return rounded;
}
/*
function roundSF(number, sigFigs, showAllZeros) { // old version
	if (!sigFigs) {sigFigs = 1};
	var multiplier = 1;
	if (number < 0) {multiplier = -1}
	number = Math.abs(number);
	
	var decPointPos;
	if (String(number).indexOf('.') !== -1) {
		decPointPos = String(number).indexOf('.');
	} else {
		decPointPos = String(number).length;	
	}
	
	var returnNum;
	
	if (Math.abs(number) >= 1) {
		number = multiplier * Math.round(number / Math.pow(10, decPointPos - sigFigs)) * Math.pow(10, decPointPos - sigFigs);
		if (decPointPos >= sigFigs) {
			returnNum = number.toFixed(0);
		} else {
			returnNum = number.toFixed(sigFigs + 1 - (decPointPos + 1));
		}
	} else {
		var firstSigFigPos;
		var jdoir = 0;
		do {
			jdoir++;
			if (String(number).charAt(jdoir) !== '0' && String(number).charAt(jdoir) !== '.') {
				firstSigFigPos = jdoir;
			}
			if (jdoir > String(number).length) {return 0}
		} while (!firstSigFigPos)
		number = multiplier * (Math.round(number * Math.pow(10, firstSigFigPos - decPointPos + sigFigs - 1)) / Math.pow(10, firstSigFigPos - decPointPos + sigFigs - 1));
		if (String(number).charAt(firstSigFigPos - 1) !== '0' && String(number).charAt(firstSigFigPos - 1) !== '.') {
			firstSigFigPos = firstSigFigPos - 1;
		}
		var toFixedPoint = Math.min(firstSigFigPos - decPointPos + sigFigs - 1, 20);
		returnNum = number.toFixed(toFixedPoint);
	}
	if (boolean(showAllZeros,true) == false) {
		returnNum = String(Number(returnNum));
	}
	return returnNum;
}
*/
function round(number,toNearest,returnAsString) { // toNearest must be a power of 10
	var sign = number < 0 ? '-' : '';
	//var str = String(number.toFixed(Math.abs(number),99));
	var str = String(Math.abs(number));
	var decPos = str.indexOf('.') > -1 ? str.indexOf('.') : str.length;
	var digits = [];
	for (var n = 0; n < str.length; n++) {
		if (isNaN(Number(str[n]))) continue;
		digits.push(Number(str[n]));
	}
	var roundPV = Math.round(Math.log(toNearest)/Math.log(10));
	var roundPos = Math.round(decPos - roundPV - 1);
	if (roundPos >= digits.length) {
		var addDigits = roundPos-digits.length;
		for (var p = 0; p <= addDigits; p++) digits.push(0);
	} else {
		if (digits[roundPos+1] >= 5) {
			if (digits[roundPos] < 9) {
				digits[roundPos]++;
			} else {
				digits[roundPos] = 0;
				var done = false;
				var pos = roundPos-1;
				while (done == false) {
					if (pos == -1) {
						digits.unshift(1);
						roundPos++;
						decPos++;
						done = true;
					} else if (digits[pos] < 9){
						digits[pos]++;
						done = true;
					} else {
						digits[pos] = 0;
						pos--;
					}
				}
			}
		}
		for (var p = roundPos+1; p < digits.length; p++) digits[p] = 0;
	}
	
	var str2 = sign;
	for (var p = 0; p < digits.length; p++) {
		if (p == decPos) {
			if (roundPV < 0) {
				str2 += '.';
			} else {
				break;
			}
		}
		if (p == roundPos+1 && p > decPos) break;
		str2 += String(digits[p]);
	}
	if (Number(str2) == 0) str2 = '0';
	
	if (boolean(returnAsString,false) == true) {
		return str2;
	} else {
		return Number(str2);
	}
	//console.log(sign,str,toNearest,decPos,digits,roundPV,roundPos,str2);
}

function nthroot(x, n) {
  try {
    var negate = n % 2 == 1 && x < 0;
    if(negate)
      x = -x;
    var possible = Math.pow(x, 1 / n);
    n = Math.pow(possible, n);
    if(Math.abs(x - n) < 1 && (x > 0 == n > 0))
      return negate ? -possible : possible;
  } catch(e){}
}
function hcf(x, y) {
	x = Math.abs(x);
	y = Math.abs(y);
   // Apply Euclid's algorithm to the two numbers.
   while (Math.max(x, y) % Math.min(x, y) != 0) {
      if (x > y) {
         x %= y;
      }
      else {
         y %= x;
      }
   }
   // When the while loop finishes the minimum of x and y is the HCF.
   return Math.min(x, y);
}
function ran(minNum, maxNum) {
	return Math.floor((maxNum - minNum + 1) * Math.random()) + minNum;
}

function clickToHide(canvas, canvasctx, canvasData, font, textColor) {
	if (!font) {font = '12px Arial'};
	if (!textColor) {textColor = '#333'};
	canvasctx.font = font;
	canvasctx.fillStyle = textColor;
	canvasctx.textBaseline = 'bottom';
	canvasctx.textAlign = 'center';
	canvasctx.fillText('Click to close', canvasData[2] / 2, canvasData[3] - 3);
	canvas.style.pointerEvents = 'auto';
	canvas.onclick = function() {
		hideObj(canvas, canvasData);	
	}
}

// rotates coordinates about the origin (or a given center) and rounds to nearest integer
function rotateCoords(x, y, degrees, opt_direction, opt_centerX, opt_centerY, opt_round) {
	var round = true;
	if (typeof opt_round == 'boolean') {round = opt_round} 
	var direction = opt_direction || 'anti-cw'; // use 'cw' or 'anti-cw'
	var centerX = opt_centerX || 0; //optional centre of rotation
	var centerY = opt_centerY || 0;
	// convert to anti-cw and radians
	if (direction == 'cw') degrees = 360 - degrees;
 	var angleRads = degrees / 180 * Math.PI;
	// transpose to origin
	x -= centerX;
	y -= centerY;
	// apply matrix
	if (round == true) {
		var newX = Math.round(Math.cos(angleRads) * x - Math.sin(angleRads) * y);
		var newY = Math.round(Math.sin(angleRads) * x + Math.cos(angleRads) * y);
	} else {
		var newX = Math.cos(angleRads) * x - Math.sin(angleRads) * y;
		var newY = Math.sin(angleRads) * x + Math.cos(angleRads) * y;
	}
	// un-transpose
	newX += centerX;
	newY += centerY;
	return {x:newX, y:newY};
}

var variArray = ['a', 'b', 'c', 'd', 'g', 'h', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'y', 'y'];
function equivExpressions(string1, string2) { // checks if two algebraic expressions (as strings in x only) are equivalent
	if (string1 == '' || string2 == '') {return false;}
	var equivalent = true;
	// select 100 * 2 random numbers of different magnitudes
	for (mag = 0; mag < 10; mag++) {
		for (num = 0; num < 10; num++) {
			var x = Math.random() * Math.pow(10, mag);
			var val1 = eval(string1);
			var val2 = eval(string2);
			// get percentage error between values
			var pError = 0;
			if (val1 !== 0) {
				pError = Math.abs((val1 - val2) / val1);
			} else if (val2 !== 0) {
				pError = Math.abs((val1 - val2) / val2);
			}
			if (pError > 0.00001) {
				equivalent = false;
			}
			x = -1 * x;
			val1 = eval(string1);
			val2 = eval(string2);
			pError = 0;
			if (val1 !== 0) {
				pError = Math.abs((val1 - val2) / val1);
			} else if (val2 !== 0) {
				pError = Math.abs((val1 - val2) / val2);
			}
			if (pError > 0.00001) {
				equivalent = false;
			}
		}
	}
	return equivalent
}

function buildQuadraticExp(d,e,f,g,h,vari) {
	if (un(h)) h = 1;
	var a = h * d * f;
	var b = h * (d * g + e * f);
	var c = h * e * g;
	return buildQuadratic(a,b,c,d,e,f,g,h,vari);
}	
function buildQuadratic(a,b,c,d,e,f,g,h,vari) {
	// ax^2 + bx + c = h(dx + e)(fx + g)
	if (!vari) {
		var variNum = ran(0,50);
		vari = 'x';
		if (variNum < 19) vari = variArray[variNum];
	}
	var p, q, r, exp, fac, compSq, disc, qText, rText, root1Text, root2Text, vertexText, expJS, factors = [], factorisedForms = [], expandedTerms = [], expandedForms = [];	
	
	// create the expanded form text
	var aSign = '';
	var aFirstSign = '';
	var aTerm = String(Math.abs(a)) + vari;
	var aTermJS = String(Math.abs(a))+'*Math.pow('+vari+',2)';
	if (a > 0) aSign = ' + ';
	if (a < 0) aSign = ' - ';
	if (a < 0) aFirstSign = '-';
	if (a == 1 || a == -1) aTerm = vari;
	if (a == 1) aTermJS = 'Math.pow('+vari+',2)';
	if (a == -1) aTermJS = '-Math.pow('+vari+',2)';
	if (a == 0) aTerm = '';
		
	var bSign = '';
	var bFirstSign = '';
	var bTerm = String((Math.abs(b))) + vari;
	var bTermJS = String((Math.abs(b)))+'*'+vari;
	if (b > 0) bSign = ' + ';
	if (b < 0) bSign = ' - ';
	if (b < 0) bFirstSign = '-';
	if (b == 1 || b == -1) bTerm = vari;
	if (b == 1 || b == -1) bTermJS = vari;
	if (b == -1) bTermJS = vari;
	if (b == 0) bTerm = '';
	if (b == 0) bTermJS = '';

	var cSign = '';
	var cFirstSign = '';
	var cTerm = String(Math.abs(c));
	var cTermJS = String(Math.abs(c));	
	if (c > 0) cSign = ' + ';
	if (c < 0) cSign = ' - ';
	if (c < 0) cFirstSign = '-';
	if (c == 0) cTermJS = '';
	if (c == 0) cTerm = '';

	var expTermsMathsText = [[aFirstSign, aTerm], [bFirstSign, bTerm], [cFirstSign, cTerm]];
	var expFormsMathsText = [
		[aFirstSign+aTerm,['power',false,'2'],bSign,bTerm,cSign,cTerm],
		[aFirstSign+aTerm,['power',false,'2'],cSign,cTerm,bSign,bTerm],
		[bFirstSign+bTerm+aSign+aTerm,['power',false,'2'],cSign+cTerm],
		[bFirstSign+bTerm+cSign+cTerm+aSign+aTerm,['power',false,'2']],
		[cFirstSign+cTerm+aSign+aTerm,['power',false,'2'],bSign+bTerm],
		[cFirstSign+cTerm+bSign+bTerm+aSign+aTerm,['power',false,'2']]
	];
	var expTermsJS = [aTermJS,bTermJS,cTermJS];	
	var expFormsJS = [
		aFirstSign+aTermJS+bSign+bTermJS+cSign+cTermJS,
		aFirstSign+aTermJS+cSign+cTermJS+bSign+bTermJS,
		bFirstSign+bTermJS+aSign+aTermJS+cSign+cTermJS,
		bFirstSign+bTermJS+cSign+cTermJS+aSign+aTermJS,
		cFirstSign+cTermJS+aSign+aTermJS+bSign+bTermJS,
		cFirstSign+cTermJS+bSign+bTermJS+aSign+aTermJS,		
	]
	
	if (a > 0 || (a < 0 && b < 0 && c < 0)) {
		exp = expFormsMathsText[0];
		expJS = expFormsJS[0];
	} else if (c > 0) {
		exp = expFormsMathsText[5];
		expJS = expFormsJS[5];
	} else {
		exp = expFormsMathsText[3];				
		expJS = expFormsJS[3];
	}
	
	// create the factorised forms
	var factors = constructFactors(h,d,e,f,g,vari);
	var factorisedForms = constructFactorisedForms(factors);

	var hFactors = [];
	for (var hF = h; hF > 1; hF--) {
		if (h % hF == 0) hFactors.push(hF);	
	}
	
	var compositeFactors = [];
	var partiallyFactorisedForms = [];	
		
	//construct sets of factors;
	
	if (typeof d !== 'undefined' && typeof e !== 'undefined' && typeof f !== 'undefined' && typeof g !== 'undefined') {
		if (d < 0) {
			bracket1 = '(' + e + " - ";
			var dText = Math.abs(d);
			if (d == -1) dText = '';
			bracket1 += dText + vari + ')'
		} else {
			var eSign = " + ";
			if (e < 0) {eSign = " - "};
			var dText = d;
			if (d == 1) dText = "";
			if (d == -1) dText = "-";
			bracket1 = "(" + dText + vari + eSign + Math.abs(e) + ")"; 
		}
		
		if (f < 0) {
			bracket2 = '(' + g + " - ";
			var fText = Math.abs(f);
			if (f == -1) fText = '';
			bracket2 += fText + vari + ')'
		} else {
			var gSign = " + ";
			if (g < 0) {gSign = " - "};
			var fText = f;
			if (f == 1) fText = "";
			if (f == -1) fText = "-";
			bracket2 = "(" + fText + vari + gSign + Math.abs(g) + ")"; 
		}
		
		fac = bracket1 + bracket2;
		if (Math.random() < 0.5) fac = bracket2 + bracket1;
		if (bracket1 == bracket2) {fac = bracket1 + String.fromCharCode(0x00B2)};
		
		if (e == 0) {
			var dText = d;
			if (d == 1) dText = '';
			if (d == -1) dText = '-';
			bracket1 = dText + vari;

		}
		
		if (g == 0) {
			var fText = f;
			if (f == 1) fText = '';
			if (f == -1) fText = '-';
			bracket2 = fText + vari;
			fac = bracket2 + bracket1;
		}
		
		
		if (typeof h !== 'undefined') {
			var hTerm = h;
			if (h == 1) hTerm = '';
			if (h == -1) hTerm = '-';
			fac = hTerm + fac;

		}
	}

	// create the completed square form text			
	p = a;
	q = b / (2 * a);
	r = c - (b * b) / (4 * a);
	compSq = '';
	if (p > 0 || p < 0 && r <= 0) { 
		var pTerm = String(p);
		if (p == 1) pTerm = '';
		if (p == -1) pTerm = '-';
		var qSign = " + ";
		if (q < 0) qSign = " - ";
		var qTerm = toMathsText(b, 2*a);
		var rSign = " + ";
		if (r < 0) rSign = " - ";
		var rTerm = toMathsText(4*a*c-b*b, 4*a);
		if (r == 0) {
			rSign = '';
			rTerm = '';	
		}
		compSq = [pTerm + '(' + vari + qSign, qTerm, ')', ['pow', '', '2'], rSign, rTerm];
	} else if (p < 0 && r > 0) { // r - p(x +- q)^2
		var rTerm = toMathsText(4*a*c-b*b, 4*a);
		var qSign = " + ";
		if (q < 0) qSign = " - ";
		var qTerm = toMathsText(b, 2*a);
		var pTerm = toMathsText(p);
		if (p == -1) pTerm = '';
		compSq = [rTerm, ' - ' + pTerm + '(' + vari + qSign, qTerm, ')', ['pow', '', '2']];
	}

	// makes qText, rText and vertexText
	if (q < 0) {
		qText = ["-", qTerm];
		if (r < 0) {
			rText = ["-", rTerm];
			vertexText = ['(', qTerm, ', -', rTerm, ')'];
		} else {
			rText = rTerm;
			vertexText = ['(', qTerm, ', ', rTerm, ')'];
		}
	} else {
		qText = qTerm;
		if (r < 0) {
			rText = ["-", rTerm];
			vertexText = ['(-', qTerm, ', -', rTerm, ')'];
		} else {
			rText = rTerm;
			vertexText = ['(-', qTerm, ', ', rTerm, ')'];
		}
	}
	
	disc = b * b - 4 * a * c;
	
	// solves ax^2 + bx + c = 0
	var root1 = (-1 * b + Math.pow(b * b - 4 * a * c, 0.5)) / (2 * a);
	var root2 = (-1 * b - Math.pow(b * b - 4 * a * c, 0.5)) / (2 * a);
	
	// makes root1text and root2text
	// if non-surd solutions
	if (Math.pow(b * b - 4 * a * c, 0.5) == Math.round(Math.pow(b * b - 4 * a * c, 0.5))) {
		var root1sign = '';
		if ((-1 * b + Math.pow(b * b - 4 * a * c, 0.5)) / (2 * a) < 0) root1sign = '-';
		root1text = [root1sign, toMathsText((-1 * b + Math.pow(b * b - 4 * a * c, 0.5)), (2 * a))];
		var root2sign = '';
		if ((-1 * b - Math.pow(b * b - 4 * a * c, 0.5)) / (2 * a) < 0) root2sign = '-';
		root2text = [root2sign, toMathsText((-1 * b - Math.pow(b * b - 4 * a * c, 0.5)), (2 * a))];
	} else {
		var surd = simpSurd(b * b - 4 * a * c, 0.5);
		root1text = [toMathsText((-1 * b), (2 * a)), ' + ', toMathsText(1, (2 * a)), surd.mathsText];
		root2text = [toMathsText((-1 * b), (2 * a)), ' - ', toMathsText(1, (2 * a)), surd.mathsText];		
	}
		
	return {exp:exp, fac:fac, compSq:compSq, disc:disc, a:a, b:b, c:c, d:d, e:e, f:f, g:g, h:h, p:p, q:q, r:r, vari:vari, root1:root1, root2:root2, qText:qText, rText:rText, vertexText:vertexText, root1text:root1text, root2text:root2text, factors:factors, factorisedForms:factorisedForms, expTermsMathsText:expTermsMathsText, expFormsMathsText:expFormsMathsText, expTermsJS:expTermsJS, expFormsJS:expFormsJS, expJS:expJS}		
}
function quadratic(level, vari) {
	if (!vari) {
		var variNum = ran(0,50);
		vari = 'x';
		if (variNum < 19) vari = variArray[variNum];
	}
	// quadratic is (dx + e)(fx + g) = ax^2 + bx + c
	var a, b, c, d, e, f, g, h, p, q, r, exp, fac, compSq, disc, qText, rText, root1Text, root2Text, vertexText, expJS;
	var factors = [];
	var factorisedForms = [];
	var expandedTerms = [];
	var expandedForms = [];
	switch (level) {
		case 1 :
			// (x +- e)(x +- g) || dx(fx +- g)
			do {
				d = 1;
				e = ran(-10,10);
				f = 1;
				g = ran(-10,10);
			} while (g == 0) 
			
			if (e == 0) {
				d = ran(1, 3);
				do {
					f = ran(1, 3);
				} while (hcf(f,g) !== 1)
			}
			
			a = d * f;
			b = d * g + e * f;
			c = e * g;
			h = 1;

			break;
		case 2 :
			// h(x +- e)(x +- g), where h > 1
			do {
				d = 1;
				e = ran(-10,10);
				f = 1;
				g = ran(-10,10);
			} while (e == 0 || g == 0) 
			
			a = d * f;
			b = d * g + e * f;
			c = e * g;
			h = [2,2,3,4,5,10][ran(0,5)];
			break;	
		case 3 :
			// h(dx +- e)(fx +- g)  where d = 1 or f = 1 but not both
			do {
				d = ran(1,6);
				e = ran(-10,10);
				f = ran(1,6);
				g = ran(-10,10);
				h = Math.max(1,ran(-15,5));
			} while (e == 0 || g == 0 || (d == 1 && f == 1) || (d !== 1 && f !== 1) || hcf(d,e) > 1 || hcf(f,g) > 1)
			
			a = h * d * f;
			b = h * (d * g + e * f);
			c = h * e * g;
						
			break;			
		case 4 :
			// h(dx +- e)(fx +- g)  where d >= 1 and f >= 1
			do {
				d = ran(1,6);
				e = ran(-10,10);
				f = ran(1,6);
				g = ran(-10,10);
				h = Math.max(1,ran(-15,5));
			} while (e == 0 || g == 0 || (d == 1 && f == 1) || hcf(d,e) > 1 || hcf(f,g) > 1)
			
			a = h * d * f;
			b = h * (d * g + e * f);
			c = h * e * g;
						
			break;
		case 5 :
			// h(e - dx)(fx +- g)  
			do {
				d = ran(-6,-1);
				e = ran(1,10);
				f = ran(1,6);
				g = ran(-10,10);
				h = Math.max(1,ran(-15,5));
			} while (g == 0 || hcf(d,e) > 1 || hcf(f,g) > 1)
			
			a = h * d * f;
			b = h * (d * g + e * f);
			c = h * e * g;
					
			break;
		case 6 :
			// +-h(+-dx +- e)(+-fx +- g)  where d >= 1 and f >= 1
			do {
				d = ran(-3,3);
				e = ran(-10,10);
				f = ran(-3,3);
				g = ran(-10,10);
				h = ran(-3,3);
			} while (e == 0 || g == 0 || d == 0 || f == 0 || h == 0 || (d == 1 && f == 1) || hcf(d,e) > 1 || hcf(f,g) > 1)
			
			if (d < 0 && e < 0) {
				d = -d;
				e = -e;
				h = -h;	
			}
			if (f < 0 && g < 0) {
				f = -f;
				g = -g;
				h = -h;	
			}
			
			a = h * d * f;
			b = h * (d * g + e * f);
			c = h * e * g;
			
			break;
		case 7:
			// generates a quadratic ax^2 +- bx +- c that doesn't factorise
			do {
				a = ran(1, 5);
				b = ran(-100, 100);
				c = ran(-100, 100);
				var disc = Math.pow(b*b-4*a*c, 0.5);	
			} while (disc == Math.round(disc));
			h = 1;

			break;
		case 8:
			// generates a quadratic +-ax^2 +- bx +- c that doesn't factorise
			do {
				a = ran(-10, 10);
				b = ran(-100, 100);
				c = ran(-100, 100);
				var disc = Math.pow(b*b-4*a*c, 0.5);	
			} while (a == 0 || disc == Math.round(disc) || (b == 0 && c == 0));
			h = 1;
			
			break;
			
	}
	
	return buildQuadratic(a,b,c,d,e,f,g,h,vari);
}
function sketchQuad(context, quad, gridLeft, gridTop, gridWidth, gridHeight, xMin, xMax, yMin, yMax, yIntLabel, xIntLabel, vertexLabel, opt_fontSize) {
	// draws a sketch of the graph of a quadratic
	if (typeof yIntLabel !== 'boolean') yIntLabel = false;
	if (typeof xIntLabel !== 'boolean') xIntLabel = false;
	if (typeof vertexLabel !== 'boolean') vertexLabel = false;
	if (quad.q == 0 && vertexLabel == true) yIntLabel = true;
	var fontSize = opt_fontSize || (Math.min(gridWidth, gridHeight) / 13); 
	
	if (quad.a > 0) {
		// need to solve ax^2 + bx + c = yMax
		var maxVal = solveQuad(quad.a,quad.b,quad.c-yMax);
	} else {
		// need to solve ax^2 + bx + c = yMin
		var maxVal = solveQuad(quad.a,quad.b,quad.c-yMin);
	}
	var xStart = Math.max(xMin, maxVal.x2);
	var yStart = quad.a * xStart * xStart + quad.b * xStart + quad.c;
	var xFin = Math.min(xMax, maxVal.x1);
	var yFin = quad.a * xFin * xFin + quad.b * xFin + quad.c;
	
	var controlPoint = getBezierCurveForQuad(quad.a,quad.b,quad.c,xStart,yStart,xFin,yFin);
	
	var minPoint = {x:-1*quad.q, y:quad.r}
	
	var gridSta = convertGridCoordsToCanvas(xStart, yStart, gridLeft, gridTop, gridWidth, gridHeight, xMin, xMax, yMin, yMax);
	var gridFin = convertGridCoordsToCanvas(xFin, yFin, gridLeft, gridTop, gridWidth, gridHeight, xMin, xMax, yMin, yMax);
	var gridCon = convertGridCoordsToCanvas(controlPoint.x, controlPoint.y, gridLeft, gridTop, gridWidth, gridHeight, xMin, xMax, yMin, yMax);
	var gridMin = convertGridCoordsToCanvas(minPoint.x, minPoint.y, gridLeft, gridTop, gridWidth, gridHeight, xMin, xMax, yMin, yMax);
	var gridRoot1 = convertGridCoordsToCanvas(quad.root1, 0, gridLeft, gridTop, gridWidth, gridHeight, xMin, xMax, yMin, yMax);
	var gridRoot2 = convertGridCoordsToCanvas(quad.root2, 0, gridLeft, gridTop, gridWidth, gridHeight, xMin, xMax, yMin, yMax);
	var gridYInt = convertGridCoordsToCanvas(0, quad.c, gridLeft, gridTop, gridWidth, gridHeight, xMin, xMax, yMin, yMax);
	
	context.lineWidth = 1;
	context.strokeStyle = '#666';
	context.beginPath();
	context.moveTo(gridLeft, gridTop + 0.5 * gridHeight);
	context.lineTo(gridLeft + gridWidth, gridTop + 0.5 * gridHeight);
	context.moveTo(gridLeft + gridWidth * 0.5, gridTop);
	context.lineTo(gridLeft + gridWidth * 0.5, gridTop + gridHeight);
	context.stroke();
	context.strokeStyle = '#000';
	context.beginPath()
	context.moveTo(gridSta.x, gridSta.y);
	context.quadraticCurveTo(gridCon.x, gridCon.y, gridFin.x, gridFin.y);
	if (vertexLabel == true) {
		context.moveTo(gridMin.x - 5, gridMin.y - 5);
		context.lineTo(gridMin.x + 5, gridMin.y + 5);
		context.moveTo(gridMin.x - 5, gridMin.y + 5);
		context.lineTo(gridMin.x + 5, gridMin.y - 5);
	}
	context.stroke();
	
	context.font = "14px Arial";
	context.textBaseline = "middle";
	context.fillStyle = "#000";
	context.textAlign = 'center';
	if (quad.disc == 0) {
		if (xIntLabel == true || vertexLabel == true) drawMathsText(context, quad.root1text, fontSize, gridRoot1.x, gridRoot1.y+15, true, '', 'center', 'middle', '#000', 'draw', '#000');
		if (yIntLabel == true) drawMathsText(context, [String(quad.c)], fontSize, gridYInt.x+5, gridYInt.y, true, '', 'left', 'middle', '#000', 'draw', '#000');
	
	} else if (quad.a > 0) {
		if (xIntLabel == true) drawMathsText(context, quad.root1text, fontSize, gridRoot1.x+4, gridRoot1.y+12, true, '', 'left', 'middle', '#000', 'draw');
		if (xIntLabel == true) drawMathsText(context, quad.root2text, fontSize, gridRoot2.x-4, gridRoot1.y+12, true, '', 'right', 'middle', '#000', 'draw');
		if (quad.b !== 0) {
			var vertexY = gridMin.y+20;
			if (xIntLabel == true && vertexY - (gridTop + 0.5 * gridHeight) < 40) vertexY = gridTop + 0.5 * gridHeight + 40;  
			if (vertexLabel == true) drawMathsText(context, quad.vertexText, fontSize, gridMin.x, vertexY, true, '', 'center', 'middle', '#000', 'draw');
		}
		if (quad.c !== 0) {
			if (quad.q <= 0) {
				if (quad.b !== 0) {
					if (yIntLabel == true) drawMathsText(context, [String(quad.c)], fontSize, gridYInt.x-5, gridYInt.y, true, '', 'right', 'middle', '#000', 'draw');
				} else {
					if (yIntLabel == true) drawMathsText(context, [String(quad.c)], fontSize, gridYInt.x-5, gridYInt.y+15, true, '', 'right', 'middle', '#000', 'draw');					
				}
			} else {
				if (quad.b !== 0) {
					if (yIntLabel == true) drawMathsText(context, [String(quad.c)], fontSize, gridYInt.x+5, gridYInt.y, true, '', 'left', 'middle', '#000', 'draw');
				} else {
					if (yIntLabel == true) drawMathsText(context, [String(quad.c)], fontSize, gridYInt.x+5, gridYInt.y+15, true, '', 'left', 'middle', '#000', 'draw');					
				}	
			}
		}
	} else {
		// quads with a < 0

	}	
}
function constructFactors(z0,z1,z2,z3,z4,vari) {
	// z0 is h
	var hSign = '+';
	var hOppSign = '-';
	var hFirstSign = '';
	var hOppFirstSign = '-';
	if (z0 < 0) {
		hSign = '-';
		hOppSign = '+';
		hFirstSign = '-';
		hOppFirstSign = '';
	}
	var hTerm = String(Math.abs(z0));
	if (z0 == 1 || z0 == -1) hTerm = '';		
	
	// z1 is d (ie.dx)
	var dSign = '+';
	var dOppSign = '-';
	var dFirstSign = '';
	var dOppFirstSign = '-';
	if (z1 < 0) {
		dSign = '-';
		dOppSign = '+';
		dFirstSign = '-';
		dOppFirstSign = '';
	}		
	var dTerm = String(Math.abs(z1)) + vari;
	if (z1 == 1 || z1 == -1) dTerm = vari;
		
	// z2 is e
	var eSign = '+';
	var eOppSign = '-';
	var eFirstSign = '';
	var eOppFirstSign = '-';
	if (z2 < 0) {
		eSign = '-';
		eOppSign = '+';
		eFirstSign = '-';
		eOppFirstSign = '';
	}
	var eTerm = String(Math.abs(z2));
	if (z2 == 0) {
		eSign = '';
		eOppSign = '';
		eFirstSign = '';
		eOppFirstSign = '';
		eTerm = '';
	}
	
	// z3 is f (ie.fx)
	var fSign = '+';
	var fOppSign = '-';
	var fFirstSign = '';
	var fOppFirstSign = '-';
	if (z3 < 0) {
		fSign = '-';
		fOppSign = '+';
		fFirstSign = '-';
		fOppFirstSign = '';
	}
	var fTerm = String(Math.abs(z3)) + vari;
	if (z3 == 1 || z3 == -1) fTerm = vari;
		
	// z4 is g
	var gSign = '+';
	var gOppSign = '-';
	var gFirstSign = '';
	var gOppFirstSign = '-';
	if (z4 < 0) {
		gSign = '-';
		gOppSign = '+';
		gFirstSign = '-';
		gOppFirstSign = '';
	}
	var gTerm = String(Math.abs(z4));
	if (z4 == 0) {
		gSign = '';
		gOppSign = '';
		gFirstSign = '';
		gOppFirstSign = '';
		gTerm = '';
	}
	
	return [
	
		[hFirstSign+hTerm, dFirstSign+dTerm+eSign+eTerm, fFirstSign+fTerm+gSign+gTerm],
		[hFirstSign+hTerm, eFirstSign+eTerm+dSign+dTerm, fFirstSign+fTerm+gSign+gTerm],
		[hFirstSign+hTerm, dFirstSign+dTerm+eSign+eTerm, gFirstSign+gTerm+fSign+fTerm],
		[hFirstSign+hTerm, eFirstSign+eTerm+dSign+dTerm, gFirstSign+gTerm+fSign+fTerm],
	
		[hOppFirstSign+hTerm, dOppFirstSign+dTerm+eOppSign+eTerm, fFirstSign+fTerm+gSign+gTerm],
		[hOppFirstSign+hTerm, eOppFirstSign+eTerm+dOppSign+dTerm, fFirstSign+fTerm+gSign+gTerm],
		[hOppFirstSign+hTerm, dOppFirstSign+dTerm+eOppSign+eTerm, gFirstSign+gTerm+fSign+fTerm],
		[hOppFirstSign+hTerm, eOppFirstSign+eTerm+dOppSign+dTerm, gFirstSign+gTerm+fSign+fTerm],

		[hOppFirstSign+hTerm, dFirstSign+dTerm+eSign+eTerm, fOppFirstSign+fTerm+gOppSign+gTerm],
		[hOppFirstSign+hTerm, eFirstSign+eTerm+dSign+dTerm, fOppFirstSign+fTerm+gOppSign+gTerm],
		[hOppFirstSign+hTerm, dFirstSign+dTerm+eSign+eTerm, gOppFirstSign+gTerm+fOppSign+fTerm],
		[hOppFirstSign+hTerm, eFirstSign+eTerm+dSign+dTerm, gOppFirstSign+gTerm+fOppSign+fTerm],
		
		[hFirstSign+hTerm, dOppFirstSign+dTerm+eOppSign+eTerm, fOppFirstSign+fTerm+gOppSign+gTerm],
		[hFirstSign+hTerm, eOppFirstSign+eTerm+dOppSign+dTerm, fOppFirstSign+fTerm+gOppSign+gTerm],
		[hFirstSign+hTerm, dOppFirstSign+dTerm+eOppSign+eTerm, gOppFirstSign+gTerm+fOppSign+fTerm],
		[hFirstSign+hTerm, eOppFirstSign+eTerm+dOppSign+dTerm, gOppFirstSign+gTerm+fOppSign+fTerm],
	
	]
	
}
function constructFactorisedForms(factorsArray) {		
	var returnArray = [];
	for (var set = 0; set < factorsArray.length; set++) {		
		var fac = [factorsArray[set][0],factorsArray[set][1],factorsArray[set][2]];
		var facBrac = ['('+fac[0]+')','('+fac[1]+')','('+fac[2]+')'];
		var bracReqFirst = [false,true,true];
		var bracReq = [true,true,true];
		
		for (br = 0; br < fac.length; br++) {
			if (fac[br] == '-') facBrac[br] = '(-1)';	
			// if the factor doesn't contain + or -, no bracket required
			if (fac[br].indexOf('-') == -1 && fac[br].indexOf('+') == -1) bracReq[br] = false;
		}
		
		var first;
		var second;
		var third;
		
		for (br1 = 0; br1 < 3; br1++) {
			first = facBrac[br1];
			if (bracReqFirst[br1] == false) first = fac[br1]; 
			for (br2 = 0; br2 < 3; br2++) {
				if (br2 !== br1) {
					second = facBrac[br2];
					if (bracReq[br2] == false) second = fac[br2];
					for (br3 = 0; br3 < 3; br3++) {
						if (br3 !== br1 && br3 !== br2) {
							third = facBrac[br3];
							if (bracReq[br3] == false) third = fac[br3];
							
							if (returnArray.indexOf(first+second+third) == -1) {
								returnArray.push(first+second+third);
							}
							if (first == second && second == third && first !== '') {
								if (returnArray.indexOf('Math.pow('+first+',3)') == -1) returnArray.push('Math.pow('+first+',3)');
							}
							if (first == second && first !== '') {
								if (returnArray.indexOf('Math.pow('+first+',2)'+second) == -1) returnArray.push('Math.pow('+first+',2)'+second);
							}
							if (second == third && second !== '') {
								if (returnArray.indexOf(first+'Math.pow('+second+',2)') == -1) returnArray.push(first+'Math.pow('+second+',2)');
							}
						}
					}
				}
			}
		}
	}
	return returnArray;
}
function toMathsText(num, num2) {
	if (typeof num2 == 'undefined') {
		num = Math.abs(num);
		if (num == Math.round(num)) {
			return String(num);	
		} else {
			// if num is negative?
			var frac = decToFrac(num);
			return ['frac', String(frac.num), String(frac.denom)];
		}
	} else {
		if (num == 0) return '0';
		var pos = true;
		if (num/num2 < 0) pos = false;
		num = Math.abs(num)
		num2 = Math.abs(num2);
		var divisor = hcf(num, num2);
		num = num / divisor;
		num2 = num2 / divisor;
		if (num2 == 1) {
			if (pos == true) {
				return String(num);
			} else {
				return"-"+String(num);
			}
		} else {
			if (pos == true) {
				return ['frac', [String(num)], [String(num2)]];
			} else {
				return ['-',['frac', [String(num)], [String(num2)]]];				
			}
		}
	}
}
function addFracs(num1,denom1,num2,denom2) {
	var denom = denom1 * denom2 / hcf(denom1,denom2);
	var num = num1 * (denom / denom1) + num2 * (denom / denom2);
	//console.log(num,denom);
	return toMathsText(num,denom);
}
function simplifyFrac(object,textArrayOrObject) {
	var textArray = boolean(textArrayOrObject,true);
	
	var positive = true;
	if (object.num / object.denom < 0) positive = false; 
	if (object.num == 0) {
		if (textArray == true) {	
			return ["0"];
		} else {
			return {num:0,denom:1};	
		}
	}
	
	while (Math.round(object.num) !== object.num || Math.round(object.denom) !== object.denom) {
		object.num = object.num * 10;
		object.denom = object.denom * 10;	
	}
		
	var num = Math.abs(object.num);
	var denom = Math.abs(object.denom);
	var multOfPi = false;
	if (typeof object.multOfPi == 'boolean') multOfPi = object.multOfPi;
	var newNum = num / hcf(num,denom);
	var newDenom = denom / hcf(num,denom);
	
	if (textArray == true) { // if returning a textArray
		if (multOfPi == false) {
			if (newDenom == 1) {
				if (positive == true) {
					return String(newNum);
				} else {
					return "-"+String(newNum);	
				}
			} else {
				if (positive == true) {
					return ['frac', [String(newNum)], [String(newDenom)]]
				} else {
					return ['-',['frac', [String(newNum)], [String(newDenom)]]]
				}				
			}
		} else {
			if (newDenom == 1) {
				if (positive == true) {
					if (newNum == 1) {
						return String.fromCharCode(0x03C0);
					} else {
						return String(newNum)+String.fromCharCode(0x03C0); 
					}
				} else {
					if (newNum == 1) {
						return "-"+String.fromCharCode(0x03C0);
					} else {
						return "-"+String(newNum)+String.fromCharCode(0x03C0); 
					}
				}
			} else {
				if (positive == true) {
					if (newNum == 1) {
						return ['frac',[String.fromCharCode(0x03C0)],[String(newDenom)]];
					} else {
						return ['frac',[String(newNum)+ String.fromCharCode(0x03C0)],[String(newDenom)]];
					}
				} else {
					if (newNum == 1) {
						return ["-",['frac',[String.fromCharCode(0x03C0)],[String(newDenom)]]];
					} else {
						return ["-",['frac',[String(newNum)+ String.fromCharCode(0x03C0)],[String(newDenom)]]];
					}
				}				
			}			
		}
	} else { // if returning an object
		if (positive == true) {
			return {num:newNum,denom:newDenom};
		} else {
			return {num:-1*newNum,denom:newDenom};			
		}
	}
}
function simpSurd(c) {
	//takes sqrt(c) and returns simplified: a*sqrt(b)
	var a, b, mathsTextSurd;
	
	for (fac = 1; fac <= c; fac++) {
		if (Math.sqrt(c/fac) == Math.round(Math.sqrt(c/fac))) {
			a = Math.sqrt(c/fac);
			b = fac;
			break;
		}
	}
	
	var aTerm = String(a);
	if (a == 1) aTerm = "";
	mathsTextSurd = [aTerm, ['root', 2, String(b)]]
	
	return {a:a, b:b, mathsText:mathsTextSurd};
}
function primeFactors(num) {
	var primes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131];
	if (num == 1) return ['1'];
	if (num > 131) return ['']; // too big!
	if (primes.indexOf(num) > -1) return [String(num)];
	var primeFactors = [];
	do {
		for (var i = 0; i < primes.length; i++) {
			if (num % primes[i] == 0) {
				primeFactors.push(primes[i]);
				num = num / primes[i];
				break;
			}
		}
	} while (num > 1);
	var returnArray = [];
	for (var i = 0; i < primeFactors.length; i++) {
		var repeated = 1;
		for (var j = i + 1; j < primeFactors.length; j++) {
			if (primeFactors[i] == primeFactors[j]) repeated++;	
		}
		if (i > 0) returnArray.push(String.fromCharCode(0x00D7))
		returnArray.push(String(primeFactors[i]));
		if (repeated > 1) {
			returnArray.push(['power',false,[String(repeated)]]);
			i += repeated - 1;
		}
	}
	return returnArray;
}

function hitAndAlign (object, firstArray, secondArray, offsetX, offsetY) {
	//this function aligns a dragged object to the x and y position of another object		
	//first array is draggable buttons
	//second array is the things they are going to hit
	//this works for buttons	
	if (typeof offsetX == 'undefined') {offsetX=0} else {offsetX = Number(offsetX)}
	if (typeof offsetY == 'undefined') {offsetY=0} else {offsetY = Number(offsetY)}
	var alreadyHitMe = false
	for (var j =0; j< firstArray.length; j++) {
	
	if (hitTestTwoObjects(object,firstArray[j])==true && object !== firstArray[j]) {alreadyHitMe = true}
	
	}

	for (var j =0; j< secondArray.length; j++) {
		
	
	if (hitTestTwoObjects(object,secondArray[j])==true && alreadyHitMe == false) {

		var buttonArray = eval(String(taskTag) + 'button')
		var buttonArrayData = eval(String(taskTag) + 'buttonData')
		
		var butNum= buttonArray.indexOf(object)
		var butNum2= buttonArray.indexOf(secondArray[j])
		
		buttonArrayData[butNum][100] =buttonArrayData[butNum2][100] + Number(offsetX)
		buttonArrayData[butNum][101] =buttonArrayData[butNum2][101] +Number(offsetY)
		resize()
	}
	
		
	
	}
	
}
function hitAndAlignImages (object, firstArray, secondArray, offsetX, offsetY) {
	
	if (typeof offsetX == 'undefined') {offsetX=0} else {offsetX = Number(offsetX)}
	if (typeof offsetY == 'undefined') {offsetY=0} else {offsetY = Number(offsetY)}
	

	var alreadyHitMe = false
	for (var j =0; j< firstArray.length; j++) {
	
	if (hitTestTwoObjects(object,firstArray[j])==true && object !== firstArray[j]) {alreadyHitMe = true}
	
	}

	for (var j =0; j< secondArray.length; j++) {
		
	
	if (hitTestTwoObjects(object,secondArray[j])==true && alreadyHitMe == false) {

		var buttonArray = eval(String(taskTag) + 'imageCanvas')
		var buttonArrayData = eval(String(taskTag) + 'imageCanvasData')
		
		var butNum= buttonArray.indexOf(object)
		var butNum2= buttonArray.indexOf(secondArray[j])
		
		buttonArrayData[butNum][100] =buttonArrayData[butNum2][100] + Number(offsetX)
		buttonArrayData[butNum][101] =buttonArrayData[butNum2][101] + Number(offsetY)
		resize()
	}
	
		
	
	}
	
}
function shuffleImagePositions(arrayOfObjects) {
	
	var buttonArray = eval(String(taskTag) + 'imageCanvas')
	var buttonArrayData = eval(String(taskTag) + 'imageCanvasData')
	
	
	currentX = []
	currentY = []
		
	//get current x and y positions of all objects in array
	
	for (n201i=0; n201i< arrayOfObjects.length;n201i++) {
		var object = arrayOfObjects[n201i]
		
		
		var butNum= buttonArray.indexOf(object)
		
		
		currentX[n201i] = buttonArrayData[butNum][100]
		currentY[n201i] = buttonArrayData[butNum][101]
		
		
		
		}
	 var mixedNumbers = []
	 for (n201i=0; n201i< arrayOfObjects.length;n201i++) {mixedNumbers[n201i] = n201i}
	 mixedNumbers= shuffleArray(mixedNumbers)
	 
		
	for (n201i=0; n201i< arrayOfObjects.length;n201i++) {
		
	//arrayOfObjects = shuffleArray(arrayOfObjects)
	//choose random object from array
	
	var objectN = arrayOfObjects[mixedNumbers[n201i]]
	var butNumN= buttonArray.indexOf(objectN)

	buttonArrayData[butNumN][100] = currentX[n201i]
	buttonArrayData[butNumN][101] = currentY[n201i]
	//arrayOfObjects = arrayOfObjects.splice(ran,1)
	}
	
	resize()
}
function shuffleObjectPositions(arrayOfObjects) {
	
	var buttonArray = eval(String(taskTag) + 'button')
	var buttonArrayData = eval(String(taskTag) + 'buttonData')
	
	currentX = []
	currentY = []
		
	//get current x and y positions of all objects in array
	
	for (n201i=0; n201i< arrayOfObjects.length;n201i++) {
		var object = arrayOfObjects[n201i]
		
		var butNum= buttonArray.indexOf(object)
		
		currentX[n201i] = buttonArrayData[butNum][100]
		currentY[n201i] = buttonArrayData[butNum][101]
		
		
		
		}
	 var mixedNumbers = []
	 for (n201i=0; n201i< arrayOfObjects.length;n201i++) {mixedNumbers[n201i] = n201i}
	 mixedNumbers= shuffleArray(mixedNumbers)
	 
		
	for (n201i=0; n201i< arrayOfObjects.length;n201i++) {
		
	//arrayOfObjects = shuffleArray(arrayOfObjects)
	//choose random object from array
	
	var objectN = arrayOfObjects[mixedNumbers[n201i]]
	var butNumN= buttonArray.indexOf(objectN)

	buttonArrayData[butNumN][100] = currentX[n201i]
	buttonArrayData[butNumN][101] = currentY[n201i]
	//arrayOfObjects = arrayOfObjects.splice(ran,1)
	}
	
	resize()
}

function polygonArea(verticesArray) {
	verticesArray.push(verticesArray[0]);
	var area = 0;
	for (var i = 0; i < verticesArray.length - 1; i++) {
		area += (verticesArray[i][0] * verticesArray[i+1][1]) - (verticesArray[i][1] * verticesArray[i+1][0]);
	}
	area = 0.5 * Math.abs(area);
	return area;
}
function polygonCountSides(verticesArray) {
	// collapses polygon (ie. finds any three points that are on a straight line and reduces to single line)
	// returns number of sides/vertices of collapsed polygon
	var verticesNum = verticesArray.length - 1; // given number of vertices
	if (verticesNum < 3) return verticesNum;
	verticesArray.push(verticesArray[0]);
	verticesArray.push(verticesArray[1]);
	var verticesCount = 0; // return number of vertices
	for (var i = 0; i <= verticesNum; i++) {
		var point1 = verticesArray[i];
		var point2 = verticesArray[i+1];
		var point3 = verticesArray[i+2];
		var m1 = (point2[1] - point1[1]) / (point2[0] - point1[0]);
		var m2 = (point3[1] - point2[1]) / (point3[0] - point2[0]);
		var error = false;
		if (point1[0] == point2[0] && point1[1] == point2[1]) error = true;
		if (point1[0] == point3[0] && point1[1] == point3[1]) error = true;
		if (point3[0] == point2[0] && point3[1] == point2[1]) error = true;
		if (m1 !== m2 && error == false) verticesCount++;
	}
	verticesArray.splice(-2,2);
	logMe("verticesArray:", verticesArray, "polygon");
	return verticesCount;
}
function polygonSelfIntersect(verticesArray) {
	// vertices array such as [[], [], [], []]
	verticesArray.push(verticesArray[0]); // duplicate first vertex to last vertex
	var segmentArray = [];
	var events = [];
	
	logMe("verticesArray", verticesArray, "polygon");
		
	// create segments array [[x1,y1,x2,y2],[...],...] where x1 <= x2
	for (var i = 0; i < verticesArray.length - 1; i++) {
		segmentArray.push([verticesArray[i][0],verticesArray[i][1],verticesArray[i+1][0],verticesArray[i+1][1]]);
		
		// choose left-most end of segment to be 'start'
		var order;
		if (verticesArray[i][0] < verticesArray[i+1][0]) {
			order = 1;
		} else if (verticesArray[i][0] > verticesArray[i+1][0]) {
			order = 2;
		} else {
			if (verticesArray[i][1] < verticesArray[i+1][1]) {
				order = 1;
			} else {
				order = 2;
			}
		}
		
		if (order == 1) {
			events.push([verticesArray[i][0],verticesArray[i][1],i,'start']);
			events.push([verticesArray[i+1][0],verticesArray[i+1][1],i,'end']);
		} else {
			events.push([verticesArray[i][0],verticesArray[i][1],i,'end']);
			events.push([verticesArray[i+1][0],verticesArray[i+1][1],i,'start']);
		}
	}

	logMe("segmentArray", segmentArray, "polygon");
	logMe("events", events, "polygon");
	
	// sort the events by x value
	events.sort(function(a,b) {return a[0]-b[0]});

	var sweepLine = [];
	
	for (var j = 0; j < events.length; j++) {
		if (events[j][3] == 'start') {
			sweepLine.push([events[j][0],events[j][1],events[j][2]]); // x-value, y-value, lineSegmentId
			sweepLine.sort(function(a,b) {return a[1]-b[1]}); // sort sweepLine by y-value
			logMe("start,sweepLine", sweepLine, "polygon");
		} else if (events[j][3] == 'end') {
			logMe("end",events[j],"polygon")			
			// get position in sweepline (pos1) and segment id (seg1)
			var pos1, seg1;
			for (var k = 0; k < sweepLine.length; k++) {
				if (sweepLine[k][2] == events[j][2]) {
					pos1 = k;
					seg1 = segmentArray[k];
					break;
				}
			}
			logMe("pos1:",pos1,"polygon")
			logMe("seg1:",seg1,"polygon")
			// if not the lowest line, check for intersection with line below
			if (pos1 > 0) {
				var pos2 = sweepLine[pos1-1][2];
				var seg2 = segmentArray[pos2];
				logMe("pos2:",pos2,"polygon")
				logMe("seg2:",seg2,"polygon")
				logMe("intersects?",intersects(seg1[0],seg1[1],seg1[2],seg1[3],seg2[0],seg2[1],seg2[2],seg2[3]),"polygon");
				if (intersects(seg1[0],seg1[1],seg1[2],seg1[3],seg2[0],seg2[1],seg2[2],seg2[3]) == true) return true;
			}
			if (pos1 < sweepLine.length - 1) {
				var pos2 = sweepLine[pos1+1][2];
				var seg2 = segmentArray[pos2];
				logMe("pos2:",pos2,"polygon")
				logMe("seg2:",seg2,"polygon")
				logMe("intersects?",intersects(seg1[0],seg1[1],seg1[2],seg1[3],seg2[0],seg2[1],seg2[2],seg2[3]),"polygon");
				if (intersects(seg1[0],seg1[1],seg1[2],seg1[3],seg2[0],seg2[1],seg2[2],seg2[3]) == true) return true;
			}
		}
	}
	
	return false;
}

// array sorting function for key values
// use is:   array = array.sort(keySort('/*key*/'));
function keySort(key,desc) {
	return function(a,b){
		return desc ? ~~(a[key] < b[key]) : ~~(a[key] > b[key]);
	}
}
function arrayMin(array) {
	var min = array[0];
	for (var i = 1; i < array.length; i++) {
		 min = Math.min(min,array[i]);
	}
	return min;
}
function arrayMax(array) {
	var max = array[0];
	for (var i = 1; i < array.length; i++) {
		 max = Math.max(max,array[i]);
	}
	return max;
}
function cloneArray(array) {
	var newArray = [];
	for (var i = 0; i < array.length; i++) {
		newArray[i] = array[i].slice(0);
	}
	return newArray
}


function hexToRgb(color) {
	if (color.indexOf('rgba') > -1) { // if an rgba string
		var result = color.substring(5,color.length-1).replace(/ /g, '').split(',');
		return result ? {r: parseInt(result[0]),g: parseInt(result[1]),b: parseInt(result[2])} : null;
	} else if (color.indexOf('rgb') > -1) { // if an rgb string
		var result = color.substring(5,color.length-1).replace(/ /g, '').split(',');
		return result ? {r: parseInt(result[0]),g: parseInt(result[1]),b: parseInt(result[2])} : null;
	} else if (color.indexOf('#') > -1) { // if a hex string
		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		color = color.replace(shorthandRegex, function(m, r, g, b) {
			return r + r + g + g + b + b;
		});
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
		return result ? {r: parseInt(result[1],16),g: parseInt(result[2],16),b: parseInt(result[3],16)} : null;
	} else {
		return color;
	}
}
function colorA(color,alpha) {
	var colorRGB = hexToRgb(color);
	return "rgba("+colorRGB.r+","+colorRGB.g+","+colorRGB.b+","+alpha+")";
}
function invertColor(color) {
	if (/^(#)((?:[A-Fa-f0-9]{3}){1,2})$/i.test(color) == true) color = hexToRgb(color); // if hex, change to rgba
	color.r = 255-color.r;
	color.g = 255-color.g;
	color.b = 255-color.b;
	var a = 1;
	if (typeof color.a == 'number') a = color.a;
	return "rgba("+color.r+","+color.g+","+color.b+","+a+")";
}
function getShades(color,invert) {
	var invert = boolean(invert,false);
	if (invert == true) {
		var color2 = hexToRgb(invertColor(color));
	} else {
		var color2 = hexToRgb(color);
	}
	var r = color2.r;
	var g = color2.g;
	var b = color2.b;
	
	//var rgb = [];
	var hex = [];
	
	if (r == 0 && g == 0 && b == 0) { // if the color is black, switch it to white
		r = 255;
		g = 255;
		b = 255;
	}	
	
	// get brightest shade of rgb
	if (Math.max(r,g,b) < 255) {
		var m = 255 / Math.max(r,g,b);
		r = r * m;
		g = g * m;
		b = b * m;
	}
	
	for (var i = 0; i < 16; i++) {
		var r2 = roundToNearest((i/15)*r,1);
		var g2 = roundToNearest((i/15)*g,1);
		var b2 = roundToNearest((i/15)*b,1);
		//rgb[i] = "rgb("+String(r2)+","+String(g2)+","+String(b2)+")";
		var r3 = decToHex2Digits(r2);
		var g3 = decToHex2Digits(g2);
		var b3 = decToHex2Digits(b2);		
		hex[i] = "#"+r3+g3+b3;
	}

	return hex;
}
function decToHex2Digits(num) {
	num2 = num.toString(16);
	if (num2.length == 1) {
		num2 = "0" + num2;
	} else if (num2.indexOf('.') == 1) {
		num2 = "0" + num2.slice(0,1);
	} else {
		num2 = num2.slice(0,2);
	}
	return num2;
}
function testShades(ctx,color,invert) {
	var colors = getShades(color,invert);
	var ctx = draw[taskId].drawctx;
	ctx.strokeStyle = '#000';
	for (var i = 0; i < 16; i++) {
		ctx.fillStyle = colors[i];
		ctx.fillRect(50+i*50,50,50,50);
		ctx.strokeRect(50+i*50,50,50,50);
	}
}


function collapseLines(lineArray) { 
	// collapses lines in an array such as:
	// [ [[x1,y1],[x2,y2]], [[x3,y3],[x4,y4]], [[x5,y5],[x6,y6]] ]
	do {
		var joinFound = false;
		for (var i = 0; i < lineArray.length; i++) {
			if (joinFound == false) {
				for (var j = i+1; j < lineArray.length; j++) {
					var x1 = lineArray[i][0][0];
					var y1 = lineArray[i][0][1];
					var x2 = lineArray[i][1][0];
					var y2 = lineArray[i][1][1];
					var x3 = lineArray[j][0][0];
					var y3 = lineArray[j][0][1];
					var x4 = lineArray[j][1][0];
					var y4 = lineArray[j][1][1];
					var m1 = (y2-y1)/(x2-x1);
					var m2 = (y4-y3)/(x4-x3);
					// if gradients are equal and point from line 1 is on line 2
					//console.log('x1,y1,x2,y2,x3,y3,x4,y4');
					//console.log('grad/grad: ',mMax/mMin);
					//console.log('pointOnLine: ',isPointOnLine([x1,y1],[x3,y3],[x4,y4],3.5));
					if (((Math.abs(m1) == 'Infinity' && Math.abs(m2) == 'Infinity') || Math.abs(m1-m2) < 0.0001) && isPointOnLine([x1,y1],[x3,y3],[x4,y4],0.25) == true) {
						// if one of the points is between the two points on the other line
						if ((x1 >= Math.min(x3,x4) && x1 <= Math.max(x3,x4) && y1 >= Math.min(y3,y4) && y1 <= Math.max(y3,y4)) || (x2 >= Math.min(x3,x4) && x2 <= Math.max(x3,x4) && y2 >= Math.min(y3,y4) && y2 <= Math.max(y3,y4)) || (x3 >= Math.min(x1,x2) && x3 <= Math.max(x1,x2) && y3 >= Math.min(y1,y2) && y3 <= Math.max(y1,y2)) || (x4 >= Math.min(x1,x2) && x4 <= Math.max(x1,x2) && y4 >= Math.min(y1,y2) && y4 <= Math.max(y1,y2))) {
							var xMin = Math.min(x1,x2,x3,x4);
							var xMax = Math.max(x1,x2,x3,x4);
							if (xMin == x1) var yMin = y1;
							if (xMin == x2) var yMin = y2;
							if (xMin == x3) var yMin = y3;
							if (xMin == x4) var yMin = y4;
							if (xMax == x1) var yMax = y1;
							if (xMax == x2) var yMax = y2;
							if (xMax == x3) var yMax = y3;
							if (xMax == x4) var yMax = y4;
							if (xMin == xMax) {
								var yMin = Math.min(y1,y2,y3,y4);
								var yMax = Math.max(y1,y2,y3,y4);	
							}
							joinFound = true;
							lineArray[i][0] = [xMin,yMin];
							lineArray[i][1] = [xMax,yMax];
							lineArray.splice(j,1);
							break;
						}
					}
				}
			}
		}
	} while (joinFound == true);
	return lineArray;
}

function drawBarChart(object) {
	/* EXAMPLE USAGE:
	drawBarChart({
		ctx:j324buttonctx[0],
		left:200,
		top:240,
		width:500,
		height:370,
		data:[
			{value:['0'],	freq:17},
			{value:['1'],	freq:6},
			{value:['2'],	freq:3},
			{value:['3'],	freq:1},
			{value:['4'],	freq:2},
			{value:['5'],	freq:0},
			{value:['6'],	freq:1},
		],
		barWidth:[2,1], // bar width to gap width ratio
		barColor:'#FCF',
		barOutlineColor:'#000',
		barOutlineWidth:4,
		xLabel:['number of days'],
		yLabel:['frequency'],
		title:['Number of days absent in a month for a class'],
		titlePos:[450,260,200,90],
		yMinor:{show:true,step:1,color:'#AAA',width:1,dash:[3,5]},
		yMajor:{show:true,step:2,color:'#888',width:2,dash:[]},
		yMin:0,
		yMax:18,
	});
	*/
	
	var ctx = object.ctx || object.context;
	var left = object.left;
	var top = object.top;
	var width = object.width;
	var height = object.height;
	var data = object.data;
	
	var barWidth = object.barWidth || [2,1];
	var barColor = object.barColor || '#FCF';
	var barOutlineColor = object.barOutlineColor || '#000';
	var barOutlineWidth = object.barOutlineWidth || 2;
	var xLabel = object.xLabel || [''];
	var yLabel = object.yLabel || [''];
	var title = object.title || [''];
	var titlePos = object.titlePos || [left+0.5*width,top+0.03*height,0.4*width,0.2*height];
	
	if (typeof object.yMinor == 'object') {
		var yMinorShow = boolean(object.yMinor.show,false);
		var yMinorStep = object.yMinor.step || 1;
		var yMinorColor = object.yMinor.color || '#AAA';
		var yMinorWidth = object.yMinor.width || 1;
		var yMinorDash = object.yMinor.dash || [];
	} else {
		var yMinorShow = false;
		var yMinorStep = 1;
		var yMinorColor = '#AAA';
		var yMinorWidth = 1;
		var yMinorDash = [];		
	}
	
	if (typeof object.yMajor == 'object') {
		var yMajorShow = boolean(object.yMajor.show,false);
		var yMajorStep = object.yMajor.step || 1;
		var yMajorColor = object.yMajor.color || '#888';
		var yMajorWidth = object.yMajor.width || 2;
		var yMajorDash = object.yMajor.dash || [];
	} else {
		var yMajorShow = false;
		var yMajorStep = 1;
		var yMajorColor = '#888';
		var yMajorWidth = 2;
		var yMajorDash = [];		
	}
	
	if (object.yMin == 'number') {
		var yMin = object.yMin;
	} else {
		var yMin = 0;
	}
	
	if (object.yMax == 'number') {
		var yMax = object.yMax;
	} else {
		var yMax = 0;
		for (var i = 0; i < data.length; i++) {
			yMax = Math.max(yMax,data[i].freq+1);	
		}
		var steps = Math.floor(yMax/yMajorStep);
		while(yMax % yMajorStep > 0 || yMax/yMajorStep < steps+1) {
			yMax++;	
		}
	}
	
	// work out the spacing for minor and major steps
	var yMinorSpacing = (height * yMinorStep) / (yMax - yMin);
	var yMajorSpacing = (height * yMajorStep) / (yMax - yMin);
	
	// work out the coordinates of the origin
	var x0 = left;
	var y0 = top + (yMax * height) / (yMax - yMin);
	
	// work out the actual display position of the origin (ie. at the edge if it is off the grid)
	var x0DisplayPos = left;
	var y0DisplayPos = top + height;
	
	ctx.save();
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	if (yMinorShow == true) {
		ctx.beginPath();
		ctx.strokeStyle = yMinorColor;
		ctx.lineWidth = yMinorWidth;
		if (!ctx.setLineDash) {ctx.setLineDash = function () {}}
		ctx.setLineDash(yMinorDash);
		var yAxisPoint = y0 - yMinorSpacing;
		while (yAxisPoint > top) {
			if (yAxisPoint < top + height) {
				ctx.moveTo(left, yAxisPoint);
				ctx.lineTo(left + width, yAxisPoint);
			}
			yAxisPoint -= yMinorSpacing;
		}
		var yAxisPoint = y0 + yMinorSpacing;
		while (yAxisPoint <= top + height) {
			if (yAxisPoint >= top) {
				ctx.moveTo(left, yAxisPoint);
				ctx.lineTo(left + width, yAxisPoint);
			}
			yAxisPoint += yMinorSpacing;
		}
		ctx.stroke();
	}
	
	if (yMajorShow == true) {
		ctx.beginPath();		
		ctx.strokeStyle = yMajorColor;
		ctx.lineWidth = yMajorWidth;
		if (!ctx.setLineDash) {ctx.setLineDash = function () {}}
		ctx.setLineDash(yMajorDash);
		var yAxisPoint = y0 - yMajorSpacing;
		while (yAxisPoint > top - 0.00001) {
			if (yAxisPoint < (top + height + 0.00001)) {
				ctx.moveTo(left, yAxisPoint);
				ctx.lineTo(left + width, yAxisPoint);
			}
			yAxisPoint -= yMajorSpacing;
		}
		var yAxisPoint = y0 + yMajorSpacing;
		while (yAxisPoint < top + height + 0.00001) {
			if (yAxisPoint > top - 0.00001) {
				ctx.moveTo(left, yAxisPoint);
				ctx.lineTo(left + width, yAxisPoint);
			}
			yAxisPoint += yMajorSpacing;
		}
		ctx.stroke();
	}	
	
	// draw axes
	ctx.beginPath();
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 3;	
	if (!ctx.setLineDash) {ctx.setLineDash = function () {}}
	ctx.setLineDash([]);
	// if neccesary, draw x-Axis
	if (y0 >= top && y0 <= top + height) {
		ctx.moveTo(left, y0);
		ctx.lineTo(left + width, y0);	
	}
	ctx.stroke();
	ctx.beginPath();
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 3;
	// if neccesary, draw y-Axis
	if (x0 >= left && x0 <= left + width) {
		ctx.moveTo(x0, top);
		ctx.lineTo(x0, top + height);	
	}
	ctx.stroke();

	// draw yAxes numbers
	ctx.font = '24px Arial';
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	ctx.lineWidth = 2;
	ctx.strokeStyle = yMajorColor;
	ctx.textBaseline = "middle";
	ctx.textAlign = "right";
	ctx.fillStyle = '#000';
	var fontSize = 24;
	
	// positive y numbers
	var yAxisPoint = y0;
	var major = 0;
	var placeValue = Math.pow(10,Math.floor(Math.log(yMajorStep)/Math.log(10)));	
	while (yAxisPoint >= top - 0.0001) {
		if (yAxisPoint <= top + height) {	
			var axisValue = Number(roundSF(major*yMajorStep, 5));
			var textWidth = ctx.measureText(String(axisValue)).width	
			ctx.clearRect(x0DisplayPos - textWidth - 16, yAxisPoint - fontSize * 0.5, textWidth + 3, fontSize);
			ctx.beginPath();
			ctx.moveTo(x0DisplayPos,yAxisPoint);
			ctx.lineTo(x0DisplayPos - 8,yAxisPoint);
			ctx.stroke();
			wrapText(ctx, String(axisValue), x0DisplayPos - 7, yAxisPoint - 2, 50, 40, fontSize + 'px Arial');
		}
		major += 1;
		yAxisPoint -= yMajorSpacing;
	}
	// negative y numbers
	var yAxisPoint = y0 + yMajorSpacing;
	var major = -1;
	while (yAxisPoint <= top + height + 0.0001) {
		if (yAxisPoint >= top) {
			var axisValue = Number(roundSF(major*yMajorStep, 5));
			var textWidth = ctx.measureText(String(axisValue)).width	
			ctx.clearRect(x0DisplayPos - textWidth - 16, yAxisPoint - fontSize * 0.5, textWidth + 3, fontSize);
			ctx.beginPath();
			ctx.moveTo(x0DisplayPos,yAxisPoint);
			ctx.lineTo(x0DisplayPos - 8,yAxisPoint);
			ctx.stroke();
			wrapText(ctx, String(axisValue), x0DisplayPos - 7, yAxisPoint - 2, 50, 40, fontSize + 'px Arial');
		}
		major -= 1;
		yAxisPoint += yMajorSpacing;
	}
	
	// draw axes
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.moveTo(left,top);
	ctx.lineTo(left,top+height);
	ctx.lineTo(left+width,top+height);
	ctx.stroke();	
	
	var ySpacing = height / (yMax - yMin);
	var xSpacing = width / (data.length * barWidth[0] + (data.length + 1) * barWidth[1]);
	var l = [];
	
	ctx.beginPath();
	for (var i = 0; i < data.length; i++) {
		l[i] = left + i * barWidth[0] * xSpacing + (i + 1) * barWidth[1] * xSpacing;
		drawMathsText(ctx,data[i].value,24,l[i]+0.5*xSpacing*barWidth[0],top+height+5,false,[],'center','top','#000');
		//ctx.moveTo(l[i]+0.5*xSpacing*barWidth[0],top+height);
		//ctx.lineTo(l[i]+0.5*xSpacing*barWidth[0],top+height+5);
	}
	ctx.stroke();
	
	ctx.lineWidth = barOutlineWidth;
	ctx.strokeStyle = barOutlineColor;
	ctx.fillStyle = barColor;	
	ctx.beginPath();

	for (var i = 0; i < data.length; i++) {
		var t = top + height - ySpacing * data[i].freq;
		var h = ySpacing * data[i].freq;
		ctx.fillRect(l[i],t,xSpacing*barWidth[0],h);
		ctx.strokeRect(l[i],t,xSpacing*barWidth[0],h);
	}
	
	if (arraysEqual(xLabel,['']) == false) {
		text({
			context:ctx,
			textArray:['<<align:center>><<font:Arial>><<fontSize:24>><<color:#000>>'+xLabel],
			left:left+width-200,
			width:200,
			top:top+height+30,
		});
	}
	
	if (arraysEqual(yLabel,['']) == false) {
		text({
			context:ctx,
			textArray:['<<align:right>><<font:Arial>><<fontSize:24>><<color:#000>>'+yLabel],
			left:left-50-200,
			width:200,
			top:top+height*0.03,
		});
	}	
	
	if (arraysEqual(title,['']) == false) {
		text({
			context:ctx,
			textArray:['<<align:center>><<font:Arial>><<fontSize:24>><<color:#000>>'+title],
			left:titlePos[0],
			top:titlePos[1],
			width:titlePos[2],
			maxHeight:titlePos[3],
			box:{color:'#FFC',dash:[],border:'#000',borderWidth:3,radius:5,pos:[titlePos[0]-10,titlePos[1]-5,titlePos[2]+12,titlePos[3]+10]}
			// box.pos may need tweaking when text has been improved
		});
	}	
}

function isNode(o){ //Returns true if it is a DOM node
  return (
    typeof Node === "object" ? o instanceof Node : 
    o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
  );
}
function isElement(o){ //Returns true if it is a DOM element    

  return (
    typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
    o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
);
}

/***************************/
/*					  	   */
/*     VECTOR GEOMETRY     */
/*				  	  	   */
/***************************/

function getVectorAB(a,b) {
	return [b[0]-a[0],b[1]-a[1]];
}
function getUnitVector(vector) {
	var mag = Math.sqrt(Math.pow(vector[0],2)+Math.pow(vector[1],2));
	return [vector[0]/mag,vector[1]/mag];
}
function setVectorMag(vector,mag) {
	var unit = getUnitVector(vector);
	return [unit[0]*mag,unit[1]*mag];
}
function getDist(a,b) {
	return Math.sqrt(Math.pow(b[0]-a[0],2)+Math.pow(b[1]-a[1],2));
}
function getPerpVector(vector,dir) {
	if (un(dir)) dir = 1;
	if (dir == 1) {
		return [-1*vector[1],vector[0]];
	} else {
		return [vector[1],-1*vector[0]];
	}
}
function pointAddVector(point,vector,scalarMult) {
	if (un(scalarMult)) scalarMult = 1;
	return [point[0]+scalarMult*vector[0],point[1]+scalarMult*vector[1]];
}
function getVectorMag(vector) {
	return Math.sqrt(Math.pow(vector[0],2)+Math.pow(vector[1],2));
}
function getVectorAngle(vector) {
	var angle = Math.atan(vector[1]/vector[0]);
	if (vector[0] >= 0 && vector[1] >= 0) return angle;
	if (vector[0] >= 0 && vector[1] < 0) return angle + 2 * Math.PI;
	if (vector[0] < 0) return angle + Math.PI;	
}
function rotateVector(vector,angle) {
	var mag = Math.sqrt(Math.pow(vector[0],2)+Math.pow(vector[1],2));
	var theta = getVectorAngle(vector) + angle;
	return [mag*Math.cos(theta),mag*Math.sin(theta)];
}
function getVectorLinesIntersection(p1,v1,p2,v2) {
	var lambda = (p1[1] * v2[0] + p2[0] * v2[1] - p1[0] * v2[1] - p2[1] * v2[0]) / (v1[0] * v2[1] - v1[1] * v2[0]);
	return pointAddVector(p1,v1,lambda);
}
function getMidpoint(p1,p2) {
	return [(p1[0]+p2[0])/2,(p1[1]+p2[1])/2];
}
function getFootOfPerp(p,v,q) { // foot of perp from point q to line p + kv
	var lambda = (q[0]*v[0]+q[1]*v[1]-p[0]*v[0]-p[1]*v[1])/(v[0]*v[0]+v[1]*v[1]);
	return pointAddVector(p,v,lambda);
}

function intersects(a,b,c,d,p,q,r,s) {
	// returns true iff the line segemnt from (a,b)->(c,d) intersects with the line segment from (p,q)->(r,s)
  var det, gamma, lambda;
  det = (c - a) * (s - q) - (r - p) * (d - b);
  logMe ("det", det, "polygon");
  if (det === 0) {
    return false;
  } else {
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
	logMe ("lambda", lambda, "polygon");
	logMe ("gamma", gamma, "polygon");
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }
};
function intersects2(a,b,c,d,p,q,r,s) {
// returns true iff the infinite line though (a,b) & (c,d) intersects with line segment (p,q)->(r,s)
	var int = intersection(a,b,c,d,p,q,r,s);
	return isPointOnLineSegment(int,[p,q],[r,s]);
};
function intersection(aX,aY,bX,bY,cX,cY,dX,dY) {	// finds and returns the intersection point of the lines AB and CD
	if (aX !== bX && cX !== dX) {
		var m1 = (bY-aY)/(bX-aX); // gradient of AB;
		var m2 = (dY-cY)/(dX-cX); // gradient of CD;
		if (m1 == m2) return 'parallel';	
		var xIntersection = ((aY-aX*m1)-(cY-cX*m2))/(m2-m1);
		var yIntersection = aY+m1*(xIntersection-aX);
		return [xIntersection, yIntersection];
	} else if (aX == bX && cX == dX) {
		return 'parallel';
	} else if (aX == bX) {
		// if AB is vertical
		var m2 = (dY-cY)/(dX-cX); // gradient of CD;
		var xIntersection = aX;
		var yIntersection = cY+m2*(xIntersection-cX);
		return [xIntersection, yIntersection];
	} else if (cX == dX) {
		// if CD is vertical
		var m1 = (bY-aY)/(bX-aX); // gradient of AB;
		var xIntersection = cX;
		var yIntersection = aY+m1*(xIntersection-aX);
		return [xIntersection, yIntersection];
	}
}
function dist(x1,y1,x2,y2) {
	return Math.pow(Math.pow(x2-x1,2)+Math.pow(y2-y1,2),0.5);	
}
function midpoint(x1,y1,x2,y2) {
	return [0.5*(x1+x2),0.5*(y1+y2)];	
}
function collapsePath(path) {
	var path1 = path.slice(0);
	
	do {	
		var joinFound = false;
		for (var i = path1.length-1; i >= 0; i--) {
			if (joinFound == false) {
				for (var j = i-1; j >= 0; j--) {
					if (path1[i].obj[0].type == path1[j].obj[0].type) {
						if (path1[i].type == 'pen') {
							
						} else if (path1[i].obj[0].type == 'line') {
							var x1 = path1[i].obj[0].startPos[0];
							var y1 = path1[i].obj[0].startPos[1];
							var x2 = path1[i].obj[0].finPos[0];
							var y2 = path1[i].obj[0].finPos[1];
							var x3 = path1[j].obj[0].startPos[0];
							var y3 = path1[j].obj[0].startPos[1];
							var x4 = path1[j].obj[0].finPos[0];
							var y4 = path1[j].obj[0].finPos[1];
							var m1 = (y2-y1)/(x2-x1);
							var m2 = (y4-y3)/(x4-x3);
							if (Math.abs(m1) > Math.abs(m2)) {
								var mMax = m1;
								var mMin = m2;
							} else {
								var mMax = m2;
								var mMin = m1;
							}
							// if gradients are equal and point from line 1 is on line 2
							//console.log('grad/grad: ',mMax/mMin);
							//console.log('pointOnLine: ',isPointOnLine([x1,y1],[x3,y3],[x4,y4],3.5));
							if (((mMin >= 0 && mMax >= 0) || (mMin < 0 && mMax < 0)) && Math.abs(mMax/mMin) < 1.1 && isPointOnLine([x1,y1],[x3,y3],[x4,y4],3.5) == true) {
								// if one of the points is between the two points on the other line
								if ((x1 >= Math.min(x3,x4) && x1 <= Math.max(x3,x4) && y1 >= Math.min(y3,y4) && y1 <= Math.max(y3,y4)) || (x2 >= Math.min(x3,x4) && x2 <= Math.max(x3,x4) && y2 >= Math.min(y3,y4) && y2 <= Math.max(y3,y4)) || (x3 >= Math.min(x1,x2) && x3 <= Math.max(x1,x2) && y3 >= Math.min(y1,y2) && y3 <= Math.max(y1,y2)) || (x4 >= Math.min(x1,x2) && x4 <= Math.max(x1,x2) && y4 >= Math.min(y1,y2) && y4 <= Math.max(y1,y2))) {
									var xMin = Math.min(x1,x2,x3,x4);
									var xMax = Math.max(x1,x2,x3,x4);
									if (xMin == x1) var yMin = y1;
									if (xMin == x2) var yMin = y2;
									if (xMin == x3) var yMin = y3;
									if (xMin == x4) var yMin = y4;
									if (xMax == x1) var yMax = y1;
									if (xMax == x2) var yMax = y2;
									if (xMax == x3) var yMax = y3;
									if (xMax == x4) var yMax = y4;
									joinFound = true;
									path1[i].startPos = [xMin,yMin];
									path1[i].finPos = [xMax,yMax];
									path1.splice(j,1);
									break;		
								}
							}
						} else if (path1[i].obj[0].type == 'arc') {
							if (Math.abs(path1[i].obj[0].center[0]-path1[j].obj[0].center[0]) < 2 && Math.abs(path1[i].obj[0].center[1]-path1[j].obj[0].center[1]) < 2 && Math.abs(path1[i].obj[0].radius-path1[j].obj[0].radius) < 2) {
								if ((path1[i].obj[0].startAngle >= path1[j].obj[0].startAngle && path1[i].obj[0].startAngle <= path1[j].obj[0].finAngle) ||
									/* if min angle of first is between min & max angle of second*/
								(path1[i].obj[0].finAngle >= path1[j].obj[0].startAngle && path1[i].obj[0].finAngle <= path1[j].obj[0].finAngle) ||
									/* if max angle of first is between min & max angle of second*/
								(path1[j].obj[0].startAngle >= path1[i].obj[0].startAngle && path1[j].obj[0].startAngle <= path1[i].obj[0].finAngle) ||
									/* if min angle of second is between min & max angle of first*/
								(path1[j].obj[0].finAngle >= path1[i].obj[0].startAngle && path1[j].obj[0].finAngle <= path1[i].obj[0].finAngle) ||
									/* if max angle of second is between min & max angle of first*/
								(path1[i].obj[0].startAngle <= path1[j].obj[0].startAngle && path1[i].obj[0].finAngle >= path1[j].obj[0].finAngle) ||
									/* if second is contained within first*/
								(path1[j].obj[0].startAngle <= path1[i].obj[0].startAngle && path1[j].obj[0].finAngle >= path1[i].obj[0].finAngle)) 
									/* if first is contained within second*/						
								{
									joinFound = true;
									path1[i].obj[0].startAngle = Math.min(path1[i].obj[0].startAngle,path1[j].obj[0].startAngle);
									path1[i].obj[0].finAngle = Math.max(path1[i].obj[0].finAngle,path1[j].obj[0].finAngle);
									path1.splice(j,1);
									break;		
								}
							}
						}
					}
				}
			}
		}
	} while (joinFound == true);
	
	return path1;
}
function getIntersectionPoints(path) {
	// currently only handles line/line, line/arc and arc/arc intersections
	var intPoints = [];
	for (var i = 0; i < path.length; i++) {
		if (typeof path[i].obj == 'undefined') continue; 
		for (var j = 0; j < path[i].obj.length; j++) {
			var obj1 = path[i].obj[j];
			if (obj1.drawing == true) continue;
			for (var k = i; k < path.length; k++) {
				for (var l = 0; l < path[k].obj.length; l++) {
					if (i == k && j == l) continue;
					var obj2 = path[k].obj[l];
					if (obj2.drawing == true) continue;
					if (obj1.type == 'line' && obj2.type == 'line') {
						var int = intersection(obj1.startPos[0],obj1.startPos[1],obj1.finPos[0],obj1.finPos[1],obj2.startPos[0],obj2.startPos[1],obj2.finPos[0],obj2.finPos[1]);
						if (isPointOnLineSegment(int,obj1.startPos,obj1.finPos) == true) intPoints.push(int);
					} else if (obj1.type == 'line' && obj2.type == 'arc') {
						var int = lineCircleIntersections(obj1.startPos,obj1.finPos,obj2.center,obj2.radius);
						for (var m = 0; m < int.length; m++) {
							if (isPointOnLineSegment(int[m],obj1.startPos,obj1.finPos) == true && isAngleInPath(obj2,obj2.center,obj2.radius,int[m][2],1) == true) intPoints.push(int[m]);					
						}
					} else if (obj1.type == 'arc' && obj2.type == 'line') {
						var int = lineCircleIntersections(obj2.startPos,obj2.finPos,obj1.center,obj1.radius);
						for (var m = 0; m < int.length; m++) {
							if (isPointOnLineSegment(int[m],obj2.startPos,obj2.finPos) == true && isAngleInPath(obj1,obj1.center,obj1.radius,int[m][2],1) == true) intPoints.push(int[m]);					
						}
					} else if (obj1.type == 'arc' && obj2.type == 'arc') {
						var int = circleIntersections(obj1.center[0],obj1.center[1],obj1.radius,obj2.center[0],obj2.center[1],obj2.radius);
						for (var m = 0; m < int.length; m++) {
							var a = isPointOnArc(int[m],obj1);
							var b = isPointOnArc(int[m],obj2);
							if (a == true && b == true) intPoints.push(int[m]);					
						}
					}
				}
			}
		}
	}
	return intPoints;
}
function getEndPoints(path) {
	// currently only handles pen, line and arc paths
	var endPoints = [];
	for (var i = 0; i < path.length; i++) {
		if (typeof path[i].obj == 'undefined') continue; 
		for (var j = 0; j < path[i].obj.length; j++) {
			if (path[i].obj[j].drawing == true) continue;
			switch (path[i].obj[j].type) {
				case 'line':
					endPoints.push(path[i].obj[j].startPos,path[i].obj[j].finPos);
					break;
				case 'arc':
					var arcEnds = getEndPointsOfArc(path[i].obj[j]);
					for (var k = 0; k < arcEnds.length; k++) {
						endPoints.push(arcEnds[k]);
					}
					break;				
			}
		}
	}
	return endPoints;		
}
function isAngleInPath(arcPath,center,radius,angle,tolerance){
	if (dist(arcPath.center[0],arcPath.center[1],center[0],center[1]) > tolerance) return false;
	if (Math.abs(arcPath.radius - radius) > tolerance) return false;
	var startAngle = arcPath.startAngle;
	var finAngle = arcPath.finAngle;
	if (arcPath.clockwise == true) {
		if (startAngle < angle && finAngle > angle) return true;
		if (startAngle+2*Math.PI < angle && finAngle+2*Math.PI > angle) return true;
		if (startAngle-2*Math.PI < angle && finAngle-2*Math.PI > angle) return true;		
	} else {
		if (startAngle < finAngle) startAngle += 2 *Math.PI;
		if (startAngle > angle && finAngle < angle) return true;
		if (startAngle+2*Math.PI > angle && finAngle+2*Math.PI < angle) return true;
		if (startAngle-2*Math.PI > angle && finAngle-2*Math.PI < angle) return true;
	}
	return false;
}
function doesArcIncludeAngle(arc,angle) {
	while (angle < 0) {angle += 2*Math.PI;}
	angle = angle % (2*Math.PI);
	if (arc.clockwise == false) {
		if (arc.finAngle > arc.startAngle) {
			if (angle <= arc.startAngle || angle >= arc.finAngle) return true;
		} else {
			if (angle >= arc.finAngle && angle <= arc.startAngle) return true;			
		}
	} else {
		if (arc.finAngle > arc.startAngle) {
			if (angle >= arc.startAngle || angle <= arc.finAngle) return true;
		} else {
			if (angle <= arc.finAngle && angle >= arc.startAngle) return true;			
		}
	}
	return false;
}
function distancePointToPath(point,path) {
	if (path.length > 1) {
		var closestDist = distancePointToLineSegment(point,path[0],path[1]);
		for (var i = 1; i < path.length - 1; i++) {
			closestDist = Math.min(closestDist,distancePointToLineSegment(point,path[i],path[i+1]));
		}
		return closestDist;		
	} else if (path.length == 1) {
		return dist(point[0],point[1],path[0][0],path[0][1]);		
	} else {
		return 100000000000;
	}

}
function isPointOnLine(point,linePos1,linePos2,tolerance) {
	if (!tolerance) tolerance = 0.001;
	var closestPos = closestPointOnLine(point,linePos1,linePos2);
	var distance = dist(closestPos[0],closestPos[1],point[0],point[1]);
	if (distance <= tolerance) return true;
	return false;
}
/*function isPointOnLineSegment(point,linePos1,linePos2,tolerance) {
	if (!tolerance) tolerance = 0.001;
	var closestPos = closestPointOnLineSegment(point,linePos1,linePos2);
	var distance = dist(closestPos[0],closestPos[1],point[0],point[1]);
	if (distance <= tolerance) return true;
	return false;
}*/
function closestPointOnLine(point,linePos1,linePos2) {
	var dirVector = [linePos2[0]-linePos1[0],linePos2[1]-linePos1[1]];
	var lambda = ((point[0]-linePos1[0])*dirVector[0]+(point[1]-linePos1[1])*dirVector[1])/(Math.pow(dirVector[0],2)+Math.pow(dirVector[1],2));
	return [linePos1[0]+lambda*dirVector[0],linePos1[1]+lambda*dirVector[1]];	
}
function distancePointToLine(point,linePos1,linePos2) {
	var closest = closestPointOnLine(point,linePos1,linePos2);
	return dist(point[0],point[1],closest[0],closest[1]);
}
function closestPointOnLineSegment(point,linePos1,linePos2) {
	var dirVector = [linePos2[0]-linePos1[0],linePos2[1]-linePos1[1]];
	var lambda = ((point[0]-linePos1[0])*dirVector[0]+(point[1]-linePos1[1])*dirVector[1])/(Math.pow(dirVector[0],2)+Math.pow(dirVector[1],2));
	if (lambda <= 0) {
		return linePos1;
	} else  if  (lambda >= 1) {
		return linePos2;
	} else {
		return [linePos1[0]+lambda*dirVector[0],linePos1[1]+lambda*dirVector[1]];
	}
}
function distancePointToLineSegment(point,linePos1,linePos2) {
	var closest = closestPointOnLineSegment(point,linePos1,linePos2);
	return dist(point[0],point[1],closest[0],closest[1]);
}
function checkPathForLine(path,x1,y1,isEnd1,x2,y2,isEnd2,tolerance) {
	for (var i = 0; i < path.length; i++) {
		for (var k = 0; k < path[i].obj.length; k++) {
			if (path[i].obj[k].type == 'line' && lineCheck(x1,y1,isEnd1,x2,y2,isEnd2,tolerance,path[i].obj[k].startPos[0],path[i].obj[k].startPos[1],path[i].obj[k].finPos[0],path[i].obj[k].finPos[1]) == true) return true;
		}
	}
	return false;
}
function isPointOnLineSegment(point,linePos1,linePos2) {
	var dirVector = [linePos2[0]-linePos1[0],linePos2[1]-linePos1[1]];
	var lambda = ((point[0]-linePos1[0])*dirVector[0]+(point[1]-linePos1[1])*dirVector[1])/(Math.pow(dirVector[0],2)+Math.pow(dirVector[1],2));
	if (lambda >= 0 && lambda <= 1) {
		return true;	
	} else {
		return false;	
	}
}
function lineCheck(x1,y1,isEnd1,x2,y2,isEnd2,tolerance,xTest1,yTest1,xTest2,yTest2) {
	//console.log(x1,y1,isEnd1,x2,y2,isEnd2,tolerance,xTest1,yTest1,xTest2,yTest2);
	// if points should be ends of the line, test if they are
	if (isEnd1 == true && dist(x1,y1,xTest1,yTest1) > tolerance && dist(x1,y1,xTest2,yTest2) > tolerance) {
		return false;
	}
	if (isEnd2 == true && dist(x2,y2,xTest1,yTest1) > tolerance && dist(x2,y2,xTest2,yTest2) > tolerance) {
		return false;
	}
	// test if the points are on the line, with the given tolerance
	if (isPointOnLine([x1,y1],[xTest1,yTest1],[xTest2,yTest2],tolerance) == false || isPointOnLine([x2,y2],[xTest1,yTest1],[xTest2,yTest2],tolerance) == false) {
		return false;
	}
	// test if the line has been drawn far enough
	var mag = dist(x1,y1,x2,y2);
	var minPos1 = [x1+2*tolerance/mag*(x2-x1),y1+2*tolerance/mag*(y2-y1)];
	var minPos2 = [x2+2*tolerance/mag*(x1-x2),y2+2*tolerance/mag*(y1-y2)];
	
	/*
	console.log('pos1:'+x1+','+y1);
	console.log('pos2:'+x2+','+y2);
	console.log('minPos1:'+minPos1[0]+','+minPos1[1]);
	console.log('minPos2:'+minPos2[0]+','+minPos2[1]);
	console.log('testPos1:'+xTest1+','+yTest1);
	console.log('testPos2:'+xTest2+','+yTest2);
	console.log('dist to min pos, dist to actual pos:');
	console.log('pos1,testPos1:',dist(minPos1[0],minPos1[1],xTest1,yTest1),dist(x1,y1,xTest1,yTest1),dist(minPos1[0],minPos1[1],xTest1,yTest1)>dist(x1,y1,xTest1,yTest1));
	console.log('pos2,testPos2:',dist(minPos2[0],minPos2[1],xTest2,yTest2),dist(x2,y2,xTest2,yTest2),dist(minPos2[0],minPos2[1],xTest2,yTest2)>dist(x2,y2,xTest2,yTest2));
	console.log('pos1,testPos2:',dist(minPos1[0],minPos1[1],xTest2,yTest2),dist(x1,y1,xTest2,yTest2),dist(minPos1[0],minPos1[1],xTest2,yTest2)>dist(x1,y1,xTest2,yTest2));
	console.log('pos2,testPos1:',dist(minPos2[0],minPos2[1],xTest1,yTest1),dist(x2,y2,xTest1,yTest1),dist(minPos2[0],minPos2[1],xTest1,yTest1)>dist(x2,y2,xTest1,yTest1));
	//*/
	
	// if both points are closer to minPos than to either of the actual points
	if ((dist(minPos1[0],minPos1[1],xTest1,yTest1) > dist(x1,y1,xTest1,yTest1)
	&& dist(minPos1[0],minPos1[1],xTest2,yTest2) > dist(x1,y1,xTest2,yTest2))

	|| (dist(minPos2[0],minPos2[1],xTest1,yTest1) > dist(x2,y2,xTest1,yTest1)
	&& dist(minPos2[0],minPos2[1],xTest2,yTest2) > dist(x2,y2,xTest2,yTest2))) {
		return false;
	}
	return true;
}
function getAngleTwoPoints(pos1,pos2) { // returns the angle in rad from pos1 to pos2 
	var m = (pos2[1]-pos1[1])/(pos2[0]-pos1[0]);
	var a = Math.atan(m);
	if (pos1[1] == pos2[1]) { // horizontal
		if (pos1[0] < pos2[0]) {
			return 0;
		} else {
			return Math.PI;
		}
	}
	if (pos1[0] == pos2[0]) { // vertical
		if (pos1[1] < pos2[1]) {
			return Math.PI/2;
		} else {
			return 3*Math.PI/2;
		}
	}	
	if (m > 0) {
		if (pos2[0] > pos1[0]) {
			return a;
		} else {
			return a + Math.PI;		
		}
	} else {
		if (pos2[0] > pos1[0]) {
			return a;
		} else {
			return a + Math.PI;
		}
	}	
}
function interpolateTwoPoints(pos1,pos2,proportion) {
	if (typeof proportion == 'undefined') proportion = 0.5;
	return [pos1[0]+proportion*(pos2[0]-pos1[0]),pos1[1]+proportion*(pos2[1]-pos1[1])];
}
function angleToPos(angle,centerX,centerY,radius,opt_angleType) {
	if (opt_angleType == 'degrees') angle = angle * Math.PI / 180;
	return [centerX+Math.cos(angle)*radius,centerY-Math.sin(angle)*radius];
}
function posToAngle(posX,posY,centerX,centerY,radius) {
	if (un(radius)) radius = dist(posX,posY,centerX,centerY);
	var cosTheta = (posX-centerX)/radius;
	var sinTheta = (posY-centerY)/radius;
	if (sinTheta >= 0) return Math.acos(cosTheta);
	if (sinTheta < 0) return 2 * Math.PI - Math.acos(cosTheta);
}
function extendLine(pos1,pos2,extLength) {
	var m = (pos2[1]-pos1[1])/(pos2[0]-pos1[0]);
	var angle = Math.atan(m);
	if (pos1[1] == pos2[1]) { // horizontal
		if (pos1[0] < pos2[0]) {
			return [pos2[0]+extLength,pos2[1]];
		} else {
			return [pos2[0]-extLength,pos2[1]];
		}
	}	
	if (pos1[0] == pos2[0]) { // vertical
		if (pos1[1] < pos2[1]) {
			return [pos2[0],pos2[1]+extLength];
		} else {
			return [pos2[0],pos2[1]-extLength];
		}
	}
	if (m > 0) {
		if (pos2[0] >= pos1[0]) {
			return([pos2[0]+extLength*Math.cos(angle),pos2[1]+extLength*Math.sin(angle)]);
		} else {
			return([pos2[0]-extLength*Math.cos(angle),pos2[1]-extLength*Math.sin(angle)]);		
		}
	} else {
		if (pos2[0] <= pos1[0]) {
			return([pos2[0]-extLength*Math.cos(angle),pos2[1]-extLength*Math.sin(angle)]);		
		} else {
			return([pos2[0]+extLength*Math.cos(angle),pos2[1]+extLength*Math.sin(angle)]);
		}
	}
}

function isPointOnEllipse(point,center,radiusX,radiusY,tolerance) {
	if (typeof tolerance == 'undefined') {
		if (roundToNearest(Math.pow((point[0]-center[0])/radiusX,2)+Math.pow((point[1]-center[1])/radiusY,2),0.0001) == 1) {
			return true;
		} else {
			return false;	
		}
	} else {
		var max = Math.pow((point[0]-center[0])/(radiusX+tolerance),2)+Math.pow((point[1]-center[1])/(radiusY+tolerance),2);
		var min = Math.pow((point[0]-center[0])/(radiusX-tolerance),2)+Math.pow((point[1]-center[1])/(radiusY-tolerance),2);
		if (Math.max(min,max) >= 1 && Math.min(min,max) <= 1) {
			return true;
		} else {
			return false;
		}
	}
}
function isPointInEllipse(point,center,radiusX,radiusY) {
	if (roundToNearest(Math.pow((point[0]-center[0])/radiusX,2)+Math.pow((point[1]-center[1])/radiusY,2),0.0001) <= 1) {
		return true;
	} else {
		return false;	
	}
}
function isPointInRect(point,left,top,width,height) {
	if (point[0] >= left && point[0] <= left + width && point[1] >= top && point[1] <= top + height) {
		return true;	
	} else {
		return false;
	}
}
function distPointToRect(point,left,top,width,height) {
	if (isPointInRect(point,left,top,width,height) == true) return 0;
	return Math.min(
		distancePointToLineSegment(point,[left,top],[left+width,top]),
		distancePointToLineSegment(point,[left+width,top],[left+width,top+height]),
		distancePointToLineSegment(point,[left+width,top+height],[left,top+height]),
		distancePointToLineSegment(point,[left,top+height],[left+width,top])
	)
}
function lineCircleIntersections(linePoint1,linePoint2,circleCenter,circleRadius) {
	var a = linePoint1[0];
	var b = linePoint1[1];
	var c = linePoint2[0];
	var d = linePoint2[1];
	var p = circleCenter[0];
	var q = circleCenter[1];
	var r = circleRadius;
		
	var m = (d-b)/(c-a);
	var s = m*m+1;
	var t = -2*p+2*m*(-m*a+b-q);
	var u = p*p+(-m*a+b-q)*(-m*a+b-q)-r*r;
	var discrim = t*t-4*s*u;
	if (discrim < 0) {
		return [];	
	} else if (discrim == 0) {
		var x = (-t+Math.sqrt(discrim))/(2*s);
		var y = m*(x-a)+b;
		if (x >= p) {
			if (y >= q) {
				var angle = Math.atan((y-q)/(x-p));			
			} else {
				var angle = 2*Math.PI+Math.atan((y-q)/(x-p));
			}
		} else {
			var angle = Math.PI+Math.atan((y-q)/(x-p));						
		}
		return [[x,y,angle]];
	} else {
		var x1 = (-t+Math.sqrt(discrim))/(2*s);
		var y1 = m*(x1-a)+b;
		if (x1 >= p) {
			if (y1 >= q) {
				var angle1 = Math.atan((y1-q)/(x1-p));			
			} else {
				var angle1 = 2*Math.PI+Math.atan((y1-q)/(x1-p));
			}
		} else {
			var angle1 = Math.PI+Math.atan((y1-q)/(x1-p));						
		}
		var x2 = (-t-Math.sqrt(discrim))/(2*s);
		var y2 = m*(x2-a)+b;
		if (x2 >= p) {
			if (y2 >= q) {
				var angle2 = Math.atan((y2-q)/(x2-p));			
			} else {
				var angle2 = 2*Math.PI+Math.atan((y2-q)/(x2-p));
			}
		} else {
			var angle2 = Math.PI+Math.atan((y2-q)/(x2-p));						
		}
		return [[x1,y1,angle1],[x2,y2,angle2]];
	}
}
function circleIntersections(x0,y0,r0,x1,y1,r1) {
	var a, dx, dy, d, h, rx, ry;
	var x2, y2;
	/* dx and dy are the vertical and horizontal distances between the circle centers. */
	dx = x1 - x0;
	dy = y1 - y0;
	/* Determine the straight-line distance between the centers. */
	d = Math.sqrt((dy*dy) + (dx*dx));
	/* Check for solvability. */
	if (d > (r0 + r1)) {
		/* no solution. circles do not intersect. */
		return [];
	}
	if (d < Math.abs(r0 - r1)) {
		/* no solution. one circle is contained in the other */
		return [];
	}
	/* 'point 2' is the point where the line through the circle intersection points crosses the line between the circle centers. */
	/* Determine the distance from point 0 to point 2. */
	a = ((r0*r0) - (r1*r1) + (d*d)) / (2 * d) ;
	/* Determine the coordinates of point 2. */
	x2 = x0 + (dx * a/d);
	y2 = y0 + (dy * a/d);
	/* Determine the distance from point 2 to either of the intersection points. */
	h = Math.sqrt((r0*r0) - (a*a));
	/* Now determine the offsets of the intersection points from point 2. */
	rx = -dy * (h/d);
	ry = dx * (h/d);
	/* Determine the absolute intersection points. */
	var xi = x2 + rx;
	var xii = x2 - rx;
	var yi = y2 + ry;
	var yii = y2 - ry;
	return [[xi,yi],[xii,yii]];
}
function isPointOnArc(point,arcPath,tolerance) {
	if (!tolerance) tolerance = 0.00001;
	var rad = dist(point[0],point[1],arcPath.center[0],arcPath.center[1]);
	if (rad < arcPath.radius - tolerance || rad > arcPath.radius + tolerance) return false;
	if (Math.abs(arcPath.startAngle-arcPath.finAngle)+0.00001 >= 2*Math.PI) return true;
	var angle = getAngleFromAToB(arcPath.center,point);
	var angle1 = simplifyAngle(arcPath.startAngle);
	var angle2 = simplifyAngle(arcPath.finAngle);
	var a = arcPath.clockwise;
	var b = angle1 < angle2;
	var c = angle >= angle1  &&  angle <= angle2;
	/*
	if (a && b && c) return true;
	if (a && b && !c) return false;
	if (a && !b && c) return true;
	if (a && !b && !c) return false;
	if (!a && b && c) return false;
	if (!a && b && !c) return true;
	if (!a && !b && c) return false;
	if (!a && !b && !c) return true;
	/*/
	if (a == true) {
		if (b == true) {
			if (c == true) {
				return true;
			} else {
				return false;	
			}
		} else {
			if (c == true) {
				return true;
			} else {
				return false;	
			}
		}
	} else {
		if (b == true) {
			if (c == true) {
				return false;
			} else {
				return true;	
			}
		} else {
			if (c == true) {
				return false;
			} else {
				return true;	
			}			
		}
	}
	//*/
}

function simplifyAngle(angle) {
	while (angle < 0) {angle += (2*Math.PI)};
	angle = angle % (2*Math.PI);
	return angle;
}
function getAngleFromAToB(a,b) {
	// angle as measured anticlockwise from positive x-direction (upside down on canvas) - A is in the centre
	var angle = Math.atan((b[1]-a[1])/(b[0]-a[0]));
	if (b[0] >= a[0] && b[1] >= a[1]) return angle;
	if (b[0] >= a[0] && b[1] < a[1]) return angle + 2 * Math.PI;
	if (b[0] < a[0]) return angle + Math.PI;
}
function getEndPointsOfArc(arcPath) {
	// if closed circle, return empty
	if (Math.abs(arcPath.startAngle-arcPath.finAngle)%(2*Math.PI) == 0) return [];
	return [
		[arcPath.center[0]+arcPath.radius*Math.cos(arcPath.startAngle),arcPath.center[1]+arcPath.radius*Math.sin(arcPath.startAngle)],
		[arcPath.center[0]+arcPath.radius*Math.cos(arcPath.finAngle),arcPath.center[1]+arcPath.radius*Math.sin(arcPath.finAngle)]
	]
}
function vectorFromAToB(a,b) {
	return [b[0]-a[0],b[1]-a[1]];
}

function snapToPoints(point,snapPoints,tolerance) {
	var minDist = [];
	for (var i = 0; i < snapPoints.length; i++) {
		minDist.push(dist(point[0],point[1],snapPoints[i][0],snapPoints[i][1]));
	}
	if (arrayMin(minDist) < tolerance) {
		return snapPoints[minDist.indexOf(arrayMin(minDist))].slice(0);
	} else {
		return point.slice(0);	
	}
}
function snapToGrid(point,snapGrid) {
	//snapGrid should contain: {left,top,width,height,dx,dy}
}

function getBezierPoints(p1,p2,p3,density) {
	if (!density) density = 10;
	var length = quadraticBezierLength(p1,p2,p3);
	var points = [p1];
	for (var i = density; i < length; i += density) {
		points.push(getQuadraticCurvePoint(p1[0],p1[1],p2[0],p2[1],p3[0],p3[1],i/length));
	}
	points.push(p3);
	return points;
}
function getQBezierValue(t, p1, p2, p3) { // called by getQuadraticCurvePoint, src: http://jsfiddle.net/QA6VG/
	var iT = 1 - t;
	return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
}
function getQuadraticCurvePoint(startX, startY, cpX, cpY, endX, endY, position) {  // called by getBezierPoints, src: http://jsfiddle.net/QA6VG/
	return [getQBezierValue(position, startX, cpX, endX),getQBezierValue(position, startY, cpY, endY)];
}
function quadraticBezierLength(p0, p1, p2) { // called by getBezierPoints, src: https://gist.github.com/tunght13488/6744e77c242cc7a94859
	function Point(x, y) {
		this.x = x;
		this.y = y;
	}
	var a = new Point(
		p0[0] - 2 * p1[0] + p2[0],
		p0[1] - 2 * p1[1] + p2[1]
	);
	var b = new Point(
		2 * p1[0] - 2 * p0[0],
		2 * p1[1] - 2 * p0[1]
	);
	var A = 4 * (a.x * a.x + a.y * a.y);
	var B = 4 * (a.x * b.x + a.y * b.y);
	var C = b.x * b.x + b.y * b.y;

	var Sabc = 2 * Math.sqrt(A+B+C);
	var A_2 = Math.sqrt(A);
	var A_32 = 2 * A * A_2;
	var C_2 = 2 * Math.sqrt(C);
	var BA = B / A_2;

	return (A_32 * Sabc + A_2 * B * (Sabc - C_2) + (4 * C * A - B * B) * Math.log((2 * A_2 + BA + Sabc) / (BA + C_2))) / (4 * A_32);
}

function drawTextBox(canvas, canvasctx, canvasData, backgroundColor, borderColor, borderWidth, font, textColor, textAlign, textLine1, textLine2) {
	var polygon = false;
	if (typeof canvasData[41] !== 'undefined') polygon = true;
	canvasctx.clearRect(0, 0, canvasData[2], canvasData[3]);
	canvasctx.fillStyle = backgroundColor;
	canvasctx.strokeStyle = borderColor;
	canvasctx.lineWidth = borderWidth;
	if (polygon == true) {
		canvasctx.beginPath();
		canvasctx.moveTo(canvasData[41][0][0], canvasData[41][0][1]);
		for (j = 0; j < canvasData[41].length; j++) {
			if (j > 0) canvasctx.lineTo(canvasData[41][j][0], canvasData[41][j][1]);
		}
		canvasctx.closePath();
		canvasctx.fill();
		canvasctx.stroke();
	} else {
		if (backgroundColor !== '') canvasctx.fillRect(0, 0, canvasData[2], canvasData[3]);
		if (borderColor !== '') canvasctx.strokeRect(0, 0, canvasData[2], canvasData[3]);
	}
	canvasctx.font = font;
	canvasctx.fillStyle = textColor;
	canvasctx.textAlign = textAlign;
	canvasctx.textBaseline = "middle";
	if (!textLine2) {
		canvasctx.fillText(textLine1, 0.5 * canvasData[2], 0.5 * canvasData[3]);
	} else {
		canvasctx.fillText(textLine1, 0.5 * canvasData[2], 0.3 * canvasData[3]);
		canvasctx.fillText(textLine2, 0.5 * canvasData[2], 0.7 * canvasData[3]);
	}
}
function drawMathsTextBox(canvasctx, canvasData, textArray, object) {
// optional object can contain: backColor, algText, fontSize, borderColor, borderWidth, textColor, textAlign
	if (!object) {
		var fontSize = 0.45 * canvasData[3];
		var horizAlign = 'center';
		var algText = true;
		var textColor = '#000';
		var backgroundColor = '#6F9';
		var borderColor = '#000';
		var borderWidth = 4;
	} else {
		var fontSize = object.fontSize || 0.45 * canvasData[3];
		var horizAlign = object.textAlign || 'center';
		var algText = true;
		if (typeof object.algText == 'boolean') algText = object.algText;
		var textColor = object.textColor || '#000';
		var backgroundColor = object.backColor || '#6F9';
		var borderColor = object.borderColor || '#000';
		var borderWidth = object.borderWidth || 4;
	}
	var horizPos = 0.5 * canvasData[2];
	if (horizAlign == 'left') horizPos = 5;
	if (horizAlign == 'right') horizPos = canvasData[2] - 5;
	canvasctx.clearRect(0, 0, canvasData[2], canvasData[3]);
	canvasctx.fillStyle = backgroundColor;
	canvasctx.strokeStyle = borderColor;
	canvasctx.lineWidth = borderWidth;
	canvasctx.fillRect(0, 0, canvasData[2], canvasData[3]);
	canvasctx.strokeRect(borderWidth*0.5, borderWidth*0.5, canvasData[2]-borderWidth, canvasData[3]-borderWidth);
	drawMathsText(canvasctx, textArray, fontSize, horizPos, 0.47*canvasData[3], algText, [], horizAlign, 'middle', textColor, 'draw');
}
function wrapText(context, text, x, y, maxWidth, lineHeight, font, fillStyle) {
	context.font = font;
	context.fillStyle = fillStyle;
	var words = text.split(' ');
	var line = '';
	for(var n = 0; n < words.length; n++) {
		var testLine = line + words[n] + ' ';
		var metrics = context.measureText(testLine);
		var testWidth = metrics.width;
		if (testWidth > maxWidth && n > 0) {
		  	context.fillText(line, x, y);
		  	line = words[n] + ' ';
		  	y += lineHeight;
		} else {
			line = testLine;
		}
	}
	context.fillText(line, x, y);
}
function drawFrac(context, font, x, y, horizAlign, numerator, denominator) {
	context.save();
	context.font = font;
	var fractionWidth = Math.max(context.measureText(numerator).width, context.measureText(denominator).width);
	context.textAlign = 'center';
	context.textBaseline = 'bottom';
	switch (horizAlign) {
		case 'right' :
			context.fillText(numerator, x - 2 - 0.5 * fractionWidth, y - 5);
			context.textBaseline = 'top';
			context.fillText(denominator, x - 2 - 0.5 * fractionWidth, y + 5);
			context.strokeStyle = textColor;
			context.lineWidth = 3;
			context.moveTo(x - 4 - fractionWidth, y);
			context.lineTo(x, y);
			break;
		case 'center' :
			context.fillText(numerator, x, y - 5);
			context.textBaseline = 'top';
			context.fillText(denominator, x, y + 5);
			context.strokeStyle = textColor;
			context.lineWidth = 3;
			context.moveTo(x - 2 - 0.5 * fractionWidth, y);
			context.lineTo(x + 2 + 0.5 * fractionWidth, y);		
			break;
		default :
			context.fillText(numerator, x + 2 + 0.5 * fractionWidth, y - 5);
			context.textBaseline = 'top';
			context.fillText(denominator, x + 2 + 0.5 * fractionWidth, y + 5);
			context.strokeStyle = textColor;
			context.lineWidth = 3;
			context.moveTo(x, y);
			context.lineTo(x + 4 + fractionWidth, y);
			break;
	}
	context.stroke();
	context.restore();
}

function phi(x) { // for normal distribution
	var a1 =  0.254829592;
	var a2 = -0.284496736;
	var a3 =  1.421413741;
	var a4 = -1.453152027;
	var a5 =  1.061405429;
	var p  =  0.3275911;

    var sign = 1
    if (x < 0) sign = -1
    x = Math.abs(x)/Math.sqrt(2)

    // A&S formula 7.1.26
    var t = 1/(1 + p*x)
    var y = 1 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x)

    return 0.5*(1 + sign*y)
}
function enlargeDash(dash,sf) {
	if (typeof sf == 'undefined') return dash;
	for (var i = 0; i < dash.length; i++) {
		dash[i] = dash[i]*sf;
	}
	return dash;
}
