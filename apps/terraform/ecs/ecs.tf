resource "aws_ecs_cluster" "app" {
  name = local.name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.tags
}

resource "aws_ecs_task_definition" "app" {
  container_definitions = jsonencode([
    {
      name      = local.name
      image     = "${aws_ecr_repository.app.repository_url}:latest"
      essential = true
      environment = [
        for name in sort(keys(var.environment_variables)) : {
          name  = name
          value = var.environment_variables[name]
        }
      ]
      healthCheck = {
        command = [
          "CMD-SHELL",
          "node -e \"fetch('http://127.0.0.1:${var.container_port}${var.health_check_path}').then((r)=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))\"",
        ]
        interval    = 30
        retries     = 3
        startPeriod = 60
        timeout     = 10
      }
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.app.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "app"
        }
      }
      portMappings = [
        {
          appProtocol   = "http"
          containerPort = var.container_port
          hostPort      = var.container_port
          name          = "http"
          protocol      = "tcp"
        }
      ]
    }
  ])
  cpu                      = tostring(var.task_cpu)
  execution_role_arn       = aws_iam_role.execution.arn
  family                   = local.name
  memory                   = tostring(var.task_memory)
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  task_role_arn            = aws_iam_role.task.arn

  runtime_platform {
    cpu_architecture        = "X86_64"
    operating_system_family = "LINUX"
  }

  tags = local.tags
}

resource "aws_ecs_service" "app" {
  cluster                            = aws_ecs_cluster.app.id
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 0
  desired_count                      = var.desired_count
  health_check_grace_period_seconds  = 120
  launch_type                        = "FARGATE"
  name                               = local.name
  task_definition                    = aws_ecs_task_definition.app.arn
  wait_for_steady_state              = false

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  load_balancer {
    container_name   = local.name
    container_port   = var.container_port
    target_group_arn = aws_lb_target_group.app.arn
  }

  network_configuration {
    assign_public_ip = true
    security_groups  = [aws_security_group.ecs.id]
    subnets          = aws_subnet.public[*].id
  }

  depends_on = [aws_lb_listener.https]

  tags = local.tags
}
