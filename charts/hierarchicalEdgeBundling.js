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
    var root = d3.hierarchy(data);

    var diameter = width() * 0.8;
    var radius = diameter / 2;
    var innerRadius = radius - 120;

    var cluster = d3.cluster()
      .size([360, innerRadius]);

    
    function createHierarchicalLinks(node) {
      var links = [];
      node.eachBefore(function(node) {
        if (!node.children) {
          var ancestors = node.ancestors()
          links.push({source: ancestors[0], target: ancestors[ancestors.length - 1]});
        }
      });
      return links;
    }

    cluster(root);

    var line = d3.lineRadial()
      .curve(d3.curveBundle.beta(0.85))
      .radius(function(d) { return d.y; })
      .angle(function(d) { return d.x / 180 * Math.PI;  });

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
        console.log(d);
        console.log(line(d));
      });

    node = node
      .data(root.leaves())
      .enter().append("text")
      .attr("class", "node")
      .attr("dy", "0.31em")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .text(function(d) { return d.data.name; })
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
