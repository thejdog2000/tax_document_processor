# Bedrock Setup

The app uses AWS Bedrock only. It does not use direct Anthropic API keys.

## Defaults

- Region: `us-east-1`
- Model family: Sonnet
- Fallback provider: none

## Local Developer Setup

Use the normal AWS credential chain. For example, with an AWS profile:

```bash
aws sso login --profile your-profile
AWS_PROFILE=your-profile python app.py
```

Or set the profile in the app's Settings dialog.

## Required Access

The active AWS identity needs permission to call Bedrock Runtime for the configured model.

At minimum, expect access to:

```text
bedrock:InvokeModel
```

Exact production IAM policy is still pending.

## Production Notes

- Customer-office users should not need AWS console access.
- A backend service may replace desktop-direct AWS credentials later.
- ZDR/data-retention requirements must be verified at the AWS/platform/policy level.
- Do not add app-side fallback providers to work around Bedrock setup issues.

## Live Verification

After credentials and model access are configured, run a real packet through the app
and confirm:

- Extraction succeeds through Bedrock.
- Document log is generated.
- Workbooks are populated.
- Zip package is created.
- No direct Anthropic API key is required.

