// 
// Dalliance Genome Explorer
// (c) Thomas Down 2006-2010
//
// feature-draw.js: new feature-tier renderer
//

function BoxGlyph(x, y, width, height, fill, stroke) {
    this.x = x;
    this.y = y;
    this._width = width;
    this._height = height;
    this.fill = fill;
    this.stroke = stroke;
}

BoxGlyph.prototype.draw = function(g) {
    var r = 1.0;

    g.beginPath();
    g.moveTo(this.x + r, this.y);
    g.lineTo(this.x + this._width - r, this.y);
    g.arcTo(this.x + this._width, this.y, this.x + this._width, this.y + r, r);
    g.lineTo(this.x + this._width, this.y + this._height - r);
    g.arcTo(this.x + this._width, this.y + this._height, this.x + this._width - r, this.y + this._height, r);
    g.lineTo(this.x + r, this.y + this._height);
    g.arcTo(this.x, this.y + this._height, this.x, this.y + this._height - r, r);
    g.lineTo(this.x, this.y + r);
    g.arcTo(this.x, this.y, this.x + r, this.y, r);
    g.closePath();

    if (this.fill) {
	g.fillStyle = this.fill;
	//g.fillRect(this.x, this.y, this._width, this._height);
	g.fill();
    }
    if (this.stroke) {
	g.strokeStyle = this.stroke;
	g.lineWidth = 0.5;
	// g.strokeRect(this.x, this.y, this._width, this._height);
	g.stroke();
    }
}

BoxGlyph.prototype.toSVG = function() {
    return makeElementNS(NS_SVG, 'rect', null,
			 {x: this.x, 
			  y: this.y, 
			  width: this._width, 
			  height: this._height,
			  stroke: this.stroke || 'none',
			  fill: this.fill || 'none'});
}

BoxGlyph.prototype.min = function() {
    return this.x;
}

BoxGlyph.prototype.max = function() {
    return this.x + this._width;
}

BoxGlyph.prototype.height = function() {
    return this.y + this._height;
}


function GroupGlyph(glyphs, connector) {
    this.glyphs = glyphs;
    this.connector = connector;
    this.h = glyphs[0].height();

    var cov = new Range(glyphs[0].min(), glyphs[0].max());
    for (g = 1; g < glyphs.length; ++g) {
	var gg = glyphs[g];
	cov = union(cov, new Range(gg.min(), gg.max()));
	this.h = Math.max(this.h, gg.height());
    }
    this.coverage = cov;
}

GroupGlyph.prototype.draw = function(g) {
    for (var i = 0; i < this.glyphs.length; ++i) {
	var gl = this.glyphs[i];
	gl.draw(g);
    }

    var ranges = this.coverage.ranges();
    for (var r = 1; r < ranges.length; ++r) {
	var gl = ranges[r];
	var last = ranges[r - 1];
	if (last && gl.min() > last.max()) {
	    var start = last.max();
	    var end = gl.min();
	    var mid = (start+end)/2
	    
	    g.beginPath();
	    if (this.connector === 'hat+') {
		g.moveTo(start, this.h/2);
		g.lineTo(mid, 0);
		g.lineTo(end, this.h/2);
	    } else if (this.connector === 'hat-') {
		g.moveTo(start, this.h/2);
		g.lineTo(mid, this.h);
		g.lineTo(end, this.h/2);
	    } else if (this.connector === 'collapsed+') {
		g.moveTo(start, this.h/2);
		g.lineTo(end, this.h/2);
		if (end - start > 4) {
		    g.moveTo(mid - 2, (this.h/2) - 5);
		    g.lineTo(mid + 2, this.h/2);
		    g.lineTo(mid - 2, (this.h/2) + 5);
		}
	    } else if (this.connector === 'collapsed-') {
		g.moveTo(start, this.h/2);
		g.lineTo(end, this.h/2);
		if (end - start > 4) {
		    g.moveTo(mid + 2, (this.h/2) - 5);
		    g.lineTo(mid - 2, this.h/2);
		    g.lineTo(mid + 2, (this.h/2) + 5);
		}
	    } else {
		g.moveTo(start, this.h/2);
		g.lineTo(end, this.h/2);
	    }
	    g.stroke();
	}
	last = gl;
    }
}

function SVGPath() {
    this.ops = [];
}

SVGPath.prototype.moveTo = function(x, y) {
    this.ops.push('M ' + x + ' ' + y);
}

SVGPath.prototype.lineTo = function(x, y) {
    this.ops.push('L ' + x + ' ' + y);
}

SVGPath.prototype.closePath = function() {
    this.ops.pusH('Z');
}

SVGPath.prototype.toPathData = function() {
    return this.ops.join(' ');
}

