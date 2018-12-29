import React, { Component } from "react";
import Button from "react-bootstrap/lib/Button";
import ButtonGroup from "react-bootstrap/lib/ButtonGroup";
import DropdownButton from "react-bootstrap/lib/DropdownButton";
import Dropdown from "react-bootstrap/lib/Dropdown";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FileReaderInput from "react-file-reader-input";

export const FSMElementType = {
  STATE: Symbol("state"),
  TRANSITION: Symbol("transition"),
};
Object.freeze(FSMElementType);


export const ToolBar = ({
  onImport,
  onAdd,
  onExport,
  onDelete
}) => {
  return (
    <>
      <Row>
        <h2>Actions</h2>
      </Row>
      <Row>
        <ButtonGroup>
          <Col sm={4}>
            <FileReaderInput as="buffer" onChange={onImport}>
              <Button variant="primary">Import</Button>
            </FileReaderInput>
          </Col>
          <Col sm={4}>
            <Button variant="primary" onClick={onExport}>
              Export
          </Button>
          </Col>
          <Col sm={4}>
            <DropdownButton id="dropdown-basic-button" title="Add">
              <Dropdown.Item onClick={() => onAdd(FSMElementType.STATE)}>State</Dropdown.Item>
              <Dropdown.Item onClick={() => onAdd(FSMElementType.TRANSITION)}>Transition</Dropdown.Item>
            </DropdownButton>
          </Col>
          <Col sm={4}>
            <Button variant="primary" onClick={onDelete}>
              Delete
          </Button>
          </Col>
        </ButtonGroup>
      </Row>
    </>
  );
};
