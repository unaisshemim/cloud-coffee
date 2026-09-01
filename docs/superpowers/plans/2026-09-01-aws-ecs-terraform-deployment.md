# AWS ECS Terraform Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a Terraform-managed AWS ECS Fargate deployment for `https://clouddcoffee.dev`, using Supabase PostgreSQL, private AWS S3 storage, Cloudflare DNS, and GitHub Actions OIDC deployments.

**Architecture:** One main S3-backed Terraform state composes `ecs` and `s3` modules. A one-time local bootstrap state creates the remote-state bucket. Existing Node 24 Docker image runs behind an HTTPS ALB; GitHub Actions pushes `latest` and commit-SHA images to ECR and forces ECS rollout.

**Tech Stack:** Terraform >= 1.10, AWS provider, Cloudflare provider, TLS provider, AWS ECS Fargate, ECR, ALB, ACM, S3, IAM, CloudWatch, GitHub Actions OIDC, TypeScript, Vitest, AWS SDK v3.

**Spec:** `docs/superpowers/specs/2026-09-01-aws-ecs-terraform-deployment-design.md`

## Global Constraints

- AWS region is exactly `us-east-1`.
- Local Terraform commands use AWS CLI profile `aws-sky`.
- Public application URL is exactly `https://clouddcoffee.dev`.
- Supabase remains external; Terraform accepts but does not provision `DATABASE_URL`.
- Main infrastructure uses one remote S3 state and S3 lockfiles.
- Application bucket stays private, encrypted, versioned, and public-blocked.
- ECS task starts with 1 vCPU, 2 GiB memory, desired count one, and container port 3000.
- ECS configuration uses task-definition environment variables as explicitly approved for hackathon scope.
- Do not commit populated `.tfvars`, Terraform state, AWS credentials, Cloudflare token, database URL, or authentication secrets.
- Cloudflare token is supplied only through `CLOUDFLARE_API_TOKEN` during Terraform execution.
- Existing unrelated working-tree changes must remain untouched.
- No live `terraform apply`, DNS mutation, ECR push, or ECS deployment occurs without explicit authorization after plans are reviewed.

---

### Task 1: Make S3 Storage Compatible with ECS Task Roles

**Files:**
- Modify: `packages/api/src/features/storage/service.test.ts`
- Modify: `packages/api/src/features/storage/service.ts`
- Modify: `packages/env/src/server.ts`
- Modify: `turbo.json`
- Modify: `docs/self-hosting/docker.mdx`

**Interfaces:**
- Consumes: existing `env.S3_BUCKET`, `env.S3_ACCESS_KEY_ID`, `env.S3_SECRET_ACCESS_KEY`, and `S3Client`.
- Produces: `env.S3_DISABLE_ACL: boolean`; S3 selection by bucket; optional static credentials; ACL-free AWS writes.

- [ ] **Step 1: Add failing storage tests**

Extend hoisted environment and AWS SDK mocks so constructor input and `PutObjectCommand` input are observable:

```ts
const s3Client = vi.hoisted(() => ({ send: vi.fn() }));
const S3Client = vi.hoisted(() => vi.fn(() => s3Client));
const PutObjectCommand = vi.hoisted(() => vi.fn((input) => input));

const envMock = vi.hoisted(() => ({
	// existing fields
	S3_DISABLE_ACL: false,
}));
```

Add isolated module resets or export a test reset helper so cached storage selection does not leak between cases. Cover exact behavior:

