data "cloudflare_zone" "app" {
  filter = {
    name = var.domain_name
  }
}

resource "aws_acm_certificate" "app" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

locals {
  certificate_validation_options = {
    for option in aws_acm_certificate.app.domain_validation_options : option.domain_name => {
      name  = trimsuffix(option.resource_record_name, ".")
      type  = option.resource_record_type
      value = trimsuffix(option.resource_record_value, ".")
    }
  }
}

resource "cloudflare_dns_record" "acm_validation" {
  for_each = local.certificate_validation_options

  content = each.value.value
  name    = each.value.name
  proxied = false
  ttl     = 60
  type    = each.value.type
  zone_id = data.cloudflare_zone.app.id
}

resource "aws_acm_certificate_validation" "app" {
  certificate_arn = aws_acm_certificate.app.arn
  validation_record_fqdns = [
    for record in cloudflare_dns_record.acm_validation : record.name
  ]
}

resource "cloudflare_dns_record" "app" {
  content = module.ecs.alb_dns_name
  name    = "@"
  proxied = var.cloudflare_proxy_enabled
  ttl     = var.cloudflare_proxy_enabled ? 1 : 300
  type    = "CNAME"
  zone_id = data.cloudflare_zone.app.id
}
