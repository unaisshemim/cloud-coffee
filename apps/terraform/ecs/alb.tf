resource "aws_lb" "app" {
  name               = local.name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  tags               = local.tags
}

resource "aws_lb_target_group" "app" {
  deregistration_delay = 30
  name                 = local.name
  port                 = var.container_port
  protocol             = "HTTP"
  protocol_version     = "HTTP1"
  target_type          = "ip"
  vpc_id               = aws_vpc.app.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = var.health_check_path
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = local.tags
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  certificate_arn   = var.certificate_arn
  load_balancer_arn = aws_lb.app.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"

  default_action {
    target_group_arn = aws_lb_target_group.app.arn
    type             = "forward"
  }
}
