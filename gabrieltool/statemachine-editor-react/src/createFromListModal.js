import React, { Component } from "react";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";
import Form from "react-bootstrap/lib/Form";

class CreateFromListModal extends Component {
    constructor(props) {
        super(props);
        this.form = React.createRef();
        this.instructionList = React.createRef();
        this.onHide = this.onHide.bind(this);
    }

    onHide() {
        // do nothing
    }

    render() {
        const {
            show,
            initList,
            onListSave,
            onListCancel
        } = this.props;

        return (
            <Modal show={show} onHide={this.onHide}>
                <Modal.Header>
                    <Modal.Title>Create FSM From Instructions</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form
                        ref={this.form}
                        onSubmit={(e) => {
                            onListSave(this.instructionList.current ? this.instructionList.current.value : null)
                        }}
                    >
                        <Form.Group>
                            <Form.Control
                                as="textarea"
                                rows={25}
                                defaultValue={initList}
                                ref={this.instructionList}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onListCancel}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={(e) => {
                            this.form.current.dispatchEvent(new Event("submit"));
                        }}
                    >
                        Apply
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
}

export default CreateFromListModal;
