import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const manifestPath = path.join(rootDir, "supabase/seed/storage-manifest.json");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function ensureBucket(bucketName) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    throw error;
  }

  if (!buckets.find((bucket) => bucket.name === bucketName)) {
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024,
    });

    if (createError && !createError.message.toLowerCase().includes("already exists")) {
      throw createError;
    }
  }
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const buckets = new Set(manifest.files.map((item) => item.bucket));

  for (const bucket of buckets) {
    await ensureBucket(bucket);
  }

  for (const file of manifest.files) {
    const localPath = path.join(rootDir, file.localPath);
    const content = await fs.readFile(localPath);
    const { error } = await supabase.storage.from(file.bucket).upload(file.storagePath, content, {
      contentType: file.contentType,
      upsert: true,
    });

    if (error) {
      throw new Error(`Failed uploading ${file.localPath}: ${error.message}`);
    }

    console.log(`Uploaded ${file.localPath} -> ${file.bucket}/${file.storagePath}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
