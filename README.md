svg.html2text.js
=============
An extension of [svg.js](https://github.com/svgdotjs/svg.js) which allows to g elements to set html.

# Get Started

- Include the script after svg.js and svg.html2text.js into your page

		<script src="svg.js"></script>
		<script src="svg.html2text.js"></script>
    
- Create a group, and set a html string:

		<div id="myDrawing"></div>

		var drawing = new SVG('myDrawing').size(500, 500);
		drawing.group().html('<p><span style="font-size: 32px;">Hello World!</span></p>');

# Usage

Adjust width


    var draw = SVG('drawing');
	  var g = draw.group();
    g.html('<p><span style="font-size: 32px;">Hello World!</span></p>').width(200);
    
    
Reset html


    g.html('<p><span style="font-size: 32px;">Wow!</span></p>');
