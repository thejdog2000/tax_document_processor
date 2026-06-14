# Bedrock Setup

The app uses **AWS Bedrock only** for AI extraction. It does not use direct
Anthropic API keys and should not add a fallback LLM provider.

## Defaults

| Setting | Value |
|---|---|
| AWS region | `us-east-1` |
| Model family | Claude Sonnet |
| Working model/inference profile | `us.anthropic.claude-sonnet-4-6` |
| AWS profile | `taxparser` recommended for local dev |
| Fallback provider | none |

Use the exact Sonnet model ID shown in the AWS Bedrock Model catalog for your
account/region. If Bedrock requires a regional inference profile, use that ID
instead of the base model ID.

## Important Auth Note

`aws configure` expects an **IAM access key ID** and **IAM secret access key**.
It does not use the newer Bedrock API key shown in parts of the AWS console.

Current app auth path:

```text
boto3 -> AWS profile/credential chain -> Bedrock Runtime
```

## Install AWS CLI

On macOS with Homebrew:

```bash
brew install awscli
aws --version
```

## Create AWS Credentials

In AWS Console:

1. Open `IAM`.
2. Go to `Users`.
3. Create or open a user such as `taxparser-dev`.
4. Open `Security credentials`.
5. Under `Access keys`, choose `Create access key`.
6. Choose `Command Line Interface (CLI)`.
7. Copy/download the access key ID and secret access key.

Do not commit access keys or downloaded credential CSV files to the repo.

Configure the local profile:

```bash
aws configure --profile taxparser
```

Use:

```text
AWS Access Key ID: <IAM access key id>
AWS Secret Access Key: <IAM secret access key>
Default region name: us-east-1
Default output format: json
```

Verify identity:

```bash
aws sts get-caller-identity --profile taxparser
```

## IAM Permissions

For early local development, attach this managed policy to the IAM user:

```text
AmazonBedrockFullAccess
```

If first-time model invocation complains about Marketplace subscription
permissions, also attach:

```text
AWSMarketplaceManageSubscriptions
```

Before production, replace broad policies with least-privilege access. Minimum
runtime permissions are expected to include:

```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel",
    "bedrock:Converse"
  ],
  "Resource": "*"
}
```

Production IAM scoping is still pending.

## Bedrock Model Setup

AWS has retired the old manual `Model access` page for serverless foundation
models. Serverless models are generally enabled on first invoke when the caller
has the required IAM and Marketplace permissions.

For Anthropic models, first-time customers may still need to submit use case
details once per account.

Steps:

1. Open AWS Console.
2. Go to `Amazon Bedrock`.
3. Set region to `US East (N. Virginia) / us-east-1`.
4. Open `Model catalog`.
5. Search for `Claude Sonnet`.
6. Select the newest serverless Anthropic Claude Sonnet model available.
7. Open it in the playground.
8. Submit Anthropic use case details if prompted.
9. Run a simple playground prompt, such as `Say hello.`

Suggested use case wording:

```text
We process sensitive financial and personally identifiable information from
client-provided tax documents, including names, addresses, taxpayer identifiers
if present, income amounts, withholding, employer/payer details, brokerage tax
data, and other tax-form content.

The use case is internal accounting/tax document extraction. The model extracts
structured data from PDFs into internal review workbooks and document logs.
Human staff review outputs before use. The system does not autonomously file tax
returns, make final tax decisions, or provide legal/tax advice without human
review.
```

## App Settings

In the current Tkinter app settings cog, use:

```text
AWS Region: us-east-1
AWS Profile: taxparser
Bedrock Model ID: us.anthropic.claude-sonnet-4-6
1040 Template: path to 25_1040.xlsx
DoubleCheck Template: path to 2025_Tax_Return_Double_Check.xlsx
Default Output Folder: where client folders should be created
```

If `anthropic.claude-sonnet-4-6` fails with an on-demand throughput validation
error, use the regional inference profile ID:

```text
us.anthropic.claude-sonnet-4-6
```

Settings are stored locally at:

```text
~/.tax_processor/config.json
```

## Sensitive Financial/PII Posture

Amazon Bedrock is the preferred path for this project because AWS provides
enterprise controls around IAM, encryption, auditability, and model-provider
data isolation.

AWS public security/privacy materials state that Bedrock customer inputs and
outputs are not shared with model providers and are not used to train base
models:

```text
https://aws.amazon.com/bedrock/security-compliance/
```

AWS Bedrock data encryption docs:

```text
https://docs.aws.amazon.com/bedrock/latest/userguide/data-encryption.html
```

AWS Bedrock compliance validation docs:

```text
https://docs.aws.amazon.com/bedrock/latest/userguide/compliance-validation.html
```

AWS Bedrock Guardrails can detect, block, or mask sensitive information such as
PII:

```text
https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-sensitive-filters.html
```

Do not claim the app is broadly "HIPAA compliant" or "guaranteed zero
retention." The safer position is:

```text
The app is intended for sensitive financial/PII workflows using AWS Bedrock
security, privacy, IAM, encryption, and audit controls. Final compliance depends
on our AWS account configuration, logging choices, IAM policies, customer
agreements, and applicable tax/privacy obligations.
```

## Logging Rules

- Do not log raw PDFs.
- Do not log full prompts or full model responses by default.
- Keep internal diagnostics in `~/.tax_processor/logs/app.log`.
- Keep staff-facing packet logs in the client output folder.
- If Bedrock invocation logging is enabled later, store logs only in encrypted
  destinations and avoid raw sensitive content unless explicitly approved.

## Local Verification

Verify AWS profile:

```bash
aws sts get-caller-identity --profile taxparser
```

Run the no-tax-data Bedrock smoke test:

```bash
cd /path/to/tax_document_processor
.venv/bin/python tests/smoke_bedrock.py \
  --profile taxparser \
  --region us-east-1 \
  --model-id us.anthropic.claude-sonnet-4-6
```

Expected result:

```text
{"ok": true, "provider": "bedrock"}
Bedrock smoke test passed.
```

Run the current app:

```bash
cd /path/to/tax_document_processor
python3 app.py
```

Run the future React/Tauri sidecar path:

```bash
cd /path/to/tax_document_processor/frontend
source "$HOME/.cargo/env"
python3 -m pip install -r ../requirements-dev.txt
npm install
npm run dev:tauri
```

After credentials and model access are configured, run a real packet and confirm:

- Extraction succeeds through AWS Bedrock/Sonnet.
- Document log is generated.
- Workbooks are populated when enabled.
- Output folder package is created.
- No direct Anthropic API key is required.

## Pending Hardening Tasks

- Replace dev IAM policy with least-privilege production policy.
- Validate the exact Sonnet model/inference profile ID for the AWS account.
- Decide whether desktop-direct AWS credentials remain acceptable for pilots or
  whether a backend service should broker Bedrock access.
- Add optional Bedrock Guardrails for PII detection/redaction when product scope
  requires it.
- Validate Windows packaging and credential handling.
