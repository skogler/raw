(function(){
  var model = raw.models.tree();

  var chart = raw.chart()
    .title("Hierarchical Edge Bundling")
    .description("")
	  .category('Hierarchy')
    .model(model)

  var width = chart.number()
    .title('Width')
    .defaultValue(900)

  var height = chart.number()
    .title('Height')
    .defaultValue(600)

  var margin = chart.number()
    .title('margin')
    .defaultValue(10)

  // Drawing function
  // selection represents the d3 selection (svg)
  // data is not the original set of records
  // but the result of the model map function
  chart.draw(function (selection, data){

    selection
      .attr("width", width())
      .attr("height", height())

    //TODO implement useful stuff here
    d3.hierarchy({});

  })
})();
