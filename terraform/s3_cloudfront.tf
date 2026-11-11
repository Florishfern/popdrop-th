# S3 Bucket for Static Assets & Uploads
resource "random_id" "bucket_id" {
  byte_length = 4
}

resource "aws_s3_bucket" "assets_bucket" {
  bucket        = "popdrop-assets-${random_id.bucket_id.hex}"
  force_destroy = true

  tags = {
    Name = "popdrop-assets"
  }
}

resource "aws_s3_bucket_cors_configuration" "assets_bucket_cors" {
  bucket = aws_s3_bucket.assets_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_public_access_block" "assets_bucket_pab" {
  bucket = aws_s3_bucket.assets_bucket.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "allow_public_read_uploads" {
  bucket = aws_s3_bucket.assets_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadUploads"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.assets_bucket.arn}/uploads/*"
      }
    ]
  })
}
