// content.js holds every word, number and link in Fab Run.
// game.js holds the logic. Fix wording and tune numbers here without touching logic.
// Lines marked // VERIFY: need checking against SEMI University and an industry mentor.

let CONTENT = {

  // How many chips a fresh wafer starts with. Yield = good chips / this number.
  startChips: 100,

  // The start screen.
  start: {
    title: "Fab Run",
    tagline: "How does a chip get made, and who makes it?",
    intro: "You run one wafer through a chip factory, called a fab. Five stations, one call at each. Good calls keep chips alive.",
    pickMajor: "Pick your major to start.",
    startButton: "Start your run"
  },

  // The majors a player can pick.
  majors: ["Electrical Eng", "Mechanical Eng", "Computer Science", "Chemistry", "Physics", "Business", "Undecided"],

  // Small reusable lines. game.js fills in the {blanks}.
  ui: {
    chipsLine: "Good chips on your wafer: {count} of {start}",
    continueButton: "Continue",
    jobCardHeading: "The real job here",
    hires: "Who gets hired:",
    yourMajor: "That includes your major."
  },

  // One object per station. Step 1 has Deposition; the rest arrive in step 2.
  stations: [
    {
      id: "deposition",
      name: "Station 1 of 5: Deposition",
      // VERIFY: deposition = coating the wafer with a thin, even layer of material
      what: "A machine coats the wafer with a thin, even film of material. Later stations print and carve circuit patterns into this film.",
      drawing: "" +
        "<svg viewBox='0 0 320 150' role='img' aria-label='A tool raining material down onto a wafer, building a film'>" +
        "<rect x='60' y='10' width='200' height='14' rx='4' class='svg-tool'/>" +
        "<circle cx='92' cy='42' r='4' class='svg-particle'/>" +
        "<circle cx='132' cy='58' r='4' class='svg-particle'/>" +
        "<circle cx='162' cy='36' r='4' class='svg-particle'/>" +
        "<circle cx='198' cy='54' r='4' class='svg-particle'/>" +
        "<circle cx='236' cy='40' r='4' class='svg-particle'/>" +
        "<rect x='40' y='88' width='240' height='10' class='svg-film'/>" +
        "<rect x='40' y='98' width='240' height='22' rx='4' class='svg-wafer'/>" +
        "<text x='160' y='142' text-anchor='middle' class='svg-label'>Material rains down and builds a film on the wafer</text>" +
        "</svg>",
      // VERIFY: are a 500 nanometer target and about 100 nanometers per minute believable for a deposition tool?
      task: "Target film thickness: 500 nanometers. This tool adds about 100 nanometers per minute.",
      prompt: "How long do you run the tool?",
      options: [
        {
          label: "3 minutes",
          chipLoss: 15,
          // VERIFY: a too-thin film fails by not fully covering the wafer
          feedback: "3 minutes built about 300 nanometers. Too thin. In spots the film does not fully cover the wafer, and the chips in those spots are dead."
        },
        {
          label: "5 minutes",
          chipLoss: 0,
          feedback: "5 minutes built about 500 nanometers. On target. The film is even, and every chip is still alive."
        },
        {
          label: "8 minutes",
          chipLoss: 15,
          // VERIFY: a too-thick film fails by stress and cracking, worst near the wafer edge
          feedback: "8 minutes built about 800 nanometers. Too thick. The extra film builds up stress and cracks near the wafer edge, and the chips there are dead."
        }
      ],
      job: {
        title: "Thin films process engineer",
        // VERIFY: job description with an industry mentor
        what: "Owns this tool's recipe. Tunes temperature, gas flow and time so every wafer gets the same even film.",
        // VERIFY: majors hired for thin films roles
        majors: ["Chemistry", "Physics", "Electrical Eng", "Mechanical Eng"]
      }
    }
  ],

  // The results screen. Step 3 adds jobs for your major and next steps.
  results: {
    heading: "Your run is done",
    yieldLabel: "Final yield",
    timeLine: "Your run took {time}.",
    playAgain: "Play again",
    // The first verdict whose min the yield reaches is the one shown. Keep them highest first.
    verdicts: [
      { min: 95, text: "A clean run. This wafer ships, and the fab wants you back." },
      { min: 80, text: "A solid run. Most of your chips made it." },
      { min: 60, text: "A rough run. The wafer shipped, but it cost the fab." },
      { min: 0, text: "The fab lost money on this wafer. Take another run." }
    ]
  }
};
