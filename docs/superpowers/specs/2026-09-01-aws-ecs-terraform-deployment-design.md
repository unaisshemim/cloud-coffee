# AWS ECS Terraform Deployment Design

## Objective

Deploy the existing production Docker image to AWS ECS Fargate while keeping Supabase as the external PostgreSQL provider. Terraform owns AWS infrastructure and Cloudflare DNS for `https://clouddcoffee.dev`. GitHub Actions builds and deploys application images through AWS OIDC.

This is a hackathon deployment. It optimizes for a reproducible, low-operations stack rather than multi-region availability or enterprise secret management.

## Decisions

- AWS region is `us-east-1`.
- Local Terraform commands use AWS CLI profile `aws-sky`.
- Application URL is `https://clouddcoffee.dev`.
- Terraform uses one main remote state with `ecs` and `s3` child modules.
- A small, one-time bootstrap Terraform configuration creates the remote-state S3 bucket.
- Cloudflare remains the authoritative DNS provider. Terraform manages certificate-validation and application DNS records.
- ECS task-definition environment variables contain application configuration, including hackathon credentials.
- GitHub Actions uses AWS OIDC. No long-lived AWS access keys are stored in GitHub.
- Supabase remains outside Terraform and is supplied through `DATABASE_URL`.
- AWS S3 replaces local or R2 object storage.
- Initial service capacity is one Fargate task with 1 vCPU and 2 GiB memory.
- Public subnets and public task IPs avoid NAT Gateway cost. The task security group accepts application traffic only from the load balancer.
- Autoscaling, WAF, Redis, SES, and multi-region failover are outside initial scope.

## Repository Layout

```text
apps/terraform/
├── bootstrap/              # One-time remote-state bucket
├── ecs/                    # VPC, ALB, ACM, ECS, ECR, IAM, logs, GitHub OIDC
├── s3/                     # Private application object bucket and task policy inputs
├── backend.tf              # S3 backend declaration with lockfile support
├── main.tf                 # Root module composition and Cloudflare records
├── providers.tf            # AWS, Cloudflare, TLS/provider constraints
├── variables.tf            # Deployment inputs
├── outputs.tf              # URLs and resource identifiers
├── terraform.tfvars.example
└── README.md               # Bootstrap, apply, DNS, and deployment instructions

.github/workflows/
└── deploy-aws-ecs.yml      # OIDC login, Docker build, ECR push, ECS rollout
```

Main infrastructure uses one remote state. Bootstrap state remains local because an S3 backend bucket must exist before the main configuration can initialize it. Bootstrap creates an encrypted, versioned, public-blocked bucket with a deterministic account-scoped name. Main initialization receives the bucket name through backend configuration and enables S3 lockfiles.

## AWS Architecture

### Network

Terraform creates one VPC with two public subnets in separate `us-east-1` availability zones, an Internet Gateway, and a public route table. Fargate tasks receive public IP addresses for outbound Supabase, package-provider, SMTP, and AI-provider traffic. No inbound task traffic is publicly permitted.

An internet-facing Application Load Balancer accepts ports 80 and 443. Port 80 redirects to HTTPS. Port 443 terminates the ACM certificate and forwards to the ECS target group on port 3000. The task security group permits port 3000 only from the ALB security group.

The target group checks `/api/health`. Deregistration delay and ECS deployment circuit-breaker settings favor fast hackathon rollouts and automatic rollback.

### DNS and TLS

Terraform looks up Cloudflare zone `clouddcoffee.dev`, requests an ACM certificate for the apex domain, and creates unproxied Cloudflare DNS validation records. After ACM validation, Terraform creates the application record pointing the apex domain to the ALB. Cloudflare proxying is configurable and enabled by default.

The Cloudflare provider reads `CLOUDFLARE_API_TOKEN` from the Terraform execution environment. The token is not passed to ECS or written into project variables.

### Compute and Images

The ECS module creates:

- private ECR repository with scan-on-push and lifecycle cleanup;
- ECS cluster;
- task execution and application task roles;
- CloudWatch log group with 14-day retention;
- Fargate task definition using Linux x86_64, 1 vCPU, and 2 GiB memory;
- ECS service with desired count one, health-check grace period, circuit breaker, and rollback.

The container listens on port 3000. Terraform points the task definition at the ECR `latest` tag. Initial apply can complete before an image exists; the service becomes healthy after the first GitHub deployment pushes an image and forces a new ECS rollout.

### Application Storage

The S3 module creates a private, encrypted, versioned bucket with all public-access blocks enabled. Browser requests continue to use application routes such as `/api/uploads/*`; clients do not receive direct bucket access.

