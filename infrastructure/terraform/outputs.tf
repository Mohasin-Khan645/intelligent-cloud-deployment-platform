output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.demo_app.dns_name
}