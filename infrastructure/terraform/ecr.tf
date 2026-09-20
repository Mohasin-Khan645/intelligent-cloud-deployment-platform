resource "aws_ecr_repository" "demo_app" {
  name                 = "intelligent-cloud-demo-app"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name    = "intelligent-cloud-demo-app"
    Project = "intelligent-cloud-deployment-platform"
  }
}