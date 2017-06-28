import '../lib/raw.js';

(function(){
  'use strict';
  var d3h = require('d3-hierarchy');
  var d3s = require('d3-shape');

  const HIERARCHY_SEPARATOR = '.';
  const LINK_SEPARATOR = '|';

  var model = raw.model();

  var hierarchy = model.dimension('hierarchy')
    .title('Hierarchy')
    .description("Will be split by the configured hierarchy separator to build the hierarchy. The rightmost entries are the final node names.")
    .required(1)
    .types(String)
    .multiple(false);

  var links = model.dimension('links')
    .title('Links')
    .required(1)
    .multiple(true)
    .types(String)
    .description("List of identifiers of connected nodes. Will be split by the configured links separator to build a list of links for each node.");

  var size = model.dimension('size')
    .title('Size')
    .required(1)
    .multiple(false)
    .types(Number)
    .description("Size of each node. Required for weighting the hierarchical layout.");

  var chart = raw.chart()
    .title("Hierarchical Edge Bundling")
    .description("Visualizes a hierarchy with adjacency information between leaves.")
    .category('Hierarchy+Graph')
    .thumbnail("imgs/hierarchicalEdgeBundling.png")
    .model(model);

  var width = chart.number()
    .title('Width')
    .defaultValue(900);

  var height = chart.number()
    .title('Height')
    .defaultValue(900);

  var margin = chart.number()
    .title('Margin')
    .defaultValue(10);

  var link_separator = chart.string()
    .title('Link Separator')
    .defaultValue(LINK_SEPARATOR);

  var hierarchy_separator = chart.string()
    .title('Hierarchy Separator')
    .defaultValue(HIERARCHY_SEPARATOR);

  var opacity = chart.number()
    .title('Link opacity')
    .defaultValue(0.4);

  model.map(function (data) {
    var result = { hierarchy: null, links: null };
    if (!hierarchy() || !links() || !size()) {
      return result;
    }
    var nodeMap = new Map();
    var root = {id: "root", name: "root", children: []};
    nodeMap[""] = root;

    function getOrCreateNode(id, data) {
      var node = nodeMap[id];
      if (node) {
        return node;
      }
      var name = id;
      var path = "";
      var idx =  id.lastIndexOf(hierarchy_separator() || HIERARCHY_SEPARATOR);
      if (idx > -1) {
        path = id.substring(0, idx);
        name = id.substring(idx + 1);
      }
      node = {id: id, name: name, children: []};
      // leaf nodes have data attached
      if (data) {
        node.data = data;
      }
      // find parent to attach to
      var parent = getOrCreateNode(path);
      parent.children.push(node);
      node.parent = parent;
      nodeMap[id] = node;
      return node;
    }
    data.forEach(x => getOrCreateNode(hierarchy(x), x));
    var d3hierarchy = d3h.hierarchy(root);
    var d3links = [];

    // create links via the hierarchy
    nodeMap = [];
    d3hierarchy.leaves().forEach(x => nodeMap[x.data.id] = x);
    data.forEach(x =>  {
      var srcNode = nodeMap[hierarchy(x)];
      var linksString = links(x);
      if (linksString)
      {
        linksString = linksString[0];
        var linksArray = linksString.split(link_separator() || LINK_SEPARATOR);
        linksArray.forEach(l => {
          var dstNode = nodeMap[l];
          if (dstNode)
          {
            d3links.push(srcNode.path(dstNode));
          }
        });
      }
    });

    result.hierarchy = d3hierarchy;
    result.links = d3links;
    return result;
  });

  var svgNodes = "";
  var svgLinks = "";

  // Drawing function
  // selection represents the d3 selection (svg)
  // data is not the original set of records
  // but the result of the model map function
  chart.draw((selection, data) => {
    var w = Math.max(0, width() || 0);
    var h = Math.max(0, height() || 0);
    var m = Math.max(0, margin() || 0);
    var minDim = Math.min(w, h);
    var diameter = minDim - m;
    var radius = diameter / 2;
    var innerRadius = Math.max(0, radius - 120);

    var chartContainer = $('#chart');
    chartContainer.width(w);
    chartContainer.height(h);

    // hierarchically compute each cluster's size
    var root = data.hierarchy.sum(x => x.size);
    // create layout based on size
    // will interpret x as angle, y as radius
    d3h.cluster().size([360, innerRadius])(root);

    var lineFunction = d3s.lineRadial()
      .curve(d3s.curveBundle.beta(0.85))
      .radius(x => x.y)
      .angle(x => x.x / 180 * Math.PI);

    var svg = selection
      .attr("viewBox",[-w/2, -h/2, w, h].join(","));
      svg.append("style").text(`
.node {
  font: 300 11px \"Helvetica Neue", Helvetica, Arial, sans-serif;
  fill: #bbb;
}

.node:hover {
  fill: #000;
}

.link {
  stroke: steelblue;
  fill: none;
  pointer-events: none;
}

.node:hover,
.node--source,
.node--target {
  font-weight: 700;
}

.node--source {
  fill: #2ca02c;
}

.node--target {
  fill: #d62728;
}

.link--source,
.link--target {
  stroke-opacity: 1;
  stroke-width: 2;
}

.link--source {
  stroke: #d62728;
}

.link--target {
  stroke: #2ca02c;
}`);


    svgLinks = svg.append("g").selectAll(".link")
      .data(data.links)
      .enter().append("path")
      .each(x => { 
        x.source = x[0];
        x.target = x[x.length - 1];
      })
      .attr("class", "link")
      .attr("style", "stroke-opacity: " + opacity())
      .attr("d", lineFunction);

    svgNodes = svg.append("g").selectAll(".node")
      .data(root.leaves())
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", d => "rotate(" + (d.x - 90) + ")translate("+ (d.y + 6) + ")" );


    svgNodes.append("circle").attr('r', '1');
    svgNodes.append("text")
      .attr("alignment-baseline", "middle")
      .attr("transform", d => "translate(6,0)rotate(" + ((d.x <= 180) ? 0 : 180) + ")" )
      .attr("text-anchor", d => (d.x <= 180) ? "start" : "end" )
      .text(d => d.data.label ? d.data.label.join(", ") : d.data.name )
      .on("mouseover", onNodeMouseOver)
      .on("mouseout", onNodeMouseOut);

  }); // end of draw

  function onNodeMouseOver(d) {
    svgNodes.each(n => n.isSelectedTarget = n.isSelectedSource = false);

    svgLinks.classed("link--target", l => {
      if (l.target === d) {
        l.source.isSelectedSource = true; 
        return true;
      }
      return false;
    });

    svgLinks.classed("link--source", l => { 
      if (l.source === d) {
        l.target.isSelectedTarget = true; 
        return true;
      }
      return false;
    });

    svgNodes.classed("node--target", n => n.isSelectedTarget)
      .classed("node--source", n => n.isSelectedSource);
  }

  function onNodeMouseOut(d) {
    svgLinks.classed("link--target", false)
      .classed("link--source", false);

    svgNodes.classed("node--target", false)
      .classed("node--source", false);
  }

})(); // end of chart
