import { createClient } from '@/lib/supabase/client';

export const MASTER_IMAGE_BUCKET = 'master-images';

/** DB column used for image per master table */
export function getMasterImageField(table: string): string {
  if (table === 'csr_partners' || table === 'organisations') return 'logo_url';
  if (table === 'users') return 'avatar_url';
  return 'image_url';
}

export async function uploadMasterImage(
  table: string,
  recordId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${table}/${recordId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(MASTER_IMAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(MASTER_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeMasterImageFromUrl(url: string): Promise<void> {
  const marker = `/storage/v1/object/public/${MASTER_IMAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  const supabase = createClient();
  await supabase.storage.from(MASTER_IMAGE_BUCKET).remove([path]);
}
