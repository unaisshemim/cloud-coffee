locals {
  name = "${var.project_name}-${var.environment}"
  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = var.project_name
  }
}

resource "aws_vpc" "app" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.tags, { Name = "${local.name}-vpc" })
}

resource "aws_internet_gateway" "app" {
  vpc_id = aws_vpc.app.id
  tags   = merge(local.tags, { Name = "${local.name}-igw" })
}

resource "aws_subnet" "public" {
  count = 2

  availability_zone       = var.availability_zones[count.index]
  cidr_block              = var.public_subnet_cidrs[count.index]
  map_public_ip_on_launch = true
  vpc_id                  = aws_vpc.app.id

  tags = merge(local.tags, { Name = "${local.name}-public-${count.index + 1}" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.app.id
  tags   = merge(local.tags, { Name = "${local.name}-public" })
}

resource "aws_route" "internet" {
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.app.id
  route_table_id         = aws_route_table.public.id
}

resource "aws_route_table_association" "public" {
  count = 2

  route_table_id = aws_route_table.public.id
  subnet_id      = aws_subnet.public[count.index].id
}

resource "aws_security_group" "alb" {
  description = "Public HTTPS entrypoint for ${local.name}"
  name        = "${local.name}-alb"
  vpc_id      = aws_vpc.app.id
  tags        = merge(local.tags, { Name = "${local.name}-alb" })
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  cidr_ipv4         = "0.0.0.0/0"
  description       = "HTTP redirect entrypoint"
  from_port         = 80
  ip_protocol       = "tcp"
  security_group_id = aws_security_group.alb.id
  to_port           = 80
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  cidr_ipv4         = "0.0.0.0/0"
  description       = "HTTPS application entrypoint"
  from_port         = 443
  ip_protocol       = "tcp"
  security_group_id = aws_security_group.alb.id
  to_port           = 443
}

resource "aws_vpc_security_group_egress_rule" "alb" {
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  security_group_id = aws_security_group.alb.id
}

resource "aws_security_group" "ecs" {
  description = "Application tasks for ${local.name}"
  name        = "${local.name}-ecs"
  vpc_id      = aws_vpc.app.id
  tags        = merge(local.tags, { Name = "${local.name}-ecs" })
}

resource "aws_vpc_security_group_ingress_rule" "ecs_from_alb" {
  description                  = "Application traffic from ALB"
  from_port                    = var.container_port
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.alb.id
  security_group_id            = aws_security_group.ecs.id
  to_port                      = var.container_port
}

resource "aws_vpc_security_group_egress_rule" "ecs" {
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  security_group_id = aws_security_group.ecs.id
}