```ts
it("uses the ECS credential provider chain when a bucket exists without static keys", async () => {
	envMock.S3_BUCKET = "clouddcoffee-uploads";
	envMock.S3_ACCESS_KEY_ID = undefined;
	envMock.S3_SECRET_ACCESS_KEY = undefined;

	getStorageService();

	expect(S3Client).toHaveBeenCalledWith({
		region: "us-east-1",
		forcePathStyle: false,
	});
});

it("omits ACL when S3_DISABLE_ACL is enabled", async () => {
	envMock.S3_BUCKET = "clouddcoffee-uploads";
	envMock.S3_DISABLE_ACL = true;

	await getStorageService().write({
		key: "uploads/user/picture.jpg",
		data: new Uint8Array([1]),
		contentType: "image/jpeg",
	});

	expect(PutObjectCommand).toHaveBeenCalledWith({
		Bucket: "clouddcoffee-uploads",
		Key: "uploads/user/picture.jpg",
		Body: new Uint8Array([1]),
		ContentType: "image/jpeg",
	});
});
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run:

```bash
pnpm --filter @reactive-resume/api test -- src/features/storage/service.test.ts
```

Expected: failures show S3 is not selected without access keys and `S3_DISABLE_ACL` is not implemented.

- [ ] **Step 3: Implement optional credentials and ACL control**

Add environment schema:

```ts
S3_DISABLE_ACL: z.stringbool().default(false),
```

Add `S3_DISABLE_ACL` to `turbo.json` `globalEnv` directly after `S3_FORCE_PATH_STYLE`.

Add `S3_DISABLE_ACL` to self-hosting storage documentation with default `false`, explaining that AWS buckets using `BucketOwnerEnforced` must set it to `true`.

Change S3 constructor to require only bucket, reject half-configured static keys, and omit credentials when neither key exists:

```ts
if (!env.S3_BUCKET) throw new Error("S3 bucket is not set");
if (!!env.S3_ACCESS_KEY_ID !== !!env.S3_SECRET_ACCESS_KEY) {
	throw new Error("S3 access key ID and secret access key must be set together");
}

this.client = new S3Client({
	region: env.S3_REGION,
	forcePathStyle: env.S3_FORCE_PATH_STYLE,
	...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT } : {}),
	...(env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
		? {
			credentials: {
				accessKeyId: env.S3_ACCESS_KEY_ID,
				secretAccessKey: env.S3_SECRET_ACCESS_KEY,
			},
		}
		: {}),
});
```

Change write input and backend selection:

```ts
const command = new PutObjectCommand({
	Bucket: this.bucket,
	Key: key,
	Body: data,
	...(env.S3_DISABLE_ACL ? {} : { ACL: isPrivate ? "private" : "public-read" }),
	ContentType: contentType,
});

cachedService ??= env.S3_BUCKET ? new S3StorageService() : new LocalStorageService();
```

- [ ] **Step 4: Run focused verification**

Run:

```bash
pnpm --filter @reactive-resume/api test -- src/features/storage/service.test.ts
pnpm --filter @reactive-resume/api typecheck
pnpm --filter @reactive-resume/env typecheck
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit storage adapter**

```bash
git add packages/api/src/features/storage/service.ts packages/api/src/features/storage/service.test.ts packages/env/src/server.ts turbo.json docs/self-hosting/docker.mdx
git commit -m "feat(storage): support ECS task role credentials"
```

---

### Task 2: Create Remote-State Bootstrap

**Files:**
- Create: `apps/terraform/bootstrap/versions.tf`
- Create: `apps/terraform/bootstrap/providers.tf`
- Create: `apps/terraform/bootstrap/variables.tf`
- Create: `apps/terraform/bootstrap/main.tf`
- Create: `apps/terraform/bootstrap/outputs.tf`
- Create: `apps/terraform/bootstrap/terraform.tfvars.example`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: AWS profile `aws-sky`, region `us-east-1`, project name `clouddcoffee`.
- Produces: output `state_bucket_name`; versioned encrypted bucket used by main `backend.tf`.

- [ ] **Step 1: Add Terraform ignore rules**

Append:

```gitignore
# Terraform
**/.terraform/*
*.tfstate
*.tfstate.*
*.tfvars
!*.tfvars.example
*.tfplan
crash.log
override.tf
override.tf.json
*_override.tf
*_override.tf.json
```

- [ ] **Step 2: Define bootstrap provider and variables**

Use Terraform and AWS constraints:

```hcl
terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}
```

