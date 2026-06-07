export async function runPythonBridge(onProgress) {
  if (!window.__TAURI_INTERNALS__) {
    onProgress("Browser preview detected. Run `npm run dev:tauri` to test the Python bridge.");
    return "Tauri runtime is not available in the browser preview.";
  }

  const [{ invoke }, { listen }] = await Promise.all([
    import("@tauri-apps/api/core"),
    import("@tauri-apps/api/event"),
  ]);

  const unlisten = await listen("python-bridge-progress", (event) => {
    onProgress(event.payload.line);
  });

  try {
    return await invoke("run_python_bridge");
  } finally {
    unlisten();
  }
}
