resource "aws_ecr_repository" "popdrop_repo" {
  name                 = "popdrop-app"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "popdrop-ecr"
  }
}
