import procZoo from "./processor-zoo.json";
import predZoo from "./predicate-zoo.json";
var fsmPb = require("./wca-state-machine_pb");

export const FSMElementType = {
    STATE: Symbol("state"),
    TRANSITION: Symbol("transition"),
};
Object.freeze(FSMElementType);

// only support state and transition two types for now
export const getFSMElementType = (element) => {
    return typeof element.getProcessorsList === "function"
        ? FSMElementType.STATE
        : FSMElementType.TRANSITION;
};

function isObject(o) {
    //How you acomplish this is upto you.
    return o === Object(o);
}

// allow array access using nested not annatation
// obj = {
//     'a': ['property': 'test']
// }
// e.g. obj['a.0.property']
export const getPropertyByString = function(o, s) {
    if (s) {
        s = s.replace(/^\./, ""); // strip a leading dot
        var a = s.split(".");
        for (var i = 0, n = a.length; i < n; ++i) {
            var k = a[i];
            if (isObject(o) && k in o) {
                o = o[k];
            } else {
                return;
            }
        }
        return o;
    } else {
        return;
    }
};

export const findStatePbByName = function(stateName, fsm) {
    let result = null;
    fsm.getStatesList().map((state) => {
        if (state.getName() === stateName) {
            result = state;
        }
        return null;
    });
    return result;
};

export const findTransitionOriginateState = function(transition, fsm) {
    let result = null;
    fsm.getStatesList().map((state) => {
        state.getTransitionsList().map((curTransition) => {
            if (curTransition === transition) {
                result = state;
            }
            return null;
        });
        return null;
    });
    return result;
};

const callableToFormValues = function(elementCallables) {
    let result = [];
    elementCallables.map((elementCallableItem) => {
        let item = {};
        item.name = elementCallableItem.getName();
        item.type = elementCallableItem.getCallableName();
        let callableArgs = JSON.parse(elementCallableItem.getCallableArgs());
        item.args = {};
        Object.keys(callableArgs).map((key) => {
            item.args[key] = callableArgs[key];
            return null;
        });
        result.push(item);
        return null;
    });
    return result;
};

const getElementCallables = function(element) {
    const elementType = getFSMElementType(element);
    let elementCallables = null;
    switch (elementType) {
        case FSMElementType.STATE:
            elementCallables = element.getProcessorsList();
            break;
        case FSMElementType.TRANSITION:
            elementCallables = element.getPredicatesList();
            break;
        default:
            throw new Error(
                "Unsupported Element Type: " +
                    elementType +
                    ". Failed to add a new element"
            );
    }
    return elementCallables;
};

export const elementToFormValues = function(element, fsm) {
    const values = {};
    values.callable = [];
    const elementType = getFSMElementType(element);
    // name
    const name = element.getName();
    values.name = name;
    // type specific attrs
    switch (elementType) {
        case FSMElementType.STATE:
            values.isStartState = element.getName() === fsm.getStartState();
            break;
        case FSMElementType.TRANSITION:
            values.to = element.getNextState();
            values.from = findTransitionOriginateState(element, fsm).getName();
            values.instruction = {};
            values.instruction.audio = element.getInstruction().getAudio();
            values.instruction.image = element.getInstruction().getImage();
            values.instruction.video = element.getInstruction().getVideo();
            break;
        default:
            throw new Error(
                "Unsupported Element Type: " +
                    elementType +
                    ". Failed to add a new element"
            );
            break;
    }
    // handle callables
    values.callable = callableToFormValues(getElementCallables(element));
    // add predicates
    return values;
};

const formCallableToElementCallable = function(
    callbleFormValue,
    setFunc,
    callablePbType,
    zoo
) {
    let callableArray = [];
    for (let idx = 0; idx < callbleFormValue.length; idx++) {
        let callableValue = callbleFormValue[idx];
        let callablePb = new callablePbType();
        callablePb.setName(callableValue.name);
        callablePb.setCallableName(callableValue.type);
        // callable args
        // need to filter out relevant arguments only
        // since the form may contain irrelevant arguments for other callable type
        // this is caused by user switching callable types
        let args = {};
        Object.keys(zoo[callableValue.type]).map((key) => {
            args[key] = callableValue.args[key];
            return null;
        });
        callablePb.setCallableArgs(JSON.stringify(args));
        callableArray.push(callablePb);
    }
    setFunc(callableArray);
};