Provider and variables use `aws_profile = "aws-sky"`, `aws_region = "us-east-1"`, and `project_name = "clouddcoffee"`. Use `data "aws_caller_identity" "current" {}` to produce deterministic bucket name `${var.project_name}-terraform-state-${data.aws_caller_identity.current.account_id}`.

- [ ] **Step 3: Create hardened state bucket**

Create `aws_s3_bucket.state`, ownership controls using `BucketOwnerEnforced`, public-access block with all four flags true, versioning enabled, AES256 server-side encryption, and lifecycle protection:

```hcl
resource "aws_s3_bucket" "state" {
  bucket = local.state_bucket_name

  lifecycle {
    prevent_destroy = true
  }
}
```

Output exact bucket name, region, and initialization command:

```hcl
output "main_init_command" {
  value = "terraform -chdir=.. init -backend-config=bucket=${aws_s3_bucket.state.bucket} -backend-config=region=${var.aws_region} -backend-config=profile=${var.aws_profile} -backend-config=key=reactive-resume/terraform.tfstate -backend-config=use_lockfile=true -backend-config=encrypt=true"
}
```

- [ ] **Step 4: Format and validate bootstrap**

Run:

```bash
terraform -chdir=apps/terraform/bootstrap fmt -check
terraform -chdir=apps/terraform/bootstrap init -backend=false
terraform -chdir=apps/terraform/bootstrap validate
terraform -chdir=apps/terraform/bootstrap plan -var-file=terraform.tfvars.example -out=bootstrap.tfplan
```

Expected: formatting, initialization, validation, and plan exit 0; plan creates one bucket plus controls.

- [ ] **Step 5: Commit bootstrap**

```bash
git add .gitignore apps/terraform/bootstrap
git commit -m "infra: add Terraform state bootstrap"
```

---

### Task 3: Build Private Application S3 Module

**Files:**
- Create: `apps/terraform/s3/variables.tf`
- Create: `apps/terraform/s3/main.tf`
- Create: `apps/terraform/s3/outputs.tf`

**Interfaces:**
- Consumes: `project_name`, `environment`, `aws_account_id`, and `noncurrent_version_expiration_days`.
- Produces: `bucket_name`, `bucket_arn`, and `object_arn_pattern`.

- [ ] **Step 1: Define module contract**

Declare typed variables with validations:

```hcl
variable "project_name" {
  type = string
}

variable "environment" {
  type    = string
  default = "hackathon"
}

variable "aws_account_id" {
  type = string
}

variable "noncurrent_version_expiration_days" {
  type    = number
  default = 30

  validation {
    condition     = var.noncurrent_version_expiration_days >= 1
    error_message = "noncurrent_version_expiration_days must be at least 1."
  }
}
```

- [ ] **Step 2: Create private bucket**

Name bucket `${var.project_name}-${var.environment}-uploads-${var.aws_account_id}`. Add `BucketOwnerEnforced`, four-way public block, AES256 encryption, enabled versioning, and lifecycle expiration for noncurrent versions. Tag resources with `Project`, `Environment`, and `ManagedBy = "Terraform"`.

- [ ] **Step 3: Export stable outputs**

```hcl
output "bucket_name" {
  value = aws_s3_bucket.uploads.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.uploads.arn
}

output "object_arn_pattern" {
  value = "${aws_s3_bucket.uploads.arn}/*"
}
```

- [ ] **Step 4: Format and validate module through rootless fixture command**

Run:

```bash
terraform fmt -check -recursive apps/terraform/s3
terraform -chdir=apps/terraform/s3 init -backend=false
terraform -chdir=apps/terraform/s3 validate
```

Expected: commands exit 0.

- [ ] **Step 5: Commit S3 module**

```bash
git add apps/terraform/s3
git commit -m "infra: add private application S3 module"
```

---

### Task 4: Build ECS, Networking, and GitHub OIDC Module

**Files:**
- Create: `apps/terraform/ecs/variables.tf`
- Create: `apps/terraform/ecs/network.tf`
- Create: `apps/terraform/ecs/iam.tf`
- Create: `apps/terraform/ecs/ecr.tf`
- Create: `apps/terraform/ecs/alb.tf`
- Create: `apps/terraform/ecs/ecs.tf`
- Create: `apps/terraform/ecs/github.tf`
- Create: `apps/terraform/ecs/outputs.tf`

