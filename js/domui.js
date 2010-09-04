/* -*- mode: javascript; c-basic-offset: 4; indent-tabs-mode: nil -*- */

// 
// Dalliance Genome Explorer
// (c) Thomas Down 2006-2010
//
// domui.js: SVG UI components
//

Browser.prototype.makeTooltip = function(ele, text)
{
    var isin = false;
    var thisB = this;
    var timer = null;
    var outlistener;
    outlistener = function(ev) {
        isin = false;
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        ele.removeEventListener('mouseout', outlistener, false);
    };

    var setup;
    setup = function(ev) {
        var mx = ev.clientX + window.scrollX, my = ev.clientY + window.scrollY;
        if (!timer) {
            timer = setTimeout(function() {
                var popup = makeElement('div', text, {}, {
                    position: 'absolute',
                    top: '' + (my + 20) + 'px',
                    left: '' + Math.max(mx - 30, 20) + 'px',
                    backgroundColor: 'rgb(250, 240, 220)',
                    borderWidth: '1px',
                    borderColor: 'black',
                    borderStyle: 'solid',
                    padding: '2px',
                    maxWidth: '400px'
                });
                thisB.hPopupHolder.appendChild(popup);
                var moveHandler;
                moveHandler = function(ev) {
                    try {
                        thisB.hPopupHolder.removeChild(popup);
                    } catch (e) {
                        // May have been removed by other code which clears the popup layer.
                    }
                    window.removeEventListener('mousemove', moveHandler, false);
                    if (isin) {
                        setup(ev);
                    }
                }
                window.addEventListener('mousemove', moveHandler, false);
                timer = null;
            }, 1000);
        }
    };

    ele.addEventListener('mouseover', function(ev) {
        isin = true
        ele.addEventListener('mouseout', outlistener, false);
        setup(ev);
    }, false);
    ele.addEventListener('DOMNodeRemoved', function(ev) {
        isin = false;
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }, false);
}

Browser.prototype.popit = function(ev, name, ele, opts)
{
    var thisB = this;
    if (!opts) {
        opts = {};
    }

    var width = opts.width || 200;

    var mx =  ev.clientX, my = ev.clientY;
    mx +=  document.documentElement.scrollLeft || document.body.scrollLeft;
    my +=  document.documentElement.scrollTop || document.body.scrollTop;
    var winWidth = window.innerWidth;

    var popup = makeElement('div');
    popup.style.position = 'absolute';
    popup.style.top = '' + (my + 30) + 'px';
    popup.style.left = '' + Math.min((mx - 30), (winWidth - width - 10)) + 'px';
    popup.style.width = width + 'px';
    popup.style.backgroundColor = 'white';
    popup.style.borderWidth = '2px';
    popup.style.borderColor = 'black'
    popup.style.borderStyle = 'solid';

    if (name) {
        var closeButton = makeElement('div', 'X', null, {
            margin: '-3px',
            padding: '3px',
            float: 'right',
            borderStyle: 'none',
            borderLeftStyle: 'solid',
            borderWidth: '1px',
            borderColor: 'rgb(128,128,128)'
        });
        closeButton.addEventListener('mouseover', function(ev) {
            closeButton.style.color = 'red';
        }, false);
        closeButton.addEventListener('mouseout', function(ev) {
            closeButton.style.color = 'black';
        }, false);
        closeButton.addEventListener('mousedown', function(ev) {
            thisB.removeAllPopups();
        }, false);
        popup.appendChild(makeElement('div', [name, closeButton], null, {
            backgroundColor: 'rgb(230,230,250)',
            borderColor: 'rgb(128,128,128)',
            borderStyle: 'none',
            borderBottomStyle: 'solid',
            borderWidth: '1px',
            padding: '3px'
        }));
    }

    popup.appendChild(makeElement('div', ele, null, {
        padding: '3px',
        clear: 'both'
    }));
    this.hPopupHolder.appendChild(popup);
}

function IconSet(uri)
{
    var req = new XMLHttpRequest();
    req.open('get', uri, false);
    req.send();
    this.icons = req.responseXML;
}

IconSet.prototype.createIcon = function(name, parent)
{
    var master = this.icons.getElementById(name);
    if (!master) {
        alert("couldn't find " + name);
        return;
    }
    var copy = document.importNode(master, true);
    parent.appendChild(copy);
    var bbox = copy.getBBox();
    parent.removeChild(copy);
    copy.setAttribute('transform', 'translate(' + (-bbox.x)  + ',' + (-bbox.y)+ ')');
    var icon = makeElementNS(NS_SVG, 'g', copy);
    return icon;
}


IconSet.prototype.createButton = function(name, parent, bx, by)
{
    bx = bx|0;
    by = by|0;

    var master = this.icons.getElementById(name);
    var copy = document.importNode(master, true);
    parent.appendChild(copy);
    var bbox = copy.getBBox();
    parent.removeChild(copy);
    copy.setAttribute('transform', 'translate(' + (((bx - bbox.width - 2)/2) - bbox.x)  + ',' + (((by - bbox.height - 2)/2) - bbox.y)+ ')');
    var button = makeElementNS(NS_SVG, 'g', [
        makeElementNS(NS_SVG, 'rect', null, {
            x: 0,
            y: 0,
            width: bx,
            height: by,
            fill: 'rgb(230,230,250)',
            stroke: 'rgb(150,150,220)',
            strokeWidth: 2
        }), 
        copy ]);
    return button;
}