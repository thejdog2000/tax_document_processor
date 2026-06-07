"""
bedrock_client.py - Thin AWS Bedrock adapter for tax extraction.

The rest of the pipeline should not need to know about Bedrock request or
response envelopes. Keep this file small so provider details stay reversible.
"""
import json
import os


DEFAULT_BEDROCK_REGION = "us-east-1"
# Current Sonnet default for Bedrock Messages API. Can be overridden per install
# while AWS account/model enablement is finalized.
DEFAULT_BEDROCK_MODEL_ID = "anthropic.claude-sonnet-4-6-v1"
ANTHROPIC_BEDROCK_VERSION = "bedrock-2023-05-31"


class BedrockTaxExtractor:
    """Invokes Claude Sonnet through AWS Bedrock Runtime only."""

    def __init__(self, region=None, model_id=None, aws_profile=None):
        self.region = region or os.getenv("AWS_REGION") or DEFAULT_BEDROCK_REGION
        self.model_id = (
            model_id
            or os.getenv("BEDROCK_MODEL_ID")
            or DEFAULT_BEDROCK_MODEL_ID
        )
        self.aws_profile = aws_profile or os.getenv("AWS_PROFILE") or None
        self._runtime = None

    @property
    def runtime(self):
        if self._runtime is None:
            import boto3

            if self.aws_profile:
                session = boto3.Session(
                    profile_name=self.aws_profile,
                    region_name=self.region,
                )
                self._runtime = session.client("bedrock-runtime")
            else:
                self._runtime = boto3.client(
                    "bedrock-runtime",
                    region_name=self.region,
                )
        return self._runtime

    def extract_text(self, content, max_tokens=1500):
        payload = {
            "anthropic_version": ANTHROPIC_BEDROCK_VERSION,
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": content}],
        }
        response = self.runtime.invoke_model(
            modelId=self.model_id,
            body=json.dumps(payload),
        )
        body = json.loads(response["body"].read())
        return self.response_text(body)

    @staticmethod
    def response_text(body):
        """Extract text blocks from an Anthropic Messages response body."""
        parts = []
        for block in body.get("content", []):
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text", ""))
        return "".join(parts).strip()
