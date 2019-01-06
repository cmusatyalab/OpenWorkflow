export const FSMElementType = {
    STATE: Symbol("state"),
    TRANSITION: Symbol("transition"),
};
Object.freeze(FSMElementType);


// only support state and transition two types for now
export const getFSMElementType = (element) => {
    return typeof element.getProcessorsList === "function"
        ? FSMElementType.STATE : FSMElementType.TRANSITION;
}

function isObject(o) {
    //How you acomplish this is upto you.
    return o === Object(o);
}

// allow array access using nested not annatation
// obj = {
//     'a': ['property': 'test']
// }
// e.g. obj['a.0.property']
export const getPropertyByString = function (o, s) {
    if (s) {
        s = s.replace(/^\./, '');           // strip a leading dot
        var a = s.split('.');
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
}


export const findStatePbByName = function (stateName, fsm) {
    let result = null;
    fsm.getStatesList().map((state) => {
        if (state.getName() === stateName) {
            result = state;
        }
    })
    return result;
}

export const findTransitionOriginateState = function (transition, fsm) {
    let result = null;
    fsm.getStatesList().map((state) => {
        state.getTransitionsList().map((curTransition) => {
            if (curTransition === transition) {
                result = state;
            }
        })
    });
    return result;
}
