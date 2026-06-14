import { useState, useEffect } from "react";
import { runProbe, runPipeline, pickPdfPaths, loadSettings, saveSettings, pickFolder, pickXlsxFile } from "./tauriBridge.js";

const defaultFolders = [
  { id: "sd", type: "Folder", value: "SD", note: "renamed source PDFs", create: true },
  { id: "review", type: "Folder", value: "Review", note: "Excel workbooks", create: true },
  { id: "return", type: "Folder", value: "Return", note: "created empty", create: true },
  { id: "signature", type: "Folder", value: "Signature Pages", note: "created empty", create: true },
  { id: "logs", type: "Log", value: "logs/", note: "packet history", create: true },
  { id: "latest-log", type: "Log", value: "document_log_latest.txt", note: "latest packet log", create: true },
];

const formTypes = ["W-2", "1099-INT", "1099-DIV", "1099-R", "Organizer", "Notes"];

function clientSlug(lastName, firstName) {
  const parts = [lastName, firstName].map((part) => part.trim()).filter(Boolean);
  const name = parts.length ? parts.join("_") : "Client";
  return `${name.replace(/[^a-zA-Z0-9_-]+/g, "_")}_2025`;
}

function guessedFormType(file, index) {
  const name = file.name.toLowerCase();
  if (name.includes("w2") || name.includes("w-2")) return "W-2";
  if (name.includes("int")) return "1099-INT";
  if (name.includes("div")) return "1099-DIV";
  if (name.includes("1099r") || name.includes("1099-r")) return "1099-R";
  if (name.includes("organizer")) return "Organizer";
  if (name.includes("note")) return "Notes";
  return formTypes[index % formTypes.length];
}

