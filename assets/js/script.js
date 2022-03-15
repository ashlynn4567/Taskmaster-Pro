var tasks = {};


// create tasks 
var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};


// check task due date to color task appropriately
var auditTask = function(taskEl) {
  // get date from task element
  var date = $(taskEl).find("span").text().trim();
  
  // convert to moment object at 5:00pm 
  var time = moment(date, "L").set("hour", 17);

  // apply new class if task is near/over due date
  // if the task due date has passed, make red
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  
  // if the task due date is coming soon, make yellow
  } else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  };
};


// load tasks from local storage
var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  };

  // loop over object properties
  $.each(tasks, function(list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};


// save tasks to local storage
var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};


// making the columns sortable
$(".card .list-group").sortable({
  // enable dragging across lists
  connectWith: $(".card .list-group"),
  scroll: false, 
  tolerance: "pointer",
  helper: "clone",
  activate: function(event, ui) {
    console.log(ui);
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event, ui) {
    console.log(ui);
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) {
    console.log(event);
    $(event.target).addClass("dropover-active");
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(event) {
    console.log(event);
    $(event.target).removeClass("dropover-active");
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  update: function() {
    // array to store the task data in
    var tempArr = [];
    
    // loop over current set of children in sortable list
    $(this).children().each(function() {
      var text = $(this)
        .find("p")
        .text()
        .trim();

      var date = $(this)
        .find("span")
        .text()
        .trim();

      // add task data to the temp array as an object
      tempArr.push({
        text: text,
        date: date,
      });

      // trim down list's ID to match object property
      var arrName = $(this)
        .attr("id")
        .replace("list-", "");

      // update array on tasks object and save
      tasks[arrName] = tempArr;
      saveTasks();
    });
  },
  stop: function(event) {
    $(this).removeClass("dropover");
  }
});

// add ability to drop tasks in trash section to delete them
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    console.log(ui);
    ui.draggable.remove();
  },
  over: function(event, ui) {
    console.log(ui);
  },
  out: function(event, ui) {
    console.log(ui);
  }
});


// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});


// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});


// enabling the calendar dropdown in the modal 
$("#modalDueDate").datepicker({
  minDate: 1,
  onClose: function() {
    // when calendar is closed, force a "change" event on the dateInput
    $(this).trigger("change");
  }
});


// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});


// edit an existing task by clicking on the task
$(".list-group").on("click", "p", function() {
  // get current text of p element
  var text = $(this)
    .text()
    .trim();
  
  // replace p element with a new textarea
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);
  $(this).replaceWith(textInput);

  // auto focus new element
  textInput.trigger("focus");
});


// save edited task when clicking out of text area
$(".list-group").on("blur", "textarea", function () {
  // get the textarea's current value/text
  var text = $(this).val();

  // get status type from the list
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and re-save to localStorage
  tasks[status][index].text = text;
  saveTasks();

  // recreate p element
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);

  // replace textarea with new p element
  $(this).replaceWith(taskP);
});


// edit a due date on an existing task
$(".list-group").on("click", "span", function() {
  // get current text
  var date = $(this)
    .text()
    .trim();

  // create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);
  $(this).replaceWith(dateInput);

  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 1
  });

  // automatically bring up the calendar
  dateInput.trigger("focus");
});


// save edited date when clicking out of text area 
$(".list-group").on("change", "input[type='text']", function () {
  // get current text
  var date = $(this).val();

  // get staus type from the list
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();
  
  // update task in array and re-save to localStorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  // pass task's <li> element into auditTask() to check new due date after edited
  auditTask($(taskSpan).closest(".list-group-item"));
});


// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  };
  saveTasks();
});


// create an interval that will refresh the page every 30 minutes 
setInterval(function() {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
}, 1800000);


// load tasks for the first time
loadTasks();