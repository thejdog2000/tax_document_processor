# Suggested New Extraction Pipeline

## Purpose

This document describes a future spike for validating whether the tax document
processor should move from an AI-first extraction path to a hybrid pipeline that
uses deterministic parsing, OCR, and AI together.

The goal is not to replace the current Bedrock/Sonnet pipeline immediately. The
goal is to give a future AI engineer enough context to design, benchmark, and
implement a safer, cheaper, and more consistent extraction path in a separate
branch.

## Current Pipeline Summary

The current pipeline is mostly AI-first:

1. User selects tax document PDFs in the desktop app.
2. `pipeline.py` tries to extract a digital text layer with `pdfplumber`.
3. If text exists, the extracted text is sent to AWS Bedrock/Sonnet.
4. If text does not exist, the PDF is base64 encoded and sent to Bedrock/Sonnet.
5. Sonnet classifies the document, extracts tax fields, returns JSON, and may
   provide `field_metadata` with confidence/evidence.
6. Python logic normalizes the model output, applies some validation and open
   item rules, renames files, populates Excel workbooks, and writes packet logs.

Current strength:
- Flexible across messy tax packets and unusual issuer layouts.
- Good for client notes, organizers, consolidated brokerage statements, and
  scanned documents.

Current weakness:
- Sonnet is being used for nearly every semantic extraction decision.
- Cost and latency are tied to model calls even for simple predictable forms.
- Model output can vary even when the source document is standard.
- Validation rules are partly prompt-driven when they should increasingly be
  owned by deterministic application logic.

## Is Textract Paid?

Yes. Amazon Textract is a paid AWS service outside its free tier. AWS prices it
per page, and the cost depends on which API/features are used.

Examples from AWS pricing documentation as of this writing:
- Detect Document Text OCR example: `$0.0015` per page for the first one million
  pages in US West (Oregon).
- Analyze Document with Tables example: `$0.015` per page.
- Analyze Document with Forms example: `$0.05` per page.
- Analyze Expense example: `$0.01` per page.

AWS also lists a limited free tier for new customers, including free monthly
page counts for Detect Document Text, Analyze Document, Analyze Expense, Analyze
ID, and Analyze Lending during the free-tier period.

Pricing must be rechecked during the spike because AWS pricing, regions, and
free-tier details can change.

References:
- https://aws.amazon.com/textract/pricing/
- https://docs.aws.amazon.com/textract/latest/APIReference/API_AnalyzeDocument.html
- https://docs.aws.amazon.com/textract/latest/APIReference/API_AnalyzeExpense.html
- https://aws.amazon.com/bedrock/pricing/

## Recommended Future Pipeline

Use a tiered extraction pipeline:

```text
input files
  -> normalize PDFs/images
  -> extract digital text or OCR text/layout
  -> classify document type
  -> deterministic parser for high-confidence standard forms
  -> Sonnet for complex, uncertain, or low-confidence documents
  -> deterministic validation and cross-document checks
  -> reviewer queue for low-confidence/conflicting fields
  -> Excel population and packet output
```

## Proposed Stages

### 1. File Intake and Normalization

Support:
- PDF
- JPEG
- PNG
- TIFF, if easy to support through the OCR provider

Responsibilities:
- Identify file type.
- Normalize images and PDFs into a consistent internal document representation.
- Track original filename, page count, document type guess, and source path.
- Preserve originals for the client packet.

Questions for spike:
- Should JPEG/PNG files be converted to PDF internally, or sent directly to OCR?
- Should the pipeline accept multi-image packets or one document per image?

### 2. Text and Layout Extraction

Use the cheapest reliable extraction method first:

- Digital PDFs: use `pdfplumber` for text layer extraction.
- Scanned PDFs/images: test AWS Textract or another OCR provider.
- Keep OCR confidence, page number, and geometry where available.

Responsibilities:
- Return text lines, key-value pairs, tables, page numbers, confidence scores,
  and bounding boxes when available.
- Avoid sending full document images to Sonnet when high-confidence text/layout
  is already available.

Questions for spike:
- Is Textract accurate enough on W-2, 1099, and 1098 documents?
- Is Textract cheaper than sending the same documents to Sonnet?
- Which Textract API is best for tax forms: Detect Document Text, Analyze
  Document Forms/Tables, or Queries?

### 3. Form Classification

Classify common form types before using AI when possible.

Deterministic signals:
- Presence of strings like `Form W-2`, `1099-INT`, `1099-DIV`, `1099-R`,
  `1098`, `SSA-1099`.
- Known tax form title locations.
- Known box labels.
- Filename hints as weak evidence only.

Use Sonnet when:
- The form type is unclear.
- Multiple form types appear in one document.
- The document is a client organizer, notes page, or consolidated brokerage
  packet.

### 4. Deterministic Field Extraction

Start with parsers for the highest-volume, most structured forms:

- W-2
- 1099-INT
- 1099-DIV
- 1099-NEC
- 1099-R
- 1098

Good deterministic targets:
- Tax year
- Payer/employer name
- Taxpayer name
- Box-numbered amounts
- Federal withholding
- State wages/withholding
- Distribution codes
- Mortgage interest/property tax fields

