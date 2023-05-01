import React, { Component } from "react";
import $ from "jquery";
import joint from "jointjs";
import _ from "lodash";
import { getAllNames } from "./utils";

// define custom state machine JointJS elements
joint.shapes.basic.Circle.define("fsa.State", {
    attrs: {
        circle: {
            "stroke-width": 2,
        },
        text: {
            "font-weight": "800",
        },
    },
});

joint.shapes.standard.Link.define("fsa.CustomArrow", {
    attrs: {
        line: {
            sourceMarker: {
                type: "circle",
                width: 5,
                stroke: "none",
            },
        },
    },
    smooth: true,
});

function adjustVertices(graph, cell) {
    // if `cell` is a view, find its model
    cell = cell.model || cell;

    if (cell instanceof joint.dia.Element) {
        // `cell` is an element

        _.chain(graph.getConnectedLinks(cell))
            .groupBy(function(link) {
                // the key of the group is the model id of the link's source or target
                // cell id is omitted
                return _.omit([link.source().id, link.target().id], cell.id)[0];
            })
            .each(function(group, key) {
                // if the member of the group has both source and target model
                // then adjust vertices
                if (key !== "undefined") adjustVertices(graph, _.first(group));
            })
            .value();

        return;
    }

    // `cell` is a link
    // get its source and target model IDs
    var sourceId = cell.get("source").id || cell.previous("source").id;
    var targetId = cell.get("target").id || cell.previous("target").id;

    // if one of the ends is not a model
    // (if the link is pinned to paper at a point)
    // the link is interpreted as having no siblings
    if (!sourceId || !targetId) {
        // no vertices needed
        cell.unset("vertices");
        return;
    }

    // identify link siblings
    var siblings = graph.getLinks().filter(function(sibling) {
        var siblingSourceId = sibling.source().id;
        var siblingTargetId = sibling.target().id;

        // if source and target are the same
        // or if source and target are reversed
        return (
            (siblingSourceId === sourceId && siblingTargetId === targetId) ||
            (siblingSourceId === targetId && siblingTargetId === sourceId)
        );
    });

    var numSiblings = siblings.length;
    switch (numSiblings) {
        case 0: {
            // the link has no siblings
            break;
        }
        default: {
            if (numSiblings === 1) {
                // there is only one link
                // no vertices needed
                cell.unset("vertices");
            }

            // there are multiple siblings
            // we need to create vertices

            // find the middle point of the link
            var sourceCenter = graph
                .getCell(sourceId)
                .getBBox()
                .center();
            var targetCenter = graph
                .getCell(targetId)
                .getBBox()
                .center();
            var midPoint = joint.g.Line(sourceCenter, targetCenter).midpoint();

            // find the angle of the link
            var theta = sourceCenter.theta(targetCenter);

            // constant
            // the maximum distance between two sibling links
            var GAP = 20;

            _.each(siblings, function(sibling, index) {
                // we want offset values to be calculated as 0, 20, 20, 40, 40, 60, 60 ...
                var offset = GAP * Math.ceil(index / 2);

                // place the vertices at points which are `offset` pixels perpendicularly away
                // from the first link
                //
                // as index goes up, alternate left and right
                //
                //  ^  odd indices
                //  |
                //  |---->  index 0 sibling - centerline (between source and target centers)
                //  |
                //  v  even indices
                var sign = index % 2 ? 1 : -1;

                // to assure symmetry, if there is an even number of siblings
                // shift all vertices leftward perpendicularly away from the centerline
                if (numSiblings % 2 === 0) {
                    offset -= (GAP / 2) * sign;
                }

                // make reverse links count the same as non-reverse
                var reverse = theta < 180 ? 1 : -1;

                // we found the vertex
                var angle = joint.g.toRad(theta + sign * reverse * 90);
                var vertex = joint.g.Point.fromPolar(offset, angle, midPoint);

                // replace vertices array with `vertex`
                sibling.vertices([vertex]);
            });
        }
    }
}

const create_transition_cell = (source, target, label) => {
    var cell = new joint.shapes.fsa.CustomArrow({
        source: {
            id: source.id,
        },
        target: {
            id: target.id,
        },
        labels: [
            {
                position: 0.5,
                attrs: {
                    text: {
                        text: label || "",
                    },
                },
            },
        ],
    });
    return cell;
};

const create_state_cell = (x, y, label) => {
    let cell = new joint.shapes.fsa.State({
        position: {
            x: x,
            y: y,
        },
        size: {
            width: 100,
            height: 100,
        },
        attrs: {
            text: {
                text: label,
            },
        },
    });
    return cell;
};

