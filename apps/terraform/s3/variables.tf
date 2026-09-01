variable "project_name" {
  description = "Stable project identifier used in resource names."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "hackathon"
}

variable "aws_account_id" {
  description = "AWS account ID used to make the bucket name globally unique."
  type        = string
}

variable "noncurrent_version_expiration_days" {
  description = "Days to retain noncurrent object versions."
  type        = number
  default     = 30

  validation {
    condition     = var.noncurrent_version_expiration_days >= 1
    error_message = "noncurrent_version_expiration_days must be at least 1."
  }
}
