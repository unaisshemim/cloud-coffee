variable "aws_profile" {
  description = "AWS CLI profile used for local Terraform commands."
  type        = string
  default     = "aws-sky"
}

variable "aws_region" {
  description = "AWS region containing the Terraform state bucket."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Stable project identifier used in resource names."
  type        = string
  default     = "clouddcoffee"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "project_name must contain only lowercase letters, numbers, and hyphens."
  }
}
