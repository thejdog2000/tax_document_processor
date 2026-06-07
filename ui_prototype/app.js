const state = {
  files: [],
  firstName: "",
  lastName: "",
  outputFolder: "~/Desktop",
  generateExcel: true,
  processing: false,
  completed: false,
};

const formTypes = ["W-2", "1099-INT", "1099-DIV", "1099-R", "Organizer", "Notes"];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const els = {
  dropZone: $("#dropZone"),
  dropTitle: $("#dropTitle"),
  dropCopy: $("#dropCopy"),
  chooseFilesButton: $("#chooseFilesButton"),
  fileInput: $("#fileInput"),
  packetStrip: $("#packetStrip"),
  packetStatusTitle: $("#packetStatusTitle"),
  packetStatusCopy: $("#packetStatusCopy"),
  clientStatusTitle: $("#clientStatusTitle"),
  clientStatusCopy: $("#clientStatusCopy"),
  firstNameInput: $("#firstNameInput"),
  lastNameInput: $("#lastNameInput"),
  outputFolderInput: $("#outputFolderInput"),
  browseButton: $("#browseButton"),
  excelToggle: $("#excelToggle"),
  processButton: $("#processButton"),
  outputPreviewTitle: $("#outputPreviewTitle"),
  outputPreviewList: $("#outputPreviewList"),
  reviewPanel: $("#reviewPanel"),
  reviewPanelTitle: $("#reviewPanelTitle"),
  reviewPanelCopy: $("#reviewPanelCopy"),
  addFolderButton: $("#addFolderButton"),
  restoreDefaultsButton: $("#restoreDefaultsButton"),
};

function clientSlug() {
  const parts = [state.lastName, state.firstName]
    .map((part) => part.trim())
    .filter(Boolean);
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

function setFiles(files) {
  state.files = files.filter((file) => file.name.toLowerCase().endsWith(".pdf"));
  state.completed = false;
  render();
}

function renderPacketStrip() {
  if (!state.files.length) {
    els.packetStrip.innerHTML = `
      <div class="packet-pill muted">W-2</div>
      <div class="packet-pill muted">1099-INT</div>
      <div class="packet-pill muted">1099-DIV</div>
      <div class="packet-pill muted">Organizer</div>
      <div class="packet-pill ghost">waiting</div>
    `;
    return;
  }

  const visible = state.files.slice(0, 5).map((file, index) => {
    const type = guessedFormType(file, index);
    return `<div class="packet-pill">${type}</div>`;
  });
  if (state.files.length > 5) {
    visible.push(`<div class="packet-pill ghost">+${state.files.length - 5} more</div>`);
  }
  els.packetStrip.innerHTML = visible.join("");
}

function renderOutputPreview() {
  const slug = clientSlug();
  els.outputPreviewTitle.textContent = `${slug}/ output preview`;

  const items = [
    ["SD/", `${state.files.length || "No"} renamed source PDFs`],
    ["Review/", state.generateExcel ? "Excel workbooks enabled" : "Excel workbooks disabled"],
    ["Return/", "created empty"],
    ["Signature Pages/", "created empty"],
    ["logs/", "versioned packet logs"],
    ["document_log_latest.txt", "staff packet log"],
  ];

  els.outputPreviewList.innerHTML = items
    .map(([label, note]) => `<li><span>${label}</span><small>${note}</small></li>`)
    .join("");
}

function renderStatus() {
  if (state.processing) {
    els.packetStatusTitle.textContent = "Processing packet";
    els.packetStatusCopy.textContent = "Reading PDFs, renaming files, and preparing output.";
    els.dropTitle.textContent = "Processing documents";
    els.dropCopy.textContent = "This prototype simulates progress; backend hookup comes next.";
    els.processButton.textContent = "Processing...";
    els.processButton.disabled = true;
    els.reviewPanel.classList.add("review-alert");
    els.reviewPanelTitle.textContent = "Review queue warming up";
    els.reviewPanelCopy.textContent = "Future low-confidence findings will route here after extraction.";
    return;
  }

  if (state.completed) {
    els.packetStatusTitle.textContent = "Packet simulated";
    els.packetStatusCopy.textContent = `${state.files.length} PDF${state.files.length === 1 ? "" : "s"} ready for backend processing.`;
    els.dropTitle.textContent = "Output preview ready";
    els.dropCopy.textContent = "The real pipeline bridge will use this same intake state.";
    els.processButton.textContent = "Process Documents";
    els.processButton.disabled = false;
    els.reviewPanel.classList.add("review-alert");
    els.reviewPanelTitle.textContent = "2 items would need review";
    els.reviewPanelCopy.textContent = "Example future state: low confidence on payer name and one validation flag. Correction workflow is not built yet.";
    return;
  }

  els.reviewPanel.classList.remove("review-alert");
  els.processButton.textContent = "Process Documents";
  els.processButton.disabled = state.files.length === 0;

  if (state.files.length) {
    els.packetStatusTitle.textContent = `${state.files.length} PDF${state.files.length === 1 ? "" : "s"} selected`;
    els.packetStatusCopy.textContent = "Ready to create the client folder and packet logs.";
    els.dropTitle.textContent = `${state.files.length} document${state.files.length === 1 ? "" : "s"} ready`;
    els.dropCopy.textContent = "Click choose PDFs again to replace the selected packet.";
  } else {
    els.packetStatusTitle.textContent = "Waiting for PDFs";
    els.packetStatusCopy.textContent = "Add source documents to enable processing.";
    els.dropTitle.textContent = "No documents selected";
    els.dropCopy.textContent = "Drop W-2s, 1099s, organizers, notes, and supporting PDFs here.";
  }

  els.reviewPanelTitle.textContent = "Nothing to review yet";
  els.reviewPanelCopy.textContent = "Once backend correction exists, fields below the confidence threshold and validation-flagged items will appear here with evidence snippets.";
}

function renderClient() {
  state.lastName = els.lastNameInput.value;
  state.firstName = els.firstNameInput.value;
  state.outputFolder = els.outputFolderInput.value;
  state.generateExcel = els.excelToggle.checked;

  const slug = clientSlug();
  if (state.lastName && state.firstName) {
    els.clientStatusTitle.textContent = `${state.lastName}, ${state.firstName}`;
    els.clientStatusCopy.textContent = `Output folder will create ${slug}.`;
  } else if (state.lastName || state.firstName) {
    els.clientStatusTitle.textContent = `${state.lastName || state.firstName} packet`;
    els.clientStatusCopy.textContent = `Output folder will create ${slug}.`;
  } else {
    els.clientStatusTitle.textContent = "Name optional";
    els.clientStatusCopy.textContent = "Blank names create Client_2025.";
  }
}

function render() {
  renderClient();
  renderPacketStrip();
  renderOutputPreview();
  renderStatus();
}

function simulateProcessing() {
  if (!state.files.length || state.processing) return;
  state.processing = true;
  state.completed = false;
  render();

  window.setTimeout(() => {
    state.processing = false;
    state.completed = true;
    render();
  }, 1200);
}

function activateTab(tabName) {
  $$(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });
  $$(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  });
}

