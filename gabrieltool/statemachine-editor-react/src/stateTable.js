import React, { Component } from "react";
import ReactTable from "react-table";
import matchSorter from "match-sorter";
import { getColumnWidth } from "./infoBox.js"
import "react-table/react-table.css";

class StateTable extends Component {
    render() {
        const { fsm } = this.props;
        const tableData = fsm.getStatesList().flatMap((state, idx) => {
            const stateName = state.getName();
            const processorsList = state.getProcessorsList()
            if (processorsList === undefined || processorsList.length === 0) {
                return [{
                    state: stateName,
                    callable_name: "",
                    classifier: "",
                    detector: "",
                    detector_class: "",
                }];
            } else {
                return processorsList.map(callableItem => {
                    return {
                        state: stateName,
                        callable_name: callableItem.getCallableName(),
                        classifier: JSON.parse(callableItem.getCallableArgs())["classifier_path"],
                        detector: JSON.parse(callableItem.getCallableArgs())["detector_path"],
                        detector_class: JSON.parse(callableItem.getCallableArgs())["detector_class_name"],
                    };
                })
            }
        })
        const tableColumns = [
            {
                Header: "State",
                accessor: "state",
                filterMethod: (filter, rows) =>
                    matchSorter(rows, filter.value, { keys: ["state"] }),
                filterAll: true,
                width: getColumnWidth(tableData, "state", "State")
            },
            {
                Header: "Type",
                accessor: "callable_name",
                filterMethod: (filter, rows) =>
                    matchSorter(rows, filter.value, { keys: ["callable_name"] }),
                filterAll: true,
                width: getColumnWidth(tableData, "callable_name", "Type")
            },
            {
                Header: "Classifier",
                accessor: "classifier",
                filterMethod: (filter, rows) =>
                    matchSorter(rows, filter.value, { keys: ["classifier"] }),
                filterAll: true,
                width: getColumnWidth(tableData, "classifier", "Classifier")
            },
            {
                Header: "Detector",
                accessor: "detector",
                filterMethod: (filter, rows) =>
                    matchSorter(rows, filter.value, { keys: ["detector"] }),
                filterAll: true,
                width: getColumnWidth(tableData, "detector", "Detector")
            },
            {
                Header: "Detector Class",
                accessor: "detector_class",
                filterMethod: (filter, rows) =>
                    matchSorter(rows, filter.value, { keys: ["detector_class"] }),
                filterAll: true
            }
        ];
        return (
            <ReactTable
                data={tableData}
                filterable
                defaultFilterMethod={(filter, row) =>
                    String(row[filter.id]) === filter.value
                }
                columns={tableColumns}
                defaultPageSize={10}
            >
                {(state, makeTable, instance) => {
                    return <div>{makeTable()}</div>;
                }}
            </ReactTable>
        );
    }
}

export default StateTable;
