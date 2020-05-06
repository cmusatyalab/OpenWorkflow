import React, { Component } from "react";
import Container from "react-bootstrap/lib/Container";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Alert from "react-bootstrap/lib/Alert";
import { Diagram } from "./diagram.js";
import "./App.css";
import InfoBox from "./infoBox.js";
import { ToolBar } from "./toolbar.js";
import {
    FSMElementType,
    getFSMElementType,
    formValuesToElement,
    allNamesAreValid,
} from "./utils.js";
import ElementModal from "./elementModal.js";
import saveAs from "file-saver";
var fsmPb = require("./wca-state-machine_pb");

function loadFsm(fsmData) {
    let fsm = null;
    try {
        fsm = fsmPb.StateMachine.deserializeBinary(fsmData);
    } catch (err) {
        throw "Incorrect file format. " + err;
    }
    if (fsm && !allNamesAreValid(fsm)) {
        throw "FSM contains duplicate names! For this web editor to work properly, all states and transitions need to have unique names.";
    }
    return fsm;
}

class App extends Component {
    constructor(props) {
        super(props);
        this.diagramRef = React.createRef();
        this.diagramContainerRef = React.createRef();
        this.alert = this.alert.bind(this);
        this.onImport = this.onImport.bind(this);
        this.onExport = this.onExport.bind(this);
        this.onAdd = this.onAdd.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onEdit = this.onEdit.bind(this);
        this.onClickCell = this.onClickCell.bind(this);
        this.onModalCancel = this.onModalCancel.bind(this);
        this.onModalSave = this.onModalSave.bind(this);
        this.state = {
            fsm: new fsmPb.StateMachine(),
            curFSMElement: null,
            modalInitElement: null,
            alertMsg: {
                show: true,
                type: "info",
                msg: "Welcome to State Machine Editor!",
            },
            showNewElementModal: false,
            newElementModalType: null,
        };
    }

    render() {
        return (
            <Container fluid>
                <h1>OpenWorkflow State Machine Editor</h1>
                {this.state.alertMsg.msg !== "" && (
                    <Alert dismissible variant={this.state.alertMsg.type}>
                        {this.state.alertMsg.msg}
                    </Alert>
                )}
                <Row>
                    <Col
                        sm={6}
                        ref={this.diagramContainerRef}
                        style={{ backgroundColor: "lavender" }}
                    >
                        <h4>Diagram</h4>
                        <Diagram
                            fsm={this.state.fsm}
                            onClickCell={this.onClickCell}
                            ref={this.diagramRef}
                            paperWidth={window.innerWidth / 2} // half of current window's inner width
                        />
                    </Col>
                    <Col sm={6}>
                        <ToolBar
                            onImport={this.onImport}
                            onAdd={this.onAdd}
                            onExport={this.onExport}
                            onDelete={this.onDelete}
                            onEdit={this.onEdit}
                        />
                        {this.state.curFSMElement && (
                            <Row>
                                <InfoBox
                                    element={this.state.curFSMElement}
                                    style={{ width: "100%" }}
                                />
                            </Row>
                        )}
                    </Col>
                </Row>
                <footer>
                    <Container>
                        <span className="text-muted">
                            Copyright Carnegie Mellon University
                        </span>
                    </Container>
                </footer>
                {this.state.showNewElementModal && (
                    <ElementModal
                        fsm={this.state.fsm} // new elements may depend on existing elements (e.g. adding a transition between two states)
                        show={this.state.showNewElementModal}
                        type={this.state.newElementModalType}
                        initElement={this.state.modalInitElement} // if element is not null, then edit the element
                        onModalSave={this.onModalSave}
                        onModalCancel={this.onModalCancel}
                    />
                )}
            </Container>
        );
    }

    alert(type, msg) {
        this.setState({
            alertMsg: {
                type: type,
                msg: msg,
            },
        });
    }

    // toolbar callbacks
    onImport(e, fileArray) {
        fileArray.forEach((result) => {
            const e = result[0];
            let fileContent = e.target.result;
            let fsm = null;
            try {
                fsm = loadFsm(fileContent);
                this.setState({ fsm: fsm, curFSMElement: null });
                this.alert("info", "Success! State machine imported.");
            } catch (err) {
                this.alert("danger", "Failed to import the file. \n" + err);
            }
        });
    }

