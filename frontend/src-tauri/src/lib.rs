use serde::Serialize;
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::{process::CommandEvent, ShellExt};

#[derive(Clone, Serialize)]
struct BridgeProgress {
    line: String,
}

#[tauri::command]
async fn run_python_bridge(app: AppHandle) -> Result<String, String> {
    let sidecar = app
        .shell()
        .sidecar("tax-bridge-probe")
        .map_err(|err| format!("Failed to resolve Python sidecar: {err}"))?;

    let (mut rx, _child) = sidecar
        .spawn()
        .map_err(|err| format!("Failed to start Python sidecar: {err}"))?;

    let mut stderr = String::new();
    let mut completed = false;

    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(bytes) => {
                let line = String::from_utf8_lossy(&bytes).trim_end().to_string();
                if !line.is_empty() {
                    app.emit("python-bridge-progress", BridgeProgress { line })
                        .map_err(|err| format!("Failed to emit Python bridge progress: {err}"))?;
                }
            }
            CommandEvent::Stderr(bytes) => {
                stderr.push_str(&String::from_utf8_lossy(&bytes));
            }
            CommandEvent::Terminated(payload) => {
                if payload.code == Some(0) {
                    completed = true;
                } else {
                    return Err(format!(
                        "Python sidecar exited with code {:?}: {}",
                        payload.code, stderr
                    ));
                }
            }
            _ => {}
        }
    }

    if completed {
        Ok("Python bridge completed successfully.".to_string())
    } else {
        Err("Python sidecar exited before reporting completion.".to_string())
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![run_python_bridge])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
