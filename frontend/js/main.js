// EncoVault Main Entry Point
// This file imports all modules and initializes the application

import * as API from "./api.js";
import * as UI from "./ui.js";
import * as Zip from "./zip.js";
import * as Archive from "./archive.js";
import * as FileSecurity from "./file-security.js";
import * as Compress from "./compress.js";
import * as AES from "./aes.js";
import * as Reference from "./reference.js";
import { initApp } from "../app.js";

// Make AES and API available globally for backward compatibility
// (reference.js and some legacy code uses window.AES and window.API)
if (typeof window !== "undefined") {
  window.AES = AES.AES;
  window.API = API.API;
  window.UI = UI;
  window.Zip = Zip;
  window.Archive = Archive;
  window.FileSecurity = FileSecurity;
  window.Compress = Compress;
  window.Reference = Reference;
}

// Initialize the app
initApp();

// Export for potential external use
export { API, UI, Zip, Archive, FileSecurity, Compress, AES, Reference };