/**
 * Change the name of a state
 * @param {*} element
 * @param {*} newName
 * @param {*} fsm
 */
const setStateName = function(element, newName, aux) {
    const { fsm } = aux;
    let oldName = element.getName();
    if (oldName) {
        // need to fix affected transitions nextState when a state name
        // changes
        fsm.getStatesList().map((state) => {
            state.getTransitionsList().map((curTransition) => {
                if (curTransition.getNextState() === oldName) {
                    curTransition.setNextState(newName);
                }
                return null;
            });
            return null;
        });
    }
    element.setName(newName);
};

const setTransitionFromState = function(element, newFromStateName, aux) {
    const { fsm } = aux;
    let oldFromState = findTransitionOriginateState(element, fsm);
    if (newFromStateName !== oldFromState.getName()) {
        // remove the transition from the old state
        let index = oldFromState.getTransitionsList().indexOf(element);
        if (index > -1) {
            oldFromState.getTransitionsList().splice(index, 1);
        }
        // add the transition to the new state
        const fromStatePb = findStatePbByName(newFromStateName, fsm);
        fromStatePb.addTransitions(element);
    }
};

/**
 * Get all state and transition names from a FSM
 */
export const getAllNames = (fsm) => {
    let curCellNames = [];
    fsm.getStatesList().map((state) => {
        curCellNames.push(state.getName());
        state.getTransitionsList().map((transition) => {
            curCellNames.push(transition.getName());
            return null;
        });
        return null;
    });
    return curCellNames;
};

/**
 * Set element from formValue.
 * @param {} formValue
 * @param {*} element: the FSM element to be set.
 */
export const formValuesToElement = function(formValue, fsm, type, initElement) {
    // create or use appropriate element based on type
    let element = null;
    let existingNames = getAllNames(fsm);
    if (initElement === null || initElement === undefined) {
        if (existingNames.includes(formValue.name))
            throw "Error: Duplicate name! All states and transitions must have unique names.";
        switch (type) {
            case FSMElementType.STATE:
                element = new fsmPb.State();
                fsm.addStates(element);
                break;
            case FSMElementType.TRANSITION:
                element = new fsmPb.Transition();
                // find from state
                const fromStatePb = findStatePbByName(formValue.from, fsm);
                fromStatePb.addTransitions(element);
                break;
            default:
                throw new Error(
                    "Unsupported Element Type: " +
                        type +
                        ". Failed to add a new element"
                );
        }
    } else {
        // if the element name changed and the new name is a duplicate
        if (
            existingNames.includes(formValue.name) &&
            initElement.name !== formValue.name
        )
            throw "Error: Duplicate name! All states and transitions must have unique names.";
        element = initElement;
    }

    // deal with type specific fields
    switch (type) {
        case FSMElementType.STATE:
            setStateName(element, formValue.name, { fsm: fsm });
            // set start state
            if (formValue.isStartState) {
                fsm.setStartState(formValue.name);
            }
            // add processors
            formCallableToElementCallable(
                formValue.callable,
                element.setProcessorsList.bind(element), //bind is needed to pass context
                fsmPb.Processor,
                procZoo
            );
            break;
        case FSMElementType.TRANSITION:
            element.setName(formValue.name);
            // from state
            setTransitionFromState(element, formValue.from, {
                fsm: fsm,
                oldFromStateName: formValue.from,
            });
            // to state
            element.setNextState(formValue.to);
            // instruction
            let instPb = new fsmPb.Instruction();
            if (formValue.instruction) {
                instPb.setAudio(formValue.instruction.audio);
                instPb.setImage(formValue.instruction.image);
                instPb.setVideo(formValue.instruction.video);
            }
            element.setInstruction(instPb);
            // add predicates
            formCallableToElementCallable(
                formValue.callable,
                element.setPredicatesList.bind(element),
                fsmPb.TransitionPredicate,
                predZoo
            );
            break;
        default:
            throw new Error(
                "Unsupported Element Type: " +
                    type +
                    ". Failed to add a new element"
            );
    }
};