**Interfaces:**
- Consumes: project/environment names, region, two AZs, ACM certificate ARN, application bucket name/ARN, environment map, GitHub repository/branch, OIDC-provider settings, CPU/memory/task count.
- Produces: ALB DNS and zone ID, ECS cluster/service names, ECR URL, GitHub deployment-role ARN, task/execution-role ARNs, log-group name.

- [ ] **Step 1: Define module inputs and validations**

Declare exact defaults:

```hcl
variable "container_port" { type = number, default = 3000 }
variable "task_cpu" { type = number, default = 1024 }
variable "task_memory" { type = number, default = 2048 }
variable "desired_count" { type = number, default = 1 }
variable "health_check_path" { type = string, default = "/api/health" }
variable "log_retention_days" { type = number, default = 14 }
variable "vpc_cidr" { type = string, default = "10.0.0.0/16" }
variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.0.0/24", "10.0.1.0/24"]
}
```

Validate two subnet CIDRs and two distinct availability zones. Define `environment_variables` as `map(string)` and mark it sensitive. Define `github_repository` as `owner/repository`, `github_branch = "main"`, `create_github_oidc_provider = true`, and nullable `github_oidc_provider_arn`.

- [ ] **Step 2: Create public network**

Create VPC with DNS support/hostnames, two public subnets with public-IP mapping, Internet Gateway, one route table with `0.0.0.0/0`, and subnet associations. Create ALB security group allowing inbound TCP 80/443 from IPv4 internet and all outbound. Create ECS task security group allowing TCP 3000 only from ALB security group and all outbound.

- [ ] **Step 3: Create ECR and logging**

Create mutable ECR repository with scan-on-push and AES256 encryption. Add lifecycle policy keeping 20 tagged images and expiring untagged images after 7 days. Create CloudWatch log group `/ecs/${var.project_name}-${var.environment}` with 14-day default retention.

- [ ] **Step 4: Create ECS roles and S3 policy**

Create execution and task roles trusted by `ecs-tasks.amazonaws.com`. Attach `service-role/AmazonECSTaskExecutionRolePolicy` to execution role. Add task inline policy:

```hcl
statement {
  actions   = ["s3:ListBucket"]
  resources = [var.application_bucket_arn]
}

statement {
  actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
  resources = ["${var.application_bucket_arn}/*"]
}
```

- [ ] **Step 5: Create ALB and listeners**

Create internet-facing ALB, IP target group on port 3000, `/api/health` matcher `200`, 30-second interval, 5-second timeout, healthy threshold 2, unhealthy threshold 3, and 30-second deregistration delay. HTTP listener redirects to HTTPS 443. HTTPS listener uses `ELBSecurityPolicy-TLS13-1-2-2021-06` and supplied ACM certificate ARN.

- [ ] **Step 6: Create ECS task and service**

Render sorted environment entries so task-definition JSON stays stable:

```hcl
environment = [
  for name in sort(keys(var.environment_variables)) : {
    name  = name
    value = var.environment_variables[name]
  }
]
```

Configure Fargate, `awsvpc`, x86_64 Linux, ECR `:latest`, awslogs, container health check against `http://127.0.0.1:3000/api/health`, and essential container. ECS service uses public subnets, public IP, target group, desired count one, 120-second health grace period, circuit breaker with rollback, and deployment percentages 0/200 so a one-task service can replace a failed revision.

- [ ] **Step 7: Create GitHub OIDC deployment role**

Use existing provider ARN when supplied; otherwise create `token.actions.githubusercontent.com` OIDC provider with client ID `sts.amazonaws.com`. Trust only:

```hcl
condition {
  test     = "StringEquals"
  variable = "token.actions.githubusercontent.com:aud"
  values   = ["sts.amazonaws.com"]
}

condition {
  test     = "StringEquals"
  variable = "token.actions.githubusercontent.com:sub"
  values   = ["repo:${var.github_repository}:ref:refs/heads/${var.github_branch}"]
}
```

