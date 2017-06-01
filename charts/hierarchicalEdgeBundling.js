'use strict';

// import d3 'd3-hierarchy';
// import * as d3 from 'd3-shape';

import '../lib/raw.js';

var d3h = require('d3-hierarchy');
var d3s = require('d3-shape');

(function(){
  var model = raw.models.tree();
  model.dimensions().remove('size');
  model.dimensions().remove('color');
  model.dimensions().remove('label');

  var chart = raw.chart()
    .title("Hierarchical Edge Bundling")
    .description("")
    .category('Hierarchy')
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

    var root = d3h.hierarchy(data);
    var fakeRoot = root.descendants()[0];
    var nodes = root.descendants().slice(1);

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

    // create an edge to each nodes' parent
    var links = [];
    for (var i = 0, len = nodes.length; i < len; i++) {
      var n = nodes[i];
      var p = n.parent;
      while (p && p != fakeRoot) {
        links.push([[n.x, n.y],[p.x, p.y]]);
        p = p.parent;
      }
    }

    var lineFunction = d3s.line()
      .curve(d3s.curveBundle.beta(0.85));

    var svg = selection
      .attr("width", w)
      .attr("height", h)
      .append("g")
      .attr("transform", "translate(" + w/2 + "," + h/2 + ")");

    var link = svg.append("g").selectAll(".link");
    var node = svg.append("g").selectAll(".node");

    link = link
      .data(links)
      .enter().append("path")
      .attr("class", "link")
      .attr("d", lineFunction);

    var nodeGroups =  node
      .data(nodes)
      .enter().append("g")
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")rotate(-" + d.angle + ")" );

    nodeGroups.append("circle").attr('r', '1');
    nodeGroups.append("text")
      .attr("class", "node")
      .attr("dy", "0.31em")
      .attr("transform", d => "translate(5,0)rotate(" + ((d.angle > 90 && d.angle < 270) ? 180  : 0) + ")" )
      .attr("text-anchor", d => ((d.angle > 90 && d.angle < 270) ? 180  : 0) ? "end" : "start")
      .text(d => d.data.label ? d.data.label.join(", ") : d.data.name )
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
