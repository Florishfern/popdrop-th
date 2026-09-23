data "aws_caller_identity" "current" {}

data "aws_sns_topic" "sre_alerts" {
  name = "popdrop-system-alerts"
}

resource "aws_sns_topic_policy" "default" {
  arn = data.aws_sns_topic.sre_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPublishFromCloudWatchAndEventBridge"
        Effect = "Allow"
        Principal = {
          Service = [
            "events.amazonaws.com",
            "cloudwatch.amazonaws.com"
          ]
        }
        Action   = "sns:Publish"
        Resource = data.aws_sns_topic.sre_alerts.arn
      }
    ]
  })
}
