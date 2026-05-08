import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET, PROMPTS_PREFIX } from "@/lib/r2";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const id = formData.get("id") as string | null;

    if (!file || !id) {
      return NextResponse.json({ error: "파일과 프롬프트 ID가 필요합니다." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "JPG, PNG, WebP, GIF 파일만 업로드할 수 있습니다." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "이미지 파일은 10MB 이하여야 합니다." }, { status: 400 });
    }

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const key = `${PROMPTS_PREFIX}${id}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const client = getR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    return NextResponse.json({
      success: true,
      key,
      url: publicUrl ? `${publicUrl}/${key}` : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
