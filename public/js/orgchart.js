var canvasWidth = 1800,
	canvasHeight = 1000;

var canvas = d3.select("#orgchart").append("svg")
	.attr("width", canvasWidth)
	.attr("height", canvasHeight)
	.append("g")
		.attr("transform", "translate(50, 50)");

/*
var diagonal = d3.svg.diagonal()
	.source({ x: 10, y: 10 })
	.target({ x: 300, y: 300 });

canvas.append("path")
	.attr("fill", "none")
	.attr("stroke", "black")
	.attr("d", diagonal);
*/

var tree = d3.layout.tree()
	//.nodeSize([200, 50])
	.size([canvasWidth-100, canvasHeight-100])
	/*.children(function (d) {
			return d.subordinates;
		})*/;
	
d3.json("/people/kiahj/orgchart", function (data) {
	var getPersById = function (persId) {
		for (var p = 0; p < data.length; p += 1) {
			if (data[p]._id === persId) {
				return data[p];
			}
		}
		return null;
	};
	
	var highestNode = data[0];
	
	// build children arrays
	data.forEach(function (pers) {
		if (data[0].ancestors.length > 0 &&
			pers._id === data[0].ancestors[0]._id)
		{
			highestNode = pers;
		}
		pers.children = [];
		if (pers.subordinates) {
			for (var s = 0; s < pers.subordinates.length; s += 1) {
				var subordinate = getPersById(pers.subordinates[s]);
				if (subordinate) {
					pers.children.push(subordinate);
				}
			}
		}
	});
	
	var nodes = tree.nodes(highestNode);
	var links = tree.links(nodes);
	
	nodes.forEach(function (d) {
		d.y = d.depth * 100;
	});
	
	var node = canvas.selectAll(".node")
		.data(nodes)
		.enter()
		.append("g")
			.attr("class", "node")
			.attr("transform", function (d) {
					return "translate(" + d.x + "," + d.y + ")";
				});
			
	node.append("rect")
		.attr("x", -100).attr("y", -25)
		.attr("width", 200).attr("height", 50)
		.attr("rx", 10).attr("ry", 10)
		.attr("fill", "steelblue");
		
	var nodeText = node.append("text")
		.attr("text-anchor", "middle")
		.attr("y", -25)
		.attr("fill", "#EEEEEE");
		
	nodeText.append("tspan")
		.attr("x", 0).attr("dy", "1.4em")
		.attr("font-weight", "bold")
		.text(function (d) {
				return d.displayName;
			});
			
	nodeText.append("tspan")
		.attr("x", 0).attr("dy", "1.4em")
		.attr("width", 200).attr("height", 50)
		.text(function (d) {
				return d.title;
			});
			
	var diagonal = d3.svg.diagonal()
		.projection(function (d) { return [d.x, d.y]; });
		
	canvas.selectAll(".link")
		.data(links)
		.enter()
		.append("path")
		.attr("class", "link")
		.attr("fill", "none")
		.attr("stroke", "#ADADAD")
		.attr("d", diagonal);
});
