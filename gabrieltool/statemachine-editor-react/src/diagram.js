import React, { Component } from "react";
import $ from "jquery";
import joint from "jointjs";

// define custom state machine JointJS elements
joint.shapes.basic.Circle.define("fsa.State", {
  attrs: {
    circle: {
      "stroke-width": 3
    },
    text: {
      "font-weight": "800"
    }
  }
});

joint.dia.Link.define("fsa.Arrow", {
  attrs: {
    ".marker-target": {
      d: "M 10 0 L 0 5 L 10 10 z"
    },
    ".link-tools": {
      display: "none"
    },
    ".tool-remove": {
      display: "none"
    }
  },
  smooth: true
});

const create_transition_cell = (source, target, label) => {
  var cell = new joint.shapes.fsa.Arrow({
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
    this.cells = [];
    this.state_shape_width = 50;
    this.state_shape_height = 50;
    this.state_spacing_x = 250;
    this.state_spacing_y = 150;
    this.state_per_row = 3;
    this.renderAllStates = this.renderAllStates.bind(this);
    this.renderAllTransitions = this.renderAllTransitions.bind(this);
  }

  componentDidMount() {
    this.$el = $(this.el);
    const paper = new joint.dia.Paper({
      el: this.$el,
      width: 800,
      height: 800,
      gridSize: 1,
      model: this.graph
    });
    this.state_per_row =
      Math.floor(
        parseInt(paper.options.width, 10) /
          (this.state_shape_width + this.state_spacing_x)
      ) + 1;

    this.graph.addCells(this.cells);
  }

  componentWillUnmount() {
    this.graph.clear();
  }

  componentDidUpdate() {
    console.log("called compnenet did update");
    // this.graph.clear();
    // this.graph.addCells(this.cells);
  }

  handleStateCallback(cell) {
    this.stateCells.push(cell);
    console.log("hanldeStateCallback: " + this.stateCells);
  }

  renderAllStates(fsm) {
    console.log("called render all states");
    const stateCells = fsm.getStatesList().map((state, idx) => {
      return create_state_cell(
        Math.floor(idx % this.state_per_row) * this.state_spacing_x,
        Math.floor(idx / this.state_per_row) * this.state_spacing_y,
        state.getName()
      );
    });
    this.graph.addCells(stateCells);
    return stateCells;
  }

  renderAllTransitions(fsm) {
    const states = fsm.getStatesList();
    const stateJointCells = this.graph.getElements();
    console.log(
      "after getting all stateJOintElements. this.stateCells better have 5 elements."
    );
    const state_name_to_joint_id = {};
    stateJointCells.map(jointElement => {
      const stateCellName = jointElement.attr("text/text");
      if (stateCellName in state_name_to_joint_id) {
        throw new Error(
          "Duplicate state name found. Quit adding transitions..."
        );
      } else {
        state_name_to_joint_id[stateCellName] = jointElement;
      }
    });
    const transitionCells = states.map(state => {
      return state.getTransitionsList().map(transition => {
        return create_transition_cell(
          state_name_to_joint_id[state.getName()],
          state_name_to_joint_id[transition.getNextState()],
          transition.getName()
        );
      });
    });
    this.graph.addCells(transitionCells);
    return transitionCells;
  }

  render() {
    console.log(this.props.fsm);
    const { fsm } = this.props;
    if (fsm) {
      this.graph.clear();
      this.renderAllStates(fsm);
      this.renderAllTransitions(fsm);
    }
    return (
      <div ref={el => (this.el = el)}>
        <h4>Diagram</h4>
      </div>
    );
  }
}
