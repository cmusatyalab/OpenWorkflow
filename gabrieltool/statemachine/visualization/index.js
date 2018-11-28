$(window).on('load', function () {
    var graph = new joint.dia.Graph;

    var paper_el = $('#fsm-display')
    var paper = new joint.dia.Paper({
        el: paper_el,
        width: 1000,
        height: 1000,
        gridSize: 1,
        model: graph
    });

    var state_per_row = 6;
    var state_shape_width = 60;
    var state_shape_height = 60;
    var state_spacing_x = 150;
    var state_spacing_y = 150;
    document.getElementById('file-input').addEventListener('change', readSingleBinaryFile, false);

    function readSingleBinaryFile(e) {
        var file = e.target.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            var contents = e.target.result;
            drawfsm(contents);
        };
        reader.readAsArrayBuffer(file);
    }

    function drawfsm(fsm_data) {
        goog.require('proto.StateMachine');
        var fsm = new proto.StateMachine.deserializeBinary(fsm_data);
        var states = fsm.getStatesList();
        var state_name_to_shape_lut = draw_states(states);
        draw_transitions(states, state_name_to_shape_lut);
        console.log('Loaded' + fsm.getName());
    }

    function draw_states(states) {
        var state_name_to_shape_lut = {};
        for (var idx = 0; idx < states.length; idx++) {
            var state = states[idx];
            var state_shape = create_state_shape(state.getName(), Math.floor(idx % state_per_row) * state_spacing_x,
                Math.floor(idx / state_per_row) * state_spacing_y);
            state_name_to_shape_lut[state.getName()] = state_shape;
        }
        return state_name_to_shape_lut;
    }

    function draw_transitions(states, state_name_to_shape_lut) {
        for (var idx = 0; idx < states.length; idx++) {
            var state = states[idx];
            var transitions = state.getTransitionsList();
            for (var tran_idx = 0; tran_idx < transitions.length; tran_idx < tran_idx++) {
                var transition = transitions[tran_idx];
                create_transition_shape(state_name_to_shape_lut[state.getName()],
                    state_name_to_shape_lut[transition.getNextState()],
                    predicates_to_string(transition.getPredicatesList()),
                    null
                );
            }
        }
    }

    function predicates_to_string(predicates) {
        var repr = "";
        for (var i = 0; i < predicates.length; i++) {
            var predicate = predicates[i];
            // TODO(junjuew) any words displayed is too crowded
            // repr += predicate.getCallableName()
            //  + '(' + predicate.getCallableKwargsMap() + ')';
            // repr += "AND";
        }
        return repr;
    }


    function create_state_shape(label, x, y) {

        var cell = new joint.shapes.fsa.State({
            position: {
                x: x,
                y: y
            },
            size: {
                width: state_shape_width,
                height: state_shape_height
            },
            attrs: {
                text: {
                    text: label
                }
            }
        });
        graph.addCell(cell);
        return cell;
    };

    function create_transition_shape(source, target, predicate, instruction, vertices) {

        var cell = new joint.shapes.fsa.Arrow({
            source: {
                id: source.id
            },
            target: {
                id: target.id
            },
            labels: [{
                    position: .5,
                    attrs: {
                        text: {
                            text: predicate || '',
                        }
                    }
                },
                {
                    position: .8,
                    attrs: {
                        text: {
                            text: instruction || '',
                            'font-weight': 'bold'
                        }
                    }
                }
            ],
            vertices: vertices || []
        });
        graph.addCell(cell);
        return cell;
    }
});

// var start = new joint.shapes.fsa.StartState({
//     position: {
//         x: 50,
//         y: 530
//     }
// });

// graph.addCell(start);

// var code = create_state_shape(180, 390, 'code');
// var slash = create_state_shape(340, 220, 'slash');
// var star = create_state_shape(600, 400, 'star');
// var line = create_state_shape(190, 100, 'line');
// var block = create_state_shape(560, 140, 'block');

// link(start, code, 'start');
// link(code, slash, '/');
// link(slash, code, 'other', [{
//     x: 270,
//     y: 300
// }]);
// link(slash, line, '/');
// link(line, code, 'new\n line');
// link(slash, block, '*');
// link(block, star, '*');
// link(star, block, 'other', [{
//     x: 650,
//     y: 290
// }]);
// link(star, code, '/', [{
//     x: 490,
//     y: 310
// }]);
// link(line, line, 'other', [{
//     x: 115,
//     y: 100
// }, {
//     x: 250,
//     y: 50
// }]);
// link(block, block, 'other', [{
//     x: 485,
//     y: 140
// }, {
//     x: 620,
//     y: 90
// }]);
// link(code, code, 'other', [{
//     x: 180,
//     y: 500
// }, {
//     x: 305,
//     y: 450
// }]);