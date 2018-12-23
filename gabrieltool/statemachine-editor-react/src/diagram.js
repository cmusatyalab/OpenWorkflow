import React, {
  Component
} from 'react';
import $ from 'jquery';
import joint from './joint.shapes.fsa.custom';

function create_state_shape(label, x, y) {
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
}
export class Diagram extends Component {

  constructor(props) {
    super(props);
    this.graph = new joint.dia.Graph();
    this.cells = [];
  }

  componentDidMount() {
    this.$el = $(this.el);
    const paper = new joint.dia.Paper({
      el: this.$el,
      width: '600px',
      height: '800px',
      gridSize: 1,
      model: this.graph
    });

    this.graph.addCells(this.cells);

    this.graph.addCell(create_state_shape('test', 200, 200));
  }

  render() {
    return (<div ref={el => this.el = el}>Diagram</div>);
    }
  }