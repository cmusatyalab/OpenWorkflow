import React, { Component } from "react";
import Container from "react-bootstrap/lib/Container";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Alert from "react-bootstrap/lib/Alert";
import { Diagram } from "./diagram.js";
import "./App.css";
import InfoBox from "./infoBox.js";
import { ToolBar } from "./toolbar.js";
import NewElementModal from "./newElementModal.js";
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
            <ToolBar onImport={this.onImport} onAdd={this.onAdd} />
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

  onModalSave(formValue) {
    console.log("received modal data")
    console.log(JSON.stringify(formValue));
    this.setState({ showNewElementModal: false })
  }

  onModalCancel() {
    this.setState({ showNewElementModal: false })
  }
}

export default App;
