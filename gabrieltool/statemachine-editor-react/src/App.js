import React, { Component } from 'react';
import Container from 'react-bootstrap/lib/Container';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import Button from 'react-bootstrap/lib/Button';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import DropdownButton from 'react-bootstrap/lib/DropdownButton';
import Dropdown from 'react-bootstrap/lib/Dropdown';
import Diagram from './diagram.js';
import './App.css';

class App extends Component {
  render() {
    return (
      <Container>
          <h1>State Machine Visualizer with React</h1>
        <Row>
          <Col sm={6} style={{ backgroundColor: 'lavender'}}>
          <h4>Diagram</h4>
          <Diagram></Diagram>
          </Col>
          <Col sm={6}>
            <ButtonToolbar>
              <Col md={4}>
              <Button variant="primary">Import</Button>
              </Col>
              <Col md={4}>
              <Button variant="primary">Export</Button>
              </Col>
              <Col md={4}>
                <DropdownButton id="dropdown-basic-button" title="Add">
                  <Dropdown.Item href="#/action-1">State</Dropdown.Item>
                  <Dropdown.Item href="#/action-2">Transition</Dropdown.Item>
                </DropdownButton>
              </Col>
              <Col md={4}>
              <Button variant="primary">Delete</Button>
              </Col>
            </ButtonToolbar>
          </Col>
        </Row>
      <footer>
        <Container>
          <span className="text-muted">Copyright Carnegie Mellon University</span>
        </Container>
      </footer>
      </Container>
    );
  }
}

export default App;
