resource "aws_lb_target_group" "demo_app" {
  name        = "intelligent-demo-tg"
  port        = 3000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    protocol            = "HTTP"
    path                = "/health"
    port                = "3000"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name    = "intelligent-demo-tg"
    Project = "intelligent-cloud-deployment-platform"
  }
}

resource "aws_lb" "demo_app" {
  name               = "intelligent-demo-alb"
  internal           = false
  load_balancer_type = "application"

  security_groups = [
    aws_security_group.alb.id
  ]

  subnets = [
    aws_subnet.public_a.id,
    aws_subnet.public_b.id
  ]

  tags = {
    Name    = "intelligent-demo-alb"
    Project = "intelligent-cloud-deployment-platform"
  }
}

resource "aws_lb_listener" "demo_app" {
  load_balancer_arn = aws_lb.demo_app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.demo_app.arn
  }
}