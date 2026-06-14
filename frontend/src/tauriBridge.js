const isTauri = () => Boolean(window.__TAURI_INTERNALS__);

/**
 * Open a native file picker and return an array of absolute PDF paths.
 * Returns [] if the user cancels or we're in browser-preview mode.
 */
/** Load settings from ~/.tax_processor/config.json. Returns a plain object. */
export async function loadSettings() {
  if (!isTauri()) return {};
  const { invoke } = await import("@tauri-apps/api/core");
  const raw = await invoke("load_settings");
  try { return JSON.parse(raw); } catch { return {}; }
}

/** Save settings to ~/.tax_processor/config.json. */
export async function saveSettings(data) {
  if (!isTauri()) return;
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("save_settings", { settingsJson: JSON.stringify(data) });
}

/** Open a native folder picker. Returns the chosen path or null. */
export async function pickFolder() {
  if (!isTauri()) return null;
  const { open } = await import("@tauri-apps/plugin-dialog");
  return await open({ directory: true, multiple: false }) ?? null;
}

/** Open a native file picker for .xlsx files. Returns the chosen path or null. */
export async function pickXlsxFile() {
  if (!isTauri()) return null;
  const { open } = await import("@tauri-apps/plugin-dialog");
  return await open({ multiple: false, filters: [{ name: "Excel", extensions: ["xlsx"] }] }) ?? null;
}

export async function pickPdfPaths() {
  if (!isTauri()) {
    console.warn("pickPdfPaths: not in Tauri context");
    return [];
  }
  console.log("pickPdfPaths: opening dialog...");
  const { open } = await import("@tauri-apps/plugin-dialog");
  const result = await open({
    multiple: true,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  console.log("pickPdfPaths: result", result);
  if (!result) return [];
  return Array.isArray(result) ? result : [result];
}

async function getTauri() {
  const [{ invoke }, { listen }] = await Promise.all([
    import("@tauri-apps/api/core"),
    import("@tauri-apps/api/event"),
  ]);
  return { invoke, listen };
}

/**
 * Diagnostics: verify the tax-runner sidecar binary is alive.
 * Calls onProgress(rawLine) for each JSON-lines string from the sidecar.
 */
export async function runProbe(onProgress) {
  if (!isTauri()) {
    onProgress(JSON.stringify({ event: "error", message: "Tauri runtime not available. Run `npm run dev:tauri`." }));
    return;
  }
  const { invoke, listen } = await getTauri();
  const unlisten = await listen("runner-progress", (event) => onProgress(event.payload.line));
  try {
    await invoke("run_probe");
  } finally {
    unlisten();
  }
}

/**
 * Run the real tax extraction pipeline.
 *
 * job shape:
 *   pdf_paths: string[]          absolute paths on the user's machine
 *   last_name: string
 *   first_name: string
 *   output_folder: string        absolute path
 *   generate_excel_review: bool
 *   // optional — fall back to ~/.tax_processor/config.json:
 *   aws_region, aws_profile, bedrock_model_id,
 *   template_1040, template_doublecheck
 *
 * onProgress(rawLine) is called with each JSON-lines string from the sidecar.
 */
export async function runPipeline(job, onProgress) {
  if (!isTauri()) {
    onProgress(JSON.stringify({ event: "error", message: "Tauri runtime not available. Run `npm run dev:tauri`." }));
    return;
  }
  const { invoke, listen } = await getTauri();
  const unlisten = await listen("runner-progress", (event) => onProgress(event.payload.line));
  try {
    await invoke("run_pipeline", { jobJson: JSON.stringify(job) });
  } finally {
    unlisten();
  }
}
