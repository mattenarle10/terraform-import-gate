# Terraform Import Gate

I built a CLI for bringing existing resources under Terraform. Give it a saved plan and the identity of the resource you want to import. You get `IMPORT ONLY` when that one import is the entire change.

I tried it on an existing CloudWatch log group that Lambda uses. The CLI blocked the plan that changed `retention_in_days`. The plan that matched the group's settings passed.

## Run the Sample

Choose **Use this template** on GitHub. Open **Actions → Terraform Import Gate** and run the workflow. All you need is a GitHub account. [GitHub template instructions](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)

To run the same check locally, clone the repo and run this command with Node.js 24 and Terraform 1.13 or later.

```sh
bash scripts/test-cli.sh
```

The script saves two real Terraform plans in a temporary directory. The import-only plan adopts a Random provider ID. The second plan would also create a `terraform_data` resource, so the gate blocks that plan.

## Check an AWS Import

Run these commands from this repo. Set `terraform_root` to the initialized Terraform root with your import block. Take the expected address, import ID, and ARN from the approved change or resource inventory. The CLI compares these values with the plan.

```sh
terraform_root=/path/to/your/terraform/root
plan="$terraform_root/import.tfplan"
address=aws_cloudwatch_log_group.app
resource_id=/aws/lambda/example
resource_arn=arn:aws:logs:ap-southeast-1:111122223333:log-group:/aws/lambda/example

terraform -chdir="$terraform_root" plan -out="$plan"
npm run --silent gate -- check "$terraform_root" "$plan" "$address" "$resource_id" "$resource_arn" --format text
```

The Terraform JSON stays in the CLI process. Here's what the terminal prints for a blocked retention update.

```text
BLOCKED
The plan contains actions beyond the intended import.
- aws_cloudwatch_log_group: update (retention_in_days)
```

| Exit | Result |
| --- | --- |
| `0` | The plan contains one import with the expected identity and no additional changes. |
| `1` | The plan is blocked. Read the reasons and evidence. |
| `2` | Check the command arguments, saved plan, and Terraform root. |

Use the same `check` command immediately after plan in CI. Let a nonzero exit fail that step. After approval, pass the exact checked plan to `terraform apply`. Keep the saved plan in the runner or use a restricted artifact if it has to move between jobs. Terraform can store sensitive values in saved plan files. [Terraform plan](https://developer.hashicorp.com/terraform/cli/commands/plan#out-filename) · [Terraform apply](https://developer.hashicorp.com/terraform/cli/commands/apply#saved-plan-mode)

## Find the Source of a Blocked Change

Open the Terraform repo in your coding agent. Give the agent the [diagnosis prompt](docs/diagnose-blocked-import.md) and the gate's text output to trace the changed field through the resource and module inputs. Review the proposed edit, save a fresh plan, and run the check again.

## Bedrock Demo

The Hono app runs on Lambda and uses Bedrock Guardrails and AgentCore to handle optional review notes. The [Bedrock walkthrough](docs/bedrock-demo.md) includes the architecture, deployment steps, and stress-test results. [Watch the demo](https://mattenarle.com/projects/terraform-import-gate)

## License

[MIT](LICENSE)
