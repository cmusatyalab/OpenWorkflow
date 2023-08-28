import React, { Component } from "react";
import Form from "react-bootstrap/lib/Form";
import Button from "react-bootstrap/lib/Button";
import { Formik, Form as FormikForm, FieldArray } from "formik";
import { createCallableMultiFields } from "./elementModal";
import procZoo from "./processor-zoo.json";

class DefaultProcessorForm extends Component {
    constructor(props) {
        super(props);
        this.form = React.createRef();
    }

    render() {
        const {
            onDefaultProcessorSave,
        } = this.props;
        return (
            <>
                <Formik
                    ref={this.form}
                    initialValues={{
                        callable: [],
                    }}
                    onSubmit={(values, { props, setSubmitting }) => {
                        onDefaultProcessorSave(values);
                        setSubmitting(false);
                    }}
                    render={({ form, values, errors }) => (
                        <FormikForm>
                            <FieldArray
                                name="callable"
                                render={(arrayHelpers) => {
                                    return (
                                        <>
                                            {values.callable.map(
                                                (eachCallable, index) =>
                                                    createCallableMultiFields(
                                                        "New Default Processor",
                                                        procZoo,
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
                                                    {"Add Default Processor"}
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    className="btn-block"
                                                    onClick={(e) => {
                                                        this.form.current.submitForm();
                                                    }}
                                                >
                                                    {"Save Changes"}
                                                </Button>
                                            </Form.Row>
                                        </>
                                    );
                                }}
                            />
                        </FormikForm>
                    )}
                />
            </>
        );
    }
}

export default DefaultProcessorForm;