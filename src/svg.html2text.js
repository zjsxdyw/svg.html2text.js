;(function(){
"use strict";
var styles = ['font-weight', 'font-size', 'font-style', 'font-family', 'text-decoration', 'color'];
function dfs(dom, arr, result) {
    if(dom.nodeType === 3) {
        for(var i = 0, l = dom.data.length; i < l; i++) {
            result.push({text: dom.data[i], list: [].concat(arr)});
        }
        return;
    }
    if(dom.tagName.toLowerCase() !== 'body') {
        arr.push({
            tagName: dom.tagName,
            style: dom.getAttribute('style')
        });
    }
    for(var i = 0; i < dom.childNodes.length; i++) {
        dfs(dom.childNodes[i], arr, result);
    }
    arr.pop();
}

function splitText(arr, width) {
    var curWidth = 0,
        curMaxHeight = {num: 0},
        result = [];
    for(var i = 0, len = arr.length; i < len; i++) {
        var textSize = getTextSize(arr[i].text, arr[i].list);
        var newLine = false;
        if((textSize.width + curWidth) > width) {
            curWidth = textSize.width;
            curMaxHeight = {num: textSize.height};
            newLine = true;
        } else {
            curWidth += textSize.width;
            curMaxHeight.num = Math.max(textSize.height, curMaxHeight.num);
            newLine = false;
        }
        result.push({text: arr[i].text, styles: textSize.styles, newLine: newLine, maxHeight: curMaxHeight});
    }
    return result;
}

function getTextSize(text, arr) {
    var p, dom;
    for(var i = 0, len = arr.length; i < len; i++) {
        var curDom = document.createElement(arr[i].tagName);
        curDom.setAttribute('style', arr[i].style);
        curDom.style.visibility = "hidden";
        if(i === 0) {
            p = curDom;
        } else {
            dom.appendChild(curDom);
        }
        dom = curDom;
    }
    if(!p) {
        p = document.createElement('p');
    }
    if(!p.lastChild) {
        dom = document.createElement('span');
        p.appendChild(dom);
    }
    p = p.lastChild;
    var result = {};
    result.width = dom.offsetWidth;
    result.height = dom.offsetWidth;
    if(text === ' ') {
        dom.innerHTML = '&nbsp;';
    } else {
        dom.textContent = text;
    }
    document.body.appendChild(p);
    result.width = dom.offsetWidth - result.width;
    result.height = dom.offsetHeight - result.height;
    result.styles = {};
    for(var i = 0, key; (key = styles[i]); i++) {
        result.styles[key] = getStyle(dom, key);
    }
    document.body.removeChild(p);
    return result;
}

function getStyle(el, styleProp) {
    var value, defaultView = (el.ownerDocument || document).defaultView;
    // W3C standard way:
    if (defaultView && defaultView.getComputedStyle) {
        // sanitize property name to css notation
        // (hypen separated words eg. font-Size)
        styleProp = styleProp.replace(/([A-Z])/g, "-$1").toLowerCase();
        value = defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
        if(styleProp === 'text-decoration' && value.indexOf('none') > -1 && el.parentNode.tagName.toLowerCase() !== 'body') {
            return getStyle(el.parentNode, styleProp);
        }
        return value;
    } else if (el.currentStyle) { // IE
        // sanitize property name to camelCase
        styleProp = styleProp.replace(/\-(\w)/g, function(str, letter) {
            return letter.toUpperCase();
        });
        value = el.currentStyle[styleProp];
        // convert other units to pixels on IE
        if (/^\d+(em|pt|%|ex)?$/i.test(value)) { 
            return (function(value) {
                var oldLeft = el.style.left, oldRsLeft = el.runtimeStyle.left;
                el.runtimeStyle.left = el.currentStyle.left;
                el.style.left = value || 0;
                value = el.style.pixelLeft + "px";
                el.style.left = oldLeft;
                el.runtimeStyle.left = oldRsLeft;
                return value;
            })(value);
        }
        return value;
    }
}

function HtmlHandler(el) {
    this.el = el;
    el.remember('_htmlHandler', this);
    this.html = '';
    this.tspanArr = [];
    this.result = [];
    this.curWidth;
}

HtmlHandler.prototype.init = function(html) {
    if(this.html === html) return;
    this.html = html;
    var parser = new DOMParser();
    var htmlDoc = parser.parseFromString(this.html, 'text/html');
    this.result = [];
    dfs(htmlDoc.body, [], this.result);
    this.setText();
}

HtmlHandler.prototype.setText = function() {
    var self = this;

    this.el.on('rebuild', function(e) {
        if(self.curWidth !== this.width() || e.detail) {
            self.curWidth = this.width()
            var arr = splitText(self.result, self.curWidth);
            self.tspanArr = [];
            this.text(function(add) {
                for(var i = 0, len = arr.length; i < len; i++) {
                    var tspan = add.tspan(arr[i].text)
                        .style(arr[i].styles).fill(arr[i].styles['color']);
                    if(arr[i] && arr[i].newLine) {
                        tspan.newLine();
                        self.tspanArr.push({tspan: tspan, dy: arr[i].maxHeight.num});
                    }
                }
            })
        }
        for(var i = 0, len = self.tspanArr.length; i < len; i++) {
            if(self.tspanArr[i].tspan.dy() !== self.tspanArr[i].dy)
                self.tspanArr[i].tspan.dy(self.tspanArr[i].dy);
        }
    });

    this.el.fire('rebuild', true);
}

SVG.extend(SVG.Text, {
    html: function (value, options) {

        if (typeof value === 'object') {
            options = value;
            value = true;
        }

        var htmlHandler = this.remember('_htmlHandler') || new HtmlHandler(this);

        htmlHandler.init(value);

        return this;

    }
});
})();
