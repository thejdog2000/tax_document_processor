import { useState } from "react";

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
  const [files, setFiles] = useState([]);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [outputFolder, setOutputFolder] = useState("~/Desktop");
  const [generateExcel, setGenerateExcel] = useState(true);
  const [processingState, setProcessingState] = useState("idle");
  const [activeTab, setActiveTab] = useState("organization");
  const [folders, setFolders] = useState(defaultFolders);
  const [dragging, setDragging] = useState(false);

  const slug = clientSlug(lastName, firstName);
  const hasFiles = files.length > 0;
  const isProcessing = processingState === "processing";
  const isComplete = processingState === "complete";

  function selectFiles(fileList) {
    const pdfs = Array.from(fileList).filter((file) => file.name.toLowerCase().endsWith(".pdf"));
    setFiles(pdfs);
    setProcessingState("idle");
  }

  function simulateProcessing() {
    if (!hasFiles || isProcessing) return;
    setProcessingState("processing");
    window.setTimeout(() => setProcessingState("complete"), 1200);
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
            onProcess={simulateProcessing}
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
            folders={folders}
            onActiveTab={setActiveTab}
            onAddFolder={addFolder}
            onRestoreDefaults={restoreDefaults}
            onRenameFolder={(id, value) => {
              setFolders((current) => current.map((item) => (item.id === id ? { ...item, value } : item)));
            }}
            onToggleFolder={(id, create) => {
              setFolders((current) => current.map((item) => (item.id === id ? { ...item, create } : item)));
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

function HeroCard({ files, hasFiles, isProcessing, isComplete, dragging, onSelectFiles, onDragState }) {
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

      <label
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
        <input type="file" accept="application/pdf,.pdf" multiple hidden onChange={(event) => onSelectFiles(event.target.files)} />
        <div className="paper-stack" aria-hidden="true"><span /><span /><strong>PDF</strong></div>
        <div>
          <p className="drop-title">{title}</p>
          <p className="drop-copy">{copy}</p>
          <span className="button secondary">Choose PDFs</span>
        </div>
      </label>
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

function ConfigShell({ activeTab, folders, onActiveTab, onAddFolder, onRestoreDefaults, onRenameFolder, onToggleFolder }) {
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
      ) : (
        <div className="tab-panel active settings-placeholder">
          <p className="eyebrow">{tabs.find(([id]) => id === activeTab)?.[1]}</p>
          <h3>{activeTab === "templates" ? "Template management will live here." : activeTab === "bedrock" ? "Admin-only model and region settings." : "Support logs stay outside client output."}</h3>
          <p>{activeTab === "templates" ? "Future implementation should map office-approved workbook templates to generated review documents." : activeTab === "bedrock" ? "Keep Sonnet as default and route inference through Bedrock only." : "Internal diagnostics belong in ~/.tax_processor/logs/app.log."}</p>
        </div>
      )}
    </section>
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
