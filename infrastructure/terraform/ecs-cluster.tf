resource "aws_ecs_cluster" "main" {
  name = "intelligent-cloud-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name    = "intelligent-cloud-cluster"
    Project = "intelligent-cloud-deployment-platform"
  }
}