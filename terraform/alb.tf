resource "aws_lb" "app_alb" {
  name               = "popdrop-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public[*].id

  tags = {
    Name = "popdrop-alb"
  }
}

resource "aws_lb_target_group" "app_tg" {
  name_prefix = "pd-tg-" # Changed from 'name = "popdrop-tg"' to support create_before_destroy recreation
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 10
    timeout             = 60
    interval            = 300
    matcher             = "200,301,302"
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "popdrop-tg"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}
