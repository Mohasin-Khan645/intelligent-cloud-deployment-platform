resource "aws_ecs_service" "demo_app" {
  name            = "intelligent-demo-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.demo_app.arn

  desired_count = 1

  launch_type = "FARGATE"

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  lifecycle {
    ignore_changes = [
      task_definition
    ]
  }

  network_configuration {
    subnets = [
      aws_subnet.public_a.id,
      aws_subnet.public_b.id
    ]

    security_groups = [
      aws_security_group.ecs.id
    ]

    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.demo_app.arn
    container_name   = "demo-app"
    container_port   = 3000
  }

  health_check_grace_period_seconds = 60

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  depends_on = [
    aws_lb_listener.demo_app
  ]

  tags = {
    Name    = "intelligent-demo-service"
    Project = "intelligent-cloud-deployment-platform"
  }
}