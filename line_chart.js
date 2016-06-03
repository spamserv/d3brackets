var dota_stats, data;

// Set the dimensions of the canvas / graph
var marginLineChart = {top: 30, right: 20, bottom: 30, left: 50},
    widthLineChart = 600 - marginLineChart.left - marginLineChart.right,
    heightLineChart = 270 - marginLineChart.top - marginLineChart.bottom;

// Parse the date / time

// Set the ranges
var x = d3.scale.linear().range([0, widthLineChart]);
var y = d3.scale.linear().range([heightLineChart, 0]);

// Define the axes
var xLineAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(10);

var yLineAxis = d3.svg.axis().scale(y)
    .orient("left").ticks(5);

// Define the line
var valueline = d3.svg.line()
    .x(function(d,i) { return x(i); })
    .y(function(d) { return y(d); });
    
// Adds the svg canvas
var svg = d3.select("#graph")
    .append("svg")
        .attr("width", widthLineChart + marginLineChart.left + marginLineChart.right)
        .attr("height", heightLineChart + marginLineChart.top + marginLineChart.bottom)
    .append("g")
        .attr("transform", 
              "translate(" + marginLineChart.left + "," + marginLineChart.top + ")");

// Get the data
d3.json("./json/dota_stats.json", function(json) {
  dota_stats = json;
  draw_line_chart();
});

function draw_line_chart() {
  dota_xpm = dota_stats.players[0].dota_xpm;
  dota_gpm = dota_stats.players[0].dota_gpm;

  // Scale the range of the dota_xpm
  x.domain(d3.extent(dota_xpm, function(d,i) { return i; }));
  y.domain([0, d3.max(dota_xpm, function(d) { return d; })]);

  // Add the valueline path.
  svg.append("path")
      .attr("class", "line")
      .attr("id","dota_xpm")
      .attr("stroke","green")
      .attr("d", valueline(dota_xpm));

  svg.append("path")
      .attr("class", "line")
      .attr("id","dota_gpm")
      .attr("stroke","#FFD700")
      .attr("d", valueline(dota_gpm));
  // Add the X Axis
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + heightLineChart + ")")
      .call(xLineAxis);

  // Add the Y Axis
  svg.append("g")
      .attr("class", "y axis")
      .call(yLineAxis);
}