export function App() {
  const [files, setFiles] = useState([]);       // File objects for display
  const [pdfPaths, setPdfPaths] = useState([]); // absolute paths for pipeline
  const [settings, setSettings] = useState({
    aws_region: "us-east-1",
    aws_profile: "",
    bedrock_model_id: "us.anthropic.claude-sonnet-4-6",
    template_1040: "",
    template_doublecheck: "",
    output_folder: "",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [outputFolder, setOutputFolder] = useState("~/Desktop");
  const [generateExcel, setGenerateExcel] = useState(true);
  const [processingState, setProcessingState] = useState("idle");
  const [activeTab, setActiveTab] = useState("organization");
  const [folders, setFolders] = useState(defaultFolders);
  const [dragging, setDragging] = useState(false);
  const [bridgeState, setBridgeState] = useState({
    running: false,
    result: "",
    lines: [],
  });

  useEffect(() => {
    loadSettings().then((loaded) => {
      if (!loaded || !Object.keys(loaded).length) return;
      setSettings((s) => ({ ...s, ...loaded }));
      if (loaded.output_folder) setOutputFolder(loaded.output_folder);
    });
  }, []);

  const slug = clientSlug(lastName, firstName);
  const hasFiles = files.length > 0;
  const isProcessing = processingState === "processing";
  const isComplete = processingState === "complete";

  function selectFiles(fileList) {
    const pdfs = Array.from(fileList).filter((file) => file.name.toLowerCase().endsWith(".pdf"));
    setFiles(pdfs);
    setPdfPaths([]); // paths come from pickPdfPaths in Tauri; cleared on new selection
    setProcessingState("idle");
  }

  async function openNativeFilePicker() {
    console.log("openNativeFilePicker called");
    try {
      const paths = await pickPdfPaths();
      if (!paths.length) return;
      const fakeFiles = paths.map((p) => ({ name: p.split("/").pop(), path: p }));
      setFiles(fakeFiles);
      setPdfPaths(paths);
      setProcessingState("idle");
    } catch (err) {
      setBridgeState((s) => ({ ...s, result: `File picker error: ${err?.message ?? err}` }));
    }
  }

  async function processDocuments() {
    if (!hasFiles || isProcessing) return;
    setProcessingState("processing");
    setBridgeState({ running: true, result: "", lines: [] });
    const job = {
      pdf_paths: pdfPaths.length ? pdfPaths : files.map((f) => f.path ?? f.name),
      last_name: lastName,
      first_name: firstName,
      output_folder: outputFolder,
      generate_excel_review: generateExcel,
    };
    try {
      await runPipeline(job, (line) => {
        setBridgeState((current) => ({ ...current, lines: [...current.lines, line] }));
      });
      setProcessingState("complete");
      setBridgeState((current) => ({ ...current, running: false, result: "Pipeline completed successfully." }));
    } catch (error) {
      setProcessingState("idle");
      setBridgeState((current) => ({
        ...current,
        running: false,
        result: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  function addFolder() {
    setFolders((current) => [
      ...current.slice(0, -2),
      { id: `folder-${Date.now()}`, type: "Folder", value: "New Folder", note: "custom folder", create: true },
      ...current.slice(-2),
    ]);
  }

  function restoreDefaults() {
    setFolders(defaultFolders);
  }

  return (
    <>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <main className="desktop-frame">
        <CommandRail />

        <section className="workspace">
          <Topbar />

          <section className="intake-grid" id="intake" aria-label="Document intake">
            <HeroCard
              files={files}
              hasFiles={hasFiles}
              isProcessing={isProcessing}
              isComplete={isComplete}
              dragging={dragging}
              onSelectFiles={selectFiles}
              onPickFiles={openNativeFilePicker}
              onDragState={setDragging}
            />

            <StatusColumn
              files={files}
              lastName={lastName}
              firstName={firstName}
              slug={slug}
              isProcessing={isProcessing}
            />
          </section>

          <DetailsCard
            firstName={firstName}
            lastName={lastName}
            outputFolder={outputFolder}
            generateExcel={generateExcel}
            hasFiles={hasFiles}
            isProcessing={isProcessing}
            onFirstName={setFirstName}
            onLastName={setLastName}
            onOutputFolder={setOutputFolder}
            onGenerateExcel={setGenerateExcel}
            onProcess={processDocuments}
          />

          <InsightGrid
            files={files}
            slug={slug}
            generateExcel={generateExcel}
            isProcessing={isProcessing}
            isComplete={isComplete}
          />

          <ConfigShell
            activeTab={activeTab}
            bridgeState={bridgeState}
            folders={folders}
            settings={settings}
            settingsSaved={settingsSaved}
            onActiveTab={setActiveTab}
            onAddFolder={addFolder}
            onRestoreDefaults={restoreDefaults}
            onSettingsChange={(key, value) => {
              setSettings((s) => ({ ...s, [key]: value }));
              setSettingsSaved(false);
            }}
            onSaveSettings={async () => {
              await saveSettings(settings);
              if (settings.output_folder) setOutputFolder(settings.output_folder);
              setSettingsSaved(true);
              setTimeout(() => setSettingsSaved(false), 2000);
            }}
            onRenameFolder={(id, value) => {
              setFolders((current) => current.map((item) => (item.id === id ? { ...item, value } : item)));
            }}
            onToggleFolder={(id, create) => {
              setFolders((current) => current.map((item) => (item.id === id ? { ...item, create } : item)));
            }}
            onRunBridge={async () => {
              setBridgeState({ running: true, result: "", lines: [] });
              try {
                await runProbe((line) => {
                  setBridgeState((current) => ({ ...current, lines: [...current.lines, line] }));
                });
                setBridgeState((current) => ({ ...current, running: false, result: "Probe completed successfully." }));
              } catch (error) {
                setBridgeState((current) => ({
                  ...current,
                  running: false,
                  result: error instanceof Error ? error.message : String(error),
                }));
              }
            }}
          />
        </section>
      </main>
    </>
  );
}

function CommandRail() {
  return (
    <aside className="command-rail" aria-label="Primary navigation">
      <div className="brand-mark">TP</div>
      <nav>
        <a className="rail-item active" href="#intake" aria-label="Intake"><span>01</span>Intake</a>
        <a className="rail-item locked" href="#review" aria-label="Review unavailable"><span>02</span>Review</a>
        <a className="rail-item" href="#configuration" aria-label="Settings"><span>03</span>Config</a>
      </nav>
      <div className="rail-footer">
        <p>2025</p>
        <small>Local workspace</small>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">front office intake</p>
        <h1>Turn a messy packet into a clean client folder.</h1>
      </div>
      <a className="settings-button" href="#configuration" aria-label="Open settings">
        <span className="gear" aria-hidden="true" />
        Settings
      </a>
    </header>
  );
}

function HeroCard({ files, hasFiles, isProcessing, isComplete, dragging, onSelectFiles, onPickFiles, onDragState }) {
  const title = isProcessing
    ? "Processing documents"
    : isComplete
      ? "Output preview ready"
      : hasFiles
        ? `${files.length} document${files.length === 1 ? "" : "s"} ready`
        : "No documents selected";
  const copy = isProcessing
    ? "This prototype simulates progress; backend hookup comes next."
    : isComplete
      ? "The real pipeline bridge will use this same intake state."
      : hasFiles
        ? "Choose PDFs again to replace the selected packet."
        : "Drop W-2s, 1099s, organizers, notes, and supporting PDFs here.";

  return (
    <article className="glass-card hero-card">
      <div className="hero-copy">
        <p className="eyebrow">Step 1</p>
        <h2>Drop in the client's PDFs.</h2>
        <p>We'll read the documents, rename source files, create the office folder structure, and prepare Excel review documents when enabled.</p>
        <PacketStrip files={files} />
      </div>

      <div
        className={`drop-zone ${dragging ? "is-dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          onDragState(true);
        }}
        onDragLeave={() => onDragState(false)}
        onDrop={(event) => {
          event.preventDefault();
          onDragState(false);
          onSelectFiles(event.dataTransfer.files);
        }}
      >
        <div className="paper-stack" aria-hidden="true"><span /><span /><strong>PDF</strong></div>
        <div>
          <p className="drop-title">{title}</p>
          <p className="drop-copy">{copy}</p>
        </div>
      </div>
      <button type="button" className="button secondary" style={{marginTop: "12px", alignSelf: "center"}} onClick={onPickFiles}>Choose PDFs</button>
    </article>
  );
}

function PacketStrip({ files }) {
  if (!files.length) {
    return (
      <div className="packet-strip" aria-label="Packet preview">
        {["W-2", "1099-INT", "1099-DIV", "Organizer"].map((type) => <div className="packet-pill muted" key={type}>{type}</div>)}
        <div className="packet-pill ghost">waiting</div>
      </div>
    );
  }

  return (
    <div className="packet-strip" aria-label="Packet preview">
      {files.slice(0, 5).map((file, index) => <div className="packet-pill" key={file.name}>{guessedFormType(file, index)}</div>)}
      {files.length > 5 ? <div className="packet-pill ghost">+{files.length - 5} more</div> : null}
    </div>
  );
}

function StatusColumn({ files, lastName, firstName, slug, isProcessing }) {
  const packetTitle = isProcessing
    ? "Processing packet"
    : files.length
      ? `${files.length} PDF${files.length === 1 ? "" : "s"} selected`
      : "Waiting for PDFs";
  const packetCopy = isProcessing
    ? "Reading PDFs, renaming files, and preparing output."
    : files.length
      ? "Ready to create the client folder and packet logs."
      : "Add source documents to enable processing.";
  const clientTitle = lastName && firstName ? `${lastName}, ${firstName}` : lastName || firstName ? `${lastName || firstName} packet` : "Name optional";
  const clientCopy = lastName || firstName ? `Output folder will create ${slug}.` : "Blank names create Client_2025.";

  return (
    <aside className="status-column" aria-label="Workflow status">
      <article className="status-card current"><p className="eyebrow">Packet</p><h3>{packetTitle}</h3><p>{packetCopy}</p></article>
      <article className="status-card"><p className="eyebrow">Client</p><h3>{clientTitle}</h3><p>{clientCopy}</p></article>
      <article className="status-card locked" id="review"><p className="eyebrow">Reviewer mode</p><h3>Locked for now</h3><p>Low-confidence review unlocks after backend correction support.</p></article>
    </aside>
  );
}

function DetailsCard(props) {
  return (
    <section className="details-card glass-card" aria-label="Client and output details">
      <div className="section-title"><div><p className="eyebrow">Step 2</p><h2>Client and output details</h2></div><span className="badge">Per-client destination</span></div>
      <div className="field-grid">
        <label><span>Last name</span><input type="text" placeholder="Optional" value={props.lastName} onChange={(event) => props.onLastName(event.target.value)} /></label>
        <label><span>First name</span><input type="text" placeholder="Optional" value={props.firstName} onChange={(event) => props.onFirstName(event.target.value)} /></label>
        <label><span>Tax year</span><input type="text" value="2025" readOnly /></label>
      </div>
      <div className="destination-row">
        <label><span>Output folder for this client</span><input type="text" value={props.outputFolder} onChange={(event) => props.onOutputFolder(event.target.value)} /></label>
        <button className="button secondary" type="button">Browse</button>
      </div>
      <div className="run-row">
        <label className="checkbox-row"><input type="checkbox" checked={props.generateExcel} onChange={(event) => props.onGenerateExcel(event.target.checked)} /><span>Generate Excel review documents</span></label>
        <button className="button primary" type="button" disabled={!props.hasFiles || props.isProcessing} onClick={props.onProcess}>{props.isProcessing ? "Processing..." : "Process Documents"}</button>
      </div>
    </section>
  );
}

function InsightGrid({ files, slug, generateExcel, isProcessing, isComplete }) {
  const items = [
    ["SD/", `${files.length || "No"} renamed source PDFs`],
    ["Review/", generateExcel ? "Excel workbooks enabled" : "Excel workbooks disabled"],
    ["Return/", "created empty"],
    ["Signature Pages/", "created empty"],
    ["logs/", "versioned packet logs"],
    ["document_log_latest.txt", "staff packet log"],
  ];
  const reviewTitle = isProcessing ? "Review queue warming up" : isComplete ? "2 items would need review" : "Nothing to review yet";
  const reviewCopy = isProcessing
    ? "Future low-confidence findings will route here after extraction."
    : isComplete
      ? "Example future state: low confidence on payer name and one validation flag. Correction workflow is not built yet."
      : "Once backend correction exists, fields below the confidence threshold and validation-flagged items will appear here with evidence snippets.";

  return (
    <section className="insight-grid" aria-label="Processing preview">
      <article className="preview-card"><p className="eyebrow">Output preview</p><h3>{slug}/ output preview</h3><ul className="preview-list">{items.map(([label, note]) => <li key={label}><span>{label}</span><small>{note}</small></li>)}</ul></article>
      <article className={`preview-card locked-panel ${isProcessing || isComplete ? "review-alert" : ""}`}><p className="eyebrow">Future review queue</p><h3>{reviewTitle}</h3><p>{reviewCopy}</p></article>
    </section>
  );
}

function ConfigShell({
  activeTab,
  bridgeState,
  folders,
  settings,
  settingsSaved,
  onActiveTab,
  onAddFolder,
  onRestoreDefaults,
  onSettingsChange,
  onSaveSettings,
  onRenameFolder,
  onToggleFolder,
  onRunBridge,
}) {
  const tabs = [
    ["organization", "File & Folder Organization"],
    ["templates", "Excel Templates"],
    ["bedrock", "AWS / Bedrock"],
    ["diagnostics", "Diagnostics"],
  ];

  return (
    <section className="config-shell" id="configuration" aria-label="Settings configuration">
      <div className="section-title"><div><p className="eyebrow">Configuration</p><h2>Office setup</h2></div><span className="badge dark">Saved outside install folder</span></div>
      <nav className="tabs" aria-label="Settings tabs">
        {tabs.map(([id, label]) => <button className={`tab ${activeTab === id ? "active" : ""}`} type="button" key={id} onClick={() => onActiveTab(id)}>{label}</button>)}
      </nav>
      {activeTab === "organization" ? (
        <div className="config-grid tab-panel active">
          <article className="builder-panel">
            <div className="builder-header"><div><p className="eyebrow">Default hierarchy</p><h3>Choose what each client/year folder creates</h3></div><button className="button secondary" type="button" onClick={onRestoreDefaults}>Restore Defaults</button></div>
            <div className="tree-list" aria-label="Editable output hierarchy">
              <div className="tree-row root-row"><span className="drag-handle" aria-hidden="true">⋮⋮</span><span className="row-type root">Root</span><strong>Client_2025/</strong><span className="row-note">destination picked on main screen</span></div>
              {folders.map((item) => <TreeRow item={item} key={item.id} onRenameFolder={onRenameFolder} onToggleFolder={onToggleFolder} />)}
            </div>
            <div className="button-row"><button className="button secondary" type="button" onClick={onAddFolder}>Add Folder</button><button className="button secondary" type="button">Add Generated File Rule</button></div>
          </article>
          <PatternPanel />
        </div>
      ) : activeTab === "templates" ? (
        <TemplatesPanel settings={settings} settingsSaved={settingsSaved} onSettingsChange={onSettingsChange} onSaveSettings={onSaveSettings} />
      ) : activeTab === "bedrock" ? (
        <BedrockPanel settings={settings} settingsSaved={settingsSaved} onSettingsChange={onSettingsChange} onSaveSettings={onSaveSettings} />
      ) : activeTab === "diagnostics" ? (
        <BridgePanel bridgeState={bridgeState} onRunBridge={onRunBridge} />
      ) : null}
    </section>
  );
}

function SettingsField({ label, value, onChange, placeholder, note, onBrowse, browseLabel = "Browse…" }) {
  return (
    <div className="settings-field">
      <label>
        <span className="settings-label">{label}</span>
        {note && <span className="settings-note">{note}</span>}
        <div className="settings-input-row">
          <input
            type="text"
            value={value}
            placeholder={placeholder || ""}
            onChange={(e) => onChange(e.target.value)}
          />
          {onBrowse && (
            <button type="button" className="button secondary" onClick={onBrowse}>{browseLabel}</button>
          )}
        </div>
      </label>
    </div>
  );
}

function SaveBar({ saved, onSave }) {
  return (
    <div className="settings-save-bar">
      <button type="button" className="button primary" onClick={onSave}>
        {saved ? "Saved ✓" : "Save Settings"}
      </button>
      <p className="support-note">Saved to ~/.tax_processor/config.json — shared between Tkinter and Tauri.</p>
    </div>
  );
}

function TemplatesPanel({ settings, settingsSaved, onSettingsChange, onSaveSettings }) {
  return (
    <div className="tab-panel active settings-placeholder">
      <p className="eyebrow">Excel Templates</p>
      <h3>Office workbook templates</h3>
      <p>These templates are copied and populated for each client packet. Both are required to generate Excel review documents.</p>
      <div className="settings-fields">
        <SettingsField
          label="1040 Template"
          value={settings.template_1040}
          onChange={(v) => onSettingsChange("template_1040", v)}
          placeholder="Path to 1040 .xlsx template"
          note="Required for Excel output"
          onBrowse={async () => {
            const path = await pickXlsxFile();
            if (path) onSettingsChange("template_1040", path);
          }}
        />
        <SettingsField
          label="DoubleCheck Template"
          value={settings.template_doublecheck}
          onChange={(v) => onSettingsChange("template_doublecheck", v)}
          placeholder="Path to DoubleCheck .xlsx template"
          note="Required for Excel output"
          onBrowse={async () => {
            const path = await pickXlsxFile();
            if (path) onSettingsChange("template_doublecheck", path);
          }}
        />
        <SettingsField
          label="Default Output Folder"
          value={settings.output_folder}
          onChange={(v) => onSettingsChange("output_folder", v)}
          placeholder="e.g. /Users/you/Desktop"
          note="Pre-fills the output folder on the main screen"
          onBrowse={async () => {
            const path = await pickFolder();
            if (path) onSettingsChange("output_folder", path);
          }}
        />
      </div>
      <SaveBar saved={settingsSaved} onSave={onSaveSettings} />
    </div>
  );
}

function BedrockPanel({ settings, settingsSaved, onSettingsChange, onSaveSettings }) {
  return (
    <div className="tab-panel active settings-placeholder">
      <p className="eyebrow">AWS / Bedrock</p>
      <h3>Inference settings</h3>
      <p>All LLM calls route through AWS Bedrock. Changes take effect on the next packet processed.</p>
      <div className="settings-fields">
        <SettingsField
          label="AWS Region"
          value={settings.aws_region}
          onChange={(v) => onSettingsChange("aws_region", v)}
          placeholder="us-east-1"
          note="Default: us-east-1"
        />
        <SettingsField
          label="AWS Profile"
          value={settings.aws_profile}
          onChange={(v) => onSettingsChange("aws_profile", v)}
          placeholder="Leave blank to use default credential chain"
          note="Optional — named profile from ~/.aws/credentials"
        />
        <SettingsField
          label="Bedrock Model ID"
          value={settings.bedrock_model_id}
          onChange={(v) => onSettingsChange("bedrock_model_id", v)}
          placeholder="us.anthropic.claude-sonnet-4-6"
          note="Default: us.anthropic.claude-sonnet-4-6"
        />
      </div>
      <SaveBar saved={settingsSaved} onSave={onSaveSettings} />
    </div>
  );
}

function BridgePanel({ bridgeState, onRunBridge }) {
  return (
    <div className="tab-panel active settings-placeholder bridge-panel">
      <p className="eyebrow">Diagnostics</p>
      <h3>Tauri Python bridge spike</h3>
      <p>
        This proves the desktop shell can invoke Python and stream progress
        before we connect the real tax pipeline.
      </p>
      <button className="button primary" type="button" disabled={bridgeState.running} onClick={onRunBridge}>
        {bridgeState.running ? "Running bridge..." : "Run Python Bridge Test"}
      </button>
      <div className="bridge-log" aria-label="Python bridge output">
        {bridgeState.lines.length ? (
          bridgeState.lines.map((line, index) => <code key={`${line}-${index}`}>{line}</code>)
        ) : (
          <code>No bridge output yet.</code>
        )}
      </div>
      {bridgeState.result ? <p className="support-note">{bridgeState.result}</p> : null}
    </div>
  );
}

function TreeRow({ item, onRenameFolder, onToggleFolder }) {
  return (
    <div className="tree-row">
      <span className="drag-handle" aria-hidden="true">⋮⋮</span>
      <span className={`row-type ${item.type.toLowerCase()}`}>{item.type}</span>
      <input type="text" value={item.value} onChange={(event) => onRenameFolder(item.id, event.target.value)} />
      {item.type === "Folder" ? (
        <label className="mini-toggle"><input type="checkbox" checked={item.create} onChange={(event) => onToggleFolder(item.id, event.target.checked)} /> create</label>
      ) : (
        <span className="row-note">{item.note}</span>
      )}
    </div>
  );
}

function PatternPanel() {
  return (
    <aside className="pattern-panel">
      <p className="eyebrow">Naming and destinations</p>
      <h3>Patterns staff should not have to remember</h3>
      <label><span>Client folder pattern</span><input type="text" defaultValue="{last}_{first}_{tax_year}" /></label>
      <label><span>Renamed PDF pattern</span><input type="text" defaultValue="{form_type}_{payer}_{tax_year}.pdf" /></label>
      <label><span>1040 workbook pattern</span><input type="text" defaultValue="{client_slug}_1040.xlsx" /></label>
      <label><span>DoubleCheck workbook pattern</span><input type="text" defaultValue="{client_slug}_DoubleCheck.xlsx" /></label>
      <div className="destination-rules"><div><span>Renamed PDFs</span><strong>SD/</strong></div><div><span>Excel workbooks</span><strong>Review/</strong></div><div><span>Packet logs</span><strong>Client root + logs/</strong></div></div>
      <p className="support-note">Internal app diagnostics stay in ~/.tax_processor/logs/app.log.</p>
    </aside>
  );
}
