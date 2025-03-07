import GameEngine from "./core/engine";
import InputManager from "./core/input";
import TimeManager from "./core/time";
import "./style.css";
import DebugTools from "./utils/debug";

console.log("Radical Aces initializing...");

// Check for debug mode in URL parameters (e.g., ?debug=true)
const urlParams = new URLSearchParams(window.location.search);
const debugMode = urlParams.get("debug") === "true";

// Create core systems
const engine = new GameEngine();
const input = new InputManager();
const time = new TimeManager();

// Initialize debug tools and check for debug settings
const debugTools = new DebugTools();

// Set debug mode if enabled via URL or debug tools
if (debugMode || debugTools.skipToMainMenu) {
  console.log("Debug mode enabled");
  engine.setDebugMode(true);
}

// Initialize the game
async function init() {
  try {
    // Initialize engine (this will load assets)
    await engine.init();

    // Add engine's canvas to the DOM
    const appElement = document.querySelector("#app");
    if (appElement) {
      appElement.appendChild(engine.getDomElement());
    }

    // Add a key handler to start the game immediately for testing (press G)
    window.addEventListener("keydown", (event) => {
      if (event.key === "g" || event.key === "G") {
        console.log("Skipping to game scene for testing");
        engine.skipToGame(); // We'll add this method to the engine
      }
    });

    // Start the engine's animation loop
    // This will handle the rendering internally
    engine.start();

    // Start our update loop for time and input
    requestAnimationFrame(updateLoop);

    console.log("Radical Aces initialization complete!");
  } catch (error) {
    console.error("Failed to initialize Radical Aces:", error);
  }
}

// Update loop for time and input managers
function updateLoop() {
  // Update time
  time.update();

  // Update input
  input.update();

  // Continue the update loop
  requestAnimationFrame(updateLoop);
}

// Initialize and start the game
init();
