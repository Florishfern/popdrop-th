data "aws_caller_identity" "current" {}


resource "aws_sns_topic_policy" "default" {
  arn = aws_sns_topic.system_alerts.arn

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
        Resource = aws_sns_topic.system_alerts.arn
      }
    ]
  })
}
