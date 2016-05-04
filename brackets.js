var json = 
{
    "name": "1st place",
    "children": [
        {
            "name": "Finals1",
            "children": [
                {
                    "name": "Semifinals1",
                    "children": [
                        {"name": "Quarterfinals 1"},
                        {"name": "Quarterfinals 2"}
                    ]
                },
                {
                    "name": "Semifinals2",
                    "children": [
                        {"name": "Quarterfinals 1"},
                        {"name": "Quarterfinals 2"}
                    ]
                }
            ]
        },
        {
            "name": "Finals2",
            "children": [
                {
                    "name": "Semifinals3",
                    "children": [
                        {"name": "Quarterfinals 1"},
                        {"name": "Quarterfinals 2"}
                    ]
                },
                {
                    "name": "Semifinals4",
                    "children": [
                        {"name": "Quarterfinals 1"},
                        {"name": "Quarterfinals 2"}
                    ]
                }
            ]
        }
    ]
};

var width = 1000;
var height = 650;
var maxLabel = 150;
var duration = 1000;
var radius = 20;
var rec_height = 20;
var rec_width = 120;
    
var i = 0;
var root;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var elbow = function (d, i){
    var source = d.source;
    var target = d.target;
    var hy = (target.y-source.y)/2;
    if(d.isRight) hy = -hy;
    return "M" + source.y + "," + source.x
         + "H" + (source.y+hy)
         + "V" + target.x + "H" + target.y;
};

var connector = elbow;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + maxLabel + ",0)");

root = json;
root.x0 = height / 2;
root.y0 = 0;

root.children.forEach(collapse);

function update(source) 
{
    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse();
    var links = tree.links(nodes);

    // Normalize for fixed-depth.
    //nodes.forEach(function(d) { d.y = d.depth * maxLabel; });
    nodes.forEach(function(d) { d.y = 500 - (d.depth * maxLabel); });

    // Update the nodes…
    var node = svg.selectAll("g.node")
        .data(nodes, function(d){ 
            return d.id || (d.id = ++i); 
        });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(d,i){ return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", click);

    nodeEnter.append("rect")
        .attr("width", 0)
        .attr("height", 0)
        .style("fill", function(d){ 
            return d._children ? "lightsteelblue" : "none"; 
        });

    nodeEnter.append("text")
        .attr("x", function(d){ 
            var spacing = computeRadius(d) + 5;
            return d.children || d._children ? -spacing + 70 : spacing + 70; 
        })
        .attr("dy", "13")
        .attr("text-anchor", function(d){ return d.children || d._children ? "start" : "end"; })
        .text(function(d){ return d.name; })
        .style("fill-opacity", 0);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + (d.x - 10) + ")"; });

    nodeUpdate.select("rect")
        .attr("height", rec_height)
        .attr("width", rec_width)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "green"; })
        .style("fill-opacity","0.3");

    nodeUpdate.select("text").style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("rect").attr("height", 0);
    nodeExit.select("rect").attr("width", 0);
    nodeExit.select("text").style("fill-opacity", 0);

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function(d){ return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d){
            var o = {x: source.x0, y: source.y0};
            return connector({source: o, target: o});
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", connector);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d){
            var o = {x: source.x, y: source.y};
            return connector({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d){
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

function computeRadius(d)
{
	//console.log(d);
    if(d.children || d._children) return radius + (radius * 1 / 10);
    else return radius;
}

function nbEndNodes(n)
{
    nb = 0;    
    if(n.children){
        n.children.forEach(function(c){ 
            nb += nbEndNodes(c); 
        });
    }
    else if(n._children){
        n._children.forEach(function(c){ 
            nb += nbEndNodes(c); 
        });
    }
    else nb++;
    
    return nb;
}

function click(d)
{
    if (d.children){
        d._children = d.children;
        d.children = null;
    } 
    else{
        d.children = d._children;
        d._children = null;
    }
    update(d);
}

function collapse(d){
    if (d._children){
        d.children = d._children;
        d.children.forEach(collapse);
        d._children = null;
    }
}

update(root);