GroupGlyph.prototype.toSVG = function() {
    var g = makeElementNS(NS_SVG, 'g');
    for (var i = 0; i < this.glyphs.length; ++i) {
	g.appendChild(this.glyphs[i].toSVG());
    }

    var ranges = this.coverage.ranges();
    for (var r = 1; r < ranges.length; ++r) {
	var gl = ranges[r];
	var last = ranges[r - 1];
	if (last && gl.min() > last.max()) {
	    var start = last.max();
	    var end = gl.min();
	    var mid = (start+end)/2

	    var p = new SVGPath();

	    if (this.connector === 'hat+') {
		p.moveTo(start, this.h/2);
		p.lineTo(mid, 0);
		p.lineTo(end, this.h/2);
	    } else if (this.connector === 'hat-') {
		p.moveTo(start, this.h/2);
		p.lineTo(mid, this.h);
		p.lineTo(end, this.h/2);
	    } else if (this.connector === 'collapsed+') {
		p.moveTo(start, this.h/2);
		p.lineTo(end, this.h/2);
		if (end - start > 4) {
		    p.moveTo(mid - 2, (this.h/2) - 5);
		    p.lineTo(mid + 2, this.h/2);
		    p.lineTo(mid - 2, (this.h/2) + 5);
		}
	    } else if (this.connector === 'collapsed-') {
		p.moveTo(start, this.h/2);
		p.lineTo(end, this.h/2);
		if (end - start > 4) {
		    p.moveTo(mid + 2, (this.h/2) - 5);
		    p.lineTo(mid - 2, this.h/2);
		    p.lineTo(mid + 2, (this.h/2) + 5);
		}
	    } else {
		p.moveTo(start, this.h/2);
		p.lineTo(end, this.h/2);
	    }

	    var path = makeElementNS(
		NS_SVG, 'path',
		null,
		{d: p.toPathData(),
		 fill: 'none',
		 stroke: 'black',
		 strokeWidth: '1px'});
	    g.appendChild(path);
	}
    }

    return g;

    
}

GroupGlyph.prototype.min = function() {
    return this.coverage.min();
}

GroupGlyph.prototype.max = function() {
    return this.coverage.max();
}

GroupGlyph.prototype.height = function() {
    return this.h;
}


function LineGraphGlyph(points, color) {
    this.points = points;
    this.color = color;
}

LineGraphGlyph.prototype.min = function() {
    return this.points[0];
};

LineGraphGlyph.prototype.max = function() {
    return this.points[this.points.length - 2];
};

LineGraphGlyph.prototype.height = function() {
    return 50;
}

LineGraphGlyph.prototype.draw = function(g) {
    g.save();
    g.strokeStyle = this.color;
    g.lineWidth = 2;
    g.beginPath();
    for (var i = 0; i < this.points.length; i += 2) {
	var x = this.points[i];
	var y = this.points[i + 1];
	if (i == 0) {
	    g.moveTo(x, y);
	} else {
	    g.lineTo(x, y);
	}
    }
    g.stroke();
    g.restore();
}

LineGraphGlyph.prototype.toSVG = function() {
    var p = new SVGPath();
    for (var i = 0; i < this.points.length; i += 2) {
	var x = this.points[i];
	var y = this.points[i + 1];
	if (i == 0) {
	    p.moveTo(x, y);
	} else {
	    p.lineTo(x, y);
	}
    }
    
    return makeElementNS(
	NS_SVG, 'path',
	null,
	{d: p.toPathData(),
	 fill: 'none',
	 stroke: this.color,
	 strokeWidth: '2px'});
}

function LabelledGlyph(glyph, text) {
    this.glyph = glyph;
    this.text = text;
    this.textLen = GLOBAL_GC.measureText(text).width + 10;
    this.bump = glyph.bump;
}

LabelledGlyph.prototype.toSVG = function() {
    return makeElementNS(NS_SVG, 'g',
        [this.glyph.toSVG(),
         makeElementNS(NS_SVG, 'text', this.text, {x: this.glyph.min(), y: this.glyph.height() + 15})]);
}

LabelledGlyph.prototype.min = function() {
    return this.glyph.min();
}

LabelledGlyph.prototype.max = function() {
    return Math.max(this.glyph.max(), (1.0*this.glyph.min()) + this.textLen);
}

LabelledGlyph.prototype.height = function() {
    return this.glyph.height() + 20;
}

LabelledGlyph.prototype.draw = function(g) {
    this.glyph.draw(g);
    g.fillStyle = 'black';
    g.fillText(this.text, this.glyph.min(), this.glyph.height() + 15);
}



function CrossGlyph(x, height, stroke) {
    this._x = x;
    this._height = height;
    this._stroke = stroke;
}

