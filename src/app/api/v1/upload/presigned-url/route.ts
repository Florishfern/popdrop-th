import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-1",
  // If running in AWS environment (like ECS/App Runner with IAM roles), credentials are automatically loaded.
  // Otherwise, fallback to env vars for local development.
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, fileType } = body;

    const sanitizedFilename = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, "_") : "upload.png";
    const key = `uploads/${Date.now()}_${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_UPLOAD_BUCKET || "popdrop-assets-98b5ce56",
      Key: key,
      ContentType: fileType || "image/png",
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // In production, we'd typically have a CloudFront distribution pointing to this S3 bucket.
    // For now, construct the public URL directly to the S3 bucket if CloudFront is not provided for assets.
    const cloudFrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || `https://${process.env.S3_UPLOAD_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    const publicUrl = `${cloudFrontUrl}/${key}`;

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}
