import React, { Component } from "react";
import Container from "react-bootstrap/lib/Container";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Alert from "react-bootstrap/lib/Alert";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";
import { Diagram } from "./diagram.js";
import "./App.css";
import InfoBox from "./infoBox.js";
import ToolBar from "./toolbar.js";
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
    this.state = {
      fsm: null,
      curFSMElement: null,
      alertMsg: {
        show: false,
        type: "info",
        msg: ""
      },
      showNewElementModal: false,
    };
  }

  render() {
    return (
      <Container>
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
            <Row>
              <ToolBar onImport={this.onImport} onAddState={this.onAdd}/>
            </Row>
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
        <NewElementModal show={this.state.showNewElementModal}/>
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

  onAdd(e) {
    this.setState(
      {
        showNewElementModal: true,
      }
    )
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
}

export default App;
