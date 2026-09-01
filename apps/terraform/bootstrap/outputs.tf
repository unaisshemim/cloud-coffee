output "state_bucket_name" {
  description = "S3 bucket used by the main Terraform backend."
  value       = aws_s3_bucket.state.bucket
}

output "state_bucket_region" {
  description = "Region containing the Terraform state bucket."
  value       = var.aws_region
}

output "main_init_command" {
  description = "Command that initializes the main stack against this bucket."
  value       = "terraform -chdir=.. init -backend-config=bucket=${aws_s3_bucket.state.bucket} -backend-config=region=${var.aws_region} -backend-config=profile=${var.aws_profile} -backend-config=key=reactive-resume/terraform.tfstate -backend-config=use_lockfile=true -backend-config=encrypt=true"
}
