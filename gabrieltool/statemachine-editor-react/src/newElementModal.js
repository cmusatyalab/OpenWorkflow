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

const NewElementForm = (
  values,
  touched,
  errors,
  dirty,
  isSubmitting,
  handleChange,
  handleBlur,
  handleSubmit,
  handleReset
) => {
  return (
    <FormikForm>
      <FieldArray
        name="friends"
        render={arrayHelpers => (
          <div>
            {values.friends && values.friends.length > 0 ? (
              values.friends.map((friend, index) => (
                <div key={index}>
                  <Field name={`friends.${index}`} />
                  <button
                    type="button"
                    onClick={() => arrayHelpers.remove(index)} // remove a friend from the list
                  >
                    -
                      </button>
                  <button
                    type="button"
                    onClick={() => arrayHelpers.insert(index, '')} // insert an empty string at a position
                  >
                    +
                      </button>
                </div>
              ))
            ) : (
                <button type="button" onClick={() => arrayHelpers.push('')}>
                  {/* show this when user has removed all friends from the list */}
                  Add a friend
                  </button>
              )}
            <div>
              <button type="submit">Submit</button>
            </div>
          </div>
        )}
      />
    </FormikForm>
  )

  {/* {
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
          <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
        </Col>
      </Form.Group>
    </Form>
    <FieldArray
      name="friends"
      component={dynamicCallableForm}
      values={values}
    />
  );
          } */}
};

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
              processors: [{ name: 'jared' }, { name: 'ian' }, { name: 'brent' }]
            }}
            onSubmit={values =>
              setTimeout(() => {
                alert(JSON.stringify(values, null, 2));
              }, 500)
            }
            render={({ values, handleSubmit }) => (
              <FormikForm>
                <FieldArray
                  name="processors"
                  render={(arrayHelpers) => {
                    return (
                      <>
                        <Form.Group as={Row}>
                          <Form.Label column sm={2}>Name</Form.Label>
                          <Col sm={10}>
                            <Form.Control
                              required
                              type="text"
                              placeholder="Please Enter a Name"
                            />
                            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                          </Col>
                        </Form.Group>
                        {
                          values.processors &&
                          values.processors.map((processor, index) => (
                            <div key={index}>
                              <Field name={`processor.${index}`} component={CallableField} arrayHelpers={arrayHelpers} index={index} />
                            </div>
                          ))
                        }
                        <Form.Row>
                          <Button variant="light" className="btn-block" onClick={() => arrayHelpers.push('')}>
                            Add Processor
                          </Button>
                        </Form.Row>
                        <button type="submit">Submit</button>
                      </>
                    );
                  }}
                />
              </FormikForm>
            )
            }
          />
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

const CallableField = ({
  field, // { name, value, onChange, onBlur }
  form: { touched, errors }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  arrayHelpers,
  index,
  ...props
}) => (
    <>
      <Form.Row>
        <Form.Group as={Col}>
          <Form.Label>Name</Form.Label>
          <Form.Control
            required
            type="text"
            placeholder="Please Enter Processor Name"
            {...field}
          />
          <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
        </Form.Group>
        <Form.Group as={Col}>
          <Form.Label>Type</Form.Label>
          <Form.Control
            required
            type="text"
            placeholder="Please Enter Processor Type"
            {...field}
          />
          <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
        </Form.Group>
      </Form.Row>
      <Button
        variant="danger"
        onClick={() => arrayHelpers.remove(index)}>
        Delete
    </Button>
    </>
  );

export default NewElementModal;
