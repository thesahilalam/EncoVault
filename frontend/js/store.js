// EncoVault Store — Lightweight Reactive State Management
// Zero dependencies, ~150 lines. Provides:
// - Reactive state with subscribe/notify pattern
// - Immutable updates with history (undo/redo ready)
// - DevTools logging
// - Module-scoped slices (files, ui, crypto, settings)

// ============ CORE STORE ============
function createStore(initialState = {}) {
  let state = { ...initialState };
  const listeners = new Set();
  const history = [];
  const maxHistory = 50;
  let isBatch = false;
  let batchCallbacks = [];

  function notify() {
    if (isBatch) return;
    listeners.forEach(cb => cb(state));
  }

  function setState(partial, actionName = "setState") {
    const prevState = { ...state };
    state = { ...state, ...partial };
    history.push({ prevState, actionName, timestamp: Date.now() });
    if (history.length > maxHistory) history.shift();
    notify();
  }

  function getState() {
    return state;
  }

  function subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  function batch(updates) {
    isBatch = true;
    try {
      updates.forEach(({ partial, actionName }) => {
        const prevState = { ...state };
        state = { ...state, ...partial };
        history.push({ prevState, actionName: actionName || "batch", timestamp: Date.now() });
        if (history.length > maxHistory) history.shift();
      });
    } finally {
      isBatch = false;
      notify();
    }
  }

  function undo() {
    if (history.length === 0) return false;
    const last = history.pop();
    state = last.prevState;
    notify();
    return true;
  }

  function clearHistory() {
    history.length = 0;
  }

  return {
    getState,
    setState,
    subscribe,
    batch,
    undo,
    clearHistory,
    get history() { return [...history]; }
  };
}

// ============ SLICES ============

// Files slice
const filesSlice = createStore({
  selectedFiles: [],
  fileList: [],
  isDragging: false,
  dragCount: 0,
});

// UI slice
const uiSlice = createStore({
  mode: "home",           // home, crypto, compress, simulation, lab, learn
  activeLab: "classical", // classical, modern, network, compression
  activeLearn: 0,
  sidebarOpen: true,
  theme: "light",         // light, dark
  toast: null,            // { message, type: success|error|info }
  progress: { current: 0, total: 0, label: "" },
});

// Crypto slice
const cryptoSlice = createStore({
  profile: "balanced",
  hash: "SHA-256",
  keyBits: 256,
  iterations: 600000,
  compression: "auto",
  keyfile: "none",
  threshold: 2,
  unlockTime: null,
});

// Settings slice
const settingsSlice = createStore({
  showAdvanced: false,
  animationsEnabled: true,
  reducedMotion: false,
});

// ============ ROOT STORE ============
const store = {
  files: filesSlice,
  ui: uiSlice,
  crypto: cryptoSlice,
  settings: settingsSlice,

  // Cross-slice actions
  resetAll() {
    filesSlice.setState({ selectedFiles: [], fileList: [], isDragging: false, dragCount: 0 });
    uiSlice.setState({ mode: "home", activeLab: "classical", activeLearn: 0, toast: null, progress: { current: 0, total: 0, label: "" } });
    cryptoSlice.setState({ profile: "balanced", hash: "SHA-256", keyBits: 256, iterations: 600000, compression: "auto", keyfile: "none", threshold: 2, unlockTime: null });
  },

  // DevTools
  logState() {
    console.group("🗄️ EncoVault Store");
    console.log("files:", filesSlice.getState());
    console.log("ui:", uiSlice.getState());
    console.log("crypto:", cryptoSlice.getState());
    console.log("settings:", settingsSlice.getState());
    console.groupEnd();
  },
};

// ============ EXPORTS ============
const useStore = () => store;
const useFiles = () => filesSlice;
const useUI = () => uiSlice;
const useCrypto = () => cryptoSlice;
const useSettings = () => settingsSlice;

window.Store = store;
window.useUI = useUI;
window.useFiles = useFiles;
window.useCrypto = useCrypto;
window.useSettings = useSettings;
