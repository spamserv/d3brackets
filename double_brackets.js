var socket = io('https://d3brackets.herokuapp.com/');
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
    root,
    steam_ids = [],
    steamaccounts = [];

// Get all children
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

// Calculating connectors;
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

// Calculating (x,y) pairs for transformation
var calcLeft = function(d){
  var l = d.y;
  if(!d.isRight){
    l = d.y-halfWidth;
    l = halfWidth - l;
  }
  
  return {x : (d.x/2-30), y : l};
};

// Creating svg element
var vis = d3.select("#chart").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", 220 + margin.top + margin.bottom)
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

d3.json("./json/bracket.json", function(json) {
  root = json;
  root.x0 = height / 2;
  root.y0 = width / 2;

  // Creating 2 binary trees for two sided brackets
  var t1 = d3.layout.tree().size([height, halfWidth]).children(function(d){return d.winners;}),
      t2 = d3.layout.tree().size([height, halfWidth]).children(function(d){return d.challengers;});
  t1.nodes(root);
  t2.nodes(root);

  // Adding .children attribute to node object
  var rebuildChildren = function(node){
    node.children = getChildren(node);
    if(node.children) node.children.forEach(rebuildChildren);
  }
  rebuildChildren(root);
  root.isRight = false;
  update(root);
  socket.emit('steam info', steam_ids, function(steam_accounts){
    steamaccounts = steam_accounts;

    var nodes = toArray(root);

    links = vis.select("path.link");
    all_nodes = d3.selectAll("g.node");
    for(var i=0;i<all_nodes[0].length;i++) {
      var id = d3.select(all_nodes[0][i]).select("text.steam-id").text();
      var acc = findInArrayOfJSONObjects(steamaccounts, id);
      d3.select(all_nodes[0][i]).select("text.name").text(acc.personaname);
    }

    
  });
});

function update(source) {
  // Compute the new tree layout.
  var nodes = toArray(source);

  // Normalize for fixed-depth.
  nodes.forEach(function(d,i) { 
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
      .on("click",showAccountStats)
      .on("mouseover", function(d,i){ 
        steamacc = findInArrayOfJSONObjects(steamaccounts, d.steam_id);
        if(typeof steamacc !== 'undefined'){
          onNodeHover(steamacc.steamid);
        }

      })
      .on("mousemove", function(){
        return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
      })
      .on("mouseout", function(){ onNodeUnhover(); });

  var svg =  d3.select("body").append("svg");
  var radialGradient = svg.append("defs")
    .append("radialGradient")
    .attr("id", "radial-gradient");

  radialGradient.append("stop")
      .attr("offset", "15%")
      .attr("stop-color", "#26AAC1");

  radialGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#2191A8");

  // create filter with id #drop-shadow
  // height=110% so that the shadow is not clipped
  var defs = svg.append("defs");
  var filter = defs.append("filter")
      .attr("id", "drop-shadow")
      .attr("height", "110%");

  // SourceAlpha refers to opacity of graphic that this filter will be applied to
  // convolve that with a Gaussian with standard deviation 4 and store result
  // in blur
  filter.append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 4)
      .attr("result", "blur");

  // translate output of Gaussian blur to the right and downwards with 2px
  // store result in offsetBlur
  filter.append("feOffset")
      .attr("in", "blur")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("result", "offsetBlur");

  var feMerge = filter.append("feMerge");

  feMerge.append("feMergeNode")
      .attr("in", "offsetBlur")
  feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");

  nodeEnter.append("rect")
      .attr("transform", "translate("+(-half_rec_width)+","+(-half_rec_height)+")")
      .attr("width", 0)
      .attr("height", 0)
      .style("fill", "url(#radial-gradient)")
      .style("filter", "url(#drop-shadow)");

  nodeEnter.append("text")
      .attr("dy", 3)
      .attr("text-anchor", "middle")
      .attr("class","name")
      .text(function(d) { return d.name; })
      .style("fill-opacity", 1e-6);

  nodeEnter.append("text")
      .attr("display","none")
      .attr("class","steam-id")
      .text(function(d,i) {return d.steam_id; });

  nodeEnter.append("rect")
      .attr("transform", "translate("+(-half_rec_width)+","+(-half_rec_height)+")")
      .attr("width", 0)
      .attr("height", 0)
      .style("fill", "url(#radial-gradient)");

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { p = calcLeft(d); return "translate(" + p.y + "," + p.x + ")"; });

  nodeUpdate.select("rect")
      .attr("height", rec_height)
      .attr("width", rec_width)

  nodeEnter.append("rect")
      .attr("transform",function(d) { 
        if(d.isRight)
          return "translate("+(-half_rec_width)+","+(-half_rec_height)+")";
        else
          return "translate("+(+half_rec_width - rec_height + 5)+","+(-half_rec_height)+")"; })
      .attr("width", 0)
      .attr("height", 0)
      .attr("id","res")
      .style("fill", "url(#radial-gradient)");

  nodeEnter.append("text")
    .attr("dy", 3)
    .attr("text-anchor", "middle")
    .attr("class","result")
    .attr("transform",function(d) { 
        if(d.isRight)
          return "translate("+(-half_rec_width + 7.5)+",0)";
        else
          return "translate("+(+half_rec_width - 7.5)+",0)"; 
      })
    .text(function(d) {  return d.result; })

  nodeUpdate.select("#res")
      .attr("height", rec_height)
      .attr("width", 15)
      .style("fill", function(d){
        if(d.result == 1){
          return "#258028";
        } else {
          return "#AB0909";
        }
      })
      .style("display",function(d){
        if(d.winner)
          return "none";
        else 
          return "block";
      });

  nodeUpdate.select("text")
      .style("fill-opacity", 1);

  // Update the links...
  var link = vis.selectAll("path.link")
      .data(tree.links(nodes), function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", diagonal)
      .attr("data-steam-id",function(d) { return d.target.steam_id; });

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", connector);

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    var p = calcLeft(d);
    d.x0 = p.x;
    d.y0 = p.y;
  });

