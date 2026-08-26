# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "PopDrop-System-Dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.app_service.name, "ClusterName", aws_ecs_cluster.main.name]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS CPU Utilization"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.popdrop_db.identifier]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS CPU Utilization"
        }
      }
    ]
  })
}

# AWS Budget to monitor cost
resource "aws_budgets_budget" "cost_budget" {
  name         = "popdrop-monthly-budget"
  budget_type  = "COST"
  limit_amount = "5.0" # Alert at $5
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.sns_alert_emails
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "popdrop-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Function (Placeholder for Self-Healing / Chaos script)
# You need to provide the actual python/js code in a zip file later
# resource "aws_lambda_function" "self_healing" {
#   filename         = "lambda_function_payload.zip"
#   function_name    = "popdrop-self-healing"
#   role             = aws_iam_role.lambda_role.arn
#   handler          = "index.handler"
#   source_code_hash = filebase64sha256("lambda_function_payload.zip")
#   runtime          = "nodejs20.x"
# }
