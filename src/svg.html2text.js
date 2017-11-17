;(function(){
"use strict";
const styles = ['font-weight', 'font-size', 'font-style', 'font-family', 'text-decoration', 'line-height', 'color'];
// Get the style of each character
function dfs(dom, arr, result) {
    if(dom.nodeType === 3) {
        let style = {};
        arr.forEach((obj) => {
            for(let key in obj) {
                style[key] = obj[key];
            }
        });
        for(let i = 0, l = dom.data.length; i < l; i++) {
            result.push({text: dom.data[i], style: style});
        }
        return;
    }
    if(dom.tagName.toLowerCase() !== 'body') {
        let style = {};
        for(let i = 0, len = styles.length; i < len; i++) {
            style[styles[i]] = dom.style[styles[i]];
        }
        arr.push(style);
    }
    for(let i = 0; i < dom.childNodes.length; i++) {
        dfs(dom.childNodes[i], arr, result);
    }
    arr.pop();
}

function HtmlHandler(el) {
    this.el = el;
    el.remember('_htmlHandler', this);
    this.html = '';
    this.tspanArr = [];
    this.result = [];
    this.position = {};
    this.tspans = [];
    this.bindReset();
}

HtmlHandler.prototype.set = function(html) {
    if(this.html === html) return;
    this.html = html;
    let parser = new DOMParser();
    let htmlDoc = parser.parseFromString(this.html, 'text/html');
    this.result = [];
    dfs(htmlDoc.body, [], this.result);
    this.el.fire('reset', true);
}

HtmlHandler.prototype.bindReset = function() {
    this.el.on('reset', (e) => {
        let width = this.el.width();
        if(this.position.width !== width || e.detail) {
            this.addText(width);
            this.position.width = width;
        }
    });
}
// Create span for each text, add to document.body, and then set the line break by offsetleft
HtmlHandler.prototype.addText = function(width) {
    let list = [];
    let arr = this.result;
    for(let i = 0, len = arr.length; i < len; i++) {
        let tag = document.createElement('span');
        for(let key in arr[i].style) {
            tag.style[key] = arr[i].style[key];
        }
        tag.innerHTML = arr[i].text;
        list.push(tag);
    }
    let p = document.createElement('p');
    for(let i = 0, len = list.length; i < len; i++) {
        list[i].id = i;
        p.appendChild(list[i]);
    }
    let div = document.createElement('div');
    div.style.width = width + 'px';
    div.style.wordWradiv = 'break-word';
    div.style.position = 'absolute';
    div.appendChild(p);
    document.body.appendChild(div);

    if(this.text) {
        this.el.removeElement(this.text);
    }

    this.text = this.el.text(function(add) {
        let arr = p.children;
        let last;
        for(let i = 0, len = arr.length; i < len; i++) {
            let tag = arr[i];
            let styleObj = {};
            for(let j = 0, l = styles.length; j < l; j++) {
                styleObj[styles[j]] = tag.style[styles[j]];
            }
            let tspan = add.tspan(tag.innerText).style(styleObj);
            // If the offsetLeft is zero, set the new line for this tspan
            if(tag.offsetLeft === 0) {
                tspan.x(0);
                tspan.y(tag.offsetTop + parseInt(styleObj['font-size'].replace(/px/, '')));
            }
        }
    });
    
    document.body.removeChild(div);
}

SVG.extend(SVG.G, {
    html: function (value) {

        let htmlHandler = this.remember('_htmlHandler') || new HtmlHandler(this);

        if (typeof value === 'string') {
            htmlHandler.set(value);
            return this;
        }

        return htmlHandler.html;
    },
    width: function(width) {
        let result = this.attr('width', width);
        if(width) this.fire('reset');
        return result;
    }
});
})();
