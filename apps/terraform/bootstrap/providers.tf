provider "aws" {
  profile = var.aws_profile
  region  = var.aws_region

  default_tags {
    tags = {
      ManagedBy = "Terraform"
      Project   = var.project_name
    }
  }
}
