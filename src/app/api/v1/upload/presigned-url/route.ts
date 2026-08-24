import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { filename } = body;

  const sanitizedFilename = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, "_") : "upload.png";
  const key = `uploads/${Date.now()}_${sanitizedFilename}`;

  // In production with AWS S3 / R2, use @aws-sdk/s3-request-presigner
  // Here we return a presigned URL format and the public URL destination
  return NextResponse.json({
    uploadUrl: `/api/v1/upload/mock-cloud-s3?key=${encodeURIComponent(key)}`,
    publicUrl: `/images/hirono.png`,
    key,
  });
}
