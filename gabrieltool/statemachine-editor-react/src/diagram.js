import React, { Component } from "react";
import $ from "jquery";
import joint from "jointjs";

// define custom state machine JointJS elements
joint.shapes.basic.Circle.define("fsa.State", {
  attrs: {
    circle: {
      "stroke-width": 2
    },
    text: {
      "font-weight": "800"
    }
  }
});

joint.shapes.standard.Link.define("fsa.CustomArrow", {
  attrs: {
    line: {
      sourceMarker: {
        type: "circle",
        width: 5,
        stroke: "none"
      }
    }
  },
  smooth: true
});

const create_transition_cell = (source, target, label) => {
  var cell = new joint.shapes.fsa.CustomArrow({
    source: {
      id: source.id
    },
    target: {
      id: target.id
    },
    labels: [
      {
        position: 0.5,
        attrs: {
          text: {
            text: label || ""
          }
        }
      }
    ]
  });
  return cell;
};

const create_state_cell = (x, y, label) => {
  let cell = new joint.shapes.fsa.State({
    position: {
      x: x,
      y: y
    },
    size: {
      width: 100,
      height: 100
    },
    attrs: {
      text: {
        text: label
      }
    }
  });
  return cell;
};

export class Diagram extends Component {
  constructor(props) {
    super(props);
    this.graph = new joint.dia.Graph();
    this.state_shape_width = 50;
    this.state_shape_height = 50;
    this.state_spacing_x = 250;
    this.state_spacing_y = 150;
    this.state_per_row = 3;
    this.cellId2FSMElement = {};
    this.renderAllStates = this.renderAllStates.bind(this);
    this.renderAllTransitions = this.renderAllTransitions.bind(this);
    this.getStateName2CellMap = this.getStateName2CellMap.bind(this);
    this.clearGraph = this.clearGraph.bind(this);
  }

  componentDidMount() {
    const { onClickCell, paperWidth } = this.props;
    this.$el = $(this.el);
    console.log("paper width is: " + paperWidth);
    const paper = new joint.dia.Paper({
      el: this.$el,
      width: paperWidth,
      height: 5 * paperWidth,
      gridSize: 1,
      model: this.graph,
      restrictTranslate: true
    });
    paper.on("cell:pointerdblclick", onClickCell);
    paper.on("cell:pointerclick", onClickCell);
    this.state_per_row =
      Math.floor(
        parseInt(paper.options.width, 10) /
          (this.state_shape_width + this.state_spacing_x)
      ) + 1;
  }

  componentWillUnmount() {
    this.graph.clear();
    this.cellId2FSMElement = {};
  }

  componentDidUpdate() {}

  handleStateCallback(cell) {
    this.stateCells.push(cell);
  }

  renderAllStates(fsm) {
    const stateCells = fsm.getStatesList().map((state, idx) => {
      const cell = create_state_cell(
        Math.floor(idx % this.state_per_row) * this.state_spacing_x,
        Math.floor(idx / this.state_per_row) * this.state_spacing_y,
        state.getName()
      );
      // mark start state
      if (fsm.getStartState() === state.getName()){
        cell.attr('circle/stroke-width', '5');
      }
      this.addGraphCellWithRef(cell, state);
      return null;
    }, this);
    return stateCells;
  }

  renderAllTransitions(fsm) {
    const states = fsm.getStatesList();
    const stateName2Cell = this.getStateName2CellMap();
    const transitionCells = states.map(state => {
      return state.getTransitionsList().map(transition => {
        const cell = create_transition_cell(
          stateName2Cell[state.getName()],
          stateName2Cell[transition.getNextState()],
          transition.getName()
        );
        this.addGraphCellWithRef(cell, transition);
        return null;
      }, this);
    }, this);
    return transitionCells;
  }

  getStateName2CellMap() {
    const stateCells = this.graph.getElements();
    const stateName2Cell = {};
    stateCells.map(jointElement => {
      const stateName = jointElement.attr("text/text");
      if (stateName in stateName2Cell) {
        // throw new Error("Invalid FSM! Duplicate state name found.");
        console.error("Duplicate State Name: " + stateName);
      } else {
        stateName2Cell[stateName] = jointElement;
      }
      return null;
    });
    return stateName2Cell;
  }

  addGraphCellWithRef(cell, ref) {
    // addGraphCell add a cell to the graph and record the reference object
    // this cell represents.
    this.graph.addCell(cell);
    this.cellId2FSMElement[cell.id] = ref;
  }

  clearGraph() {
    this.graph.clear();
    this.cellId2FSMElement = {};
  }

  render() {
    const { fsm } = this.props;
    if (fsm != null) {
      this.clearGraph();
      this.renderAllStates(fsm);
      this.renderAllTransitions(fsm);
    }
    return <div ref={el => (this.el = el)} />;
  }
}
