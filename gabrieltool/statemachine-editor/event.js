// paper object event call backs
var info = new joint.shapes.standard.Rectangle();
info.position(100, 100);
info.resize(100, 20);
info.attr({
  body: {
    visibility: "visible",
    cursor: "default",
    fill: "blue",
    stoke: "black"
  },
  label: {
    visibility: "hidden",
    text: "Link clicked",
    cursor: "default",
    fill: "black",
    fontSize: 12
  }
});
info.addTo(graph);

function resetAll(paper) {
  paper.drawBackground({
    color: "white"
  });

  var elements = paper.model.getElements();
  for (var i = 0, ii = elements.length; i < ii; i++) {
    var currentElement = elements[i];
    currentElement.attr("body/stroke", "black");
  }

  var links = paper.model.getLinks();
  for (var j = 0, jj = links.length; j < jj; j++) {
    var currentLink = links[j];
    currentLink.attr("line/stroke", "black");
    currentLink.label(0, {
      attrs: {
        body: {
          stroke: "black"
        }
      }
    });
  }
}

paper.on("element:pointerdblclick", function(elementView) {
  resetAll(this);

  var currentElement = elementView.model;
  currentElement.attr("body/stroke", "orange");
  currentElement.attr("body/fill", "blue");
});

paper.on("link:pointerdblclick", function(linkView) {
  resetAll(this);

  var currentLink = linkView.model;
  currentLink.attr("line/stroke", "orange");
  currentLink.label(0, {
    attrs: {
      body: {
        stroke: "orange"
      }
    }
  });
});

paper.on("cell:pointerdblclick", function(cellView) {
  var isElement = cellView.model.isElement();
  var message = (isElement ? "Element" : "Link") + " clicked";
  info.attr("label/text", message);

  info.attr("body/visibility", "visible");
  info.attr("label/visibility", "visible");
});

paper.on("element:pointerdblclick", function(elementView) {
  resetAll(this);

  var currentElement = elementView.model;
  currentElement.attr("body/stroke", "orange");
});
