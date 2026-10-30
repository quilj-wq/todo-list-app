const taskInput = document.getElementById("task-input");
const importanceSelect = document.getElementById("importance-select");
const addTaskBtn = document.getElementById("add-task-btn");
const taskList = document.getElementById("task-list");
const errorMessage = document.getElementById("error-message");

const doingNowTask = document.getElementById("doing-now-task");
const durationSelect = document.getElementById("duration-select");
const timerDisplay = document.getElementById("timer-display");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const clearDoingNowBtn = document.getElementById("clear-doing-now-btn");

const completionPrompt = document.getElementById("completion-prompt");
const yesBtn = document.getElementById("yes-btn");
const noBtn = document.getElementById("no-btn");

let tasks = [];
let nextId = 1;

let doingNowId = null;

let timerId = null;
let selectedDuration = 10 * 60;
let timeLeft = selectedDuration;

let awaitingTimerAnswer = false;


// ADD TASK
addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    addTask();
  }
});

function addTask() {
  const title = taskInput.value.trim();

  if (title === "") {
    errorMessage.textContent = "Please enter a task.";
    return;
  }

  errorMessage.textContent = "";

  const newTask = {
    id: nextId,
    title: title,
    importance: importanceSelect.value,
    completed: false
  };

  nextId++;

  insertTaskAtEndOfGroup(newTask);

  taskInput.value = "";
  importanceSelect.value = "Low";

  renderTasks();
}


