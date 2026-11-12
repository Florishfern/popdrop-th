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

# CloudFront Origin Access Control (OAC) for S3
resource "aws_cloudfront_origin_access_control" "default" {
  name                              = "popdrop-oac"
  description                       = "OAC for PopDrop assets bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 Failover Page for CloudFront Origin Failover (Disaster Recovery Demonstration)
resource "aws_s3_object" "failover_page" {
  bucket       = aws_s3_bucket.assets_bucket.id
  key          = "index.html"
  content      = <<-HTML
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PopDropTH | CloudFront Edge Failover</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0c0d14; color: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px; }
        .card { background: #161824; border: 1px solid #2b2f4a; border-radius: 24px; padding: 48px 32px; max-width: 520px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .badge { display: inline-block; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px; }
        h1 { font-size: 28px; font-weight: 800; margin: 0 0 16px 0; color: #ffffff; }
        p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; }
        .meta { font-family: monospace; font-size: 12px; color: #64748b; background: #0f111a; padding: 12px; border-radius: 12px; border: 1px solid #1e2235; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">CloudFront Origin Failover Active</div>
        <h1>PopDropTH Resilience Mode</h1>
        <p>The primary Application Load Balancer is temporarily recovering or simulating chaos.<br>You are safely viewing this failover page served globally from Amazon S3 Edge Storage.</p>
        <div class="meta">Origin: AWS CloudFront + Amazon S3 Origin Group</div>
      </div>
    </body>
    </html>
  HTML
  content_type = "text/html"
}

# S3 Bucket Policy allowing Public Read on uploads AND CloudFront OAC for full bucket
resource "aws_s3_bucket_policy" "allow_public_and_cloudfront" {
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
      },
      {
        Sid       = "AllowCloudFrontOAC"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.assets_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn
          }
        }
      }
    ]
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "" # Handled dynamically by ALB / Next.js

  # Origin 1: ALB (Next.js Application & Live Bidding)
  origin {
    domain_name = aws_lb.app_alb.dns_name
    origin_id   = "ALBOrigin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Origin 2: S3 (Static Uploads & Disaster Recovery Failover)
  origin {
    domain_name              = aws_s3_bucket.assets_bucket.bucket_regional_domain_name
    origin_id                = "S3Origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.default.id
  }

  # Origin Group for High Availability / Disaster Recovery Failover
  origin_group {
    origin_id = "PopdropOriginGroup"

    failover_criteria {
      status_codes = [500, 502, 503, 504]
    }

    member {
      origin_id = "ALBOrigin"
    }

    member {
      origin_id = "S3Origin"
    }
  }

  # Dynamic API Routes (All HTTP methods allowed, Bypass Cache to ALB directly)
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALBOrigin"

    forwarded_values {
      query_string = true
      headers      = ["Accept", "Accept-Language", "Authorization", "Content-Type", "Origin", "Referer", "User-Agent"]

      cookies {
        forward = "all"
      }
    }

    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  # Static Assets from S3 (/uploads/* - Cached for High Performance)
  ordered_cache_behavior {
    path_pattern     = "/uploads/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  # Default Cache Behavior (Page routes -> Origin Group with Failover to S3)
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "PopdropOriginGroup"

    forwarded_values {
      query_string = true
      headers      = ["Accept", "Accept-Language", "Authorization", "Origin", "Referer", "User-Agent"]

      cookies {
        forward = "all"
      }
    }

    min_ttl                = 0
    default_ttl            = 0 # Dynamic pages always fresh
    max_ttl                = 0
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "popdrop-cloudfront"
  }
}
