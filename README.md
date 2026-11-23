# Terraform Import Gate

Review an existing resource before bringing it into Terraform. Run the local check against a saved plan. Use the Hono page to see the verdict and ask the managed AgentCore agent to explain the result.

## Layout

| Path | Purpose |
| --- | --- |
| `deployments/import-gate/` | Singapore deployment root. Owns the provider configuration and app state. |
| `modules/import-gate/` | API Gateway, Hono Lambda, Guardrails, and the AgentCore harness. |
| `src/` and `scripts/` | Hono application, local plan review CLI, and live stress tests. |

## Build and Check

Use Node.js 24, Terraform 1.13 or later, and an authenticated sandbox profile for AWS.

1. Run `npm ci --ignore-scripts`, `npm run check`, `npm test`, and `npm run build`.
2. Run `terraform -chdir=deployments/import-gate init` and `terraform -chdir=deployments/import-gate validate`.
3. Before deploying, confirm the sandbox account with STS. Set `TF_VAR_account_id` to the intended account number. Set `TF_VAR_access_token_sha256` to the SHA-256 digest of a randomly generated 32-byte access token. Keep the token in your password manager.
4. Review a saved Terraform deployment plan. Deploy it after review. The stack creates IAM roles, a regional HTTP API, a Lambda function, a Bedrock guardrail, and a managed AgentCore harness in Singapore. The Nova Lite inference profile can route redacted evidence and change notes within APAC. Model calls and AWS resources can incur charges.
5. Check `GET /health` and open the `app_url` output.

## Review a Saved Plan

1. Generate a saved plan in your initialized Terraform root. For a CloudWatch log group, write the import with the existing group name as its ID and match the live retention setting.
2. Run the CLI from this repository. Pass the original Terraform root so Terraform can load its provider schemas. Pass the existing AWS resource's regional ARN so the check can verify its account and Region. Plans that lack a matching ARN in the imported state stay blocked.

   ```sh
   terraform_root=/path/to/your/terraform/root
   plan=/path/to/import.tfplan
   address=aws_cloudwatch_log_group.app
   resource_id=/aws/lambda/example
   resource_arn=arn:aws:logs:ap-southeast-1:111122223333:log-group:/aws/lambda/example

   node scripts/cli.ts check "$terraform_root" "$plan" "$address" "$resource_id" "$resource_arn"
   node scripts/cli.ts summary "$terraform_root" "$plan" "$address" "$resource_id" "$resource_arn" > summary.json
   ```

   The check exits 0 for an import-only plan, 1 for a blocked plan, and 2 if the CLI cannot read the plan.

3. Upload the summary to the web app for an explanation. Use the local CLI result when reviewing the exact saved plan for apply.

For the live demo, invoke the deployed app to create its default log group. Use that group in two plans. Match its retention in the first plan and change the retention in the second. Expect `IMPORT ONLY` for the first and `BLOCKED` with `retention_in_days` in the evidence for the second.

## Rules and Enforcement

| Rule | Enforced by |
| --- | --- |
| Accept one import to the expected Terraform address and string import ID. For regional AWS resources, verify the ARN from imported state. | The local CLI checks the saved plan before sharing the summary. |
| Block changes to infrastructure, moves, drift, unsupported actions, and incomplete plans. | The same deterministic check runs in the CLI and Hono. The web result describes the submitted summary. Use the CLI as the gate for the actual plan. |
| Give the agent evidence for the current review only. | The CLI exports resource types, action names, and changed field names. Hono validates the summary and exposes one read-only tool for the current request. |
| Refuse overrides, access to raw state, and apply requests. | Bedrock Guardrails screens change notes. The harness receives the review verdict through its read-only tool. The app only displays an explanation when the agent's structured response matches that verdict. |
| Handle missing evidence without guessing. | When the agent cannot complete a tool call, Hono shows the code verdict and reports that the explanation is unavailable. |

Run `node scripts/stress.ts <https-endpoint> <blocked-summary.json>` with `IMPORT_GATE_ACCESS_TOKEN` set. Each result records the gate verdict and whether the agent refused or the guardrail blocked the note. The script exits 1 if either check fails in any case. Hide the endpoint, account identifiers, log group name, and access token in screenshots.

For cleanup, review the deployment's destroy plan. Save any log evidence, then remove the app before its log group.

## References

- [Terraform import](https://developer.hashicorp.com/terraform/language/import/single-resource)
- [Terraform saved-plan JSON](https://developer.hashicorp.com/terraform/internals/json-format)
- [AgentCore harness tools](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-tools.html)
