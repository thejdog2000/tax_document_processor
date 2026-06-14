use serde::Serialize;
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::{process::CommandEvent, ShellExt};

#[derive(Clone, Serialize)]
struct BridgeProgress {
    line: String,
}

/// Shared helper: spawn tax-runner with given args, stream stdout as
/// "runner-progress" events, return on clean exit or error string.
async fn spawn_runner(app: &AppHandle, args: &[&str]) -> Result<String, String> {
    let sidecar = app
        .shell()
        .sidecar("tax-runner")
        .map_err(|err| format!("Failed to resolve tax-runner sidecar: {err}"))?;

    let (mut rx, _child) = sidecar
        .args(args)
        .spawn()
        .map_err(|err| format!("Failed to start tax-runner: {err}"))?;

    let mut stderr = String::new();
    let mut completed = false;

    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(bytes) => {
                let line = String::from_utf8_lossy(&bytes).trim_end().to_string();
                if !line.is_empty() {
                    app.emit("runner-progress", BridgeProgress { line })
                        .map_err(|err| format!("Failed to emit progress: {err}"))?;
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
                        "tax-runner exited with code {:?}: {}",
                        payload.code, stderr
                    ));
                }
            }
            _ => {}
        }
    }

    if completed {
        Ok("Completed successfully.".to_string())
    } else {
        Err(format!(
            "tax-runner exited before reporting completion. stderr: {}",
            stderr
        ))
    }
}

/// Diagnostics: prove the sidecar binary is alive.
#[tauri::command]
async fn run_probe(app: AppHandle) -> Result<String, String> {
    spawn_runner(&app, &["probe"]).await
}

/// Load persistent settings from ~/.tax_processor/config.json.
/// Returns a JSON string of the settings object.
#[tauri::command]
async fn load_settings(app: AppHandle) -> Result<String, String> {
    let sidecar = app
        .shell()
        .sidecar("tax-runner")
        .map_err(|e| format!("Failed to resolve tax-runner: {e}"))?;

    let output = sidecar
        .args(["settings"])
        .output()
        .await
        .map_err(|e| format!("Failed to run tax-runner settings: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(format!("tax-runner settings failed: {stderr}"));
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

/// Save settings to ~/.tax_processor/config.json.
/// settings_json is a JSON object string with the keys to update.
#[tauri::command]
async fn save_settings(app: AppHandle, settings_json: String) -> Result<(), String> {
    let sidecar = app
        .shell()
        .sidecar("tax-runner")
        .map_err(|e| format!("Failed to resolve tax-runner: {e}"))?;

    let (mut rx, mut child) = sidecar
        .args(["settings", "--save"])
        .spawn()
        .map_err(|e| format!("Failed to start tax-runner settings --save: {e}"))?;

    child
        .write(settings_json.as_bytes())
        .map_err(|e| format!("Failed to write settings JSON to stdin: {e}"))?;
    drop(child);

    while let Some(event) = rx.recv().await {
        if let tauri_plugin_shell::process::CommandEvent::Terminated(payload) = event {
            if payload.code != Some(0) {
                return Err(format!("tax-runner settings --save exited with code {:?}", payload.code));
            }
        }
    }
    Ok(())
}

/// Run the real tax pipeline. job_json is the full JSON job object as a string,
/// passed to tax-runner via stdin.
#[tauri::command]
async fn run_pipeline(app: AppHandle, job_json: String) -> Result<String, String> {
    let sidecar = app
        .shell()
        .sidecar("tax-runner")
        .map_err(|err| format!("Failed to resolve tax-runner sidecar: {err}"))?;

    let (mut rx, mut child) = sidecar
        .args(["pipeline"])
        .spawn()
        .map_err(|err| format!("Failed to start tax-runner pipeline: {err}"))?;

    // Write job JSON to stdin, then drop child to close stdin so the
    // sidecar's sys.stdin.read() returns instead of blocking forever.
    child
        .write(job_json.as_bytes())
        .map_err(|err| format!("Failed to write job JSON to sidecar stdin: {err}"))?;
    drop(child);

    let mut stderr = String::new();
    let mut completed = false;

    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(bytes) => {
                let line = String::from_utf8_lossy(&bytes).trim_end().to_string();
                if !line.is_empty() {
                    app.emit("runner-progress", BridgeProgress { line })
                        .map_err(|err| format!("Failed to emit progress: {err}"))?;
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
                        "tax-runner pipeline exited with code {:?}: {}",
                        payload.code, stderr
                    ));
                }
            }
            _ => {}
        }
    }

    if completed {
        Ok("Pipeline completed successfully.".to_string())
    } else {
        Err(format!(
            "tax-runner pipeline exited before reporting completion. stderr: {}",
            stderr
        ))
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![run_probe, run_pipeline, load_settings, save_settings])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
