locals {
  app_domain = "tf-import-gate.mattenarle.com"
}

resource "aws_acm_certificate" "app" {
  domain_name       = local.app_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "app" {
  certificate_arn         = aws_acm_certificate.app.arn
  validation_record_fqdns = [for record in aws_acm_certificate.app.domain_validation_options : record.resource_record_name]
}

resource "aws_apigatewayv2_domain_name" "app" {
  domain_name  = local.app_domain
  routing_mode = "API_MAPPING_ONLY"

  domain_name_configuration {
    certificate_arn = aws_acm_certificate_validation.app.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "app" {
  api_id      = module.import_gate.api_id
  domain_name = aws_apigatewayv2_domain_name.app.id
  stage       = module.import_gate.stage_name
}

output "certificate_validation_records" {
  value = [for record in aws_acm_certificate.app.domain_validation_options : {
    name  = record.resource_record_name
    type  = record.resource_record_type
    value = record.resource_record_value
  }]
}

output "custom_app_url" {
  value = "https://${aws_apigatewayv2_domain_name.app.domain_name}"
}

output "custom_domain_target" {
  value = aws_apigatewayv2_domain_name.app.domain_name_configuration[0].target_domain_name
}
