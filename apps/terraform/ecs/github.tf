resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 1 : 0

  client_id_list = ["sts.amazonaws.com"]
  tags           = local.tags
  url            = "https://token.actions.githubusercontent.com"
}

locals {
  github_oidc_provider_arn = one(concat(
    aws_iam_openid_connect_provider.github[*].arn,
    var.github_oidc_provider_arn == null ? [] : [var.github_oidc_provider_arn],
  ))
}

data "aws_iam_policy_document" "github_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      identifiers = [local.github_oidc_provider_arn]
      type        = "Federated"
    }

    condition {
      test     = "StringEquals"
      values   = ["sts.amazonaws.com"]
      variable = "token.actions.githubusercontent.com:aud"
    }

    condition {
      test     = "StringEquals"
      values   = ["repo:${var.github_repository}:ref:refs/heads/${var.github_branch}"]
      variable = "token.actions.githubusercontent.com:sub"
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  assume_role_policy = data.aws_iam_policy_document.github_assume.json
  name               = "${local.name}-github-deploy"
  tags               = local.tags
}

data "aws_iam_policy_document" "github_deploy" {
  statement {
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:CompleteLayerUpload",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart",
    ]
    resources = [aws_ecr_repository.app.arn]
  }

  statement {
    actions   = ["ecs:DescribeServices", "ecs:UpdateService"]
    resources = [aws_ecs_service.app.id]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "deploy-${local.name}"
  policy = data.aws_iam_policy_document.github_deploy.json
  role   = aws_iam_role.github_deploy.id
}
