var dota_stats;
var margin = {top: 20, right: 20, bottom: 70, left: 40},
    width = 600 - margin.left - margin.right,
    heightBar = 300 - margin.top - margin.bottom;

// Parse the date / time
var	parseDate = d3.time.format("%Y-%m").parse;

var xBarChart = d3.scale.ordinal().rangeRoundBands([0, width], .05);

var yBarChart = d3.scale.linear().range([heightBar, 0]);

var xBarAxis = d3.svg.axis()
    .scale(xBarChart)
    .orient("bottom")
    .tickFormat(d3.time.format("%Y-%m-%d"));

var yBarAxis = d3.svg.axis()
    .scale(yBarChart)
    .orient("left")
    .ticks(10);

var svg = d3.select("#graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", heightBar + margin.top + margin.bottom)
  .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

d3.json("./json/dota_stats.json", function(json) {
  dota_stats = json;
  draw_bar_chart();
});

var defs = svg.append("defs");
var filter = defs.append("filter")
    .attr("id", "drop-shadow")
    .attr("height", "105%");

// SourceAlpha refers to opacity of graphic that this filter will be applied to
// convolve that with a Gaussian with standard deviation 4 and store result
// in blur
filter.append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", 2)
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


function draw_bar_chart() {
  dota_xpm = dota_stats.players[0].dota_xpm;
  dota_gpm = dota_stats.players[0].dota_gpm;
  dates = dota_stats.players[0].dates;

  var data = {};
  data.dota_xpm = dota_xpm;
  data.dota_gpm = dota_gpm;
  data.dates = dates;
  
  for(var i=0; i<data.dates.length;i++){
      data.dates[i] = new Date(data.dates[i]);
  }
	
  xBarChart.domain(data.dates.map(function(d,i) { return d; }));
  yBarChart.domain([0, d3.max(dota_xpm, function(d) { return d; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + heightBar + ")")
      .call(xBarAxis)
    .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", "-.55em")
      .attr("transform", "rotate(-45)" );    

  svg.append("g")
      .attr("class", "y axis")
      .call(yBarAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .attr("x", 10)
      .style("text-anchor", "end")
      .text("exp/min");

  svg.selectAll("bar")
      .data(dota_gpm)
      .enter().append("rect")
      .attr("class","bars")
      .style("fill", "#2191A8")
      .style("filter", "url(#drop-shadow)")
      .attr("x", function(d,i) { return xBarChart(dates[i]); })
      .attr("width", xBarChart.rangeBand())
      .attr("y", function(d) { return yBarChart(d); })
      .attr("height", function(d) { return heightBar - yBarChart(d); });

}

function updateChart(stats) {
  dota_xpm = stats.dota_xpm;
  dota_gpm = stats.dota_gpm;
  dates = stats.dates;
  // Scale the range of the dota_xpm
  dates = dota_stats.players[0].dates;

  var data = {};
  data.dota_xpm = dota_xpm;
  data.dota_gpm = dota_gpm;
  data.dates = dates;
  
  for(var i=0; i<data.dates.length;i++){
      data.dates[i] = new Date(data.dates[i]);
  }
  
  xBarChart.domain(data.dates.map(function(d,i) { return d; }));
  yBarChart.domain([0, d3.max(dota_xpm, function(d) { return d; })]);
  d3.selectAll(".bars").remove();
  svg.selectAll("bar")
      .data(dota_gpm)
      .enter().append("rect")
      .attr("class","bars")
      .style("fill", "#2191A8")
      .style("filter", "url(#drop-shadow)")
      .attr("x", function(d,i) { return xBarChart(dates[i]); })
      .attr("width", xBarChart.rangeBand())
      .attr("y", function(d) { return yBarChart(d); })
      .attr("height", function(d) { return heightBar - yBarChart(d); });

      

}