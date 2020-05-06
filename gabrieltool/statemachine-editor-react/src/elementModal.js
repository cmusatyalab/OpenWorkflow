import React, { Component } from "react";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";
import Form from "react-bootstrap/lib/Form";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";
import { Formik, Form as FormikForm, Field, FieldArray } from "formik";
import FileReaderInput from "react-file-reader-input";
import "./App.css";
import Select from "react-select";
import procZoo from "./processor-zoo.json";
import predZoo from "./predicate-zoo.json";
import {
    FSMElementType,
    getPropertyByString,
    elementToFormValues,
    getAllNames,
} from "./utils.js";

/** Helper function to create options for Select elements
 * from a pre-defined callable zoo (procZoo or predZoo)
 *
 * @param {*} zoo
 */
const getZooOptions = (zoo) => {
    return Object.keys(zoo).map((key) => {
        return { value: key, label: key };
    });
};

/** Custom validate functions for Formik forms
 *
 * Formik has a wierd return requirement
 * if invalid, return a string containing the error message or return undefined.
 *
 * return null if valid, a string if invalid
 * @param {*} param0
 */
const isEmpty = (value) => {
    let errorMessage = null;
    if (value === undefined || value === null || !/^.+$/i.test(value)) {
        errorMessage = "Required. Cannot be empty.";
    }
    return errorMessage;
};

/**
 * return null if valid, a string if invalid
 * @param {*} value
 * @param {*} existingItemArray
 */
const isDuplicate = (value, existingItemArray) => {
    let errorMessage = null;
    if (
        value === undefined ||
        value === null ||
        existingItemArray.includes(value)
    ) {
        errorMessage =
            "Duplicate name. All states and transitions must have unique names.";
    }
    return errorMessage;
};

/**
 * return null if valid, a string if invalid
 */
const isUniqueName = (value, existingItemArray) => {
    return isEmpty(value) || isDuplicate(value, existingItemArray) || null;
};

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
    isValid,
    ...props
}) => (
    <Form.Group as={Row}>
        <Form.Label column>{label}</Form.Label>
        <Col>
            <Form.Control
                required
                {...field}
                {...props}
                type={type}
                placeholder={placeholder}
                value={field.value || defaultValue || ""} // to supress uncontrolled to controlled warning
                isValid={isValid}
            />
        </Col>
    </Form.Group>
);

class ImageUploadField extends Component {
    constructor(props) {
        super(props);
        this.imageInstUrl = null;
    }

    prepareResource(imageBytes) {
        // clear up urls to prevent leaking memories
        if (this.imageInstUrl !== null) {
            URL.revokeObjectURL(this.imageInstUrl);
        }
        let blob = new Blob([imageBytes], {
            type: "image",
        });
        this.imageInstUrl = URL.createObjectURL(blob);
        return {
            imageInstUrl: this.imageInstUrl,
        };
    }

    render() {
        const { field, form, label } = this.props;
        let res = {};
        if (field.value) {
            res = this.prepareResource(field.value);
        }
        return (
            <Form.Group as={Row}>
                <Form.Label column>{label}</Form.Label>
                {res.imageInstUrl && (
                    <Form.Label column sm={1}>
                        <img
                            src={res.imageInstUrl}
                            alt="instruction"
                            style={{ width: 40, height: 40 }}
                        />
                    </Form.Label>
                )}
                <Col>
                    <FileReaderInput
                        as="buffer"
                        onChange={(e, fileArray) => {
                            fileArray.forEach((result) => {
                                const e = result[0];
                                let fileContent = e.target.result;
                                form.setFieldValue(
                                    field.name,
                                    new Uint8Array(fileContent)
                                );
                            });
                        }}
                    >
                        <Button variant="light" className="fw-btn">
                            New Image
                        </Button>
                    </FileReaderInput>
                </Col>
            </Form.Group>
        );
    }
}

/** Custom the look of a Formik Select field with react-select
 *
 * @param {*} param0
 */
const SelectFormikField = ({
    field,
    form, // values, setXXXX, handleXXXX, dirty, isValid, status, etc.
    label,
    selectOptions,
    ...props
}) => (
    <Form.Group as={Row}>
        <Form.Label column>{label}</Form.Label>
        <Col>
            <Select
                {...field}
                {...props}
                options={selectOptions}
                name={field.name}
                value={
                    selectOptions
                        ? selectOptions.find(
                              (option) => option.value === field.value
                          )
                        : ""
                }
                onChange={(option) =>
                    form.setFieldValue(field.name, option.value)
                }
                onBlur={field.onBlur}
            />
        </Col>
    </Form.Group>
);

