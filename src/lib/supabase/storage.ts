import { createServiceClient } from './service';

// SERVER ONLY — uses the service role key, which bypasses Row Level
// Security. Never import this file into a Client Component.

export async function uploadFile(bucket: string, path: string, file: File): Promise<string> {
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  });
  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number
): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message ?? 'unknown error'}`);
  }
  return data.signedUrl;
}
