# AWS ECS deployment

Terraform deploys cloudcoffee to a dedicated `us-east-1` VPC with two public subnets, an HTTPS Application Load Balancer, one ECS Fargate task, ECR, private S3 uploads, CloudWatch logs, ACM, Cloudflare DNS, and a GitHub Actions OIDC role. Supabase remains the PostgreSQL provider.

## Prerequisites

- Terraform 1.10 or newer
- Docker
- AWS CLI profile `aws-sky`
- Cloudflare API token with `Zone:Read` and `DNS:Edit` for `clouddcoffee.dev` only when Terraform manages DNS
- Supabase session-pooler connection string using port 5432
- GitHub repository `unaisshemim/cloud-coffee`

`aws-sky` currently authenticates as AWS account root. Replace it with an IAM administrative role before repeated use. Never place AWS or Cloudflare credentials in Terraform variables.

## 1. Prepare local values

```bash
export AWS_PROFILE=aws-sky
export AWS_REGION=us-east-1
# Only needed when manage_cloudflare_dns = true:
# export CLOUDFLARE_API_TOKEN=replace-in-shell-only

cp apps/terraform/bootstrap/terraform.tfvars.example apps/terraform/bootstrap/terraform.tfvars
cp apps/terraform/terraform.tfvars.example apps/terraform/terraform.tfvars
```

Edit `apps/terraform/terraform.tfvars`:

- replace `database_url` with Supabase session-pooler URL;
- generate `auth_secret` using `openssl rand -hex 32`;
- add OAuth, SMTP, `ENCRYPTION_SECRET`, AI, or feature flags under `additional_environment_variables`.

Both populated files are ignored by Git. ECS task-definition environment variables and Terraform state still contain these values, an accepted hackathon tradeoff.

`manage_cloudflare_dns` defaults to `false`. Create the ACM validation CNAME shown by `terraform output acm_validation_dns_records`, then create the application CNAME shown by `terraform output application_dns_record`. Keep ACM validation records DNS-only in Cloudflare.

## 2. Bootstrap remote state

```bash
terraform -chdir=apps/terraform/bootstrap init
terraform -chdir=apps/terraform/bootstrap fmt -check
terraform -chdir=apps/terraform/bootstrap validate
terraform -chdir=apps/terraform/bootstrap plan -out=bootstrap.tfplan
terraform -chdir=apps/terraform/bootstrap apply bootstrap.tfplan
```

Initialize main state using bootstrap output:

```bash
terraform -chdir=apps/terraform init \
  -backend-config="bucket=$(terraform -chdir=apps/terraform/bootstrap output -raw state_bucket_name)" \
  -backend-config="key=reactive-resume/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="profile=aws-sky" \
  -backend-config="use_lockfile=true" \
  -backend-config="encrypt=true"
```

S3 versioning protects state history. S3 lockfiles prevent concurrent state writes.

## 3. Check existing GitHub OIDC provider

GitHub's OIDC provider is account-wide. Check before planning:

```bash
aws iam list-open-id-connect-providers --profile aws-sky
```

If `token.actions.githubusercontent.com` already exists, set:

```hcl
create_github_oidc_provider = false
github_oidc_provider_arn    = "arn:aws:iam::<account-id>:oidc-provider/token.actions.githubusercontent.com"
```

Otherwise keep `create_github_oidc_provider = true`.

## 4. Plan and apply main infrastructure

```bash
terraform -chdir=apps/terraform fmt -check -recursive
terraform -chdir=apps/terraform validate
terraform -chdir=apps/terraform plan -out=main.tfplan
terraform -chdir=apps/terraform apply main.tfplan
```

First ECS task may remain unhealthy until ECR contains `latest`. Terraform does not wait for service stability during initial bootstrap.

If `clouddcoffee.dev` already has an apex DNS record, import that record into `cloudflare_dns_record.app` or remove it before applying. Do not destroy an active record without verifying its current target.

## 5. Configure GitHub repository variables

Read outputs:

```bash
terraform -chdir=apps/terraform output github_repository_variables
```

Create these GitHub repository variables:

| Variable | Terraform output |
| --- | --- |
| `AWS_REGION` | `us-east-1` |
| `AWS_DEPLOY_ROLE_ARN` | `github_deploy_role_arn` |
| `AWS_ECR_REPOSITORY` | `ecr_repository_name` |
| `AWS_ECS_CLUSTER` | `ecs_cluster_name` |
| `AWS_ECS_SERVICE` | `ecs_service_name` |

Workflow `.github/workflows/deploy-aws-ecs.yml` authenticates through OIDC, pushes commit-SHA and `latest` tags, forces ECS deployment, and waits for service stability.

## 6. Deploy and verify

Push to `main` or run **Deploy to AWS ECS** manually in GitHub Actions. Then verify:

```bash
curl --fail --show-error https://clouddcoffee.dev/api/health
curl --fail --show-error --head https://clouddcoffee.dev/

aws ecs describe-services --profile aws-sky --region us-east-1 \
  --cluster clouddcoffee-hackathon \
  --services clouddcoffee-hackathon
```

If deployment fails:

1. Inspect stopped-task reason in ECS.
2. Open CloudWatch log group `/ecs/clouddcoffee-hackathon`.
3. Check ALB target health.
4. Confirm Supabase session-pooler hostname, password, and port 5432.
5. Confirm task role can list, read, write, and delete from application S3 bucket.
6. Confirm `/api/health` returns healthy database and storage checks.

ECS circuit breaker rolls back failed deployments after a healthy revision exists.

## Teardown

Destroy main infrastructure before bootstrap:

```bash
terraform -chdir=apps/terraform plan -destroy -out=destroy.tfplan
terraform -chdir=apps/terraform apply destroy.tfplan
```

Bootstrap state bucket has `prevent_destroy = true`. Preserve a state backup before removing that protection. Empty every current and noncurrent object version before destroying bucket. This runbook intentionally avoids force-delete commands.
