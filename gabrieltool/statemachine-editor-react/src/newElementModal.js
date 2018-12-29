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

const BSFormikField = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  type,
  label,
  placeholder,
  ...props
}) => (
    <Form.Group as={Col}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        required
        type={type}
        placeholder={placeholder}
        {...field}
        {...props}
        value={field.value || ''} // to supress uncontrolled to controlled warning
      />
      <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
    </Form.Group>
  );


const CallableNameField = ({
  field,
  ...props
}) => (
    <Form.Group as={Col}>
      <Form.Label>"Name"</Form.Label>
      <Form.Control
        required
        type="text"
        placeholder="Please Enter Name"
        {...field}
        {...props}
        value={field.value || ''} // to supress uncontrolled to controlled warning
      />
      <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
    </Form.Group>
  )

const CallableTypeField = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  arrayHelpers,
  index,
  selectOptions,
  ...props
}) => (
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
  )

const CallableArgField = ({
  field, // { name, value, onChange, onBlur }
  form, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  key, // unused. just to suppress react list warning
  argName,
  defaultValue,
  ...props
}) => (
    <Form.Group as={Row}>
      <Form.Label column>{argName}</Form.Label>
      <Col>
        <Form.Control
          required
          type="text"
          placeholder={defaultValue}
          {...field}
          {...props}
          value={field.value || ''} // to supress uncontrolled to controlled warning
        />
      </Col>
    </Form.Group>
  )

const createCallableMultiFields = (zoo, values, index, arrayHelpers) => {
  return (<div key={index}>
    <Form.Row>
      <Field
        name={`callable.${index}.name`} // add values.callable[index].name
        component={CallableNameField}
        index={index} />
      <Field
        name={`callable.${index}.type`} // add values.callable[index].name
        component={CallableTypeField}
        index={index}
        selectOptions={procZooOptions} />
    </Form.Row>
    {
      values.hasOwnProperty('callable') &&
      (values.callable[index] !== undefined) &&
      values['callable'][index]['type'] &&
      createCallableArgMultiFields(zoo[values['callable'][index]['type']], index)
  }
    <p>{JSON.stringify(values)}</p>
    <Form.Row>
      <Button
        variant="danger"
        onClick={() => arrayHelpers.remove({ index })}>
        Delete
    </Button>
    </Form.Row>
  </div>)
}

const createCallableArgMultiFields = (args, index) => {
  console.log(args);
  const argFields = Object.keys(args).map((key, argIndex) => {
    return <Field
      name={`callable.${index}.${key}`} // add values.callable.c0.name
      component={CallableArgField}
      key={index + '-arg-' + argIndex}
      argName={key}
      defaultValue={args[key]} />
  })
  return argFields
}


class NewElementModal extends Component {
  constructor(props) {
    super(props);
    this.form = React.createRef();
  }

  render() {
    const { show, type } = this.props;
    return (
      <Modal show={show} onHide={this.handleClose}>
        <Modal.Header>
          <Modal.Title>New {type}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            ref={this.form}
            initialValues={{
              name: "",
              callable: []
            }}
            onSubmit={(values, { props, setSubmitting }) => {
              console.log(JSON.stringify(values));
              setSubmitting(false)
            }
            }
            render={({ values, handleSubmit }) => (
              <FormikForm>
                <FieldArray
                  name="callable"
                  render={(arrayHelpers) => {
                    return (
                      <>
                        {
                          values.callable.map((eachCallable, index) => createCallableMultiFields(
                            procZoo,
                            values,
                            index,
                            arrayHelpers
                          ))
                        }
                        <Form.Row>
                          <Button
                            variant="light"
                            className="btn-block"
                            onClick={() => arrayHelpers.push('')}>
                            Add
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
          <Button variant="secondary" onClick={() => this.setState({ show: false })}>
            Close
          </Button>
          <Button variant="primary" onClick={() => {
            this.form.current.submitForm() &&
              this.setState({ show: false })
          }
          }>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}


export default NewElementModal;