Grant ECR authorization/push actions plus `ecs:DescribeServices` and `ecs:UpdateService` only for created service. Do not grant task-role pass-through because workflow forces deployment of existing task definition.

- [ ] **Step 8: Export deployment outputs**

Export ALB DNS/zone ID, cluster/service names, ECR URL, deployment-role ARN, and log-group name. Mark no output sensitive.

- [ ] **Step 9: Format and validate ECS module**

Run:

```bash
terraform fmt -check -recursive apps/terraform/ecs
terraform -chdir=apps/terraform/ecs init -backend=false
terraform -chdir=apps/terraform/ecs validate
```

Expected: commands exit 0.

- [ ] **Step 10: Commit ECS module**

```bash
git add apps/terraform/ecs
git commit -m "infra: add ECS Fargate deployment module"
```

---

### Task 5: Compose Root Stack, ACM, and Cloudflare DNS

**Files:**
- Create: `apps/terraform/backend.tf`
- Create: `apps/terraform/versions.tf`
- Create: `apps/terraform/providers.tf`
- Create: `apps/terraform/variables.tf`
- Create: `apps/terraform/main.tf`
- Create: `apps/terraform/dns.tf`
- Create: `apps/terraform/outputs.tf`
- Create: `apps/terraform/terraform.tfvars.example`

**Interfaces:**
- Consumes: bootstrap bucket backend config, `CLOUDFLARE_API_TOKEN`, Supabase URL, auth secret, GitHub repository, module contracts from Tasks 3-4.
- Produces: deployable main stack and user-facing outputs.

- [ ] **Step 1: Declare backend and providers**

Use empty partial backend configuration:

```hcl
terraform {
  backend "s3" {}
}
```

Require Terraform >= 1.10, AWS `~> 6.0`, Cloudflare `~> 5.0`, and TLS `~> 4.0`. Configure AWS provider with `region = var.aws_region` and `profile = var.aws_profile`. Configure Cloudflare provider from `CLOUDFLARE_API_TOKEN` implicitly.

- [ ] **Step 2: Define root variables**

Use exact defaults:

```hcl
variable "aws_region" { type = string, default = "us-east-1" }
variable "aws_profile" { type = string, default = "aws-sky" }
variable "project_name" { type = string, default = "clouddcoffee" }
variable "environment" { type = string, default = "hackathon" }
variable "domain_name" { type = string, default = "clouddcoffee.dev" }
variable "github_branch" { type = string, default = "main" }
```

Require `database_url`, `auth_secret`, and `github_repository`. Mark database/auth variables sensitive. Accept `additional_environment_variables` as sensitive `map(string)` default `{}`. Accept Cloudflare proxy boolean default true and OIDC-provider reuse inputs.

- [ ] **Step 3: Create ACM validation through Cloudflare**

Look up Cloudflare zone by name. Create ACM certificate with DNS validation and `create_before_destroy`. Convert `domain_validation_options` to a `for_each` map. Remove trailing dots from validation values when writing Cloudflare CNAME records. Keep validation records unproxied. Feed FQDNs into `aws_acm_certificate_validation`.

- [ ] **Step 4: Compose storage and ECS modules**

Use `data.aws_caller_identity.current` and `data.aws_availability_zones.available`. Pass first two AZs to ECS. Build environment map:

```hcl
locals {
  application_environment = merge({
    NODE_ENV          = "production"
    PORT              = "3000"
    APP_URL           = "https://${var.domain_name}"
    DATABASE_URL      = var.database_url
    AUTH_SECRET       = var.auth_secret
    S3_REGION         = var.aws_region
    S3_BUCKET         = module.storage.bucket_name
    S3_FORCE_PATH_STYLE = "false"
    S3_DISABLE_ACL    = "true"
  }, var.additional_environment_variables)
}
```

Pass storage ARN/name into ECS, ACM validated certificate ARN into ALB, and GitHub/OIDC inputs into deployment role.

