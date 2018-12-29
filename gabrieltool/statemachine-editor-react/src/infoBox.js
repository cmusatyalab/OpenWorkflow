import React, { Component } from "react";
import ReactTable from "react-table";
import matchSorter from "match-sorter";
import ListGroup from "react-bootstrap/lib/ListGroup";
import ListGroupItem from "react-bootstrap/lib/ListGroupItem";
import { FSMElementType, getFSMElementType } from "./utils.js";
import "react-table/react-table.css";

const InfoBox = ({ element }) => {
  console.log("infobox render called");
  const elementType = getFSMElementType(element);
  const tableData =
    elementType === FSMElementType.STATE
      ? element.getProcessorsList().map(callableItem => {
        return {
          name: callableItem.getName(),
          callable_name: callableItem.getCallableName(),
          callable_args: callableItem.getCallableArgs()
        };
      })
      : element.getPredicatesList().map(callableItem => {
        return {
          name: callableItem.getName(),
          callable_name: callableItem.getCallableName(),
          callable_args: callableItem.getCallableArgs()
        };
      });
  const tableColumns =
    elementType === FSMElementType.STATE
      ? [
        {
          Header: "Processor Name",
          accessor: "name",
          filterMethod: (filter, rows) =>
            matchSorter(rows, filter.value, { keys: ["name"] }),
          filterAll: true
        },
        {
          Header: "Processing Function",
          accessor: "callable_name",
          filterMethod: (filter, rows) =>
            matchSorter(rows, filter.value, {
              keys: ["callable_name"]
            }),
          filterAll: true
        },
        {
          Header: "Arguments",
          accessor: "callable_args",
          filterMethod: (filter, rows) =>
            matchSorter(rows, filter.value, {
              keys: ["callable_args"]
            }),
          filterAll: true
        }
      ]
      : [
        {
          Header: "Predicate Name",
          accessor: "name",
          filterMethod: (filter, rows) =>
            matchSorter(rows, filter.value, { keys: ["name"] }),
          filterAll: true
        },
        {
          Header: "Predicate Function",
          accessor: "callable_name",
          filterMethod: (filter, rows) =>
            matchSorter(rows, filter.value, {
              keys: ["callable_name"]
            }),
          filterAll: true
        },
        {
          Header: "Arguments",
          accessor: "callable_args",
          filterMethod: (filter, rows) =>
            matchSorter(rows, filter.value, {
              keys: ["callable_args"]
            }),
          filterAll: true
        }
      ];
  return (
    <div>
      <h3>Information</h3>
      <ListGroup>
        <ListGroupItem>
          <h4>Name: {element.getName()}</h4>
        </ListGroupItem>
        <ListGroupItem>
          <h4>Type: {elementType}</h4>
        </ListGroupItem>
        {
          elementType === FSMElementType.TRANSITION &&
          <ListGroupItem>
            <h4>Instruction</h4>
            <h5>Audio:</h5><p>{element.getInstruction().getAudio()}</p>
            <h5>Image:</h5><p>{element.getInstruction().getImage()}</p> {/*TODO(junjuew): add proper display of images and videos*/}
            <h5>Video:</h5><p>{element.getInstruction().getVideo()}</p>
          </ListGroupItem>
        }
        <ListGroupItem>
          {(
            <ReactTable
              data={tableData}
              filterable
              defaultFilterMethod={(filter, row) =>
                String(row[filter.id]) === filter.value
              }
              columns={tableColumns}
              defaultPageSize={5}
              className="-striped -highlight"
            />
          )}
        </ListGroupItem>
      </ListGroup>
    </div>
  );
};

export default InfoBox;