const CallableNameField = ({
    field, // name, value, onChange, onBlur
    ...props
}) => (
    <BSFormikField
        field={field}
        type="text"
        label="name"
        placeholder="Enter Name"
        {...props}
    />
);

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
        {...props}
    />
);

const addFieldError = (errors, fieldName) => {
    if (getPropertyByString(errors, fieldName)) {
        return (
            <div className="text-danger">
                {getPropertyByString(errors, fieldName)}
            </div>
        );
    } else {
        return null;
    }
};

/*
Functions to create a group of form field to present a "callable".
The UIs to create a "callable" consist of following form fields:
1. callable name
2. callable type
3. A field for each callable argument (loaded from callable zoos)
*/
const createCallableMultiFields = (
    callableTitle,
    zoo,
    values,
    index,
    arrayHelpers,
    errors
) => {
    const zooOptions = getZooOptions(zoo);
    return (
        <div key={index} className="border">
            <h6>{callableTitle}</h6>
            <Field
                name={`callable.${index}.name`} // add values.callable[index].name
                component={CallableNameField}
                validate={isEmpty}
            />
            {addFieldError(errors, `callable.${index}.name`)}
            <Field
                name={`callable.${index}.type`} // add values.callable[index].name
                component={SelectFormikField}
                label="Type"
                selectOptions={zooOptions}
                validate={isEmpty}
            />
            {addFieldError(errors, `callable.${index}.type`)}
            {getPropertyByString(values, `callable.${index}.type`) &&
                createCallableArgMultiFields(
                    zoo[values["callable"][index]["type"]],
                    index,
                    errors
                )}
            <Form.Row>
                <Button
                    variant="danger"
                    className="btn-block"
                    onClick={() => arrayHelpers.remove({ index })}
                >
                    Delete
                </Button>
            </Form.Row>
        </div>
    );
};

/*
Create a field for each callable argument.
*/
const createCallableArgMultiFields = (args, index, errors) => {
    const argFields = Object.keys(args).map((key, argIndex) => {
        return (
            <div key={index + ".arg." + argIndex}>
                <Field
                    name={`callable.${index}.args.${key}`} // add values.callable[0].name
                    component={CallableArgField}
                    label={key}
                    placeholder={args[key]}
                    defaultValue=""
                    validate={isEmpty}
                />
                {addFieldError(errors, `callable.${index}.args.${key}`)}
            </div>
        );
    });
    return argFields;
};

/** Create transition basic fields including
 * from and to state, and instructions.
 *
 * @param {*} values
 */
const createTransitionBasicFields = (fsm, form, errors) => {
    const fsmStateOptions = fsm.getStatesList().map((state) => {
        return { value: state.getName(), label: state.getName() };
    });
    return (
        <>
            <Field
                name="from"
                component={SelectFormikField}
                label="From State"
                selectOptions={fsmStateOptions}
                validate={isEmpty}
            />
            {addFieldError(errors, "from")}
            <Field
                name="to"
                component={SelectFormikField}
                label="To State"
                selectOptions={fsmStateOptions}
                validate={isEmpty}
            />
            {addFieldError(errors, "to")}
            <Field
                name="instruction.audio"
                component={BSFormikField}
                type="text"
                label="Audio Instruction"
                defaultValue=""
            />
            <Field
                name="instruction.image"
                component={ImageUploadField}
                label="Image Instruction"
            />
            <Field
                name="instruction.video"
                component={BSFormikField}
                type="text"
                label="Video Instruction"
                defaultValue=""
            />
        </>
    );
};

/**
 * A Modal used to create a new FSM element.
 * The core of the modal is a Formik form that captures
 * the user-inputted properties for the element
 */
class ElementModal extends Component {
    constructor(props) {
        super(props);
        this.form = React.createRef();
        this.onHide = this.onHide.bind(this);
    }

    onHide() {
        // do nothing
    }

    getInitModalValuesFromElement(element, fsm) {
        if (element === null) {
            return {
                callable: [],
            };
        } else {
            return elementToFormValues(element, fsm);
        }
    }

