data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

locals {
  application_environment = merge(var.additional_environment_variables, {
    APP_URL             = "https://${var.domain_name}"
    AUTH_SECRET         = var.auth_secret
    DATABASE_URL        = var.database_url
    NODE_ENV            = "production"
    PORT                = "3000"
    S3_BUCKET           = module.storage.bucket_name
    S3_DISABLE_ACL      = "true"
    S3_FORCE_PATH_STYLE = "false"
    S3_REGION           = var.aws_region
  })
}

module "storage" {
  source = "./s3"

  aws_account_id = data.aws_caller_identity.current.account_id
  environment    = var.environment
  project_name   = var.project_name
}

module "ecs" {
  source = "./ecs"

  application_bucket_arn      = module.storage.bucket_arn
  availability_zones          = slice(data.aws_availability_zones.available.names, 0, 2)
  aws_region                  = var.aws_region
  certificate_arn             = aws_acm_certificate_validation.app.certificate_arn
  create_github_oidc_provider = var.create_github_oidc_provider
  desired_count               = var.desired_count
  environment                 = var.environment
  environment_variables       = local.application_environment
  github_branch               = var.github_branch
  github_oidc_provider_arn    = var.github_oidc_provider_arn
  github_repository           = var.github_repository
  project_name                = var.project_name
  task_cpu                    = var.task_cpu
  task_memory                 = var.task_memory
}
