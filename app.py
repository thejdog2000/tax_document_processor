"""
app.py — Tax Document Processor Desktop App
Drag-and-drop GUI for the accounting firm pipeline.
Requires: tkinterdnd2, boto3, openpyxl  (see requirements.txt)
"""
import os
import threading
import traceback
import tkinter as tk
from tkinter import filedialog, messagebox
from pathlib import Path

try:
    import tkinterdnd2 as tkdnd
except ModuleNotFoundError:
    tkdnd = None

from app_logging import configure_app_logging
from bedrock_client import DEFAULT_BEDROCK_MODEL_ID
from settings import Settings

# ─────────────────────────────────────────────────────────────────────────────
# Colors
# ─────────────────────────────────────────────────────────────────────────────
CLR_DARK   = "#1e2b3c"
CLR_ACCENT = "#2980b9"
CLR_GREEN  = "#27ae60"
CLR_WARN   = "#e67e22"
CLR_BG     = "#f5f6fa"
CLR_CARD   = "#ffffff"
CLR_TEXT   = "#2c3e50"
CLR_MUTED  = "#7f8c8d"
CLR_DROP   = "#eaf4fb"
CLR_DROPBORDER = "#aed6f1"
CLR_DROPOK = "#d5f5e3"
CLR_LOG_BG = "#1e1e2e"
CLR_LOG_FG = "#cdd6f4"

# ─────────────────────────────────────────────────────────────────────────────
# Settings dialog
# ─────────────────────────────────────────────────────────────────────────────
class SettingsDialog(tk.Toplevel):
    def __init__(self, parent, settings: Settings):
        super().__init__(parent)
        self.settings = settings
        self.title("Settings")
        self.geometry("620x390")
        self.resizable(False, False)
        self.configure(bg=CLR_BG)
        self.grab_set()
        self._build()

    def _build(self):
        tk.Label(self, text="Settings", font=("Segoe UI", 14, "bold"),
                 bg=CLR_BG, fg=CLR_TEXT).pack(pady=(18, 4))
        tk.Label(self, text="Changes are saved immediately and persist between sessions.",
                 font=("Segoe UI", 9), bg=CLR_BG, fg=CLR_MUTED).pack()

        frame = tk.Frame(self, bg=CLR_BG, padx=30, pady=12)
        frame.pack(fill="both", expand=True)

        def row(label, row_n, default_key, masked=False, browse=False, filetypes=None):
            tk.Label(frame, text=label, font=("Segoe UI", 10),
                     bg=CLR_BG, fg=CLR_TEXT, anchor="w").grid(
                row=row_n, column=0, sticky="w", pady=5)
            var = tk.StringVar(value=self.settings.get(default_key, ""))
            entry = tk.Entry(frame, textvariable=var, width=38,
                             font=("Segoe UI", 10), show="*" if masked else "")
            entry.grid(row=row_n, column=1, padx=(10, 4), sticky="w")
            if browse:
                def _browse(e=entry, ft=filetypes):
                    path = filedialog.askopenfilename(filetypes=ft or [("Excel", "*.xlsx")])
                    if path:
                        e.delete(0, "end")
                        e.insert(0, path)
                tk.Button(frame, text="Browse…", font=("Segoe UI", 9),
                          command=_browse, bg=CLR_ACCENT, fg="white",
                          relief="flat", padx=8).grid(row=row_n, column=2, padx=2)
            return var

        self._v_region = row("AWS Region", 0, "aws_region")
        if not self._v_region.get():
            self._v_region.set("us-east-1")
        self._v_profile = row("AWS Profile (optional)", 1, "aws_profile")
        self._v_model = row("Bedrock Model ID", 2, "bedrock_model_id")
        if not self._v_model.get():
            self._v_model.set(DEFAULT_BEDROCK_MODEL_ID)
        self._v_1040 = row("1040 Template (.xlsx)", 3, "template_1040", browse=True)
        self._v_dc   = row("DoubleCheck Template (.xlsx)", 4, "template_doublecheck", browse=True)
        self._v_out  = row("Default Output Folder", 5, "output_folder", browse=False)

        # Output browse is a folder, not a file
        def _browse_out():
            folder = filedialog.askdirectory()
            if folder:
                self._v_out.set(folder)
        tk.Button(frame, text="Browse…", font=("Segoe UI", 9),
                  command=_browse_out, bg=CLR_ACCENT, fg="white",
                  relief="flat", padx=8).grid(row=5, column=2, padx=2)

        tk.Button(self, text="Save & Close", font=("Segoe UI", 11, "bold"),
                  bg=CLR_GREEN, fg="white", relief="flat", padx=20, pady=6,
                  command=self._save).pack(pady=12)

    def _save(self):
        self.settings.set("aws_region", self._v_region.get().strip() or "us-east-1")
        self.settings.set("aws_profile", self._v_profile.get().strip())
        self.settings.set("bedrock_model_id", self._v_model.get().strip())
        self.settings.set("template_1040", self._v_1040.get().strip())
        self.settings.set("template_doublecheck", self._v_dc.get().strip())
        self.settings.set("output_folder", self._v_out.get().strip())
        self.settings.save()
        self.destroy()


