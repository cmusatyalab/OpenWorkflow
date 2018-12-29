import React, { Component } from "react";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";
import Form from "react-bootstrap/lib/Form";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";
import { Formik, Form as FormikForm, Field, FieldArray } from "formik";
import * as Yup from "yup";
import "./App.css";
import Select from 'react-select'
import procZoo from './processor-zoo.json';
import predZoo from './predicate-zoo.json';
import { FSMElementType } from "./toolbar.js";

/*
Load Processor and Predicate zoo from json files.
So that we can show relevant field names when creating them.
*/
const procZooOptions = Object.keys(procZoo).map((key) => {
  return { value: key, label: key }
})

const predZooOptions = Object.keys(predZoo).map((key) => {
  return { value: key, label: key }
})

/*
Customize the look of form fields using bootstrap.
These following React components should be passed as the "component"
property of a Formik field.
*/
const BSFormikField = ({
  field, // { name, value, onChange, onBlur }
  type,
  label,
  placeholder,
  defaultValue,
  ...props
}) => (
    <Form.Group as={Row}>
      <Form.Label column>{label}</Form.Label>
      <Col>
        <Form.Control
          required
          type={type}
          placeholder={placeholder}
          {...field}
          {...props}
          value={field.value || defaultValue || ''} // to supress uncontrolled to controlled warning
        />
      </Col>
      <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
    </Form.Group>
  );

const CallableNameField = ({
  field,  // name, value, onChange, onBlur
  ...props
}) => (
    <BSFormikField
      field={field}
      type="text"
      label="name"
      placeholder="Enter Name"
      {...props} />
  )

const CallableTypeField = ({
  field,
  form, // values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  selectOptions,
  ...props
}) => (
    <Form.Group as={Row}>
      <Form.Label column>Type</Form.Label>
      <Col>
        <Select
          options={selectOptions}
          name={field.name}
          value={selectOptions ? selectOptions.find(option => option.value === field.value) : ''}
          onChange={(option) => form.setFieldValue(field.name, option.value)}
          onBlur={field.onBlur}
        />
      </Col>
    </Form.Group>
  )

const CallableArgField = ({
  field,
  key, // unused. not passed to the field. just to suppress parent's react list warning
  label,
  placeholder,
  ...props
}) => (
    <BSFormikField
      field={field}
      type="text"
      label={label}
      placeholder={placeholder}
      {...props} />
  )

/*
Functions to create a group of form field to present a "callable".
The UIs to create a "callable" consist of following form fields:
1. callable name
2. callable type
3. A field for each callable argument (loaded from callable zoos)
*/
const createCallableMultiFields = (callableTitle, zooOptions, values, index, arrayHelpers) => {
  return (<div key={index} className="border">
    <h5>{callableTitle}</h5>
    <Field
      name={`callable.${index}.name`} // add values.callable[index].name
      component={CallableNameField} />
    <Field
      name={`callable.${index}.type`} // add values.callable[index].name
      component={CallableTypeField}
      selectOptions={zooOptions} />
    {
      values.hasOwnProperty('callable') &&
      (values.callable[index] !== undefined) &&
      values['callable'][index]['type'] &&
      createCallableArgMultiFields(zooOptions[values['callable'][index]['type']], index)
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

/*
Create a field for each callable argument.
*/
const createCallableArgMultiFields = (args, index) => {
  const argFields = Object.keys(args).map((key, argIndex) => {
    return <Field
      name={`callable.${index}.${key}`} // add values.callable[0].name
      component={CallableArgField}
      key={index + '-arg-' + argIndex}
      label={key}
      placeholder={args[key]} />
  })
  return argFields
}


/**
 * A Modal used to create a new FSM element.
 * The core of the modal is a Formik form that captures
 * the user-inputted properties for the element
 */
class NewElementModal extends Component {
  constructor(props) {
    super(props);
    this.form = React.createRef();
  }

  render() {
    const { show, type, onModalCancel, onModalSave } = this.props;
    let title, callableTitle = "";
    let callableZooOptions = null;
    switch (type) {
      case FSMElementType.STATE:
        title = "New State";
        callableTitle = "New Processor";
        callableZooOptions = procZooOptions;
        break;
      case FSMElementType.TRANSITION:
        title = "New Transition";
        callableTitle = "New Predicate";
        callableZooOptions = predZooOptions;
        break;
      default:
        throw new Error("Unsupported Element Type: " + type + ". Failed to add a new element")
    }

    return (
      <Modal show={show} onHide={this.handleClose}>
        <Modal.Header>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            ref={this.form}
            initialValues={{
              name: "",
              callable: []
            }}
            onSubmit={(values, { props, setSubmitting }) => {
              onModalSave(values);
              setSubmitting(false);
            }
            }
            render={({ values, handleSubmit }) => (
              <FormikForm>
                <FieldArray
                  name="callable"
                  render={(arrayHelpers) => {
                    return (
                      <>
                        <Field
                          name="name"
                          component={BSFormikField}
                          type="text"
                          label="Name"
                          placeholder="Enter Name" />
                        {
                          values.callable.map((eachCallable, index) => createCallableMultiFields(
                            callableTitle,
                            callableZooOptions,
                            values,
                            index,
                            arrayHelpers
                          ))
                        }
                        <Form.Row>
                          <Button
                            variant="light"
                            className="btn-block"
                            onClick={() => arrayHelpers.push({})}>
                            Add
                          </Button>
                        </Form.Row>
                      </>
                    );
                  }}
                />
              </FormikForm>
            )
            }
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onModalCancel}>
            Close
          </Button>
          <Button variant="primary" onClick={(e) => {
            this.form.current.submitForm();
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