The ECS task role receives only required bucket permissions: list bucket and get, put, and delete objects. Static S3 access keys are not created.

Current storage code needs a focused compatibility change:

- select S3 storage when `S3_BUCKET` is configured, even without static access keys;
- allow AWS SDK default credential resolution so ECS task-role credentials work;
- make object ACL emission configurable and disable it for this private AWS bucket;
- preserve existing behavior for existing S3-compatible self-hosters by default;
- add the new environment key to `packages/env/src/server.ts` and `turbo.json`.

## Supabase Database

Terraform does not create or mutate Supabase resources. `DATABASE_URL` is supplied as an ECS environment variable. For the default IPv4-only VPC, deployment documentation instructs using the Supabase session-pooler connection string rather than an IPv6-only direct endpoint.

The existing server runs Drizzle migrations before accepting traffic. Initial desired count one limits concurrent migration risk. Schema migrations remain part of application startup for this hackathon version; a dedicated migration task is deferred.

## Application Configuration

Non-secret and secret application values are rendered into the ECS task definition as environment entries because this is an explicitly accepted hackathon tradeoff. At minimum:

- `NODE_ENV=production`
- `PORT=3000`
- `APP_URL=https://clouddcoffee.dev`
- `DATABASE_URL`
- `AUTH_SECRET`
- `S3_REGION=us-east-1`
- `S3_BUCKET`
- `S3_FORCE_PATH_STYLE=false`
- ACL-disabling storage flag

Optional OAuth, SMTP, encryption, AI, and feature-flag values are accepted through a map variable. Sensitive Terraform variables are marked `sensitive`, but their values still exist in Terraform state and ECS task-definition revisions. Populated `.tfvars` files must never be committed.

## GitHub Actions Deployment

Terraform creates or reuses a GitHub Actions OIDC provider and creates a deployment role restricted by repository and branch variables. Trust policy accepts only the configured GitHub repository and branch.

Local bootstrap and main-stack Terraform providers use AWS CLI profile `aws-sky`. The profile currently authenticates with account-root credentials; this is accepted only for initial hackathon bootstrap, with migration to an IAM administrative role recommended immediately afterward.

Workflow behavior:

1. Trigger on pushes to the configured production branch and manual dispatch.
2. Assume AWS deployment role through GitHub OIDC.
3. Authenticate Docker to ECR.
4. Build repository root `Dockerfile`.
5. Push immutable commit-SHA tag and mutable `latest` tag.
6. Force a new ECS service deployment.
7. Wait for ECS service stability.

Deployment role permissions are limited to ECR image push and ECS service describe/update operations. Terraform remains a separately executed infrastructure workflow; application deployment does not modify Terraform state.

## Failure Handling

- ECS deployment circuit breaker rolls back tasks that fail startup or ALB health checks.
- `/api/health` reports database and storage failures as HTTP 503, preventing unhealthy targets from receiving traffic.
- CloudWatch captures container stdout and stderr for diagnosis.
- S3 versioning protects against accidental replacement and deletion; lifecycle rules remove old noncurrent versions after a configurable retention period.
- Remote Terraform state uses S3 versioning, encryption, public-access blocking, and lockfiles.
- If Supabase or S3 is unavailable, ECS remains deployed but ALB has no healthy targets until dependencies recover.
- If initial ECR image is absent, infrastructure remains created and first GitHub deployment repairs service health.

## Cost and Security Boundaries

The design omits NAT Gateways and runs one task to control cost. Main recurring services are ALB, Fargate, ECR, S3, CloudWatch, and DNS traffic. Public task IPs are accepted because security groups prevent direct inbound access.

Credentials in ECS environment variables and Terraform state are an accepted hackathon shortcut. Production hardening would move secrets to Secrets Manager, create private subnets with controlled egress, separate migrations, add autoscaling and alarms, restrict ALB ingress to Cloudflare ranges when proxying, and use a remote Terraform execution system.

## Verification

Implementation verification includes:

- storage adapter unit tests for task-role credentials and ACL-disabled writes;
- focused package typecheck and tests for environment and storage changes;
- `terraform fmt -check -recursive` for bootstrap and main configurations;
- `terraform init -backend=false` and `terraform validate` for modules where applicable;
- bootstrap and main `terraform plan` with non-secret test inputs;
- GitHub workflow syntax inspection;
- production Docker image build;
- `pnpm exec turbo boundaries` if application package boundaries change;
- `graphify update .` once after all verified changes.

No live `terraform apply`, Cloudflare DNS mutation, ECR push, or ECS deployment occurs without valid user credentials and explicit execution authorization.