CrossGlyph.prototype.draw = function(g) {
    var hh = this._height/2;
    
    g.beginPath();
    g.moveTo(this._x, 0);
    g.lineTo(this._x, this._height);
    g.moveTo(this._x - hh, hh);
    g.lineTo(this._x + hh, hh);

    g.strokeStyle = this._stroke;
    g.lineWidth = 1;

    g.stroke();
}

CrossGlyph.prototype.toSVG = function() {
    var hh = this._height/2;

    var g = new SVGPath();
    g.moveTo(this._x, 0);
    g.lineTo(this._x, this._height);
    g.moveTo(this._x - hh, hh);
    g.lineTo(this._x + hh, hh);
    
    return makeElementNS(
	NS_SVG, 'path',
	null,
	{d: g.toPathData(),
	 fill: 'none',
	 stroke: this._stroke,
	 strokeWidth: '1px'});
}

CrossGlyph.prototype.min = function() {
    return this._x - this._height/2;
}

CrossGlyph.prototype.max = function() {
    return this._x + this._height/2;
}

CrossGlyph.prototype.height = function() {
    return this._height;
}

function ExGlyph(x, height, stroke) {
    this._x = x;
    this._height = height;
    this._stroke = stroke;
}

ExGlyph.prototype.draw = function(g) {
    var hh = this._height/2;
    
    g.beginPath();
    g.moveTo(this._x - hh, 0);
    g.lineTo(this._x + hh, this._height);
    g.moveTo(this._x - hh, this._height);
    g.lineTo(this._x + hh, 0);

    g.strokeStyle = this._stroke;
    g.lineWidth = 1;

    g.stroke();
}

ExGlyph.prototype.toSVG = function() {
    var hh = this._height/2;

    var g = new SVGPath();
    g.moveTo(this._x - hh, 0);
    g.lineTo(this._x + hh, this._height);
    g.moveTo(this._x - hh, this._height);
    g.lineTo(this._x + hh, 0);
    
    return makeElementNS(
	NS_SVG, 'path',
	null,
	{d: g.toPathData(),
	 fill: 'none',
	 stroke: this._stroke,
	 strokeWidth: '1px'});
}

ExGlyph.prototype.min = function() {
    return this._x - this._height/2;
}

ExGlyph.prototype.max = function() {
    return this._x + this._height/2;
}

ExGlyph.prototype.height = function() {
    return this._height;
}

function TriangleGlyph(x, height, dir, stroke) {
    this._x = x;
    this._height = height;
    this._dir = dir;
    this._stroke = stroke;
}

TriangleGlyph.prototype.drawPath = function(g) {
    var hh = this._height/2;
    g.moveTo(this._x , 0);
    g.lineTo(this._x + hh, this._height);
    g.lineTo(this._x - hh, this._height);
    g.closePath();
}

TriangleGlyph.prototype.draw = function(g) {
    g.beginPath();
    this.drawPath(g);
    g.fillStyle = this._stroke;
    g.fill();
}

TriangleGlyph.prototype.toSVG = function() {


    var g = new SVGPath();
    this.drawPath(g);
    
    return makeElementNS(
	NS_SVG, 'path',
	null,
	{d: g.toPathData(),
	 fill: this._stroke});
}

TriangleGlyph.prototype.min = function() {
    return this._x - this._height/2;
}

TriangleGlyph.prototype.max = function() {
    return this._x + this._height/2;
}

TriangleGlyph.prototype.height = function() {
    return this._height;
}




function DotGlyph(x, height, dir, stroke) {
    this._x = x;
    this._height = height;
    this._stroke = stroke;
}

DotGlyph.prototype.draw = function(g) {
    var hh = this._height/2;
    g.fillStyle = this._stroke;
    g.beginPath();
    g.arc(this._x, hh, hh, 0, 6.29);
    g.fill();
}

DotGlyph.prototype.toSVG = function() {
    var gg = this._height/2;
    return makeElementNS(
	NS_SVG, 'circle',
	null,
	{cx: x, cy: hh, r: hh,
	 fill: this._stroke,
	 strokeWidth: '1px'});
}

DotGlyph.prototype.min = function() {
    return this._x - this._height/2;
}

DotGlyph.prototype.max = function() {
    return this._x + this._height/2;
}

DotGlyph.prototype.height = function() {
    return this._height;
}


function PaddedGlyph(glyph, minp, maxp) {
    this.glyph = glyph;
    this._min = minp;
    this._max = maxp;
    this.bump = glyph.bump;
}

PaddedGlyph.prototype.draw = function(g) {
    this.glyph.draw(g);
}

PaddedGlyph.prototype.toSVG = function() {
    return this.glyph.toSVG();
}

PaddedGlyph.prototype.min = function() {
    return this._min;
}

PaddedGlyph.prototype.max = function() {
    return this._max;
}

PaddedGlyph.prototype.height = function() {
    return this.glyph.height();
}