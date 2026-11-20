// game.js holds the game logic. Every word and number lives in content.js.

// Everything the game remembers during one run.
let game = {
  major: "",      // the major the player picked
  goodChips: 0,   // chips still alive on the wafer
  offSteps: [],   // names of steps that went wrong, like ["deposition"]
  shippedBad: 0,  // bad chips that reached customers at Test (used in step 2)
  startTime: 0,   // when the run started, for the results screen
  station: 0      // which station the player is on, as an index into CONTENT.stations
};

// Hides every screen, then shows the one with this id.
function showScreen(id) {
  let screens = document.querySelectorAll(".screen");
  for (let i = 0; i < screens.length; i++) {
    screens[i].classList.remove("active");
  }
  document.getElementById(id).classList.add("active");
}

// Replaces one {blank} in a text from content.js with a value, like {count} with 85.
function fillBlank(text, blankName, value) {
  return text.replace("{" + blankName + "}", value);
}

// Puts the words from content.js onto the start screen, builds the major buttons,
// and wires up every button the game uses. Runs once, when the page loads.
function setUpStartScreen() {
  document.getElementById("start-title").textContent = CONTENT.start.title;
  document.getElementById("start-tagline").textContent = CONTENT.start.tagline;
  document.getElementById("start-intro").textContent = CONTENT.start.intro;
  document.getElementById("start-pick").textContent = CONTENT.start.pickMajor;
  document.getElementById("start-button").textContent = CONTENT.start.startButton;

  // one button per major
  let holder = document.getElementById("major-buttons");
  for (let i = 0; i < CONTENT.majors.length; i++) {
    let button = document.createElement("button");
    button.textContent = CONTENT.majors[i];
    button.className = "major-btn";
    button.onclick = function () { pickMajor(CONTENT.majors[i], button); };
    holder.appendChild(button);
  }

  document.getElementById("start-button").onclick = startRun;
  document.getElementById("continue-button").textContent = CONTENT.ui.continueButton;
  document.getElementById("continue-button").onclick = nextStation;
  document.getElementById("play-again-button").textContent = CONTENT.results.playAgain;
  document.getElementById("play-again-button").onclick = resetGame;
}

// Remembers the major the player tapped, highlights its button, and unlocks Start.
function pickMajor(major, tappedButton) {
  game.major = major;
  let buttons = document.querySelectorAll(".major-btn");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("selected");
  }
  tappedButton.classList.add("selected");
  document.getElementById("start-pick").classList.add("hidden");
  document.getElementById("start-button").disabled = false;
}

// Resets the wafer and sends the player to the first station.
function startRun() {
  game.goodChips = CONTENT.startChips;
  game.offSteps = [];
  game.shippedBad = 0;
  game.station = 0;
  game.startTime = Date.now();
  renderStation(game.station);
  showScreen("screen-station");
}

// Fills the station screen with one station's words, drawing, options and job card.
function renderStation(stationIndex) {
  let station = CONTENT.stations[stationIndex];
  document.getElementById("station-name").textContent = station.name;
  document.getElementById("station-what").textContent = station.what;
  document.getElementById("station-drawing").innerHTML = station.drawing;
  document.getElementById("station-task").textContent = station.task;
  document.getElementById("station-prompt").textContent = station.prompt;

  // one button per option
  let holder = document.getElementById("option-buttons");
  holder.innerHTML = "";
  for (let i = 0; i < station.options.length; i++) {
    let button = document.createElement("button");
    button.textContent = station.options[i].label;
    button.className = "option-btn";
    button.onclick = function () { chooseOption(i); };
    holder.appendChild(button);
  }

  // the job card
  document.getElementById("job-heading").textContent = CONTENT.ui.jobCardHeading;
  document.getElementById("job-title").textContent = station.job.title;
  document.getElementById("job-what").textContent = station.job.what;
  document.getElementById("job-majors").textContent = CONTENT.ui.hires + " " + station.job.majors.join(", ");

  // point it out when the player's own major is on the hiring list
  let yours = document.getElementById("job-yours");
  if (station.job.majors.indexOf(game.major) >= 0) {
    yours.textContent = CONTENT.ui.yourMajor;
    yours.classList.remove("hidden");
  } else {
    yours.classList.add("hidden");
  }

  // show the decision, hide the last station's feedback
  document.getElementById("station-decision").classList.remove("hidden");
  document.getElementById("station-feedback").classList.add("hidden");
}

// Runs when the player taps an option button. Hands the choice to this station's own function.
function chooseOption(optionIndex) {
  let station = CONTENT.stations[game.station];
  if (station.id === "deposition") {
    applyDeposition(optionIndex);
  }
  // lithography, etch, metrology and test get their own branches in step 2
}

// Station 1. Applies the player's deposition choice to the wafer.
function applyDeposition(optionIndex) {
  let option = CONTENT.stations[game.station].options[optionIndex];
  if (option.chipLoss === 0) {
    // the right call: the wafer moves on unharmed
  } else {
    // a wrong call: chips die now, and the step is marked off for later stations
    game.goodChips = game.goodChips - option.chipLoss;
    game.offSteps.push("deposition");
  }
  showFeedback(option.feedback);
}

// Swaps the decision area for feedback: what the call did, the chip count, and Continue.
function showFeedback(text) {
  let chipsLine = fillBlank(CONTENT.ui.chipsLine, "count", game.goodChips);
  chipsLine = fillBlank(chipsLine, "start", CONTENT.startChips);
  document.getElementById("feedback-text").textContent = text;
  document.getElementById("feedback-chips").textContent = chipsLine;
  document.getElementById("station-decision").classList.add("hidden");
  document.getElementById("station-feedback").classList.remove("hidden");
}

// Moves to the next station, or to the results screen after the last one.
function nextStation() {
  game.station = game.station + 1;
  if (game.station < CONTENT.stations.length) {
    renderStation(game.station);
  } else {
    showResults();
  }
}

// Works out the yield and the run time, then fills and shows the results screen.
function showResults() {
  // yield = good chips / starting chips, as a whole-number percent
  let yieldPercent = Math.round((game.goodChips / CONTENT.startChips) * 100);
  document.getElementById("results-heading").textContent = CONTENT.results.heading;
  document.getElementById("results-yield-label").textContent = CONTENT.results.yieldLabel;
  document.getElementById("results-yield").textContent = yieldPercent + "%";

  // the first verdict whose minimum the yield reaches is the one shown
  let verdictText = "";
  for (let i = 0; i < CONTENT.results.verdicts.length; i++) {
    if (yieldPercent >= CONTENT.results.verdicts[i].min) {
      verdictText = CONTENT.results.verdicts[i].text;
      break;
    }
  }
  document.getElementById("results-verdict").textContent = verdictText;

  // how long the run took, as minutes and seconds
  let totalSeconds = Math.round((Date.now() - game.startTime) / 1000);
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds - minutes * 60;
  let timeText = minutes + " min " + seconds + " sec";
  document.getElementById("results-time").textContent = fillBlank(CONTENT.results.timeLine, "time", timeText);

  showScreen("screen-results");
}

// Sends the player back to the start screen for another run.
function resetGame() {
  showScreen("screen-start");
}

// Fill the screens with words as soon as the page loads.
setUpStartScreen();
