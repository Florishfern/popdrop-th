import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-1",
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("file");
    const fileType = searchParams.get("type");

    if (!fileName || !fileType) {
      return NextResponse.json({ message: "Missing file name or type" }, { status: 400 });
    }

    const bucketName = process.env.S3_UPLOAD_BUCKET;
    if (!bucketName) {
      console.error("S3_UPLOAD_BUCKET is not set");
      return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
    }

    const extension = fileName.split('.').pop();
    // Using private prefix so it doesn't get served publicly by CloudFront (which only routes /uploads/* to S3)
    const uniqueKey = `private/documents/${session.user.id}-${Date.now()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueKey,
      ContentType: fileType,
    });

    // 5 minutes expiry for security
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    
    // Do NOT return a publicUrl because this is a private file
    return NextResponse.json({
      uploadUrl,
      key: uniqueKey,
    });
  } catch (error) {
    console.error("Error generating secure presigned URL:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