- [ ] **Step 5: Create application Cloudflare record**

Create apex CNAME with `name = "@"`, value from ECS ALB DNS, configured proxy state, and TTL 1 when proxied or 300 when DNS-only.

- [ ] **Step 6: Add example variables and outputs**

Example file contains non-production literals:

```hcl
github_repository = "your-github-owner/reactive-resume"
database_url      = "postgresql://postgres.project:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
auth_secret       = "replace-with-openssl-rand-hex-32"

additional_environment_variables = {
  FLAG_DISABLE_SIGNUPS = "false"
}
```

Output application URL, ALB hostname, upload bucket, ECR URL, ECS names, GitHub role ARN, log group, and state/bootstrap guidance.

- [ ] **Step 7: Validate root stack without remote backend**

Copy example to an ignored temporary tfvars path, set `CLOUDFLARE_API_TOKEN` only when producing a real plan, then run offline structural validation:

```bash
terraform -chdir=apps/terraform fmt -check -recursive
terraform -chdir=apps/terraform init -backend=false
terraform -chdir=apps/terraform validate
```

Expected: all commands exit 0. Real plan is deferred until Cloudflare token and valid account inputs are available.

- [ ] **Step 8: Commit root composition**

```bash
git add apps/terraform
git commit -m "infra: compose AWS ECS Terraform stack"
```

---

### Task 6: Add GitHub Actions ECS Deployment

**Files:**
- Create: `.github/workflows/deploy-aws-ecs.yml`

**Interfaces:**
- Consumes: GitHub repository variables `AWS_REGION`, `AWS_ECR_REPOSITORY`, `AWS_ECS_CLUSTER`, `AWS_ECS_SERVICE`, and `AWS_DEPLOY_ROLE_ARN` copied from Terraform outputs.
- Produces: ECR tags `${GITHUB_SHA}` and `latest`, then stable ECS rollout.

- [ ] **Step 1: Create least-privilege workflow**

Use push to `main` and manual dispatch, one concurrency group, `contents: read` and `id-token: write`. Steps:

```yaml
- uses: actions/checkout@v6
- uses: aws-actions/configure-aws-credentials@v6
  with:
    role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}
    aws-region: ${{ vars.AWS_REGION }}
- id: login-ecr
  uses: aws-actions/amazon-ecr-login@v2
- uses: docker/setup-buildx-action@v4
- uses: docker/build-push-action@v7
  with:
    context: .
    push: true
    platforms: linux/amd64
    tags: |
      ${{ steps.login-ecr.outputs.registry }}/${{ vars.AWS_ECR_REPOSITORY }}:${{ github.sha }}
      ${{ steps.login-ecr.outputs.registry }}/${{ vars.AWS_ECR_REPOSITORY }}:latest
- run: >-
    aws ecs update-service
    --cluster "${{ vars.AWS_ECS_CLUSTER }}"
    --service "${{ vars.AWS_ECS_SERVICE }}"
    --force-new-deployment
- run: >-
    aws ecs wait services-stable
    --cluster "${{ vars.AWS_ECS_CLUSTER }}"
    --services "${{ vars.AWS_ECS_SERVICE }}"
```

- [ ] **Step 2: Inspect workflow syntax and action versions**

Run:

```bash
pnpm exec prettier --check .github/workflows/deploy-aws-ecs.yml
rg -n "id-token: write|role-to-assume|amazon-ecr-login|build-push-action|update-service|services-stable" .github/workflows/deploy-aws-ecs.yml
```

Expected: Prettier exits 0 and all six workflow controls appear.

- [ ] **Step 3: Commit deployment workflow**

```bash
git add .github/workflows/deploy-aws-ecs.yml
git commit -m "ci: deploy application to AWS ECS"
```

---

### Task 7: Document Bootstrap and Operations

**Files:**
- Create: `apps/terraform/README.md`

**Interfaces:**
- Consumes: outputs and variables from Tasks 2-6.
- Produces: exact bootstrap, initialization, plan, apply, GitHub configuration, smoke-test, rollback, and destroy runbook.

