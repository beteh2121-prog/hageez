import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// SERVER ONLY — uses the service role key, which bypasses Row Level
// Security. Never import this file into a Client Component.
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function uploadFile(bucket: string, path: string, file: File): Promise<string> {
  const supabase = getServiceClient();
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
  const supabase = getServiceClient();
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
  const supabase = getServiceClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message ?? 'unknown error'}`);
  }
  return data.signedUrl;
}
