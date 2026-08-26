resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "popdrop-rds-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "popdrop-rds-subnet-group"
  }
}

resource "aws_db_instance" "popdrop_db" {
  identifier           = "popdrop-db"
  engine               = "mysql"
  engine_version       = "8.0"
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  storage_type         = "gp2"
  db_name              = "popdropdb"
  username             = var.db_username
  password             = var.db_password
  parameter_group_name = "default.mysql8.0"
  skip_final_snapshot  = true # Set to false in real production
  publicly_accessible  = false

  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name

  tags = {
    Name = "popdrop-rds"
  }
}
