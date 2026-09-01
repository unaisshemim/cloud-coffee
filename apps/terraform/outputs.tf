output "application_url" {
  description = "Public application URL."
  value       = "https://${var.domain_name}"
}

output "acm_validation_dns_records" {
  description = "CNAME records to add manually when manage_cloudflare_dns is false. Keep them DNS-only."
  value = [
    for record in local.certificate_validation_options : {
      name    = record.name
      type    = record.type
      content = record.value
      proxied = false
    }
  ]
}

output "application_dns_record" {
  description = "Application CNAME to add manually after the ALB has been created."
  value = {
    name    = var.domain_name
    type    = "CNAME"
    content = module.ecs.alb_dns_name
    proxied = var.cloudflare_proxy_enabled
  }
}

output "alb_dns_name" {
  description = "Direct ALB hostname for diagnostics."
  value       = module.ecs.alb_dns_name
}

output "upload_bucket_name" {
  description = "Private application upload bucket."
  value       = module.storage.bucket_name
}

output "ecr_repository_name" {
  description = "GitHub Actions AWS_ECR_REPOSITORY value."
  value       = module.ecs.ecr_repository_name
}

output "ecr_repository_url" {
  description = "ECR repository URL."
  value       = module.ecs.ecr_repository_url
}

output "ecs_cluster_name" {
  description = "GitHub Actions AWS_ECS_CLUSTER value."
  value       = module.ecs.ecs_cluster_name
}

output "ecs_service_name" {
  description = "GitHub Actions AWS_ECS_SERVICE value."
  value       = module.ecs.ecs_service_name
}

output "github_deploy_role_arn" {
  description = "GitHub Actions AWS_DEPLOY_ROLE_ARN value."
  value       = module.ecs.github_deploy_role_arn
}

output "log_group_name" {
  description = "CloudWatch application log group."
  value       = module.ecs.log_group_name
}

output "vpc_id" {
  description = "Dedicated application VPC ID."
  value       = module.ecs.vpc_id
}

output "github_repository_variables" {
  description = "Repository variables required by deploy-aws-ecs.yml."
  value = {
    AWS_DEPLOY_ROLE_ARN = module.ecs.github_deploy_role_arn
    AWS_ECR_REPOSITORY  = module.ecs.ecr_repository_name
    AWS_ECS_CLUSTER     = module.ecs.ecs_cluster_name
    AWS_ECS_SERVICE     = module.ecs.ecs_service_name
    AWS_REGION          = var.aws_region
  }
}
