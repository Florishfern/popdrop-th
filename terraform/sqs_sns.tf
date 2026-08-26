# SQS Queue for Bid Requests
resource "aws_sqs_queue" "bids_queue" {
  name                      = "popdrop-bids-queue"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 86400
  receive_wait_time_seconds = 10

  tags = {
    Name = "popdrop-bids-queue"
  }
}

# SNS Topic for System Alerts
resource "aws_sns_topic" "system_alerts" {
  name = "popdrop-system-alerts"

  tags = {
    Name = "popdrop-system-alerts"
  }
}

# SNS Subscriptions (Email)
resource "aws_sns_topic_subscription" "email_sub" {
  count     = length(var.sns_alert_emails)
  topic_arn = aws_sns_topic.system_alerts.arn
  protocol  = "email"
  endpoint  = var.sns_alert_emails[count.index]
}
