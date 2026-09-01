data "aws_iam_policy_document" "ecs_task_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"

    principals {
      identifiers = ["ecs-tasks.amazonaws.com"]
      type        = "Service"
    }
  }
}

resource "aws_iam_role" "execution" {
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
  name               = "${local.name}-execution"
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  role       = aws_iam_role.execution.name
}

resource "aws_iam_role" "task" {
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
  name               = "${local.name}-task"
  tags               = local.tags
}

data "aws_iam_policy_document" "task_storage" {
  statement {
    actions   = ["s3:ListBucket"]
    resources = [var.application_bucket_arn]
  }

  statement {
    actions   = ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"]
    resources = ["${var.application_bucket_arn}/*"]
  }
}

resource "aws_iam_role_policy" "task_storage" {
  name   = "application-storage"
  policy = data.aws_iam_policy_document.task_storage.json
  role   = aws_iam_role.task.id
}
