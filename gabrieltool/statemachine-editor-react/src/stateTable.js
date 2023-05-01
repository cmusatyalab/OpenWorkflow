import React, { Component } from "react";
import ReactTable from "react-table";
import matchSorter from "match-sorter";
import { getColumnWidth } from "./infoBox.js"
import "react-table/react-table.css";
import ReactJson from "react-json-view";

class StateTable extends Component {
    render() {
        const { fsm } = this.props;
        const tableData = fsm.getStatesList().flatMap((state, idx) => {
            const stateName = state.getName();
            const processorsList = state.getProcessorsList()
            if (processorsList === undefined || processorsList.length === 0) {
                return [{
                    state: stateName,
                    processor: "",
                    callable_name: "",
                    callable_args: {}
                }];
            } else {
                return processorsList.map(callableItem => {
                    return {
                        state: stateName,
                        processor: callableItem.getName(),
                        callable_name: callableItem.getCallableName(),
                        callable_args: JSON.parse(callableItem.getCallableArgs())
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
                Header: "Processor",
                accessor: "processor",
                filterMethod: (filter, rows) =>
                    matchSorter(rows, filter.value, { keys: ["processor"] }),
                filterAll: true,
                width: getColumnWidth(tableData, "processor", "Processor")
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
