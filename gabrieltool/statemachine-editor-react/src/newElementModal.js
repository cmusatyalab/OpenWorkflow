import React, { Component } from "react";
import Table from "react-bootstrap/lib/Table";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";
import InputGroup from "react-bootstrap/lib/InputGroup";
import Form from "react-bootstrap/lib/Form";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";
import { Formik, Form as FormikForm, Field, FieldArray } from "formik";
import * as Yup from "yup";
import "./App.css";

class NewElementModal extends Component {
  render() {
    const { show, type } = this.props;
    return (
      <Modal show={show} onHide={this.handleClose}>
        <Modal.Header>
          <Modal.Title>New {type}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{
              name: "",
              processors: [{ name: "p1" }, { name: "p2" }]
            }}
            onSubmit={(values, { setSubmitting }) => {
              setTimeout(() => {
                alert(JSON.stringify(values, null, 2));
                setSubmitting(false);
              }, 500);
            }}
            validationSchema={Yup.object({
              name: Yup.string().required()
            })}
          >
            {props => {
              const {
                values,
                touched,
                errors,
                dirty,
                isSubmitting,
                handleChange,
                handleBlur,
                handleSubmit,
                handleReset
              } = props;
              return (
                <div>
                  <Form noValidate onSubmit={handleSubmit}>
                    <Form.Group as={Row} controlId="validationName">
                      <Form.Label column sm="2">
                        Name
                      </Form.Label>
                      <Col sm="10">
                        <Form.Control
                          type="text"
                          name="name"
                          placeholder="Enter a Name"
                          value={values.name}
                          onBlur={handleBlur}
                          onChange={handleChange}
                          isValid={touched.name && !errors.name}
                        />
                        <Form.Control.Feedback>
                          Looks good!
                        </Form.Control.Feedback>
                      </Col>
                    </Form.Group>
                  </Form>
                  <FieldArray
                    name="friends"
                    component={dynamicCallableForm}
                    values={values}
                  />
                </div>
              );
            }}
          </Formik>
          <Table striped bordered hover>
            <tbody>
              <tr>
                <td>Name</td>
                <td />
              </tr>
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={this.handleClose}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

const dynamicCallableForm = ({
  move,
  swap,
  push,
  insert,
  unshift,
  pop,
  form
}) => {
  const {
    values,
    touched,
    errors,
    dirty,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    handleReset
  } = form;
  return (
    <FormikForm>
      {values.processors.map((processor, index) => (
        <Form.Group
          as={Row}
          controlId={"processor" + index}
          key={"processor" + index}
        >
          <Form.Label column sm="2">
            Processor Name
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="text"
              name={"processor" + index + ".name"}
              placeholder="Processor Name"
              value={processor.name}
              onBlur={handleBlur}
              onChange={handleChange}
              isValid={touched.name && !errors.name}
            />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Col>
        </Form.Group>
      ))}
      {
        <Button
          type="button"
          onClick={() => push({ name: "add1" })}
        >
          Add
        </Button>
      }
    </FormikForm>
  );
};

export default NewElementModal;
