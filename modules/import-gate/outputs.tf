output "app_url" {
  value = aws_apigatewayv2_api.app.api_endpoint
}

output "api_id" {
  value = aws_apigatewayv2_api.app.id
}

output "stage_name" {
  value = aws_apigatewayv2_stage.app.name
}

output "log_group_name" {
  value = "/aws/lambda/${aws_lambda_function.app.function_name}"
}
