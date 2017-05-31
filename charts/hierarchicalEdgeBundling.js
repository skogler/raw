'use strict';

// import d3 'd3-hierarchy';
// import * as d3 from 'd3-shape';

import '../lib/raw.js';

var d3h = require('d3-hierarchy');
var d3s = require('d3-shape');

(function(){
  var model = raw.models.tree();

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
    .defaultValue(600);

  var margin = chart.number()
    .title('margin')
    .defaultValue(10);


  // Drawing function
  // selection represents the d3 selection (svg)
  // data is not the original set of records
  // but the result of the model map function
  chart.draw(function (selection, data){
    var root = d3h.hierarchy(data);

    var diameter = width() * 0.8;
    var radius = diameter / 2;
    var innerRadius = radius - 120;

    var cluster = d3h.cluster()
      .size([360, innerRadius]);

    
    function createHierarchicalLinks(node) {
      var links = [];
      node.eachBefore(function(node) {
        if (!node.children) {
          var ancestors = node.ancestors();
          var s = ancestors[0];
          var i = ancestors.length;
          while (--i > 1)
          {
            var d = ancestors[i];
            links.push([[s.x, s.y], [d.x, d.y]]);
          }
        }
      });
      return links;
    }

    cluster(root);

    var lineFunction = d3s.line();
      // .curve(d3s.curveBundle.beta(0.85))
      // .radius(function(d) { return d.y; })
      // .angle(function(d) { return d.x / 180 * Math.PI;  });

    var svg = selection
      .attr("width", width())
      .attr("height", height())
      .append("g")
      .attr("transform", "translate(" + radius + "," + radius + ")");

    var link = svg.append("g").selectAll(".link");
    var node = svg.append("g").selectAll(".node");

    link = link
      .data(createHierarchicalLinks(root))
      .enter().append("path")
      .attr("class", "link")
      .attr("d", function(d) {
        var res = lineFunction(d);
        console.log(d, res);
        return res;
      });

    node = node
      .data(root.leaves())
      .enter().append("text")
      .attr("class", "node")
      .attr("dy", "0.31em")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .text(function(d) { return d.data.label ? d.data.label.join(", ") : d.data.name; })
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
