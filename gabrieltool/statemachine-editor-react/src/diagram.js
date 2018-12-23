import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import joint from 'jointjs';

class Diagram extends Component {

  constructor(props){
    super(props);
    this.graph = new joint.dia.Graph();
    this.cells = [];
  }

  componentDidMount(){
    this.$el = $(this.el);
		const paper = new joint.dia.Paper({
			el: this.$el,
			width: '600px',
			height: '800px',
			gridSize: 1,
			model: this.graph
		});

		this.graph.addCells(this.cells);
  }

  render() {
      return (<div ref={el => this.el = el}>Diagram</div>);
  }
}

export default Diagram;
