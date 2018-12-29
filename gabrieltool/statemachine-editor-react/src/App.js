import React, { Component } from "react";
import Container from "react-bootstrap/lib/Container";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Alert from "react-bootstrap/lib/Alert";
import { Diagram } from "./diagram.js";
import "./App.css";
import InfoBox from "./infoBox.js";
import { FSMElementType, ToolBar } from "./toolbar.js";
import NewElementModal from "./newElementModal.js";
import procZoo from './processor-zoo.json';
import predZoo from './predicate-zoo.json';
import saveAs from 'file-saver';
var fsmPb = require("./wca-state-machine_pb");

function loadFsm(fsmData) {
  let fsm = null;
  try {
    fsm = new fsmPb.StateMachine.deserializeBinary(fsmData);
  } catch (err) {
    throw err;
  }
  return fsm;
}

class App extends Component {
  constructor(props) {
    super(props);
    this.diagramRef = React.createRef();
    this.alert = this.alert.bind(this);
    this.onImport = this.onImport.bind(this);
    this.onExport = this.onExport.bind(this);
    this.onAdd = this.onAdd.bind(this);
    this.onClickCell = this.onClickCell.bind(this);
    this.onModalCancel = this.onModalCancel.bind(this);
    this.onModalSave = this.onModalSave.bind(this);
    this.state = {
      fsm: new fsmPb.StateMachine(),
      curFSMElement: null,
      alertMsg: {
        show: true,
        type: "info",
        msg: "Welcome to State Machine Editor!"
      },
      showNewElementModal: false,
      newElementModalType: null
    };
  }

  render() {
    return (
      <Container fluid>
        <h1>State Machine Visualizer with React</h1>
        {this.state.alertMsg.msg !== "" && (
          <Alert dismissible variant={this.state.alertMsg.type}>
            {this.state.alertMsg.msg}
          </Alert>
        )}
        <Row>
          <Col sm={6} style={{ backgroundColor: "lavender" }}>
            <h4>Diagram</h4>
            <Diagram
              fsm={this.state.fsm}
              onClickCell={this.onClickCell}
              ref={this.diagramRef}
            />
          </Col>
          <Col sm={6}>
            <ToolBar onImport={this.onImport} onAdd={this.onAdd} onExport={this.onExport} />
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
        {
          this.state.showNewElementModal &&
          <NewElementModal
            fsm={this.state.fsm} // new elements may depend on existing elements (e.g. adding a transition between two states)
            show={this.state.showNewElementModal}
            type={this.state.newElementModalType}
            onModalSave={this.onModalSave}
            onModalCancel={this.onModalCancel}
          />
        }
      </Container>
    );
  }

  alert(type, msg) {
    this.setState({
      alertMsg: {
        type: type,
        msg: msg
      }
    });
  }

  // toolbar callbacks
  // TODO(junjuew): add delete functionality
  onImport(e, fileArray) {
    fileArray.forEach(result => {
      const e = result[0];
      let fileContent = e.target.result;
      let fsm = null;
      try {
        fsm = loadFsm(fileContent);
        this.setState({ fsm: fsm, curFSMElement: null });
        this.alert("info", "Success! State machine imported.");
      } catch (err) {
        this.alert(
          "danger",
          "Incorrect File Format. Failed to import the file. \n" + err
        );
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
      if (fsmPb.getStartState() == "") {
        fsmPb.setStartState(fsmPb.getStatesList()[0].getName());
      }
      let fsmPbSerialized = fsmPb.serializeBinary();
      let blob = new Blob([fsmPbSerialized], { type: "application/octet-stream" });
      saveAs(blob, "app.pbfsm");
    }
  }

  onAdd(type) {
    this.setState({ showNewElementModal: true, newElementModalType: type })
  }

  // diagram callbacks
  onClickCell(elementView) {
    const fsmElement = this.diagramRef.current.cellId2FSMElement[
      elementView.model.id
    ];
    this.setState({
      curFSMElement: fsmElement
    });
  }

  addCallableFormDataToPb(callbleFormValue, addFunc, callablePbType, zoo) {
    for (let idx = 0; idx < callbleFormValue.length; idx++) {
      let callableValue = callbleFormValue[idx];
      let callablePb = new callablePbType();
      callablePb.setName(callableValue.name)
      callablePb.setCallableName(callableValue.type);
      // callable args
      // need to filter out relevant arguments only
      // since the form may contain irrelevant arguments for other callable type
      // this is caused by user switching callable types
      let args = {}
      Object.keys(zoo[callableValue.type]).map((key) => {
        args[key] = callableValue.args[key]
      });
      callablePb.setCallableArgs(JSON.stringify(args));
      addFunc(callablePb);
    }
  }

  createStatePb(formValue) {
    let statePb = new fsmPb.State();
    statePb.setName(formValue['name']);
    // add processors
    this.addCallableFormDataToPb(
      formValue.callable,
      statePb.addProcessors.bind(statePb), //bind is needed to pass context
      fsmPb.Processor,
      procZoo
    )
    return statePb;
  }

  findStatePb(stateName) {
    let result = null;
    const fsm = this.state.fsm;
    fsm.getStatesList().map((state) => {
      if (state.getName() == stateName) {
        result = state;
      }
    })
    return result;
  }

  createTransitionPb(formValue) {
    let transitionPb = new fsmPb.Transition();
    transitionPb.setName(formValue.name)
    // to state
    transitionPb.setNextState(formValue.to);
    // instruction
    let instPb = new fsmPb.Instruction();
    instPb.setAudio(formValue.instruction.audio);
    instPb.setImage(formValue.instruction.image);
    instPb.setVideo(formValue.instruction.video);
    transitionPb.setInstruction(instPb);
    // add predicates
    this.addCallableFormDataToPb(formValue.callable,
      transitionPb.addPredicates.bind(transitionPb),
      fsmPb.TransitionPredicate,
      predZoo
    )
    return transitionPb;
  }

  onModalSave(type, formValue) {
    const fsm = this.state.fsm;
    switch (type) {
      case FSMElementType.STATE:
        const statePb = this.createStatePb(formValue);
        fsm.addStates(statePb);
        break;
      case FSMElementType.TRANSITION:
        const transitionPb = this.createTransitionPb(formValue);
        // find from state
        const fromStatePb = this.findStatePb(formValue.from);
        fromStatePb.addTransitions(transitionPb);
        break;
      default:
        throw new Error("Unsupported Element Type: " + type + ". Failed to add a new element")
    }
    this.setState({ fsm: fsm });
    this.setState({ showNewElementModal: false })
  }

  onModalCancel() {
    this.setState({ showNewElementModal: false })
  }
}

export default App;
