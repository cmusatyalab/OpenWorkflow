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
    listToFsm,
} from "./utils.js";
import ElementModal from "./elementModal.js";
import saveAs from "file-saver";
import ReactPlayer from "react-player";
import Form from "react-bootstrap/lib/Form";
import Button from "react-bootstrap/lib/Button";
import StateTable from "./stateTable";
import CreateFromListModal from "./createFromListModal";
var fsmPb = require("./wca-state-machine_pb");

function loadFsm(fsmData) {
    let fsm = null;
    try {
        fsm = fsmPb.StateMachine.deserializeBinary(fsmData);
    } catch (err) {
        throw "Incorrect file format. " + err;
    }
    if (fsm && !allNamesAreValid(fsm)) {
        throw "FSM contains duplicate names! For this web editor to work properly, " +
            "all states and transitions need to have unique names." +
            "If you create the FSM using the python library, make sure to assign unique names for states and transitions.";
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
        this.onClickBlank = this.onClickBlank.bind(this);
        this.onModalCancel = this.onModalCancel.bind(this);
        this.onModalSave = this.onModalSave.bind(this);
        this.onListCancel = this.onListCancel.bind(this);
        this.onListSave = this.onListSave.bind(this);
        this.clipStart = React.createRef();
        this.clipEnd = React.createRef();
        this.prompt = React.createRef();
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
            showCreateFromListModal: false,
            newElementModalType: null,
            videoUrl: null,
            videoName: null,
            playedSeconds: null,
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
                    <Col sm={3}>
                        <h4>Upload Video</h4>
                        <div className='player-wrapper'>
                            <input onChange={this.onChooseFile} type='file' accept='video/*' />
                            <ReactPlayer
                                url={this.state.videoUrl}
                                className='react-player'
                                controls
                                width='100%'
                                height='100%'
                                onProgress={this.handleProgress}
                            />
                            {this.state.videoUrl && (
                                <Form>
                                    <Form.Group as={Row}>
                                        <Form.Label column>Video Clip Start</Form.Label>
                                        <Col>
                                            <Form.Control
                                                type="text"
                                                placeholder="HH:mm:ss.xxx"
                                                ref={this.clipStart}
                                                readOnly
                                            />
                                            <Button
                                                variant="primary"
                                                className="fw-btn"
                                                onClick={() => {
                                                    this.clipStart.current.value = this.state.playedSeconds
                                                }}
                                            >
                                                Use Current Frame
                                            </Button>
                                        </Col>
                                    </Form.Group>
                                    <Form.Group as={Row}>
                                        <Form.Label column>Video Clip End</Form.Label>
                                        <Col>
                                            <Form.Control
                                                type="text"
                                                placeholder="HH:mm:ss.xxx"
                                                ref={this.clipEnd}
                                                readOnly
                                            />
                                            <Button
                                                variant="primary"
                                                className="fw-btn"
                                                onClick={() => {
                                                    this.clipEnd.current.value = this.state.playedSeconds
                                                }}
                                            >
                                                Use Current Frame
                                            </Button>
                                        </Col>
                                    </Form.Group>
                                </Form>
                            )}
                        </div>
                        <br/>
                        <h4>Create From Instructions</h4>
                        <Form.Group>
                            <Form.Control
                                as="textarea"
                                rows={20}
                                placeholder="1. xxx&#13;&#10;2. xxx"
                                ref={this.prompt}
                            />
                            <Button
                                variant="primary"
                                onClick={() => {
                                    this.setState({ showCreateFromListModal: true })
                                }}
                            >
                                Generate Instructions
                            </Button>
                        </Form.Group>
                    </Col>
                    <Col
                        sm={4}
                        ref={this.diagramContainerRef}
                        style={{ backgroundColor: "lavender" }}
                    >
                        <h4>Diagram</h4>
                        <Diagram
                            fsm={this.state.fsm}
                            onClickCell={this.onClickCell}
                            onClickBlank={this.onClickBlank}
                            ref={this.diagramRef}
                            paperWidth={window.innerWidth / 3} // 1/3 of current window's inner width
                        />
                    </Col>
                    <Col sm={5}>
                        <ToolBar
                            onImport={this.onImport}
                            onAdd={this.onAdd}
                            onExport={this.onExport}
                            onDelete={this.onDelete}
                            onEdit={this.onEdit}
                        />
                        {this.state.curFSMElement ? (
                            <Row>
                                <InfoBox
                                    element={this.state.curFSMElement}
                                    style={{ width: "100%" }}
                                />
                            </Row>
                        ) : (
                            <div>
                                <StateTable fsm={this.state.fsm} />
                            </div>
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
                        videoUrl={this.state.videoUrl}
                        videoName={this.state.videoName}
                        videoSeekPos={this.state.playedSeconds}
                        clipStart={this.clipStart.current ? this.clipStart.current.value : null}
                        clipEnd={this.clipEnd.current ? this.clipEnd.current.value : null}
                    />
                )}
                {this.state.showCreateFromListModal && (
                    <CreateFromListModal
                        show={this.state.showCreateFromListModal}
                        initList={this.prompt.current ? this.prompt.current.value : null}
                        onListSave={this.onListSave}
                        onListCancel={this.onListCancel}
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

    onChooseFile = e => {
        // clear up urls to prevent leaking memories
        if (this.state.videoUrl !== null) {
            URL.revokeObjectURL(this.state.videoUrl);
            this.clipStart.current.value = null;
            this.clipEnd.current.value = null;
        }
        const url = URL.createObjectURL(e.target.files[0]);
        this.setState({ videoUrl: url, videoName: e.target.files[0].name });
    }

    handleProgress = state => {
        // Time format conversion
        const pos = state.playedSeconds
        const numHrs = Math.floor(pos / 3600);
        const numMin = Math.floor(pos / 60) % 60;
        const numSec = pos - numHrs * 3600 - numMin * 60;
        const hmsString = [
            (numHrs < 10) ? "0" + numHrs : "" + numHrs,
            (numMin < 10) ? "0" + numMin : "" + numMin,
            (numSec < 10) ? "0" + Math.floor(numSec * 1000) / 1000 : "" + Math.floor(numSec * 1000) / 1000,
        ].join(":");
        this.setState({ playedSeconds: hmsString });
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

    onClickBlank(elementView) {
        this.setState({
            curFSMElement: null,
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

    onListSave(instructions) {
        let fsm = null;
        try {
            fsm = listToFsm(instructions);
            this.setState({ fsm: fsm, curFSMElement: null });
            this.alert("info", "Success! State machine created.");
            this.setState({
                showCreateFromListModal: false,
                modalInitElement: null
            });
        } catch (err) {
            this.setState({
                showCreateFromListModal: false,
                modalInitElement: null
            });
            this.alert("danger", err);
        }
    }

    onListCancel() {
        this.setState({ showCreateFromListModal: false, modalInitElement: null });
    }
}

export default App;
