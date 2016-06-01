var socket = io('http://localhost:8081');
var margin = {top: 30, right: 10, bottom: 10, left: 10},
    width = 1060 - margin.left - margin.right,
    halfWidth = width / 2,
    height = 500 - margin.top - margin.bottom,
    halfHeight = height / 2,
    i = 0,
    duration = 500,
    rec_height = 20,
    rec_width = 100,
    score_width = 20,
    half_rec_height = rec_height/2,
    half_rec_width = rec_width/2,
    root;
    first_update = false,
    steam_ids = [],
    steamaccounts = [];

var getChildren = function(d){
  var a = [];
  if(d.winners) for(var i = 0; i < d.winners.length; i++){
    d.winners[i].isRight = false;
    d.winners[i].parent = d;
    a.push(d.winners[i]);
    steam_ids.push(d.winners[i].steam_id);
  }
  if(d.challengers) for(var i = 0; i < d.challengers.length; i++){
    d.challengers[i].isRight = true;
    d.challengers[i].parent = d;
    a.push(d.challengers[i]);
    steam_ids.push(d.challengers[i].steam_id);
  }
  return a.length?a:null;
};

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var elbow = function (d, i){
  var source = calcLeft(d.source);
  var target = calcLeft(d.target);
  var hy = (target.y-source.y)/2;
  if(d.isRight) hy = -hy;
  if(d.target.finalist) {
    return "M" + source.y + "," + source.x
         + "H" + (source.y)
         + "V" + target.x + "H" + target.y;

  } else {
  return "M" + source.y + "," + source.x
         + "H" + (source.y+hy)
         + "V" + target.x + "H" + target.y;
       }
};
var connector = elbow;

var calcLeft = function(d){
  var l = d.y;
  if(!d.isRight){
    l = d.y-halfWidth;
    l = halfWidth - l;
  }
  
  return {x : d.x/2, y : l};
};

var vis = d3.select("#chart").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var toArray = function(item, arr){
  arr = arr || [];
  var i = 0, 
  l = item.children ? item.children.length : 0;
  arr.push(item);
  for(; i < l; i++){
    toArray(item.children[i], arr);
  }
  return arr;
};

d3.json("bracket.json", function(json) {
  root = json;
  root.x0 = height / 2;
  root.y0 = width / 2;

  var t1 = d3.layout.tree().size([height, halfWidth]).children(function(d){return d.winners;}),
      t2 = d3.layout.tree().size([height, halfWidth]).children(function(d){return d.challengers;});
  t1.nodes(root);
  t2.nodes(root);

  var rebuildChildren = function(node){
    node.children = getChildren(node);
    if(node.children) node.children.forEach(rebuildChildren);
  }
  rebuildChildren(root);
  root.isRight = false;
  update(root);
  socket.emit('steam info', steam_ids, function(steam_accounts){
    steamaccounts = steam_accounts;
    console.log(steamaccounts);
  });
});

function update(source) {
  // Compute the new tree layout.
  var nodes = toArray(source);

  // Normalize for fixed-depth.
  nodes.forEach(function(d,i) { 
    if(d.winner) console.log(d);
    //Diferentiate finalists nodes from other nodes
    if(d.finalist) {
      d.y = d.depth * 110 + halfWidth - 30;
      if(d.isRight){
        d.x = height/2 - 60 ;
      }
      else{
        d.x = height/2 + 60;
      }
    }
    else {
      d.y = d.depth * 110 + halfWidth;}
    }
  );

  // Update the nodes…
  var node = vis.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  var tooltip = d3.select("#tooltip");

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      //.on("click", click)
      .on("click",showAccountStats)
      .on("mouseover", function(d,i){ 
        date = timeSince(new Date(steamaccounts[i].lastlogoff*1000));

        tooltip.style("visibility", "visible")
          .select("img")
          .attr("src", steamaccounts[i].avatarmedium);

        tooltip.select("#steam-personaname")
          .text(steamaccounts[i].personaname);

        tooltip.select("#steam-username")
          .text(steamaccounts[i].profileurl);

        tooltip.select("#steam-last-login")
          .text("Last login: " + date);

      })
      .on("mousemove", function(){
        return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
      })
      .on("mouseout", function(){return tooltip.style("visibility", "hidden");});

  nodeEnter.append("rect")
      .attr("transform", "translate("+(-half_rec_width)+","+(-half_rec_height)+")")
      .attr("width", 0)
      .attr("height", 0)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeEnter.append("text")
      .attr("dy", 3)
      .attr("text-anchor", "middle")
      .text(function(d) { return d.name; })
      .style("fill-opacity", 1e-6);

  nodeEnter.append("text")
      .attr("display","none")
      .attr("class","steam-id")
      .text(function(d) { return d.steam_id; });

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { p = calcLeft(d); return "translate(" + p.y + "," + p.x + ")"; });

  nodeUpdate.select("rect")
      .attr("height", rec_height)
      .attr("width", rec_width)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeUpdate.select("text")
      .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { p = calcLeft(d.parent||source); return "translate(" + p.y + "," + p.x + ")"; })
      .remove();

  nodeExit.select("text")
      .style("fill-opacity", 1e-6);

  // Update the links...
  var link = vis.selectAll("path.link")
      .data(tree.links(nodes), function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", diagonal);

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", connector);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = calcLeft(d.source||source);
        if(d.source.isRight) o.y -= halfWidth - (d.target.y - d.source.y);
        else o.y += halfWidth - (d.target.y - d.source.y);
        return connector({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    var p = calcLeft(d);
    d.x0 = p.x;
    d.y0 = p.y;
  });


  
  // Toggle children on click.
  function click(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(source);
  }

  function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years ago";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months ago";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days ago";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours ago";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes ago";
    }
    return Math.floor(seconds) + " seconds ago";
  }

  function showAccountStats(d) {
    socket.emit('get steam account info', d.steam_id, function(steam_info){
      console.log(steam_info);
    });
  }

}