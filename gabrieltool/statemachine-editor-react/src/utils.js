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
