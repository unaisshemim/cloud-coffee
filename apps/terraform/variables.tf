variable "aws_profile" {
  description = "AWS CLI profile used for local Terraform commands."
  type        = string
  default     = "aws-sky"
}

variable "aws_region" {
  description = "AWS deployment region."
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

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "hackathon"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment))
    error_message = "environment must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "domain_name" {
  description = "Public application hostname and Cloudflare zone."
  type        = string
  default     = "clouddcoffee.dev"
}

variable "database_url" {
  description = "Supabase PostgreSQL session-pooler connection string."
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^postgres(ql)?://", var.database_url))
    error_message = "database_url must be a PostgreSQL connection URL."
  }
}

variable "auth_secret" {
  description = "Application authentication secret."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.auth_secret) >= 32
    error_message = "auth_secret must contain at least 32 characters."
  }
}

variable "additional_environment_variables" {
  description = "Optional OAuth, SMTP, encryption, AI, and feature-flag environment variables."
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "github_repository" {
  description = "GitHub repository allowed to deploy, in owner/repository form."
  type        = string

  validation {
    condition     = can(regex("^[^/]+/[^/]+$", var.github_repository))
    error_message = "github_repository must use owner/repository format."
  }
}

variable "github_branch" {
  description = "GitHub branch allowed to deploy."
  type        = string
  default     = "main"
}

variable "github_oidc_subject" {
  description = "Exact GitHub OIDC subject when customized subject claims are enabled. Uses the standard repository/branch subject when null."
  type        = string
  default     = null
  nullable    = true
}

variable "create_github_oidc_provider" {
  description = "Create the account-wide GitHub Actions OIDC provider."
  type        = bool
  default     = true
}

variable "github_oidc_provider_arn" {
  description = "Existing GitHub Actions OIDC provider ARN when creation is disabled."
  type        = string
  default     = null
  nullable    = true
}

variable "cloudflare_proxy_enabled" {
  description = "Proxy application traffic through Cloudflare."
  type        = bool
  default     = true
}

variable "manage_cloudflare_dns" {
  description = "Manage ACM validation and application DNS records through Terraform. Disable for manual Cloudflare DNS."
  type        = bool
  default     = false
}

variable "task_cpu" {
  description = "Fargate task CPU units."
  type        = number
  default     = 1024
}

variable "task_memory" {
  description = "Fargate task memory in MiB."
  type        = number
  default     = 2048
}

variable "desired_count" {
  description = "Number of application tasks."
  type        = number
  default     = 1
}
