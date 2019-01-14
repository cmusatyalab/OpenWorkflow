import React, { Component } from "react";
import ReactTable from "react-table";
import matchSorter from "match-sorter";
import ListGroup from "react-bootstrap/lib/ListGroup";
import ListGroupItem from "react-bootstrap/lib/ListGroupItem";
import { FSMElementType, getFSMElementType } from "./utils.js";
import "react-table/react-table.css";
import ReactJson from "react-json-view";

const getColumnWidth = (rows, accessor, headerText) => {
  const maxWidth = 400;
  const magicSpacing = 11;
  const cellLength = Math.max(
    ...rows.map(row => (`${row[accessor]}` || "").length),
    headerText.length
  );
  return Math.min(maxWidth, cellLength * magicSpacing);
};

class InfoBox extends Component {
  constructor(props) {
    super(props);
    this.imageInstUrl = null;
  }

  prepareResource(element) {
    let res = {};
    // clear up urls to prevent leaking memories
    if (this.imageInstUrl !== null) {
      URL.revokeObjectURL(this.imageInstUrl);
    }
    if (element.getInstruction()) {
      if (element.getInstruction().getImage()) {
        let blob = new Blob([element.getInstruction().getImage()], {
          type: "image"
        });
        this.imageInstUrl = URL.createObjectURL(blob);
        res.imageInstUrl = this.imageInstUrl;
      }
    }
    return res;
  }

  render() {
    const { element } = this.props;
    const elementType = getFSMElementType(element);

    // prepare resources
    let res = {};
    if (elementType === FSMElementType.TRANSITION) {
      res = this.prepareResource(element);
    }

    const tableData =
      elementType === FSMElementType.STATE
        ? element.getProcessorsList().map(callableItem => {
            return {
              name: callableItem.getName(),
              callable_name: callableItem.getCallableName(),
              callable_args: JSON.parse(callableItem.getCallableArgs())
            };
          })
        : element.getPredicatesList().map(callableItem => {
            return {
              name: callableItem.getName(),
              callable_name: callableItem.getCallableName(),
              callable_args: JSON.parse(callableItem.getCallableArgs())
            };
          });
    const tableColumns = [
      {
        Header: "Name",
        accessor: "name",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["name"] }),
        filterAll: true,
        width: getColumnWidth(tableData, "name", "Name")
      },
      {
        Header: "Type",
        accessor: "callable_name",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, {
            keys: ["callable_name"]
          }),
        filterAll: true,
        width: getColumnWidth(tableData, "callable_name", "Type")
      },
      {
        Header: "Arguments",
        accessor: "callable_args",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, {
            keys: ["callable_args"]
          }),
        Cell: row => <ReactJson src={row.value} />,
        filterAll: true
      }
    ];
    return (
      <ListGroup style={{ width: "100%", margin: "20px" }}>
        <ListGroupItem variant="secondary">
          Name: {element.getName()}
        </ListGroupItem>
        <ListGroupItem variant="secondary">
          Type: {elementType === FSMElementType.STATE ? "State" : "Transition"}
        </ListGroupItem>
        {elementType === FSMElementType.TRANSITION && (
          <>
            <ListGroupItem variant="secondary">Instruction</ListGroupItem>
            <ListGroupItem>
              Audio: {element.getInstruction().getAudio()}
            </ListGroupItem>
            {res.imageInstUrl ? (
              <ListGroupItem>
                Image: <img src={res.imageInstUrl} alt="instruction" />
              </ListGroupItem>
            ) : (
              <ListGroupItem>Image: </ListGroupItem>
            )}
            <ListGroupItem>
              Video: {element.getInstruction().getVideo()}
            </ListGroupItem>
          </>
        )}
        <ListGroupItem variant="secondary">
          {elementType === FSMElementType.STATE
            ? "Processors"
            : "Transition Predicates"}
        </ListGroupItem>
        <ReactTable
          data={tableData}
          filterable
          defaultFilterMethod={(filter, row) =>
            String(row[filter.id]) === filter.value
          }
          columns={tableColumns}
          defaultPageSize={3}
        >
          {(state, makeTable, instance) => {
            return <div>{makeTable()}</div>;
          }}
        </ReactTable>
      </ListGroup>
    );
  }
}

export default InfoBox;
