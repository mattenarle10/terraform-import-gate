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

variable "region" {
  type        = string
  description = "AWS Region for the API and managed harness."
}

variable "package_path" {
  type        = string
  description = "Path to the built Lambda ZIP."
}
