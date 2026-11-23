output "app_url" {
  value = aws_apigatewayv2_api.app.api_endpoint
}

output "log_group_name" {
  value = "/aws/lambda/${aws_lambda_function.app.function_name}"
}
