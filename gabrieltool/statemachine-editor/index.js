$(document).ready(function () {
  var graph = new joint.dia.Graph();
  var $paper = $("#fsm-display");
  var paper = new joint.dia.Paper({
    el: $paper,
    width: $paper.innerWidth,
    height: window.innerHeight * 4,
    gridSize: 1,
    model: graph
  });
  var graph_el_to_pb_el = {};

  // paper object event call backs
  paper.on("link:pointerdblclick", function (linkView) {
    var el = linkView.model;
    info_box.display_transition_info(graph_el_to_pb_el[el.id]);
  });

  paper.on("element:pointerdblclick", function (elementView) {
    var el = elementView.model;
    // el.attr('circle/fill', 'aqua');
    info_box.display_state_info(graph_el_to_pb_el[el.id]);
  });

  function display_info(element) {
    $("#infoTable").show();
    if (element instanceof proto.State) {
      display_state_info(element);
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
    }
  }

  // ===============================================================
  var processor_zoo = {};
  var predicate_zoo = {};
  $.getJSON("processor-zoo.json", function (data) {
    processor_zoo = data;
  });
  $.getJSON("predicate-zoo.json", function (data) {
    predicate_zoo = data;
  });
  var state_shape_width = 50;
  var state_shape_height = 50;
  var state_spacing_x = 250;
  var state_spacing_y = 150;
  var state_per_row =
    Math.floor($paper.width() / (state_shape_width + state_spacing_x)) + 1;
  document
    .getElementById("file-input")
    .addEventListener("change", load_and_draw_fsm_file, false);

  // alert box
  bootstrap_alert = function () {};
  bootstrap_alert.warning = function (message) {
    $("#alert-placeholder").html(
      '<div class="alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><span>' +
      message +
      "</span></div>"
    );
  };
  bootstrap_alert.info = function (message) {
    $("#alert-placeholder").html(
      '<div class="alert alert-info alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><span>' +
      message +
      "</span></div>"
    );
  };

  // element info region
  info_box = function () {};
  info_box.add_list = function () {
    var $list = $("<div></div>").addClass("list-group");
    $("#infoBox").append($list);
    return $list;
  };
  info_box.add_table = function () {
    var $info_table = $("<table></table>")
      .css("width", "100%")
      .addClass("display")
      .addClass("table")
      .addClass("table-striped")
      .addClass("table-bordered");
    $("#infoBox").append($info_table);
    return $info_table;
  };
  info_box.empty = function () {
    $("#infoBox").empty();
  };
  info_box.table_data = [];
  info_box.table = null;
  info_box.display_state_info = function (state) {
    info_box.empty();
    // create the info list
    var $info_list = info_box.add_list();
    var $info_list_name = $("<h2></h2>")
      .addClass("list-group-item")
      .text("State: " + state.getName());
    $info_list.append($info_list_name);
    var $info_table = info_box.add_table();
    // create the info table
    info_box.table_data.splice(0, info_box.table_data.length);
    if (info_box.table != null) {
      info_box.table.destroy();
    }
    var processors = state.getProcessorsList();
    for (var i = 0; i < processors.length; i++) {
      var processor = processors[i];
      info_box.table_data.push(
        new Array(
          processor.getName(),
          processor.getCallableName(),
          processor.getCallableKwargsMap()
        )
      );
    }
    info_box.table = $info_table.DataTable({
      // for bootstrap 4
      dom: "<'row'<'col-sm-12'tr>><'row'<'col-sm-12 col-md-6'f>><'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
      data: info_box.table_data,
      columns: [{
          title: "Processor Name"
        },
        {
          title: "Type"
        },
        {
          title: "Parameters"
        }
      ]
    });
  };
  info_box.display_transition_info = function (transition) {
    info_box.empty();
    // create the info list
    var $info_list = info_box.add_list();
    var $info_list_name = $("<h2></h2>")
      .addClass("list-group-item")
      .text("Transition: " + transition.getName());
    $info_list.append($info_list_name);
    var $info_table = info_box.add_table();
    // create the info table
    info_box.table_data.splice(0, info_box.table_data.length);
    if (info_box.table != null) {
      info_box.table.destroy();
    }
    var predicates = transition.getPredicatesList();
    for (var i = 0; i < predicates.length; i++) {
      var predicate = predicates[i];
      info_box.table_data.push(
        new Array(
          predicate.getName(),
          predicate.getCallableName(),
          predicate.getCallableKwargsMap()
        )
      );
    }
    info_box.table = $info_table.DataTable({
      dom: "<'row'<'col-sm-12'tr>><'row'<'col-sm-12 col-md-6'f>><'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
      data: info_box.table_data,
      columns: [{
          title: "Predicate Name"
        },
        {
          title: "Type"
        },
        {
          title: "Parameters"
        }
      ]
    });
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
      var fsm = load_fsm(contents);
      draw_fsm(fsm);
    };
    reader.readAsArrayBuffer(file);
  }

  function load_fsm(fsm_data) {
    goog.require("proto.StateMachine");
    var fsm = null;
    try {
      fsm = new proto.StateMachine.deserializeBinary(fsm_data);
    } catch (err) {
      bootstrap_alert.warning("Failed to Load the File. Invalid File Format.");
      throw err;
    }
    bootstrap_alert.info("Succesfully loaded State Machine:" + fsm.getName());
    return fsm;
  }

  function draw_fsm(fsm) {
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
      graph_el_to_pb_el[state_shape.id] = state;
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
        var transition_shape = create_transition_shape(
          state_name_to_shape_lut[state.getName()],
          state_name_to_shape_lut[transition.getNextState()],
          get_info_string(transition)
        );
        graph_el_to_pb_el[transition_shape.id] = transition;
      }
    }
  }

  function get_info_string(element) {
    var repr = "";
    if (element instanceof proto.State) {
      repr += element.getName() + "\n";
      // repr += "Processors: " + "\n";
      // var processors = element.getProcessorsList();
      // for (var i = 0; i < processors.length; i++) {
      //   var processor = processors[i];
      //   repr += processor.getCallableName() + "\n";
      // }
    } else if (element instanceof proto.Transition) {
      repr += element.getName();
      // repr += "Predicates: " + "\n";
      // var predicates = element.getPredicatesList();
      // for (var i = 0; i < predicates.length; i++) {
      //   repr += predicates[i].getCallableName().toString() + "(\n";
      //   // try to display bytes as ASCII
      //   var kwargs = predicates[i].getCallableKwargsMap();
      //   var entry_list = kwargs.getEntryList();
      //   for (var j = 0; j < entry_list.length; j++) {
      //     var val = new TextDecoder().decode(entry_list[j][1].slice(0, 50));
      //     repr += entry_list[j][0] + "=" + val;
      //   }
      //   repr += ")\n";
      // }

      // var instruction = element.getInstruction();
      // if (typeof instruction != 'undefined') {
      //   repr += "Audio Instruction:\n";
      //   var audio_instruction = instruction.getAudio();
      //   // break long instructions for better appearance.
      //   for (var i = 0; i < Math.floor(audio_instruction.length / 50); i++) {
      //     audio_instruction = insert(audio_instruction, 50 * i, "\n");
      //   }
      //   repr += audio_instruction;
      // }
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

  function create_transition_shape(source, target, predicate, instruction) {
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
      ]
    });
    graph.addCell(cell);
    return cell;
  }

  // ===================== modals ===============
  function clear_modal() {
    $modal = $('#newModal');
    while ($modal.find("tbody").length > 1) {
      $modal.find("tbody:last").remove();
    }
  }
  $('.open-modal').click(function () {
    clear_modal();
    var pb_type = $(this).attr('pb-type');
    var $state_modal_add = $("#newModalAdd");
    $('#newModal').attr('pb-type', pb_type);
    if (pb_type == 'state') {
      $('#newModalTitle').text('New State');
      $('#newModalAdd').val('Add Processor');
      $state_modal_add.off('click');
      $state_modal_add.click(function () {
        table_add_callable_tbody($("#newTable"), "Processor Name", processor_zoo);
      });
    } else if (pb_type == 'transition') {
      $('#newModalTitle').text('New Transition');
      $('#newModalAdd').val('Add Predicate');
      $state_modal_add.off('click');
      $state_modal_add.click(function () {
        table_add_callable_tbody($("#newTable"), "Predicate Name", predicate_zoo);
      });
    }
    $('#newModal').modal('toggle');
  });


  function register_callable_tbody_callback(zoo) {
    $(".select-new-row").on("select2:select", function (e) {
      var callable_type = e.params.data.text;
      args = zoo[callable_type];
      table_set_row_args($(e.target).parents("tbody"), args);
    });
  }

  function table_add_callable_tbody($table, name_label, zoo) {
    var $new_callable = $("<tbody></tbody>");
    var $new_callable_top_row = $("<tr></tr>");
    var $state_modal_proc_td_name = $("<td></td>").text(name_label);
    var $state_modal_proc_td_input = $("<td></td>");
    var $state_modal_proc_input = $("<input type=\"text\" required></input>").addClass("form-control").attr('name', 'callable_name');
    $state_modal_proc_td_input.append($state_modal_proc_input);

    $new_callable_top_row.append($state_modal_proc_td_name);
    $new_callable_top_row.append($state_modal_proc_td_input);
    $new_callable_top_row.append($("<td>Type</td>"));
    var $new_select_div = create_new_select_div(zoo).attr('name', 'callable_type');
    var $new_type_td = $("<td></td>").append($new_select_div);
    $new_callable_top_row.append($new_type_td);
    var $delete_btn = $("<input type=\"button\" class=\"select-new-row-btn-del btn btn-md btn-danger\" value=\"Delete\" \">").on(
      'click',
      function () {
        $(this)
          .closest("tbody")
          .remove();
      }
    );
    $new_callable_top_row.append($("<td></td>").append($delete_btn));
    $new_callable.append($new_callable_top_row);
    $table.children("tbody:last").after($new_callable);
    $new_select_div.select2({
      placeholder: "Please specify type"
    });
    register_callable_tbody_callback(zoo);
  }

  function create_new_select_div(zoo) {
    var $select = $('<select required></select>').addClass('select-new-row');
    $select.append('<option></option>')
    $.each(zoo, function (key, value) {
      $select.append(
        $('<option></option').text(key)
      );
    });
    return $select;
  }

  function table_set_row_args($tbody, args) {
    var args_per_row = 2;
    var args_idx = 0;
    // remove arg tr if there is one
    while ($tbody.children("tr").length > 1) {
      $tbody.children("tr:last").remove();
    }

    // add arg td
    var add_arg_td = function (key, value) {
      $tbody.find("tr:last").append($("<td></td>").text(key));
      $tbody
        .find("tr:last")
        .append(
          $("<td></td>").append(
            $('<input type="text" class="form-control" required></input>').val(value).attr('name', key)
          )
        );
    };
    for (var key in args) {
      if (args_idx % args_per_row == 0) {
        $tbody.append("<tr></tr>");
      }
      if (args.hasOwnProperty(key)) {
        add_arg_td(key, args[key]);
      }
      args_idx += 1;
    }
  }

  $("#procTypeSelect").select2({
    placeholder: "Please specify type"
  });

  $('#modalSaveBtn').click(
    function () {
      $form = $('#modalForm');
      if (!$form[0].checkValidity()) {
        // cause the browser to display the native HTML5 error messages.
        $('<input type="submit">').hide().appendTo($form).click().remove();
      } else {
        var form_data = $form.serializeArray();
        add_to_pb(form_data)
        console.log(form_data);
        $('#newModal').modal('toggle');
      }
    }
  );

  function add_to_pb(data) {
    //TODO(junjuew)
  }
});