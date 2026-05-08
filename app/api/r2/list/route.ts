import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET, PROMPTS_PREFIX } from "@/lib/r2";

export async function GET() {
  try {
    const client = getR2Client();
    const ids: string[] = [];
    let continuationToken: string | undefined;

    do {
      const result = await client.send(
        new ListObjectsV2Command({
          Bucket: R2_BUCKET,
          Prefix: PROMPTS_PREFIX,
          ContinuationToken: continuationToken,
        })
      );

      for (const obj of result.Contents ?? []) {
        const name = obj.Key?.replace(PROMPTS_PREFIX, "").split(".")[0];
        if (name) {
          ids.push(name);
        }
      }

      continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
    } while (continuationToken);

    return NextResponse.json({ ids });
  } catch (err) {
    const message = err instanceof Error ? err.message : "목록 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message, ids: [] }, { status: 500 });
  }
}
