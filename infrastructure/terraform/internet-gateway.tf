resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name    = "intelligent-cloud-igw"
    Project = "intelligent-cloud-deployment-platform"
  }
}