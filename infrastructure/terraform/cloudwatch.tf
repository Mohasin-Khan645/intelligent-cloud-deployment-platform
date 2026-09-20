resource "aws_cloudwatch_log_group" "demo_app" {
  name              = "/ecs/intelligent-cloud-demo-app"
  retention_in_days = 7

  tags = {
    Name    = "intelligent-cloud-demo-app-logs"
    Project = "intelligent-cloud-deployment-platform"
  }
}