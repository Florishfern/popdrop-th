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

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "lambda"
  output_path = "lambda_function_payload.zip"
}

resource "aws_lambda_function" "self_healing" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "popdrop-self-healing"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs20.x"

  environment {
    variables = {
      HEAL_API_URL = "http://${aws_lb.app_alb.dns_name}/api/v1/chaos"
    }
  }
}

# ------------------------------------------------------------------
# Auto-Healing: Website Defaced (Synthetics Canary + EventBridge -> Lambda)
# ------------------------------------------------------------------

resource "aws_s3_bucket" "canary_bucket" {
  bucket        = "popdrop-canary-logs-${random_id.bucket_id.hex}"
  force_destroy = true
}

resource "aws_iam_role" "canary_role" {
  name = "popdrop-canary-role"

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

# Give Canary full access to CloudWatch and S3 for artifacts
resource "aws_iam_role_policy_attachment" "canary_policy" {
  role       = aws_iam_role.canary_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchSyntheticsFullAccess"
}

data "archive_file" "canary_zip" {
  type        = "zip"
  source_dir  = "canary"
  output_path = "canary_payload.zip"
}

resource "aws_synthetics_canary" "defacement_guard" {
  name                 = "popdrop-guard-bot"
  artifact_s3_location = "s3://${aws_s3_bucket.canary_bucket.bucket}/"
  execution_role_arn   = aws_iam_role.canary_role.arn
  handler              = "index.handler"
  zip_file             = data.archive_file.canary_zip.output_path
  runtime_version      = "syn-nodejs-puppeteer-9.1"
  start_canary         = true

  schedule {
    expression = "rate(1 minute)"
  }

  run_config {
    timeout_in_seconds = 60
    environment_variables = {
      TARGET_URL = "http://${aws_lb.app_alb.dns_name}/"
    }
  }
}

resource "aws_cloudwatch_event_rule" "defaced_rule" {
  name        = "popdrop-defaced-remediation"
  description = "Trigger Lambda when Canary fails (Defaced)"

  event_pattern = jsonencode({
    source      = ["aws.synthetics"]
    detail-type = ["Synthetics Canary TestRun Failure"]
    detail = {
      "canary-name"     = [aws_synthetics_canary.defacement_guard.name]
      "test-run-status" = ["FAILED"]
    }
  })
}

resource "aws_cloudwatch_event_target" "trigger_lambda" {
  rule      = aws_cloudwatch_event_rule.defaced_rule.name
  target_id = "TriggerSelfHealingLambda"
  arn       = aws_lambda_function.self_healing.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.self_healing.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.defaced_rule.arn
}

# ------------------------------------------------------------------
# Auto-Healing: Disk Full (CloudWatch Alarm + EventBridge + SSM)
# ------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "disk_full_alarm" {
  alarm_name          = "popdrop-disk-full-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "disk_used_percent"
  namespace           = "CWAgent"
  period              = "60"
  statistic           = "Average"
  threshold           = "90"
  alarm_description   = "Triggers when EC2 disk usage is 90% or above"
  alarm_actions       = [data.aws_sns_topic.sre_alerts.arn]

  # Monitor all instances with this image/path
  dimensions = {
    path = "/"
  }
}

resource "aws_iam_role" "eventbridge_ssm_role" {
  name = "popdrop-eventbridge-ssm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "eventbridge_ssm_policy" {
  name = "popdrop-eventbridge-ssm-policy"
  role = aws_iam_role.eventbridge_ssm_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:SendCommand"
        ]
        Resource = [
          "arn:aws:ssm:*:*:document/AWS-RunShellScript",
          "arn:aws:ec2:*:*:instance/*"
        ]
      }
    ]
  })
}

resource "aws_cloudwatch_event_rule" "disk_full_rule" {
  name        = "popdrop-disk-full-remediation"
  description = "Trigger SSM Run Command to clear disk when alarm fires"

  event_pattern = jsonencode({
    source      = ["aws.cloudwatch"]
    detail-type = ["CloudWatch Alarm State Change"]
    detail = {
      alarmName = [aws_cloudwatch_metric_alarm.disk_full_alarm.alarm_name]
      state = {
        value = ["ALARM"]
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "run_ssm_command" {
  rule      = aws_cloudwatch_event_rule.disk_full_rule.name
  target_id = "ClearDiskSpace"
  # Target the SSM RunShellScript document
  arn      = "arn:aws:ssm:${var.aws_region}::document/AWS-RunShellScript"
  role_arn = aws_iam_role.eventbridge_ssm_role.arn

  # Target instances tagged with "popdrop-ecs-instance" (from our Launch Template)
  run_command_targets {
    key    = "tag:Name"
    values = ["popdrop-ecs-instance"]
  }

  input = jsonencode({
    commands = ["rm -f /tmp/chaos-dummy.log && echo 'Auto-Remediation: Cleared chaos dummy log'"]
  })
}

resource "aws_iam_role_policy" "canary_s3_policy" {
  name = "popdrop-canary-s3-policy"
  role = aws_iam_role.canary_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.canary_bucket.arn,
          "${aws_s3_bucket.canary_bucket.arn}/*"
        ]
      }
    ]
  })
}

# ------------------------------------------------------------------
# SRE Alerts: Disk Full SSM Remediation & Website Defacement (EventBridge to SNS)
# ------------------------------------------------------------------

resource "aws_cloudwatch_event_rule" "ssm_remediation_alert" {
  name        = "popdrop-ssm-remediation-alert"
  description = "Trigger SNS when SSM Run Command completes (Disk Full)"
  event_pattern = jsonencode({
    source      = ["aws.ssm"]
    detail-type = ["EC2 Command Status-change Notification"]
    detail = {
      status = ["Success", "Failed"]
    }
  })
}

resource "aws_cloudwatch_event_target" "sns_ssm_alert" {
  rule      = aws_cloudwatch_event_rule.ssm_remediation_alert.name
  target_id = "SendToSNS"
  arn       = data.aws_sns_topic.sre_alerts.arn

  input_transformer {
    input_paths = {
      doc      = "$.detail.document-name"
      status   = "$.detail.status"
      instance = "$.detail.instance-id"
    }
    input_template = "\"🚨 ALERT (Disk Full Remediation): SSM Document <doc> execution on instance <instance> resulted in <status>. The disk space has been cleared automatically.\""
  }
}

resource "aws_cloudwatch_event_target" "sns_defaced_alert" {
  rule      = aws_cloudwatch_event_rule.defaced_rule.name
  target_id = "SendToSNS"
  arn       = data.aws_sns_topic.sre_alerts.arn

  input_transformer {
    input_paths = {
      canary = "$.detail.canary-name"
      status = "$.detail.test-run-status"
    }
    input_template = "\"🚨 ALERT (Website Defacement): Canary <canary> detected a 500 Error (Status: <status>). Self-healing Lambda has been triggered to restore the database to normal.\""
  }
}
