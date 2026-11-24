terraform {
  required_version = ">= 1.13"

  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "3.7.2"
    }
  }
}

variable "include_extra_change" {
  type    = bool
  default = false
}

# A four-byte ID from the Random provider's import documentation.
import {
  to = random_id.example
  id = "p-9hUg"
}

resource "random_id" "example" {
  byte_length = 4
}

resource "terraform_data" "extra" {
  count = var.include_extra_change ? 1 : 0
  input = "an unrelated change"
}