export class Diagram extends Component {
    constructor(props) {
        super(props);
        this.graph = new joint.dia.Graph();
        // bind `graph` to the `adjustVertices` function
        var adjustGraphVertices = _.partial(adjustVertices, this.graph);
        // adjust vertices when a cell is removed or its source/target was changed
        this.graph.on(
            "add remove change:source change:target",
            adjustGraphVertices
        );

        this.state_shape_width = 50;
        this.state_shape_height = 50;
        this.state_spacing_x = 200;
        this.state_spacing_y = 150;
        this.state_per_row = 3;
        this.cellId2FSMElement = {};
        this.name2Cell = new Map();
        this.renderAllStates = this.renderAllStates.bind(this);
        this.renderAllTransitions = this.renderAllTransitions.bind(this);
        this.getStateName2CellMap = this.getStateName2CellMap.bind(this);
        this.clearGraph = this.clearGraph.bind(this);
        this.removeUnusedCells = this.removeUnusedCells.bind(this);
    }

    componentDidMount() {
        const { onClickCell, onClickBlank, paperWidth } = this.props;
        this.$el = $(this.el);
        console.log("paper width is: " + paperWidth);
        const paper = new joint.dia.Paper({
            el: this.$el,
            width: paperWidth,
            height: 5 * paperWidth,
            gridSize: 1,
            model: this.graph,
            restrictTranslate: true,
        });
        paper.on("cell:pointerdblclick", onClickCell);
        paper.on("cell:pointerclick", onClickCell);
        paper.on("blank:pointerclick", onClickBlank);
        paper.on("blank:pointerclick", onClickBlank);
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
            if (!this.name2Cell.has(state.getName())) {
                const cell = create_state_cell(
                    Math.floor(idx % this.state_per_row) * this.state_spacing_x,
                    Math.floor(idx / this.state_per_row) * this.state_spacing_y,
                    state.getName()
                );
                // mark start state
                if (fsm.getStartState() === state.getName()) {
                    cell.attr("circle/stroke-width", "5");
                }
                // mark gated state
                if (state.getProcessorsList()
                    .map(callableItem => callableItem.getCallableName())
                    .includes("GatedTwoStageProcessor")
                ) {
                    cell.attr("circle/fill", "yellow");
                }
                this.addGraphCellWithRef(state.getName(), cell, state);
            }
            return null;
        }, this);
        return stateCells;
    }

    renderAllTransitions(fsm) {
        const states = fsm.getStatesList();
        const stateName2Cell = this.getStateName2CellMap();
        const transitionCells = states.map((state) => {
            return state.getTransitionsList().map((transition) => {
                if (!this.name2Cell.has(transition.getName())) {
                    const cell = create_transition_cell(
                        stateName2Cell[state.getName()],
                        stateName2Cell[transition.getNextState()],
                        transition.getName()
                    );
                    this.addGraphCellWithRef(
                        transition.getName(),
                        cell,
                        transition
                    );
                }
                return null;
            }, this);
        }, this);
        return transitionCells;
    }

    getStateName2CellMap() {
        const stateCells = this.graph.getElements();
        const stateName2Cell = {};
        stateCells.map((jointElement) => {
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

    addGraphCellWithRef(name, cell, ref) {
        // addGraphCell add a cell to the graph and record the reference object
        // this cell represents.
        this.graph.addCell(cell);
        this.cellId2FSMElement[cell.id] = ref;
        this.name2Cell.set(name, cell);
    }

    clearGraph() {
        this.graph.clear();
        this.cellId2FSMElement = {};
        this.name2Cell.clear();
    }

    removeUnusedCells(fsm) {
        // first get all valid cell names
        let curCellNames = getAllNames(fsm);
        let toDeleteNames = [];
        for (let key of this.name2Cell.keys()) {
            if (!curCellNames.includes(key)) {
                toDeleteNames.push(key);
            }
        }
        toDeleteNames.forEach((name) => {
            this.graph.removeCells(this.name2Cell.get(name));
            this.name2Cell.delete(name);
            return null;
        });
    }

    render() {
        const { fsm } = this.props;
        if (fsm != null) {
            // remove old cells, this can be caused either by deletion or renaming
            this.removeUnusedCells(fsm);
            this.renderAllStates(fsm);
            this.renderAllTransitions(fsm);
        }
        return <div ref={(el) => (this.el = el)} />;
    }
}
