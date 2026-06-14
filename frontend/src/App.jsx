import { useState, useEffect, useRef } from "react";
import { runProbe, runPipeline, pickPdfPaths, loadSettings, saveSettings, pickFolder, pickXlsxFile } from "./tauriBridge.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function clientSlug(lastName, firstName) {
  const parts = [lastName, firstName].map((p) => p.trim()).filter(Boolean);
  const name = parts.length ? parts.join("_") : "Client";
  return `${name.replace(/[^a-zA-Z0-9_-]+/g, "_")}_2025`;
}

function guessFormType(file) {
  const n = file.name.toLowerCase();
  if (n.includes("w2") || n.includes("w-2")) return "W-2";
  if (n.includes("1099-int") || n.includes("1099int")) return "1099-INT";
  if (n.includes("1099-div") || n.includes("1099div")) return "1099-DIV";
  if (n.includes("1099-r") || n.includes("1099r")) return "1099-R";
  if (n.includes("1099-misc") || n.includes("1099misc")) return "1099-MISC";
  if (n.includes("k-1") || n.includes("k1")) return "K-1";
  if (n.includes("organizer")) return "Organizer";
  if (n.includes("mortgage")) return "Mortgage";
  if (n.includes("note")) return "Notes";
  return null;
}

function fmtSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Root App ────────────────────────────────────────────────────────────────