# ─────────────────────────────────────────────────────────────────────────────
# Main application window
# ─────────────────────────────────────────────────────────────────────────────
class TaxProcessorApp((tkdnd.Tk if tkdnd else tk.Tk)):
    def __init__(self):
        super().__init__()
        self.title("Tax Document Processor — 2025")
        self.geometry("800x760")
        self.resizable(False, False)
        self.configure(bg=CLR_BG)

        self.app_logger = configure_app_logging()
        self.app_logger.info("Tax Document Processor UI started")
        self.settings = Settings()
        self.dropped_files: list[str] = []

        self._build_header()
        self._build_workflow_status()
        self._build_drop_zone()
        self._build_client_fields()
        self._build_output_row()
        self._build_process_button()
        self._build_log()

        if not self.settings.get("template_1040") or not self.settings.get("template_doublecheck"):
            self.after(300, self._first_run)

    # ── UI construction ───────────────────────────────────────────────────────
    def _build_header(self):
        bar = tk.Frame(self, bg=CLR_DARK, height=54)
        bar.pack(fill="x")
        bar.pack_propagate(False)

        tk.Label(bar, text="⚙ Tax Document Processor",
                 font=("Segoe UI", 14, "bold"),
                 bg=CLR_DARK, fg="white").pack(side="left", padx=20)

        tk.Label(bar, text="2025 Tax Year",
                 font=("Segoe UI", 10),
                 bg=CLR_DARK, fg="#7fb3d3").pack(side="left", padx=6)

        tk.Button(bar, text="⚙ Settings",
                  font=("Segoe UI", 9),
                  bg="#2c3e50", fg="white", relief="flat", padx=12, pady=6,
                  cursor="hand2",
                  command=self._open_settings).pack(side="right", padx=14)

    def _build_workflow_status(self):
        outer = tk.Frame(self, bg=CLR_BG, padx=22)
        outer.pack(fill="x", pady=(14, 0))

        self.file_status_var = tk.StringVar(value="No PDFs selected")
        self.client_status_var = tk.StringVar(value="Client name optional")
        self.review_status_var = tk.StringVar(value="Reviewer mode coming soon")

        self._status_card(
            outer,
            "1. Packet",
            self.file_status_var,
            CLR_DROP,
            0,
        )
        self._status_card(
            outer,
            "2. Client",
            self.client_status_var,
            CLR_CARD,
            1,
        )
        review_card = self._status_card(
            outer,
            "3. Review",
            self.review_status_var,
            CLR_CARD,
            2,
        )
        tk.Label(
            review_card,
            text="Unavailable in this build",
            font=("Segoe UI", 9, "bold"),
            bg=CLR_CARD,
            fg=CLR_MUTED,
        ).pack(anchor="w", pady=(8, 0))

    def _status_card(self, parent, title, text_var, bg, col):
        card = tk.Frame(parent, bg=bg, bd=1, relief="solid", padx=12, pady=9)
        card.grid(row=0, column=col, sticky="nsew", padx=(0, 10 if col < 2 else 0))
        parent.grid_columnconfigure(col, weight=1, uniform="status")

        tk.Label(card, text=title,
                 font=("Segoe UI", 9, "bold"),
                 bg=bg, fg=CLR_TEXT).pack(anchor="w")
        tk.Label(card, textvariable=text_var,
                 font=("Segoe UI", 9),
                 bg=bg, fg=CLR_MUTED,
                 wraplength=210, justify="left").pack(anchor="w", pady=(4, 0))
        return card

    def _build_drop_zone(self):
        outer = tk.Frame(self, bg=CLR_BG, padx=22, pady=12)
        outer.pack(fill="x")

        self.drop_zone = tk.Label(
            outer,
            text="📄   Drop PDF files here\n\nor click to browse",
            font=("Segoe UI", 12),
            bg=CLR_DROP,
            fg=CLR_ACCENT,
            relief="groove",
            height=5,
            cursor="hand2",
        )
        self.drop_zone.pack(fill="x")
        if tkdnd:
            self.drop_zone.drop_target_register(tkdnd.DND_FILES)
            self.drop_zone.dnd_bind("<<Drop>>", self._on_drop)
        self.drop_zone.bind("<Button-1>", self._browse_files)

        label = "No files selected"
        if not tkdnd:
            label += " — drag/drop unavailable; click to browse"
        self.file_label_var = tk.StringVar(value=label)
        tk.Label(outer, textvariable=self.file_label_var,
                 font=("Segoe UI", 9), bg=CLR_BG, fg=CLR_MUTED).pack(anchor="w", pady=(4, 0))

    def _build_client_fields(self):
        card = tk.Frame(self, bg=CLR_CARD, padx=22, pady=12,
                        relief="flat", bd=1)
        card.pack(fill="x", padx=22)

        tk.Label(card, text="Client Information",
                 font=("Segoe UI", 10, "bold"),
                 bg=CLR_CARD, fg=CLR_TEXT).grid(row=0, column=0,
                 columnspan=4, sticky="w", pady=(0, 8))
        tk.Label(card, text="Optional — leave blank if the packet should be labeled Client_2025.",
                 font=("Segoe UI", 9),
                 bg=CLR_CARD, fg=CLR_MUTED).grid(row=1, column=0,
                 columnspan=4, sticky="w", pady=(0, 8))

        def field(label, row, col):
            tk.Label(card, text=label, font=("Segoe UI", 10),
                     bg=CLR_CARD, fg=CLR_TEXT).grid(row=row, column=col, sticky="w", padx=(0, 6))
            e = tk.Entry(card, font=("Segoe UI", 10), width=22,
                         relief="solid", bd=1)
            e.grid(row=row, column=col + 1, padx=(0, 20), sticky="w")
            return e

        self.last_name  = field("Last Name:",  2, 0)
        self.first_name = field("First Name:", 2, 2)
        tk.Label(card, text="Tax Year:",
                 font=("Segoe UI", 10),
                 bg=CLR_CARD, fg=CLR_TEXT).grid(row=3, column=0, sticky="w", padx=(0, 6), pady=(10, 0))
        self.tax_year_var = tk.StringVar(value="2025")
        tk.Entry(card, textvariable=self.tax_year_var,
                 font=("Segoe UI", 10), width=22,
                 relief="solid", bd=1, state="readonly").grid(
                     row=3, column=1, padx=(0, 20), sticky="w", pady=(10, 0))
        self.last_name.bind("<KeyRelease>", self._refresh_workflow_state)
        self.first_name.bind("<KeyRelease>", self._refresh_workflow_state)

    def _build_output_row(self):
        outer = tk.Frame(self, bg=CLR_BG, padx=22, pady=8)
        outer.pack(fill="x")

        row = tk.Frame(outer, bg=CLR_BG)
        row.pack(fill="x")

        tk.Label(row, text="Output Folder:", font=("Segoe UI", 10),
                 bg=CLR_BG, fg=CLR_TEXT).pack(side="left")

        default_out = self.settings.get("output_folder",
                                        str(Path.home() / "Desktop"))
        self.output_var = tk.StringVar(value=default_out)
        tk.Entry(row, textvariable=self.output_var,
                 font=("Segoe UI", 9), width=42,
                 relief="solid", bd=1).pack(side="left", padx=(8, 6))

        tk.Button(row, text="Browse…", font=("Segoe UI", 9),
                  bg=CLR_ACCENT, fg="white", relief="flat", padx=8,
                  command=self._browse_output).pack(side="left")

        self.generate_excel_var = tk.BooleanVar(value=True)
        tk.Checkbutton(
            outer,
            text="Generate Excel review documents",
            variable=self.generate_excel_var,
            font=("Segoe UI", 10),
            bg=CLR_BG,
            fg=CLR_TEXT,
            activebackground=CLR_BG,
            anchor="w",
        ).pack(anchor="w", pady=(8, 0))

    def _build_process_button(self):
        btn_frame = tk.Frame(self, bg=CLR_BG)
        btn_frame.pack(pady=10)

        self.process_btn = tk.Button(
            btn_frame,
            text="▶   Process Documents",
            font=("Segoe UI", 13, "bold"),
            bg=CLR_GREEN, fg="white",
            relief="flat", padx=30, pady=10,
            cursor="hand2",
            command=self._start_processing,
        )
        self.process_btn.pack()

    def _build_log(self):
        log_outer = tk.Frame(self, bg=CLR_BG, padx=22, pady=2)
        log_outer.pack(fill="both", expand=True)

        tk.Label(log_outer, text="Processing Log",
                 font=("Segoe UI", 9, "bold"),
                 bg=CLR_BG, fg=CLR_MUTED).pack(anchor="w")

        text_frame = tk.Frame(log_outer, bg=CLR_LOG_BG)
        text_frame.pack(fill="both", expand=True)

        scrollbar = tk.Scrollbar(text_frame)
        scrollbar.pack(side="right", fill="y")

        self.log_text = tk.Text(
            text_frame,
            font=("Cascadia Mono", 9) if os.name == "nt" else ("Courier", 9),
            bg=CLR_LOG_BG, fg=CLR_LOG_FG,
            relief="flat",
            state="disabled",
            yscrollcommand=scrollbar.set,
            wrap="word",
        )
        self.log_text.pack(fill="both", expand=True, padx=4, pady=4)
        scrollbar.config(command=self.log_text.yview)

        # Status bar
        self.status_var = tk.StringVar(value="Ready")
        tk.Label(self, textvariable=self.status_var,
                 font=("Segoe UI", 9), bg=CLR_DARK, fg="#aaa",
                 anchor="w", padx=12).pack(fill="x", side="bottom")

    # ── Event handlers ────────────────────────────────────────────────────────
    def _first_run(self):
        messagebox.showinfo(
            "Welcome to Tax Document Processor",
            "Before you begin, please go to Settings and enter:\n\n"
            "  • AWS Bedrock region/profile if needed\n"
            "  • Path to your 1040 Excel template\n"
            "  • Path to your DoubleCheck Excel template\n\n"
            "AWS credentials are resolved through your normal AWS configuration.\n\n"
            "The Settings window will open now."
        )
        self._open_settings()

    def _open_settings(self):
        SettingsDialog(self, self.settings)

    def _on_drop(self, event):
        files = self.tk.splitlist(event.data)
        pdfs = [f for f in files if f.lower().endswith(".pdf")]
        non_pdfs = [f for f in files if not f.lower().endswith(".pdf")]
        if non_pdfs:
            messagebox.showwarning(
                "Non-PDF Files",
                f"Only PDF files are accepted.\nSkipped: {len(non_pdfs)} non-PDF file(s)."
            )
        if pdfs:
            self.dropped_files = pdfs
            self._refresh_drop_zone()
            self._refresh_workflow_state()

    def _browse_files(self, _event=None):
        files = filedialog.askopenfilenames(
            title="Select PDF tax documents",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
        )
        if files:
            self.dropped_files = list(files)
            self._refresh_drop_zone()
            self._refresh_workflow_state()

    def _refresh_drop_zone(self):
        n = len(self.dropped_files)
        names = [Path(f).name for f in self.dropped_files]
        if n == 0:
            label = "No files selected"
            if not tkdnd:
                label += " — drag/drop unavailable; click to browse"
            self.drop_zone.config(
                text=("📄   Drop PDF files here\n\nor click to browse" if tkdnd
                      else "📄   Click to browse PDF files"),
                bg=CLR_DROP, fg=CLR_ACCENT
            )
            self.file_label_var.set(label)
            self.file_status_var.set("No PDFs selected")
        else:
            display = ", ".join(names[:4])
            if n > 4:
                display += f" … +{n - 4} more"
            self.drop_zone.config(
                text=f"✓   {n} PDF{'s' if n > 1 else ''} ready\n\nClick to change selection",
                bg=CLR_DROPOK, fg="#1e8449"
            )
            self.file_label_var.set(display)
            self.file_status_var.set(f"{n} PDF{'s' if n > 1 else ''} ready")

    def _browse_output(self):
        folder = filedialog.askdirectory(title="Select output folder")
        if folder:
            self.output_var.set(folder)
            self.settings.set("output_folder", folder)
            self.settings.save()

    def _start_processing(self):
        # Validate inputs
        if not self.dropped_files:
            messagebox.showwarning("No Files", "Please add PDF files first.")
            return
        last = self.last_name.get().strip()
        # Lock UI
        self.process_btn.config(state="disabled", text="⏳  Processing…")
        self.status_var.set("Running pipeline…")
        self.review_status_var.set("Reviewer mode coming soon")
        self._clear_log()

        first = self.first_name.get().strip()
        threading.Thread(target=self._run_pipeline,
                         args=(self.dropped_files[:], last, first),
                         daemon=True).start()

    def _run_pipeline(self, pdfs, last_name, first_name):
        try:
            from pipeline import TaxPipeline

            self.app_logger.info(
                "Starting packet processing: pdf_count=%s output_folder=%s generate_excel=%s",
                len(pdfs),
                self.output_var.get(),
                self.generate_excel_var.get(),
            )
            pipeline = TaxPipeline(
                api_key=self.settings.get("api_key", ""),
                template_1040=self.settings.get("template_1040"),
                template_doublecheck=self.settings.get("template_doublecheck"),
                output_folder=self.output_var.get(),
                log_callback=self._append_log,
                aws_region=self.settings.get("aws_region", "us-east-1"),
                aws_profile=self.settings.get("aws_profile", ""),
                bedrock_model_id=self.settings.get("bedrock_model_id", ""),
                generate_excel_review=self.generate_excel_var.get(),
            )
            pipeline.run(
                pdf_paths=pdfs,
                last_name=last_name,
                first_name=first_name,
            )
            self.app_logger.info("Packet processing completed")
            self.after(0, self._finish_processing)
        except Exception as exc:
            msg = str(exc)
            self.app_logger.error(
                "Packet processing failed: %s\n%s",
                msg,
                traceback.format_exc(),
            )
            self._append_log(f"\n❌ FATAL ERROR: {msg}")
            self.after(0, lambda: self.status_var.set(f"❌  Error — {msg[:60]}"))
            self.after(0, lambda: self.review_status_var.set("Reviewer mode coming soon"))
            self.after(0, lambda: messagebox.showerror("Processing Error", msg))
        finally:
            self.after(0, lambda: self.process_btn.config(
                state="normal", text="▶   Process Documents"))

    def _finish_processing(self):
        self.review_status_var.set("Reviewer mode coming soon")
        self.status_var.set("✅  Complete — package ready")
        messagebox.showinfo(
            "Complete",
            f"Processing complete!\n\n"
            f"Output folder:\n{self.output_var.get()}"
        )

    def _refresh_workflow_state(self, _event=None):
        last = self.last_name.get().strip()
        first = self.first_name.get().strip()
        if last and first:
            self.client_status_var.set(f"{last}, {first}")
        elif last:
            self.client_status_var.set(f"{last} packet")
        else:
            self.client_status_var.set("Client name optional")

    # ── Log helpers ───────────────────────────────────────────────────────────
    def _append_log(self, message: str):
        def _do():
            self.log_text.config(state="normal")
            self.log_text.insert("end", message + "\n")
            self.log_text.see("end")
            self.log_text.config(state="disabled")
        self.after(0, _do)

    def _clear_log(self):
        self.log_text.config(state="normal")
        self.log_text.delete(1.0, "end")
        self.log_text.config(state="disabled")


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app = TaxProcessorApp()
    app.mainloop()
