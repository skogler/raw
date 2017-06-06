import '../lib/raw.js';

(function(){
  'use strict';

  var d3s = require('d3-shape');

  var model = raw.model();
  model.dimensions().remove('size');
  model.dimensions().remove('color');
  model.dimensions().remove('label');

  var source = model.dimension('source')
    .title('source')
    .multiple(false)
    .required(1);

  var target = model.dimension('target')
    .title('target')
    .multiple(false)
    .required(1);

  model.map(function (data){
    var d = { nodes: [], links: [] };
    var nodeMap = new Map();
    var numNodes = 0;
    var l = [];

    if (!source() || !target())
    {
      return d;
    }

    var sourceVal = data.map(x => source(x));
    var targetVal = data.map(x => target(x));

    if (!sourceVal || !targetVal)
    {
      return d;
    }

    if (sourceVal.length != targetVal.length) {
      return d;
    }
    // create nodes on demand
    for (var i = 0, len = sourceVal.length; i < len; i++) {
      var s = sourceVal[i];
      var t = targetVal[i];
      // skip self-edges
      if (s == t)
      {
        continue;
      }
      var si = 0;
      var ti = 0;
      if (!nodeMap.has(s))
      {
        si = numNodes++;
        nodeMap.set(s, si);
      }
      else
      {
        si = nodeMap.get(s);
      }
      if (!nodeMap.has(t))
      {
        ti = numNodes++;
        nodeMap.set(t, ti);
      }
      else
      {
        ti = nodeMap.get(s);
      }
      l.push([si, ti]);
    }

    nodeMap.forEach(function(v,k,m) {
      d.nodes[v] = { name: k };
    });
    d.links = l;
    return d;
  });

  var chart = raw.chart()
    .title("Circular Edge Bundling")
    .description("Visualizes networks represented by a list of edges in a circular layout with bundled edges.")
    .category('Network')
    .model(model);

  var width = chart.number()
    .title('Width')
    .defaultValue(900);

  var height = chart.number()
    .title('Height')
    .defaultValue(900);

  var margin = chart.number()
    .title('margin')
    .defaultValue(10);

  // Drawing function
  // selection represents the d3 selection (svg)
  // data is not the original set of records
  // but the result of the model map function
  chart.draw(function (selection, data){
    var w = Math.max(0, width() || 0);
    var h = Math.max(0, height() || 0);
    var m = Math.max(0, margin() || 0);

    var nodes = data.nodes;
    var links = data.links;

    if (nodes.length === 0 || links.length === 0)
    {
      return;
    }

    // create circular layout
    var minDim = Math.min(w, h);
    var diameter = minDim - m;
    var radius = diameter / 2;
    var innerRadius = Math.max(0, radius - 120);
    var placementAngle = (2 * Math.PI) / (nodes.length);

    for (var i = 0, len = nodes.length; i < len; i++) {
      nodes[i].x = Math.cos(placementAngle * i) * innerRadius;
      nodes[i].y = -Math.sin(placementAngle * i) * innerRadius;
      nodes[i].angle = (placementAngle * i * 180) / Math.PI;
    }

    var lineFunction = d3s.line()
      .curve(d3s.curveBundle.beta(0.85));

    var svg = selection
      .attr("width", w)
      .attr("height", h)
      .append("g")
      .attr("transform", "translate(" + w/2 + "," + h/2 + ")");

    svg.append("g").selectAll(".link")
      .data(links)
      .each(link => [nodes[link].x, nodes[link].y])
      .enter().append("path")
      .attr("class", "link")
      .attr("d", lineFunction);

    var nodeGroups =  svg.append("g").selectAll(".node")
      .data(nodes)
      .enter().append("g")
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")rotate(-" + d.angle + ")" );

    nodeGroups.append("circle").attr('r', '1');
    nodeGroups.append("text")
      .attr("class", "node")
      .attr("dy", "0.31em")
      .attr("transform", d => "translate(5,0)rotate(" + ((d.angle > 90 && d.angle < 270) ? 180  : 0) + ")" )
      .attr("text-anchor", d => ((d.angle > 90 && d.angle < 270) ? 180  : 0) ? "end" : "start")
      .text(d => d.label ? d.label.join(", ") : d.name )
      .on("mouseover", mouseovered)
      .on("mouseout", mouseouted);

    function mouseovered(d) {
      // node.each(function(n) { n.target = n.source = false; });

      // link.classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
      //   .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
      //   .filter(function(l) { return l.target === d || l.source === d; })
      //   .raise();

      // node.classed("node--target", function(n) { return n.target; })
      //   .classed("node--source", function(n) { return n.source; });
    }

    function mouseouted(d) {
      // link.classed("link--target", false)
      //   .classed("link--source", false);

      // node.classed("node--target", false)
      //   .classed("node--source", false);
    }

  }); // end of draw
})(); // end of chart
