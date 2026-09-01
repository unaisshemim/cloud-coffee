output "alb_dns_name" {
  description = "Public ALB DNS hostname."
  value       = aws_lb.app.dns_name
}

output "alb_zone_id" {
  description = "Route 53 canonical hosted-zone ID for the ALB."
  value       = aws_lb.app.zone_id
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.app.name
}

output "ecs_service_name" {
  description = "ECS service name."
  value       = aws_ecs_service.app.name
}

output "ecr_repository_name" {
  description = "ECR repository name used by GitHub Actions."
  value       = aws_ecr_repository.app.name
}

output "ecr_repository_url" {
  description = "ECR repository URL."
  value       = aws_ecr_repository.app.repository_url
}

output "github_deploy_role_arn" {
  description = "AWS role assumed by GitHub Actions."
  value       = aws_iam_role.github_deploy.arn
}

output "task_role_arn" {
  description = "IAM role used by application tasks."
  value       = aws_iam_role.task.arn
}

output "execution_role_arn" {
  description = "IAM role used by ECS to start tasks."
  value       = aws_iam_role.execution.arn
}

output "log_group_name" {
  description = "CloudWatch application log group."
  value       = aws_cloudwatch_log_group.app.name
}

output "vpc_id" {
  description = "Dedicated application VPC ID."
  value       = aws_vpc.app.id
}