- [ ] **Step 1: Write bootstrap and main-stack commands**

Document exact sequence:

```bash
export AWS_PROFILE=aws-sky
export AWS_REGION=us-east-1
export CLOUDFLARE_API_TOKEN=replace-in-shell-only

terraform -chdir=apps/terraform/bootstrap init
terraform -chdir=apps/terraform/bootstrap plan -out=bootstrap.tfplan
terraform -chdir=apps/terraform/bootstrap apply bootstrap.tfplan

terraform -chdir=apps/terraform init \
  -backend-config="bucket=$(terraform -chdir=apps/terraform/bootstrap output -raw state_bucket_name)" \
  -backend-config="key=reactive-resume/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="profile=aws-sky" \
  -backend-config="use_lockfile=true" \
  -backend-config="encrypt=true"

terraform -chdir=apps/terraform plan -out=main.tfplan
terraform -chdir=apps/terraform apply main.tfplan
```

Explicitly warn that `aws-sky` currently authenticates as root and recommend replacing it with an IAM administrative role before repeated use.

- [ ] **Step 2: Document external inputs and GitHub variables**

List Supabase session-pooler URL, generated auth secret, Cloudflare scoped token permissions, GitHub repository string, and optional OAuth/SMTP variables. Map Terraform outputs to exact GitHub repository variable names used by workflow.

- [ ] **Step 3: Document first deployment and smoke checks**

Include:

```bash
curl --fail --show-error https://clouddcoffee.dev/api/health
curl --fail --show-error --head https://clouddcoffee.dev/
aws ecs describe-services --profile aws-sky --region us-east-1 \
  --cluster clouddcoffee-hackathon \
  --services clouddcoffee-hackathon
```

Describe checking CloudWatch logs, ECS stopped-task reason, ALB target health, Supabase pooler reachability, and S3 healthcheck permission failures.

- [ ] **Step 4: Document safe teardown order**

Main stack destroys before bootstrap. State bucket uses `prevent_destroy`; explain removing protection only after copying state and emptying versioned objects. Do not include automated force deletion.

- [ ] **Step 5: Validate documentation links and commit**

Run:

```bash
pnpm run docs:check
pnpm run docs:links
```

Expected: both commands exit 0.

Commit:

```bash
git add apps/terraform/README.md
git commit -m "docs: add AWS ECS deployment runbook"
```

---

### Task 8: Perform Final Verification and Refresh Graph

**Files:**
- Modify: `graphify-out/*` through generated Graphify update only

**Interfaces:**
- Consumes: all implementation tasks.
- Produces: verified Terraform/application deployment artifacts and current repository graph.

- [ ] **Step 1: Inspect change scope**

```bash
git status --short
git diff --check
git diff --stat
```

Expected: only planned files plus pre-existing unrelated user changes appear; no whitespace errors.

- [ ] **Step 2: Run application verification**

```bash
pnpm --filter @reactive-resume/api test -- src/features/storage/service.test.ts
pnpm --filter @reactive-resume/api typecheck
pnpm --filter @reactive-resume/env typecheck
pnpm exec turbo boundaries
```

Expected: all commands exit 0.

- [ ] **Step 3: Run Terraform verification**

```bash
terraform fmt -check -recursive apps/terraform
terraform -chdir=apps/terraform/bootstrap init -backend=false
terraform -chdir=apps/terraform/bootstrap validate
terraform -chdir=apps/terraform init -backend=false
terraform -chdir=apps/terraform validate
```

Expected: all commands exit 0.

- [ ] **Step 4: Build production container**

```bash
docker build --tag clouddcoffee:terraform-verify .
```

Expected: Docker build exits 0 and final image uses Node 24 runtime.

- [ ] **Step 5: Refresh Graphify once**

```bash
graphify update .
```

Expected: graph update exits 0 after all code verification.

- [ ] **Step 6: Review final commits and handoff**

```bash
git log --oneline --max-count=10
git status --short
```

Report created resources, commands run, verification evidence, remaining unrelated working-tree changes, and explicit live-deployment steps requiring user authorization.