// Calculating time since the date
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

// Showing person name, last login, time when steam was created, steam id and steam avatar
  function showAccountStats(d) {
    steamid = d.steam_id;
    stats = findBySteamId(dota_stats.players, steamid);
    updateChart(stats);  

    steamacc = findInArrayOfJSONObjects(steamaccounts, steamid);
    date = timeSince(new Date(steamacc.lastlogoff*1000));
    created = timeSince(new Date(steamacc.timecreated*1000));

    tooltip.style("visibility", "visible")
      .select("img")
      .attr("src", steamacc.avatarfull);
    tooltip.select("#steam-personaname")
      .text(steamacc.personaname);

    tooltip.select("#steam-id32")
      .text(steamacc.steamid);

    tooltip.select("#steam-last-login")
      .text(date);

    if(steamacc.timecreated != undefined) {
    tooltip.select("#steam-created")
      .text(created);
    } else {
      created = "Unknown";
      tooltip.select("#steam-created")
      .text(created);
    }

  }
 // Finding JSON object in array by Steam id
  function findBySteamId(array, id) {
    for(z in array) {
      if(array[z].steamid == id) {
        return array[z];
      }
    }
  }

  function onNodeHover(id) {
    var nodes = toArray(source);

    links = vis.select("path.link");
    nodes.forEach(function(d,i) { 
      //Diferentiate finalists nodes from other nodes
      if(id == d.steam_id){
        if(d.winner)
          vis.selectAll("path.link[data-steam-id='"+id+"']")
          .attr("class","hovered-winner");

        vis.selectAll("path.link[data-steam-id='"+id+"']")
          .attr("class","hovered");
      }
    });
  }

  function onNodeUnhover() {
    vis.selectAll("path").attr("class","link");
  }

}

function findInArrayOfJSONObjects(array,steam_id) {
  for (z in array) {
    if (array[z].steamid == steam_id) return array[z];   
  }
}

  