Use deterministic extraction only when:
- The form type is confidently known.
- Expected labels are present.
- OCR/text confidence is above the selected threshold.
- Extracted numeric values pass basic sanity checks.

Use Sonnet when:
- Required labels are missing.
- Values conflict.
- Tables are fragmented or poorly OCRed.
- The form is complex, multi-page, or consolidated.

### 5. AI Extraction and Verification

Use Sonnet for:
- Consolidated 1099 packets.
- Brokerage statements.
- Client notes and organizers.
- Low-confidence OCR results.
- Documents that fail deterministic extraction.
- Evidence snippet generation when deterministic OCR cannot provide it cleanly.

Important rule:
- Sonnet confidence should be treated as a review-routing heuristic, not as
  statistical truth.

Required model output:
- Existing scalar fields must remain compatible with `pipeline.py`.
- `field_metadata` should include confidence, evidence, page, and optional notes.
- Evidence should be copied from the document text/OCR where possible.

### 6. Deterministic Validation

Move as many validation rules as possible out of the prompt and into Python.

Examples:
- Tax year mismatch.
- W-2 Social Security tax math.
- W-2 Medicare tax math.
- 401k deferral limits.
- 1099-R taxable amount greater than gross distribution.
- TN state withholding rule.
- Missing required fields.
- Cross-document taxpayer/spouse conflicts.
- Duplicate interest from client notes and 1099-INT.

The model may still suggest validation flags, but application code should own
final validation decisions.

### 7. Reviewer Queue

Route fields or documents to human review when:
- OCR confidence is below threshold.
- Sonnet confidence is below `90`.
- Evidence is missing or weak.
- Deterministic validation fails.
- Required fields are missing.
- Cross-document values conflict.
- The document was parsed by AI after deterministic extraction failed.

Reviewer UI should show:
- Source document.
- Field name.
- Extracted value.
- Confidence score.
- Evidence snippet.
- Page number.
- Original parser source: deterministic, OCR, Sonnet, or mixed.
- Quick correction input.

### 8. Excel Population and Output

Keep workbook population deterministic.

Responsibilities:
- Read normalized extracted data.
- Apply corrected reviewer values when present.
- Populate 1040 and DoubleCheck templates.
- Write document logs, review metadata, and output package.

Do not let workbook population depend directly on OCR or model response shape.
It should depend on a stable normalized extraction schema.

## Suggested Architecture

Introduce a small extraction layer between `pipeline.py` and Bedrock:

```text
pipeline.py
  -> extraction_orchestrator.py
       -> document_loader.py
       -> text_layer_extractor.py
       -> ocr_provider.py
       -> form_classifier.py
       -> deterministic_parsers/
       -> bedrock_ai_extractor.py
       -> extraction_validator.py
```

The spike should not necessarily implement all files above. This is the target
shape to evaluate.

## Spike Validation Plan

### Test Set

Create or collect a representative golden set:

- Clean digital W-2.
- Scanned W-2.
- 1099-INT.
- 1099-DIV.
- 1099-R.
- 1098.
- Consolidated brokerage 1099.
- Client organizer/notes.
- Prior-year mismatch.
- Poor image quality document.
- Multi-document packet with taxpayer/spouse ambiguity.

### Metrics

Measure:
- Extraction accuracy by field.
- Required-field miss rate.
- False confidence rate.
- Reviewer queue volume.
- Average processing time per packet.
- Cost per packet.
- Failure rate by file type.
- Number of Sonnet calls avoided.

### Comparisons

Compare at least these pipelines:

1. Current Sonnet-first path.
2. `pdfplumber` text layer plus deterministic parser for simple forms.
3. Textract OCR/layout plus deterministic parser for simple forms.
4. Hybrid deterministic first, Sonnet only for fallback/complex cases.

## Success Criteria

The new pipeline is worth implementing if it can show:

- Equal or better field accuracy on standard forms.
- Lower average cost per packet.
- Similar or better processing time.
- More explainable reviewer evidence.
- Fewer avoidable model calls.
- No meaningful regression on messy or complex documents.

## Risks

- Deterministic parsers can become brittle across issuer layouts.
- Textract may be cheaper than Sonnet for OCR but more expensive if Forms/Tables
  are overused.
- Sonnet may still outperform OCR on messy scanned tax documents.
- Too many parser paths can make debugging harder unless the normalized schema
  and logs are strong.
- Confidence scores from different systems are not directly comparable.

## Recommended First Implementation Slice

Start small:

1. Build a read-only extraction orchestrator prototype.
2. Add OCR/text extraction output as a structured intermediate artifact.
3. Implement deterministic parsing for W-2 only.
4. Compare W-2 deterministic output against current Sonnet output.
5. Log parser source, confidence, and review-routing reason.
6. Do not change workbook population until the spike proves value.

## Recommendation

Keep Bedrock/Sonnet in the product, but stop treating it as the only extraction
engine.

The best long-term approach is a hybrid pipeline where deterministic parsing and
OCR handle easy, high-confidence forms, while Sonnet handles ambiguity, complex
documents, client notes, and reviewer evidence.
