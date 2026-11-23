# Preserve the state from the initial deployment root.

moved {
  from = aws_apigatewayv2_api.app
  to   = module.import_gate.aws_apigatewayv2_api.app
}

moved {
  from = aws_apigatewayv2_stage.app
  to   = module.import_gate.aws_apigatewayv2_stage.app
}

moved {
  from = aws_bedrock_guardrail.notes
  to   = module.import_gate.aws_bedrock_guardrail.notes
}

moved {
  from = aws_bedrock_guardrail_version.notes
  to   = module.import_gate.aws_bedrock_guardrail_version.notes
}

moved {
  from = aws_bedrockagentcore_harness.reviewer
  to   = module.import_gate.aws_bedrockagentcore_harness.reviewer
}

moved {
  from = aws_iam_role.app
  to   = module.import_gate.aws_iam_role.app
}

moved {
  from = aws_iam_role.harness
  to   = module.import_gate.aws_iam_role.harness
}

moved {
  from = aws_iam_role_policy.harness
  to   = module.import_gate.aws_iam_role_policy.harness
}
