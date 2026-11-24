#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
cd "$repo_root"

fixture_root=$(mktemp -d "${TMPDIR:-/tmp}/terraform-import-gate.XXXXXX")
trap 'rm -rf -- "$fixture_root"' EXIT
cp test/fixtures/import/main.tf test/fixtures/import/.terraform.lock.hcl "$fixture_root/"

export TF_IN_AUTOMATION=true
terraform -chdir="$fixture_root" init -input=false -lockfile=readonly -no-color > /dev/null
terraform -chdir="$fixture_root" plan -input=false -no-color -out=clean.tfplan > /dev/null
terraform -chdir="$fixture_root" plan -input=false -no-color -var=include_extra_change=true -out=blocked.tfplan > /dev/null

check_status() {
  local expected_status=$1 plan=$2 expected_line=$3 output status=0
  output=$(npm run --silent gate -- check "$fixture_root" "$fixture_root/$plan" \
    random_id.example p-9hUg --format text 2>&1) || status=$?
  printf '%s\n' "$output"
  if [[ "$status" != "$expected_status" ]] || ! grep -Fxq -- "$expected_line" <<< "$output"; then
    printf 'Unexpected result for %s. Expected exit %s and got %s.\n' "$plan" "$expected_status" "$status" >&2
    return 1
  fi
}

check_status 0 clean.tfplan 'IMPORT ONLY'
check_status 1 blocked.tfplan 'BLOCKED'
check_status 2 missing.tfplan 'Could not read the saved plan. Check the path and initialize its Terraform root.'
