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
import Select from 'react-select'
import procZoo from './processor-zoo.json';


console.log(procZoo);

const procZooOptions = Object.keys(procZoo).map((key) => {
  return { value: key, label: key }
})

const createCallableMultiFields = (processor, index, arrayHelpers) => (
  <div key={index}>
    <Field
      name={`processor.${index}`}
      component={CallableField}
      arrayHelpers={arrayHelpers}
      index={index}
      selectOptions={procZooOptions} />
  </div>
)

// TODO(junjuew): need to break these down into multiple fields
// since a single field has a single name and value
const CallableField = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  arrayHelpers,
  index,
  selectOptions,
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
          <Select
            options={selectOptions}
            name={field.name}
            value={selectOptions ? selectOptions.find(option => option.value === field.value) : ''}
            onChange={(option) => form.setFieldValue(field.name, option.value)}
            onBlur={field.onBlur}
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
                          values.processors.map((processor, index) => createCallableMultiFields(
                            processor,
                            index,
                            arrayHelpers
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


export default NewElementModal;
