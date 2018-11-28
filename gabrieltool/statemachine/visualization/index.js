$(window).on("load", function () {
  var graph = new joint.dia.Graph();

  var paper_el = $("#fsm-display");
  var paper = new joint.dia.Paper({
    el: paper_el,
    width: 1800,
    height: 10000,
    gridSize: 1,
    model: graph
  });

  var state_per_row = 3;
  var state_shape_width = 150;
  var state_shape_height = 150;
  var state_spacing_x = 500;
  var state_spacing_y = 500;
  document
    .getElementById("file-input")
    .addEventListener("change", load_and_draw_fsm_file, false);

  bootstrap_alert = function () {};
  bootstrap_alert.warning = function (message) {
    $("#alert_placeholder").html(
      '<div class="alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><span>' +
      message + '</span></div>');
  };
  bootstrap_alert.info = function (message) {
    $("#alert_placeholder").html(
      '<div class="alert alert-info alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><span>' +
      message + '</span></div>');
  };

  function load_and_draw_fsm_file(e) {
    graph.clear();
    var file = e.target.files[0];
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      var contents = e.target.result;
      draw_fsm(contents);
    };
    reader.readAsArrayBuffer(file);
  }

  function draw_fsm(fsm_data) {
    goog.require("proto.StateMachine");
    var fsm = null;
    try {
      fsm = new proto.StateMachine.deserializeBinary(fsm_data);
    } catch (err) {
      bootstrap_alert.warning('Failed to Load the File. Invalid File Format.');
      throw err;
    }
    bootstrap_alert.info('Succesfully loaded State Machine:' + fsm.getName());
    var states = fsm.getStatesList();
    var state_name_to_shape_lut = draw_states(states);
    draw_transitions(states, state_name_to_shape_lut);
  }

  function draw_states(states) {
    var state_name_to_shape_lut = {};
    for (var idx = 0; idx < states.length; idx++) {
      var state = states[idx];
      var state_shape = create_state_shape(
        get_info_string(state),
        Math.floor(idx % state_per_row) * state_spacing_x,
        Math.floor(idx / state_per_row) * state_spacing_y
      );
      state_name_to_shape_lut[state.getName()] = state_shape;
    }
    return state_name_to_shape_lut;
  }

  function draw_transitions(states, state_name_to_shape_lut) {
    for (var idx = 0; idx < states.length; idx++) {
      var state = states[idx];
      var transitions = state.getTransitionsList();
      for (
        var tran_idx = 0; tran_idx < transitions.length; tran_idx < tran_idx++
      ) {
        var transition = transitions[tran_idx];
        create_transition_shape(
          state_name_to_shape_lut[state.getName()],
          state_name_to_shape_lut[transition.getNextState()],
          get_info_string(transition),
          null
        );
      }
    }
  }

  function get_info_string(element) {
    var repr = "";
    if (element instanceof proto.State) {
      repr += element.getName() + "\n";
      repr += "Processors: " + "\n";
      var processors = element.getProcessorsList();
      for (var i = 0; i < processors.length; i++) {
        var processor = processors[i];
        repr += processor.getCallableName() + "\n";
      }
    } else if (element instanceof proto.Transition) {
      repr += "Predicates: " + "\n";
      var predicates = element.getPredicatesList();
      for (var i = 0; i < predicates.length; i++) {
        repr += predicates[i].getCallableName().toString() + "(\n";
        // try to display bytes as ASCII
        var kwargs = predicates[i].getCallableKwargsMap();
        var entry_list = kwargs.getEntryList();
        for (var j = 0; j < entry_list.length; j++) {
          var val = new TextDecoder().decode(entry_list[j][1].slice(0, 50));
          repr += entry_list[j][0] + "=" + val;
        }
        repr += ")\n";
      }

      var instruction = element.getInstruction();
      if (typeof instruction != 'undefined') {
        repr += "Audio Instruction:\n";
        var audio_instruction = instruction.getAudio();
        // break long instructions for better appearance.
        for (var i = 0; i < Math.floor(audio_instruction.length / 50); i++) {
          audio_instruction = insert(audio_instruction, 50 * i, "\n");
        }
        repr += audio_instruction;
      }
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
  }

  function create_transition_shape(
    source,
    target,
    predicate,
    instruction,
    vertices
  ) {
    var cell = new joint.shapes.fsa.Arrow({
      source: {
        id: source.id
      },
      target: {
        id: target.id
      },
      labels: [{
          position: 0.5,
          attrs: {
            text: {
              text: predicate || ""
            }
          }
        },
        {
          position: 0.8,
          attrs: {
            text: {
              text: instruction || "",
              "font-weight": "bold"
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