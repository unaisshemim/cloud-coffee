variable "project_name" {
  description = "Stable project identifier used in resource names."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "hackathon"
}

variable "aws_region" {
  description = "AWS region used by ECS logging."
  type        = string
}

variable "availability_zones" {
  description = "Two distinct availability zones for public subnets."
  type        = list(string)

  validation {
    condition     = length(var.availability_zones) == 2 && length(distinct(var.availability_zones)) == 2
    error_message = "availability_zones must contain exactly two distinct zones."
  }
}

variable "vpc_cidr" {
  description = "CIDR assigned to the dedicated application VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDRs assigned to the two public application subnets."
  type        = list(string)
  default     = ["10.0.0.0/24", "10.0.1.0/24"]

  validation {
    condition     = length(var.public_subnet_cidrs) == 2
    error_message = "public_subnet_cidrs must contain exactly two CIDRs."
  }
}

variable "certificate_arn" {
  description = "Validated ACM certificate ARN used by the HTTPS listener."
  type        = string
}

variable "application_bucket_arn" {
  description = "Private application S3 bucket ARN."
  type        = string
}

variable "environment_variables" {
  description = "Environment variables rendered into the ECS task definition."
  type        = map(string)
  sensitive   = true
}

variable "container_port" {
  description = "Port exposed by the application container."
  type        = number
  default     = 3000
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

variable "health_check_path" {
  description = "ALB health-check path."
  type        = string
  default     = "/api/health"
}

variable "log_retention_days" {
  description = "CloudWatch application log retention."
  type        = number
  default     = 14
}

variable "github_repository" {
  description = "GitHub repository allowed to assume the deployment role, in owner/repository form."
  type        = string

  validation {
    condition     = can(regex("^[^/]+/[^/]+$", var.github_repository))
    error_message = "github_repository must use owner/repository format."
  }
}

variable "github_branch" {
  description = "GitHub branch allowed to assume the deployment role."
  type        = string
  default     = "main"
}

variable "github_oidc_subject" {
  description = "Exact GitHub OIDC subject when customized subject claims are enabled."
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