    onExport() {
        const fsmPb = this.state.fsm;
        if (fsmPb.getStatesList().length === 0) {
            this.alert(
                "danger",
                "Empty state machine! There is nothing to save. \n"
            );
        } else {
            // TODO(junjuew): fix start state. It should be marked by users
            // instead of being the first state added
            if (fsmPb.getStartState() === "") {
                fsmPb.setStartState(fsmPb.getStatesList()[0].getName());
            }
            let fsmPbSerialized = fsmPb.serializeBinary();
            let blob = new Blob([fsmPbSerialized], {
                type: "application/octet-stream",
            });
            saveAs(blob, "app.pbfsm");
        }
    }

    onAdd(type) {
        this.setState({ showNewElementModal: true, newElementModalType: type });
    }

    isElementSafeToDelete(element) {
        const fsm = this.state.fsm;
        const elementType = getFSMElementType(element);
        let isSafe = true;
        switch (elementType) {
            case FSMElementType.STATE:
                // check if there are transitions starting from this state
                if (element.getTransitionsList().length > 0) isSafe = false;
                // check if there are transitions ending at this state
                fsm.getStatesList().map((state) => {
                    state.getTransitionsList().map((transition) => {
                        if (transition.getNextState() === element.getName()) {
                            isSafe = false;
                        }
                        return null;
                    });
                    return null;
                });
                return isSafe;
            case FSMElementType.TRANSITION:
                return isSafe;
            default:
                throw new Error("Unsupported Element Type: " + elementType);
        }
    }

    deleteStatePb(element) {
        const fsm = this.state.fsm;
        if (this.isElementSafeToDelete(element)) {
            const elementIdx = fsm.getStatesList().indexOf(element);
            fsm.getStatesList().splice(elementIdx, 1);
            this.setState({ fsm: fsm, curFSMElement: null });
        } else {
            return this.alert(
                "danger",
                "A state cannot be deleted unless all transitions to/from it have been deleted."
            );
        }
    }

    deleteTransitionPb(element) {
        const fsm = this.state.fsm;
        if (this.isElementSafeToDelete(element)) {
            // find the state this transition belons to and removes it from
            // the transitions list
            fsm.getStatesList().map((state) => {
                const elementIdx = state.getTransitionsList().indexOf(element);
                if (elementIdx >= 0) {
                    state
                        .getTransitionsList()
                        .splice(elementIdx, elementIdx + 1);
                }
                return null;
            });
            this.setState({ fsm: fsm, curFSMElement: null });
        } else {
            return this.alert(
                "danger",
                "The transition cannot be safely deleted"
            );
        }
    }

    hasCurElement() {
        const element = this.state.curFSMElement;
        if (element === null) {
            this.alert(
                "danger",
                "There is no element selected. Double-click to select an element."
            );
            return false;
        }
        return true;
    }

    onEdit() {
        if (this.hasCurElement()) {
            const element = this.state.curFSMElement;
            const elementType = getFSMElementType(element);
            this.setState({
                showNewElementModal: true,
                newElementModalType: elementType,
                modalInitElement: element,
            });
        }
    }

    onDelete() {
        if (this.hasCurElement()) {
            const element = this.state.curFSMElement;
            const elementType = getFSMElementType(element);
            switch (elementType) {
                case FSMElementType.STATE:
                    this.deleteStatePb(element);
                    break;
                case FSMElementType.TRANSITION:
                    this.deleteTransitionPb(element);
                    break;
                default:
                    throw new Error("Unsupported Element Type: " + elementType);
            }
        }
    }

    // diagram callbacks
    onClickCell(elementView) {
        const fsmElement = this.diagramRef.current.cellId2FSMElement[
            elementView.model.id
        ];
        this.setState({
            curFSMElement: fsmElement,
        });
    }

    onModalSave(type, formValue, initElement) {
        const fsm = this.state.fsm;
        try {
            formValuesToElement(formValue, fsm, type, initElement);
            this.setState({ fsm: fsm });
            this.setState({
                showNewElementModal: false,
                modalInitElement: null,
            });
        } catch (err) {
            this.setState({
                showNewElementModal: false,
                modalInitElement: null,
            });
            this.alert("danger", err);
        }
    }

    onModalCancel() {
        this.setState({ showNewElementModal: false, modalInitElement: null });
    }
}

export default App;