function addFolderRow() {
  const rows = $(".tree-list");
  const row = document.createElement("div");
  row.className = "tree-row new-row";
  row.innerHTML = `
    <span class="drag-handle" aria-hidden="true">⋮⋮</span>
    <span class="row-type folder">Folder</span>
    <input type="text" value="New Folder">
    <label class="mini-toggle"><input type="checkbox" checked> create</label>
  `;
  rows.insertBefore(row, rows.querySelector(".tree-row:nth-last-child(2)"));
  row.querySelector("input").focus();
}

function restoreDefaults() {
  $$(".tree-row.new-row").forEach((row) => row.remove());
  $$(".tree-row input[type='text']").forEach((input) => {
    input.value = input.defaultValue;
  });
  $$(".tree-row input[type='checkbox']").forEach((input) => {
    input.checked = true;
  });
}

els.chooseFilesButton.addEventListener("click", () => els.fileInput.click());
els.fileInput.addEventListener("change", (event) => setFiles(Array.from(event.target.files)));
els.processButton.addEventListener("click", simulateProcessing);
els.browseButton.addEventListener("click", () => {
  els.outputFolderInput.focus();
  els.outputFolderInput.select();
});
els.addFolderButton.addEventListener("click", addFolderRow);
els.restoreDefaultsButton.addEventListener("click", restoreDefaults);

[els.firstNameInput, els.lastNameInput, els.outputFolderInput, els.excelToggle].forEach((input) => {
  input.addEventListener("input", () => {
    state.completed = false;
    render();
  });
  input.addEventListener("change", () => {
    state.completed = false;
    render();
  });
});

els.dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  els.dropZone.classList.add("is-dragging");
});

els.dropZone.addEventListener("dragleave", () => {
  els.dropZone.classList.remove("is-dragging");
});

els.dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  els.dropZone.classList.remove("is-dragging");
  setFiles(Array.from(event.dataTransfer.files));
});

$$(".tab").forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
});

render();
