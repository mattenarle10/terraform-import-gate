terraform {
  required_version = ">= 1.13"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "= 6.69.1"
    }
  }
}

variable "account_id" {
  type        = string
  description = "Expected AWS account for the deployment."
}

variable "access_token_sha256" {
  type      = string
  sensitive = true
  validation {
    condition     = can(regex("^[a-f0-9]{64}$", var.access_token_sha256))
    error_message = "Provide the SHA-256 digest of a randomly generated access token."
  }
}

provider "aws" {
  region              = "ap-southeast-1"
  allowed_account_ids = [var.account_id]

  default_tags {
    tags = { Project = "terraform-import-gate" }
  }
}

module "import_gate" {
  source = "../../modules/import-gate"

  account_id          = var.account_id
  region              = "ap-southeast-1"
  package_path        = abspath("${path.root}/../../dist/app.zip")
  access_token_sha256 = var.access_token_sha256
}

output "app_url" {
  value = module.import_gate.app_url
}

output "log_group_name" {
  value = module.import_gate.log_group_name
}
