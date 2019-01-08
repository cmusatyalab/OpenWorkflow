import React from "react";
import Button from "react-bootstrap/lib/Button";
import ButtonGroup from "react-bootstrap/lib/ButtonGroup";
import Dropdown from "react-bootstrap/lib/Dropdown";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FileReaderInput from "react-file-reader-input";
import { FSMElementType } from "./utils.js";
import "./App.css";

export const ToolBar = ({
  onImport,
  onAdd,
  onExport,
  onEdit,
  onDelete
}) => {
  return (
    <>
      <Row>
        <ButtonGroup>
          <Col sm={3}>
            <FileReaderInput as="buffer" onChange={onImport}>
              <Button variant="primary" className="fw-btn">Import</Button>
            </FileReaderInput>
          </Col>
          <Col sm={3}>
            <Button variant="primary" onClick={onExport} className="fw-btn">
              Export
          </Button>
          </Col>
          <Col sm={3}>
            <Dropdown>
              <Dropdown.Toggle id="dropdown-add" className="fw-btn">Add</Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => onAdd(FSMElementType.STATE)}>State</Dropdown.Item>
                <Dropdown.Item onClick={() => onAdd(FSMElementType.TRANSITION)}>Transition</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col sm={3}>
            <Button variant="primary" onClick={onEdit} className="fw-btn">
              Edit
          </Button>
          </Col>
          <Col sm={3}>
            <Button variant="primary" onClick={onDelete} className="fw-btn">
              Delete
          </Button>
          </Col>
        </ButtonGroup>
      </Row>
    </>
  );
};
