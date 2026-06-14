#!/usr/bin/env python3
"""Small live Bedrock smoke test.

This intentionally sends no tax data. It only verifies that the configured AWS
profile/region/model can invoke Bedrock and return a simple JSON response.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parent.parent
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from bedrock_client import DEFAULT_BEDROCK_MODEL_ID, DEFAULT_BEDROCK_REGION, BedrockTaxExtractor


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify live Bedrock/Sonnet access.")
    parser.add_argument("--profile", default="taxparser", help="AWS profile name.")
    parser.add_argument("--region", default=DEFAULT_BEDROCK_REGION, help="AWS region.")
    parser.add_argument("--model-id", default=DEFAULT_BEDROCK_MODEL_ID, help="Bedrock model ID.")
    args = parser.parse_args()

    extractor = BedrockTaxExtractor(
        region=args.region,
        model_id=args.model_id,
        aws_profile=args.profile,
    )
    prompt = (
        'Return exactly this JSON object and no other text: {"ok": true, "provider": "bedrock"}'
    )
    text = extractor.extract_text([{"type": "text", "text": prompt}], max_tokens=80)
    print(text)
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        print(f"Smoke test failed: response was not JSON: {exc}", file=sys.stderr)
        return 1
    if parsed.get("ok") is not True:
        print(f"Smoke test failed: unexpected payload: {parsed}", file=sys.stderr)
        return 1
    print("Bedrock smoke test passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