    render() {
        const {
            show,
            type,
            fsm,
            onModalCancel,
            onModalSave,
            initElement,
        } = this.props;

        let title,
            callableTitle = "";
        let callableZoo = null;
        let callableButtonValue = "";
        switch (type) {
            case FSMElementType.STATE:
                title = "State";
                callableTitle = "New Processor";
                callableButtonValue = "Add Processor";
                callableZoo = procZoo;
                break;
            case FSMElementType.TRANSITION:
                title = "Transition";
                callableTitle = "New Predicate";
                callableButtonValue = "Add Predicate";
                callableZoo = predZoo;
                break;
            default:
                throw new Error(
                    "Unsupported Element Type: " +
                        type +
                        ". Failed to add a new element"
                );
        }

        const initValues = this.getInitModalValuesFromElement(initElement, fsm);

        return (
            <Modal show={show} onHide={this.onHide}>
                <Modal.Header>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Formik
                        ref={this.form}
                        initialValues={initValues}
                        onSubmit={(values, { props, setSubmitting }) => {
                            onModalSave(type, values, initElement);
                            setSubmitting(false);
                        }}
                        render={({ form, values, errors }) => (
                            <FormikForm>
                                <FieldArray
                                    name="callable"
                                    render={(arrayHelpers) => {
                                        return (
                                            <>
                                                {type ===
                                                    FSMElementType.STATE && (
                                                    <>
                                                        <Field
                                                            name="name"
                                                            component={
                                                                BSFormikField
                                                            }
                                                            type="text"
                                                            label="Name"
                                                            validate={(
                                                                value
                                                            ) => {
                                                                if (
                                                                    initElement ===
                                                                        null ||
                                                                    initElement ===
                                                                        undefined
                                                                ) {
                                                                    const existingItemArray = getAllNames(
                                                                        fsm
                                                                    );
                                                                    return isUniqueName(
                                                                        value,
                                                                        existingItemArray
                                                                    );
                                                                } else {
                                                                    return isEmpty(
                                                                        value
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        {addFieldError(
                                                            errors,
                                                            "name"
                                                        )}
                                                        <Field name="isStartState">
                                                            {({
                                                                field,
                                                                form,
                                                            }) => {
                                                                return (
                                                                    <Form.Group
                                                                        as={Row}
                                                                    >
                                                                        <Form.Label
                                                                            column
                                                                        >
                                                                            Start
                                                                            from
                                                                            this
                                                                            state?
                                                                        </Form.Label>
                                                                        <Col>
                                                                            <Form.Control
                                                                                type="checkbox"
                                                                                checked={
                                                                                    values[
                                                                                        field
                                                                                            .name
                                                                                    ]
                                                                                }
                                                                                onChange={() => {
                                                                                    if (
                                                                                        values[
                                                                                            field
                                                                                                .name
                                                                                        ]
                                                                                    ) {
                                                                                        form.setFieldValue(
                                                                                            field.name,
                                                                                            false
                                                                                        );
                                                                                    } else {
                                                                                        form.setFieldValue(
                                                                                            field.name,
                                                                                            true
                                                                                        );
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </Col>
                                                                    </Form.Group>
                                                                );
                                                            }}
                                                        </Field>
                                                    </>
                                                )}
                                                {type ===
                                                    FSMElementType.TRANSITION && (
                                                    <>
                                                        <Field
                                                            name="name"
                                                            component={
                                                                BSFormikField
                                                            }
                                                            type="text"
                                                            label="Name"
                                                            validate={(
                                                                value
                                                            ) => {
                                                                if (
                                                                    initElement ===
                                                                        null ||
                                                                    initElement ===
                                                                        undefined
                                                                ) {
                                                                    const existingItemArray = getAllNames(
                                                                        fsm
                                                                    );
                                                                    return isUniqueName(
                                                                        value,
                                                                        existingItemArray
                                                                    );
                                                                } else {
                                                                    return isEmpty(
                                                                        value
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        {addFieldError(
                                                            errors,
                                                            "name"
                                                        )}
                                                        {createTransitionBasicFields(
                                                            fsm,
                                                            form,
                                                            errors
                                                        )}
                                                    </>
                                                )}
                                                {values.callable.map(
                                                    (eachCallable, index) =>
                                                        createCallableMultiFields(
                                                            callableTitle,
                                                            callableZoo,
                                                            values,
                                                            index,
                                                            arrayHelpers,
                                                            errors
                                                        )
                                                )}
                                                <Form.Row>
                                                    <Button
                                                        variant="info"
                                                        className="btn-block"
                                                        onClick={() =>
                                                            arrayHelpers.push(
                                                                {}
                                                            )
                                                        }
                                                    >
                                                        {callableButtonValue}
                                                    </Button>
                                                </Form.Row>
                                            </>
                                        );
                                    }}
                                />
                            </FormikForm>
                        )}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onModalCancel}>
                        Close
                    </Button>
                    <Button
                        variant="primary"
                        onClick={(e) => {
                            this.form.current.submitForm();
                        }}
                    >
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default ElementModal;