export function App() {
  const [files, setFiles] = useState([]);
  const [pdfPaths, setPdfPaths] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [outputFolder, setOutputFolder] = useState("");
  const [generateExcel, setGenerateExcel] = useState(true);
  const [processingState, setProcessingState] = useState("idle"); // idle | processing | complete
  const [progressLines, setProgressLines] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    aws_region: "us-east-1",
    aws_profile: "",
    bedrock_model_id: "us.anthropic.claude-sonnet-4-6",
    template_1040: "",
    template_doublecheck: "",
    output_folder: "",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsTab, setSettingsTab] = useState("bedrock");
  const [bridgeState, setBridgeState] = useState({ running: false, lines: [], result: "" });
  const [dragging, setDragging] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    loadSettings().then((loaded) => {
      if (!loaded || !Object.keys(loaded).length) return;
      setSettings((s) => ({ ...s, ...loaded }));
      if (loaded.output_folder) setOutputFolder(loaded.output_folder);
    });
  }, []);

  // Elapsed timer during processing
  useEffect(() => {
    if (processingState === "processing") {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [processingState]);

  const slug = clientSlug(lastName, firstName);
  const isIdle = processingState === "idle";
  const isProcessing = processingState === "processing";
  const isComplete = processingState === "complete";

  async function openFilePicker() {
    try {
      const paths = await pickPdfPaths();
      if (!paths.length) return;
      const fakeFiles = paths.map((p) => ({ name: p.split("/").pop(), path: p, size: 0 }));
      setFiles(fakeFiles);
      setPdfPaths(paths);
      setProcessingState("idle");
      setProgressLines([]);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(`File picker error: ${err?.message ?? err}`);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const pdfs = Array.from(e.dataTransfer.files).filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (!pdfs.length) return;
    setFiles(pdfs);
    setPdfPaths([]);
    setProcessingState("idle");
    setProgressLines([]);
    setErrorMsg("");
  }

  async function processDocuments() {
    if (!files.length || isProcessing) return;
    setProcessingState("processing");
    setProgressLines([]);
    setErrorMsg("");
    const job = {
      pdf_paths: pdfPaths.length ? pdfPaths : files.map((f) => f.path ?? f.name),
      last_name: lastName,
      first_name: firstName,
      output_folder: outputFolder,
      generate_excel_review: generateExcel,
    };
    try {
      await runPipeline(job, (line) => {
        setProgressLines((cur) => [...cur, line]);
      });
      setProcessingState("complete");
    } catch (err) {
      setProcessingState("idle");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }

  function resetToIdle() {
    setFiles([]);
    setPdfPaths([]);
    setProcessingState("idle");
    setProgressLines([]);
    setErrorMsg("");
    setFirstName("");
    setLastName("");
  }

  return (
    <div className="rp-app">
      {/* ── Header ── */}
      <header className="rp-header">
        <span className="rp-header-icon">📄</span>
        <h1 className="rp-header-title">Tax Document Processor</h1>
        <span className="rp-year-badge">2025</span>
        <button className="rp-settings-btn" onClick={() => setShowSettings(true)}>
          ⚙ Settings
        </button>
      </header>

      {/* ── Main content ── */}
      <div className="rp-body">
        {isComplete ? (
          <CompleteView
            slug={slug}
            files={files}
            elapsed={elapsed}
            outputFolder={outputFolder}
            onReset={resetToIdle}
          />
        ) : (
          <>
            <div className="rp-grid">
              {/* Left: Client Packet */}
              <div className="rp-card">
                <div className="rp-card-header">
                  <span className="rp-card-icon">📂</span>
                  <h2>Client Packet</h2>
                  {isProcessing && <span className="rp-card-sub">{slug}</span>}
                </div>
                <div className="rp-card-body">
                  <div className="rp-form-row">
                    <div className="rp-field">
                      <label>FIRST NAME <span className="rp-opt">(optional)</span></label>
                      <input
                        type="text"
                        placeholder="e.g., John"
                        value={firstName}
                        readOnly={isProcessing}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="rp-field">
                      <label>LAST NAME <span className="rp-opt">(optional)</span></label>
                      <input
                        type="text"
                        placeholder="e.g., Smith"
                        value={lastName}
                        readOnly={isProcessing}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  {isProcessing ? (
                    <div className="rp-form-row">
                      <div className="rp-field">
                        <label>TAX YEAR</label>
                        <input type="text" value="2025" readOnly />
                      </div>
                      <div className="rp-field">
                        <label>OUTPUT FOLDER</label>
                        <input type="text" value={outputFolder || "~/Desktop"} readOnly />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="rp-field">
                        <label>TAX YEAR</label>
                        <input type="text" value="2025" readOnly />
                      </div>
                      <div className="rp-field">
                        <label>OUTPUT FOLDER</label>
                        <div className="rp-input-row">
                          <input
                            type="text"
                            placeholder="~/Desktop/TaxData/2025"
                            value={outputFolder}
                            onChange={(e) => setOutputFolder(e.target.value)}
                          />
                          <button
                            className="rp-browse-btn"
                            onClick={async () => {
                              const p = await pickFolder();
                              if (p) setOutputFolder(p);
                            }}
                          >
                            Browse…
                          </button>
                        </div>
                      </div>

                      {/* Drop zone */}
                      <div
                        className={`rp-dropzone${dragging ? " is-dragging" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={openFilePicker}
                      >
                        <span className="rp-dz-icon">☁</span>
                        <p className="rp-dz-title">Drop PDF files here</p>
                        <small>or click to browse</small>
                      </div>

                      <button className="rp-browse-full" onClick={openFilePicker}>
                        Browse Files
                      </button>
                    </>
                  )}

                  {/* File list */}
                  {files.length > 0 && (
                    <>
                      <div className="rp-files-header">
                        <span className="rp-section-label">Selected files</span>
                        <div className="rp-files-meta">
                          <span className="rp-count-pill">{files.length} files</span>
                          {!isProcessing && (
                            <button className="rp-clear-btn" onClick={() => { setFiles([]); setPdfPaths([]); }}>
                              ✕ Clear
                            </button>
                          )}
                        </div>
                      </div>
                      <table className="rp-ftable">
                        <thead>
                          <tr>
                            <th style={{ width: "52%" }}>File name</th>
                            <th style={{ width: "18%" }}>Size</th>
                            <th>{isProcessing ? "Status" : "Type"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {files.map((file, i) => (
                            <tr key={file.name + i}>
                              <td>
                                <span className="rp-pdf-ico">📄</span>
                                {file.name}
                              </td>
                              <td>{fmtSize(file.size)}</td>
                              <td>
                                {isProcessing ? (
                                  <FileStatus index={i} total={files.length} lines={progressLines} />
                                ) : (
                                  <span className="rp-type-dash">{guessFormType(file) ?? "—"}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {errorMsg && <p className="rp-error">{errorMsg}</p>}
                </div>
              </div>

              {/* Right: Package Outputs */}
              <div className="rp-card">
                <div className="rp-card-header">
                  <span className="rp-card-icon">📦</span>
                  <h2>Package Outputs</h2>
                </div>

                {!isProcessing && (
                  <p className="rp-card-desc">
                    The following outputs will be generated for this client packet.
                  </p>
                )}

                <div className="rp-output-list">
                  <div className="rp-output-item">
                    <div className="rp-file-ic rp-ic-pdf">📄</div>
                    <div className="rp-out-text">
                      <p>Renamed PDFs</p>
                      <small>Organized in SD/ subfolder</small>
                    </div>
                    <div className="rp-incl"><span className="rp-incl-dot">✓</span> Included</div>
                  </div>
                  <div className="rp-output-item">
                    <div className="rp-file-ic rp-ic-xls">⊞</div>
                    <div className="rp-out-text">
                      <p>1040 Workbook</p>
                      <small>Populated for review</small>
                    </div>
                    <div className="rp-incl"><span className="rp-incl-dot">✓</span> Included</div>
                  </div>
                  <div className="rp-output-item">
                    <div className="rp-file-ic rp-ic-xls">⊞</div>
                    <div className="rp-out-text">
                      <p>DoubleCheck Workbook</p>
                      <small>Cross-check diagnostics</small>
                    </div>
                    <div className="rp-incl"><span className="rp-incl-dot">✓</span> Included</div>
                  </div>
                </div>

                {isProcessing ? (
                  <div className="rp-saving-box">
                    <div className="rp-saving-label">SAVING TO</div>
                    <div className="rp-saving-path">{outputFolder || "~/Desktop"}/{slug}</div>
                  </div>
                ) : (
                  <label className="rp-ckr">
                    <span className={`rp-ckbox${generateExcel ? " checked" : ""}`}>✓</span>
                    <div>
                      <p className="rp-ck-title">Generate Excel workbooks</p>
                      <small>Creates 1040 and DoubleCheck files</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={generateExcel}
                      onChange={(e) => setGenerateExcel(e.target.checked)}
                      style={{ display: "none" }}
                    />
                  </label>
                )}

                <button
                  className="rp-process-btn"
                  disabled={!files.length || isProcessing}
                  onClick={processDocuments}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "#2d5a8e"; }}
                  onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "#1e3a5f"; }}
                  onMouseDown={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "#162d47"; }}
                  onMouseUp={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "#2d5a8e"; }}
                >
                  {isProcessing ? (
                    <><span className="rp-spin">↻</span> Processing…</>
                  ) : (
                    <>▶ Process Documents</>
                  )}
                </button>

                <div className="rp-warn">
                  <span>⚠</span>
                  <p>
                    {isProcessing
                      ? "Processing in progress. Do not close the app."
                      : "Generated workbooks are first drafts. Human review required before customer use."}
                  </p>
                </div>
              </div>
            </div>

            {/* Processing drawer */}
            {isProcessing && (
              <div className="rp-drawer">
                <div className="rp-drawer-header">
                  <span className="rp-drawer-title">Processing run</span>
                  <span className="rp-run-badge">
                    <span className="rp-run-dot" />
                    Running · {elapsed}s
                  </span>
                  <span className="rp-drawer-right">
                    {progressLines.length} of {files.length} complete
                  </span>
                </div>
                <div className="rp-drawer-rows">
                  {files.map((file, i) => (
                    <DrawerRow key={file.name + i} file={file} index={i} total={files.length} lines={progressLines} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Settings overlay */}
      {showSettings && (
        <SettingsOverlay
          settings={settings}
          settingsSaved={settingsSaved}
          settingsTab={settingsTab}
          bridgeState={bridgeState}
          onTabChange={setSettingsTab}
          onClose={() => setShowSettings(false)}
          onChange={(k, v) => { setSettings((s) => ({ ...s, [k]: v })); setSettingsSaved(false); }}
          onSave={async () => {
            await saveSettings(settings);
            if (settings.output_folder) setOutputFolder(settings.output_folder);
            setSettingsSaved(true);
            setTimeout(() => setSettingsSaved(false), 2000);
          }}
          onRunProbe={async () => {
            setBridgeState({ running: true, lines: [], result: "" });
            try {
              await runProbe((line) => setBridgeState((s) => ({ ...s, lines: [...s.lines, line] })));
              setBridgeState((s) => ({ ...s, running: false, result: "Probe completed successfully." }));
            } catch (err) {
              setBridgeState((s) => ({ ...s, running: false, result: String(err) }));
            }
          }}
        />
      )}
    </div>
  );
}

// ─── File status cell (used in table during processing) ──────────────────────

function FileStatus({ index, total, lines }) {
  // Heuristic: done = has a progress line, current = index === lines.length, waiting = else
  const done = index < lines.length;
  const current = index === lines.length;
  if (done) return <span className="rp-status-done">✓ Done</span>;
  if (current) return <span className="rp-status-extracting">↻ Extracting</span>;
  return <span className="rp-status-waiting">● Waiting</span>;
}

// ─── Processing drawer row ────────────────────────────────────────────────────

function DrawerRow({ file, index, lines }) {
  const done = index < lines.length;
  const current = index === lines.length;
  const line = lines[index];

  return (
    <div className="rp-drawer-row">
      <div className={`rp-dr-icon ${done ? "done" : current ? "spin" : "wait"}`}>
        {done ? "✓" : current ? <span className="rp-spin">↻</span> : "◷"}
      </div>
      <div className="rp-dr-body">
        <div className="rp-dr-name">{file.name}</div>
        <div className="rp-dr-sub">
          {done && line ? `Extracted — ${guessFormType(file) ?? "document"}` : current ? "Extracting…" : "Waiting"}
        </div>
      </div>
      {done && <div className="rp-dr-time">{/* latency from line if available */}—</div>}
    </div>
  );
}

// ─── Complete view ────────────────────────────────────────────────────────────

function CompleteView({ slug, files, elapsed, outputFolder, onReset }) {
  const outputPath = `${outputFolder || "~/Desktop"}/${slug}`;

  return (
    <div className="rp-complete">
      {/* Success banner */}
      <div className="rp-success-banner">
        <div className="rp-success-circle">✓</div>
        <div>
          <div className="rp-success-title">Package complete</div>
          <div className="rp-success-sub">{files.length} documents · {elapsed}s · {slug}</div>
        </div>
        <button className="rp-open-btn" onClick={onReset}>
          ＋ New packet
        </button>
      </div>

      <div className="rp-explorer-label">OUTPUT FOLDER CONTENTS</div>

      {/* File explorer */}
      <div className="rp-explorer">
        {/* Breadcrumb */}
        <div className="rp-breadcrumb">
          <span className="rp-bc-seg">Desktop</span>
          <span className="rp-bc-sep">/</span>
          <span className="rp-bc-seg">TaxData</span>
          <span className="rp-bc-sep">/</span>
          <span className="rp-bc-seg">2025</span>
          <span className="rp-bc-sep">/</span>
          <span className="rp-bc-seg active">{slug}</span>
        </div>

        {/* SD folder */}
        <div className="rp-folder-row">
          <span className="rp-folder-ico">📁</span>
          <span className="rp-folder-name">SD</span>
          <span className="rp-folder-meta">{files.length} files · Source documents</span>
          <span className="rp-folder-arrow">▾</span>
        </div>
        {files.map((file, i) => (
          <div className="rp-file-row" key={file.name + i}>
            <span className="rp-file-pdf-ico">📄</span>
            <span className="rp-file-name">{file.name.replace(".pdf", `_2025.pdf`)}</span>
            <span className="rp-file-size">{fmtSize(file.size)}</span>
            <span className="rp-type-badge rp-badge-red">{guessFormType(file) ?? "PDF"}</span>
          </div>
        ))}

        {/* Review folder */}
        <div className="rp-folder-row rp-folder-sep">
          <span className="rp-folder-ico">📁</span>
          <span className="rp-folder-name">Review</span>
          <span className="rp-folder-meta">2 files · Excel workbooks</span>
          <span className="rp-folder-arrow">▾</span>
        </div>
        <div className="rp-file-row">
          <span className="rp-file-xls-ico">📊</span>
          <span className="rp-file-name">{slug}_1040.xlsx</span>
          <span className="rp-file-size">84 KB</span>
          <span className="rp-type-badge rp-badge-green">1040</span>
        </div>
        <div className="rp-file-row rp-file-sep">
          <span className="rp-file-xls-ico">📊</span>
          <span className="rp-file-name">{slug}_DoubleCheck.xlsx</span>
          <span className="rp-file-size">61 KB</span>
          <span className="rp-type-badge rp-badge-green">DoubleCheck</span>
        </div>

        {/* Return + Signature Pages */}
        <div className="rp-folder-row rp-folder-sep">
          <span className="rp-folder-ico rp-folder-empty">📁</span>
          <span className="rp-folder-name">Return</span>
          <span className="rp-folder-meta">Empty · Ready for preparer</span>
          <span className="rp-folder-arrow rp-arrow-right">▸</span>
        </div>
        <div className="rp-folder-row" style={{ borderBottom: "none" }}>
          <span className="rp-folder-ico rp-folder-empty">📁</span>
          <span className="rp-folder-name">Signature Pages</span>
          <span className="rp-folder-meta">Empty · Ready for preparer</span>
          <span className="rp-folder-arrow rp-arrow-right">▸</span>
        </div>
      </div>
    </div>
  );
}

// ─── Settings overlay ─────────────────────────────────────────────────────────

function SettingsOverlay({ settings, settingsSaved, settingsTab, bridgeState, onTabChange, onClose, onChange, onSave, onRunProbe }) {
  const tabs = [
    ["bedrock", "AWS / Bedrock"],
    ["templates", "Templates"],
    ["diagnostics", "Diagnostics"],
  ];

  return (
    <div className="rp-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rp-settings-panel">
        <div className="rp-settings-header">
          <h2>Settings</h2>
          <button className="rp-close-btn" onClick={onClose}>✕</button>
        </div>
        <nav className="rp-settings-tabs">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              className={`rp-stab${settingsTab === id ? " active" : ""}`}
              onClick={() => onTabChange(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        {settingsTab === "bedrock" && (
          <div className="rp-settings-body">
            <p className="rp-settings-desc">All LLM calls route through AWS Bedrock. Changes take effect on the next packet processed.</p>
            <SettingsField label="AWS Region" value={settings.aws_region} placeholder="us-east-1" note="Default: us-east-1" onChange={(v) => onChange("aws_region", v)} />
            <SettingsField label="AWS Profile" value={settings.aws_profile} placeholder="Leave blank for default credential chain" note="Optional named profile from ~/.aws/credentials" onChange={(v) => onChange("aws_profile", v)} />
            <SettingsField label="Bedrock Model ID" value={settings.bedrock_model_id} placeholder="us.anthropic.claude-sonnet-4-6" note="Default: us.anthropic.claude-sonnet-4-6" onChange={(v) => onChange("bedrock_model_id", v)} />
            <SaveBar saved={settingsSaved} onSave={onSave} />
          </div>
        )}

        {settingsTab === "templates" && (
          <div className="rp-settings-body">
            <p className="rp-settings-desc">These templates are copied and populated for each client packet.</p>
            <SettingsField label="1040 Template" value={settings.template_1040} placeholder="Path to 1040 .xlsx template" note="Required for Excel output" onChange={(v) => onChange("template_1040", v)}
              onBrowse={async () => { const p = await pickXlsxFile(); if (p) onChange("template_1040", p); }} />
            <SettingsField label="DoubleCheck Template" value={settings.template_doublecheck} placeholder="Path to DoubleCheck .xlsx template" note="Required for Excel output" onChange={(v) => onChange("template_doublecheck", v)}
              onBrowse={async () => { const p = await pickXlsxFile(); if (p) onChange("template_doublecheck", p); }} />
            <SettingsField label="Default Output Folder" value={settings.output_folder} placeholder="e.g. /Users/you/Desktop" note="Pre-fills the output folder on the main screen" onChange={(v) => onChange("output_folder", v)}
              onBrowse={async () => { const p = await pickFolder(); if (p) onChange("output_folder", p); }} />
            <SaveBar saved={settingsSaved} onSave={onSave} />
          </div>
        )}

        {settingsTab === "diagnostics" && (
          <div className="rp-settings-body">
            <p className="rp-settings-desc">Run the Python sidecar probe to verify the bridge and AWS credentials are working.</p>
            <button className="rp-primary-btn" disabled={bridgeState.running} onClick={onRunProbe}>
              {bridgeState.running ? "Running…" : "Run Python Bridge Test"}
            </button>
            <div className="rp-bridge-log">
              {bridgeState.lines.length
                ? bridgeState.lines.map((line, i) => <code key={i}>{line}</code>)
                : <code>No output yet.</code>}
            </div>
            {bridgeState.result && <p className="rp-support-note">{bridgeState.result}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsField({ label, value, placeholder, note, onChange, onBrowse }) {
  return (
    <div className="rp-sfield">
      <label className="rp-slabel">{label}</label>
      {note && <span className="rp-snote">{note}</span>}
      <div className="rp-sinput-row">
        <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        {onBrowse && <button className="rp-browse-btn" onClick={onBrowse}>Browse…</button>}
      </div>
    </div>
  );
}

function SaveBar({ saved, onSave }) {
  return (
    <div className="rp-save-bar">
      <button className="rp-primary-btn" onClick={onSave}>{saved ? "Saved ✓" : "Save Settings"}</button>
      <p className="rp-support-note">Saved to ~/.tax_processor/config.json</p>
    </div>
  );
}
