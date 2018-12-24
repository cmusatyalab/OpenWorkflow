import React, { Component } from "react";
import Button from "react-bootstrap/lib/Button";
import ButtonGroup from "react-bootstrap/lib/ButtonGroup";
import DropdownButton from "react-bootstrap/lib/DropdownButton";
import Dropdown from "react-bootstrap/lib/Dropdown";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FileReaderInput from "react-file-reader-input";

const ToolBar = ({
  onImport,
  onAddState,
  onAddTransition,
  onExport,
  onDelete
}) => {
  return (
    <Row>
      <ButtonGroup>
        <Col sm={4}>
          <FileReaderInput as="binary" onChange={onImport}>
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
            <Dropdown.Item onClick={onAddState}>State</Dropdown.Item>
            <Dropdown.Item onClick={onAddTransition}>Transition</Dropdown.Item>
          </DropdownButton>
        </Col>
        <Col sm={4}>
          <Button variant="primary" onClick={onDelete}>
            Delete
          </Button>
        </Col>
      </ButtonGroup>
    </Row>
  );
};

export default ToolBar;
