resource "aws_ecs_task_definition" "demo_app" {
  family                   = "intelligent-cloud-demo-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = "256"
  memory = "512"

  execution_role_arn = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "demo-app"
      image     = "${aws_ecr_repository.demo_app.repository_url}:1.0.0"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3000"
        },
        {
          name  = "APP_VERSION"
          value = "1.0.0"
        }
      ]

      healthCheck = {
        command = [
          "CMD-SHELL",
          "wget -qO- http://localhost:3000/health || exit 1"
        ]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 10
      }

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          awslogs-group         = aws_cloudwatch_log_group.demo_app.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  tags = {
    Name    = "intelligent-cloud-demo-app-task"
    Project = "intelligent-cloud-deployment-platform"
  }
}