// RENDER TASKS
function renderTasks() {
  taskList.innerHTML = "";

  const highTasks = tasks.filter(
    task => !task.completed && task.importance === "High"
  );

  const mediumTasks = tasks.filter(
    task => !task.completed && task.importance === "Medium"
  );

  const lowTasks = tasks.filter(
    task => !task.completed && task.importance === "Low"
  );

  const completedTasks = tasks.filter(
    task => task.completed
  );

  const orderedTasks = [
    ...highTasks,
    ...mediumTasks,
    ...lowTasks,
    ...completedTasks
  ];

  orderedTasks.forEach(task => {
    const li = document.createElement("li");

    if (task.completed) {
      li.classList.add("completed");
    }

    if (task.id === doingNowId) {
      li.classList.add("doing-now");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;

    checkbox.addEventListener("change", function () {
      toggleComplete(task.id);
    });

    const titleSpan = document.createElement("span");
    titleSpan.textContent = " " + task.title + " ";

    const importanceLabel = document.createElement("strong");
    importanceLabel.textContent = `[${task.importance}] `;

    const importanceDropdown = document.createElement("select");

    ["High", "Medium", "Low"].forEach(level => {
      const option = document.createElement("option");
      option.value = level;
      option.textContent = level;

      if (task.importance === level) {
        option.selected = true;
      }

      importanceDropdown.appendChild(option);
    });

    importanceDropdown.addEventListener("change", function () {
      changeImportance(task.id, importanceDropdown.value);
    });

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";

    editBtn.addEventListener("click", function () {
      editTask(task.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";

    deleteBtn.addEventListener("click", function () {
      deleteTask(task.id);
    });

    li.appendChild(checkbox);
    li.appendChild(importanceLabel);
    li.appendChild(titleSpan);
    li.appendChild(importanceDropdown);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    if (!task.completed) {
      const doingNowBtn = document.createElement("button");
      doingNowBtn.textContent =
        task.id === doingNowId ? "Doing Now" : "Set Doing Now";

      doingNowBtn.addEventListener("click", function () {
        setDoingNow(task.id);
      });

      li.appendChild(doingNowBtn);
    }

    taskList.appendChild(li);
  });

  updateDoingNowDisplay();
}


// DELETE TASK
function deleteTask(id) {
  if (awaitingTimerAnswer && id === doingNowId) {
    alert("Please answer Yes or No first.");
    return;
  }

  if (id === doingNowId) {
    clearDoingNow();
  }

  tasks = tasks.filter(task => task.id !== id);

  renderTasks();
}


// EDIT TASK
function editTask(id) {
  const task = tasks.find(task => task.id === id);

  const newTitle = prompt("Edit task title:", task.title);

  if (newTitle === null) {
    return;
  }

  const cleanedTitle = newTitle.trim();

  if (cleanedTitle === "") {
    alert("Task title cannot be blank.");
    return;
  }

  task.title = cleanedTitle;

  renderTasks();
}


// COMPLETE / RESTORE
function toggleComplete(id) {
  const task = tasks.find(task => task.id === id);

  if (awaitingTimerAnswer && id === doingNowId) {
    alert("Please answer Yes or No first.");
    renderTasks();
    return;
  }

  if (!task.completed) {
    task.completed = true;

    if (task.id === doingNowId) {
      clearDoingNow();
    }

    tasks = tasks.filter(t => t.id !== task.id);
    tasks.push(task);
  } else {
    task.completed = false;

    tasks = tasks.filter(t => t.id !== task.id);
    insertTaskAtEndOfGroup(task);
  }

  renderTasks();
}


// IMPORTANCE
function changeImportance(id, newImportance) {
  const task = tasks.find(task => task.id === id);

  if (task.importance === newImportance) {
    return;
  }

  task.importance = newImportance;

  if (task.completed) {
    renderTasks();
    return;
  }

  tasks = tasks.filter(t => t.id !== task.id);
  insertTaskAtEndOfGroup(task);

  renderTasks();
}


// INSERT TASK IN CORRECT GROUP
function insertTaskAtEndOfGroup(task) {
  if (task.completed) {
    tasks.push(task);
    return;
  }

  const priorityOrder = {
    High: 3,
    Medium: 2,
    Low: 1
  };

  let insertIndex = tasks.length;

  for (let i = 0; i < tasks.length; i++) {
    const currentTask = tasks[i];

    if (currentTask.completed) {
      insertIndex = i;
      break;
    }

    if (
      priorityOrder[currentTask.importance] <
      priorityOrder[task.importance]
    ) {
      insertIndex = i;
      break;
    }
  }

  while (
    insertIndex < tasks.length &&
    !tasks[insertIndex].completed &&
    tasks[insertIndex].importance === task.importance
  ) {
    insertIndex++;
  }

  tasks.splice(insertIndex, 0, task);
}


// DOING NOW
function setDoingNow(id) {
  const task = tasks.find(task => task.id === id);

  if (!task || task.completed) {
    return;
  }

  if (awaitingTimerAnswer) {
    alert("Please answer Yes or No first.");
    return;
  }

  if (doingNowId !== id) {
    resetTimer();
  }

  doingNowId = id;

  timeLeft = selectedDuration;

  renderTasks();
  updateTimerDisplay();
}


function clearDoingNow() {
  if (awaitingTimerAnswer) {
    alert("Please answer Yes or No first.");
    return;
  }

  stopTimer();

  doingNowId = null;
  timeLeft = selectedDuration;

  completionPrompt.hidden = true;

  renderTasks();
  updateTimerDisplay();
}


function updateDoingNowDisplay() {
  const task = tasks.find(task => task.id === doingNowId);

  if (task && !task.completed) {
    doingNowTask.textContent = task.title;
    startBtn.disabled = false;
  } else {
    doingNowTask.textContent = "No task selected";
    startBtn.disabled = true;
  }
}


// TIMER DURATION
durationSelect.addEventListener("change", function () {
  selectedDuration = Number(durationSelect.value) * 60;
  timeLeft = selectedDuration;

  updateTimerDisplay();
});


// START TIMER
startBtn.addEventListener("click", startTimer);

function startTimer() {
  if (doingNowId === null) {
    return;
  }

  if (timerId !== null) {
    return;
  }

  if (awaitingTimerAnswer) {
    return;
  }

  durationSelect.disabled = true;
  startBtn.disabled = true;

  timerId = setInterval(function () {
    timeLeft--;

    if (timeLeft <= 0) {
      timeLeft = 0;
      updateTimerDisplay();
      finishTimer();
      return;
    }

    updateTimerDisplay();
  }, 1000);
}


// RESET TIMER
resetBtn.addEventListener("click", resetTimer);

function resetTimer() {
  stopTimer();

  timeLeft = selectedDuration;

  durationSelect.disabled = false;
  completionPrompt.hidden = true;

  if (doingNowId !== null) {
    startBtn.disabled = false;
  }

  updateTimerDisplay();
}


// STOP TIMER
function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}


// FINISH TIMER
function finishTimer() {
  stopTimer();

  awaitingTimerAnswer = true;
  durationSelect.disabled = true;
  startBtn.disabled = true;

  completionPrompt.hidden = false;
}


// YES
yesBtn.addEventListener("click", function () {
  const task = tasks.find(task => task.id === doingNowId);

  if (!task) {
    return;
  }

  task.completed = true;

  tasks = tasks.filter(t => t.id !== task.id);
  tasks.push(task);

  doingNowId = null;

  awaitingTimerAnswer = false;

  completionPrompt.hidden = true;
  durationSelect.disabled = false;

  timeLeft = selectedDuration;

  renderTasks();
  updateTimerDisplay();
});


// NO
noBtn.addEventListener("click", function () {
  awaitingTimerAnswer = false;

  completionPrompt.hidden = true;
  durationSelect.disabled = false;

  timeLeft = selectedDuration;

  if (doingNowId !== null) {
    startBtn.disabled = false;
  }

  updateTimerDisplay();
});


// CLEAR DOING NOW BUTTON
clearDoingNowBtn.addEventListener("click", clearDoingNow);


// TIMER DISPLAY
function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  timerDisplay.textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


updateTimerDisplay();
renderTasks();