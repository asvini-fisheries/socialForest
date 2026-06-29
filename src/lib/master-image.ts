import { createClient } from '@/lib/supabase/client';

export const MASTER_IMAGE_BUCKET = 'master-images';

/** Master tables that support image/logo/avatar attachments */
export const MASTER_IMAGE_FIELDS: Record<string, string> = {
  years: 'image_url',
  designations: 'image_url',
  certificates: 'image_url',
  csr_partners: 'logo_url',
  organisations: 'logo_url',
  stakeholders: 'image_url',
  activities: 'image_url',
  resource_categories: 'image_url',
  resources_materials: 'image_url',
  users: 'avatar_url',
  projects: 'image_url',
  project_areas: 'image_url',
  project_activities: 'image_url',
  project_user_access: 'image_url',
  stakeholder_categories: 'image_url',
  stakeholder_resources: 'image_url',
  stakeholder_supply_rates: 'image_url',
  stakeholder_category_access_rights: 'image_url',
  organisation_contacts: 'image_url',
  organisation_certificates: 'image_url',
  organisation_employees: 'image_url',
  activity_resource_requirements: 'image_url',
  activity_contractor_allocations: 'image_url',
  work_contracts: 'image_url',
  work_contract_items: 'image_url',
};

export function masterTableSupportsImages(table: string): boolean {
  return table in MASTER_IMAGE_FIELDS;
}

/** DB column used for image per master table */
export function getMasterImageField(table: string): string {
  return MASTER_IMAGE_FIELDS[table] ?? 'image_url';
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

export async function saveRecordImage(
  table: string,
  recordId: string,
  imageField: string,
  file: File | null,
  clear: boolean,
  previousUrl?: string | null
): Promise<string | null> {
  if (!file && !clear) return previousUrl ?? null;

  let imageUrl: string | null = clear ? null : (previousUrl ?? null);

  if (file) {
    if (previousUrl) await removeMasterImageFromUrl(previousUrl).catch(() => {});
    imageUrl = await uploadMasterImage(table, recordId, file);
  }

  const supabase = createClient();
  const { error } = await supabase.from(table).update({ [imageField]: imageUrl }).eq('id', recordId);
  if (error) throw new Error(error.message);

  return imageUrl;
}
