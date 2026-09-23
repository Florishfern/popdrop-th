data "aws_ssm_parameter" "ecs_ami" {
  name = "/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id"
}

resource "aws_ecs_cluster" "main" {
  name = "popdrop-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_launch_template" "ecs_lt" {
  name_prefix   = "popdrop-ecs-lt-"
  image_id      = data.aws_ssm_parameter.ecs_ami.value
  instance_type = "t3.micro"

  iam_instance_profile {
    name = aws_iam_instance_profile.ecs_instance_profile.name
  }

  network_interfaces {
    security_groups             = [aws_security_group.ecs_sg.id]
    associate_public_ip_address = true
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
              
              # Install CloudWatch Agent
              yum install -y amazon-cloudwatch-agent
              
              # Create basic config to monitor disk space
              cat << 'CWCONF' > /opt/aws/amazon-cloudwatch-agent/bin/config.json
              {
                "metrics": {
                  "metrics_collected": {
                    "disk": {
                      "measurement": ["used_percent"],
                      "metrics_collection_interval": 60,
                      "resources": ["/"]
                    }
                  }
                }
              }
              CWCONF
              
              # Start the agent
              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json -s
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "popdrop-ecs-instance"
    }
  }
}

resource "aws_autoscaling_group" "ecs_asg" {
  name                = "popdrop-ecs-asg"
  vpc_zone_identifier = aws_subnet.public[*].id
  min_size            = 1
  max_size            = 3
  desired_capacity    = 1

  target_group_arns         = [aws_lb_target_group.app_tg.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.ecs_lt.id
    version = "$Latest"
  }

  tag {
    key                 = "AmazonECSManaged"
    value               = true
    propagate_at_launch = true
  }

  tag {
    key                 = "Name"
    value               = "popdrop-ecs-instance"
    propagate_at_launch = true
  }
}

resource "aws_ecs_capacity_provider" "ecs_cp" {
  name = "popdrop-ecs-capacity-provider"

  auto_scaling_group_provider {
    auto_scaling_group_arn = aws_autoscaling_group.ecs_asg.arn

    managed_scaling {
      maximum_scaling_step_size = 2
      minimum_scaling_step_size = 1
      status                    = "ENABLED"
      target_capacity           = 100
    }
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = [aws_ecs_capacity_provider.ecs_cp.name]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = aws_ecs_capacity_provider.ecs_cp.name
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "popdrop-app-task"
  network_mode             = "bridge" # Changed from awsvpc to bridge for EC2 compatibility
  requires_compatibilities = ["EC2"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "popdrop-app"
      image     = "${aws_ecr_repository.popdrop_repo.repository_url}:latest"
      cpu       = 256
      memory    = 512
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000 # Map to port 3000 on the host EC2 instance
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/popdrop-app"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      environment = [
        {
          name  = "DATABASE_URL"
          value = "mysql://${var.db_username}:${var.db_password}@${aws_db_instance.popdrop_db.endpoint}/popdropdb"
        },
        {
          name  = "S3_UPLOAD_BUCKET"
          value = aws_s3_bucket.assets_bucket.bucket
        },
        {
          name  = "NEXT_PUBLIC_CLOUDFRONT_URL"
          value = "https://${aws_cloudfront_distribution.cdn.domain_name}"
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "app_service" {
  name            = "popdrop-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ecs_cp.name
    weight            = 100
  }

  # network_configuration is removed because we are using 'bridge' network mode on EC2 instead of 'awsvpc'

  load_balancer {
    target_group_arn = aws_lb_target_group.app_tg.arn
    container_name   = "popdrop-app"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http]
}

resource "aws_cloudwatch_log_group" "ecs_log_group" {
  name              = "/ecs/popdrop-app"
  retention_in_days = 7
}

# ------------------------------------------------------------------
# Auto-Healing: ECS Service CPU Auto Scaling (App Freeze / CPU Spike)
# ------------------------------------------------------------------

resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 3
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_policy_cpu" {
  name               = "cpu-auto-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    scale_in_cooldown  = 60
    scale_out_cooldown = 30

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

# ------------------------------------------------------------------
# SRE Alerts: High CPU & App Freeze (EventBridge to SNS)
# ------------------------------------------------------------------

resource "aws_cloudwatch_event_rule" "ecs_scaling_rule" {
  name        = "popdrop-ecs-scaling-alert"
  description = "Trigger SNS when ECS Auto Scaling occurs (High CPU)"
  event_pattern = jsonencode({
    source      = ["aws.application-autoscaling"]
    detail-type = ["Application Auto Scaling Scaling Activity State Change"]
    detail = {
      resourceId = [aws_appautoscaling_target.ecs_target.resource_id]
    }
  })
}

resource "aws_cloudwatch_event_target" "sns_scaling_target" {
  rule      = aws_cloudwatch_event_rule.ecs_scaling_rule.name
  target_id = "SendToSNS"
  arn       = data.aws_sns_topic.sre_alerts.arn

  input_transformer {
    input_paths = {
      cause  = "$.detail.cause"
      status = "$.detail.statusCode"
    }
    input_template = "\"🚨 ALERT (High CPU): ECS Auto Scaling activity detected. Status: <status>. Cause: <cause>\""
  }
}

resource "aws_cloudwatch_event_rule" "app_freeze_rule" {
  name        = "popdrop-app-freeze-alert"
  description = "Trigger SNS when ECS Task fails ELB Health Check (App Freeze)"
  event_pattern = jsonencode({
    source      = ["aws.ecs"]
    detail-type = ["ECS Task State Change"]
    detail = {
      clusterArn    = [aws_ecs_cluster.main.arn]
      lastStatus    = ["STOPPED"]
      stoppedReason = [{ prefix = "Task failed ELB health checks" }]
    }
  })
}

resource "aws_cloudwatch_event_target" "sns_app_freeze_target" {
  rule      = aws_cloudwatch_event_rule.app_freeze_rule.name
  target_id = "SendToSNS"
  arn       = data.aws_sns_topic.sre_alerts.arn

  input_transformer {
    input_paths = {
      task   = "$.detail.taskArn"
      reason = "$.detail.stoppedReason"
    }
    input_template = "\"🚨 ALERT (App Freeze): A container stopped responding and failed the health check. ECS is automatically replacing it. Reason: <reason>\""
  }
}
