import { validateImageFile } from '../lib/fileValidation';
import { supabase } from '../lib/supabase';

const getFileExtension = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension && /^[a-z0-9]+$/.test(extension) ? extension : 'bin';
};

export const buildUserAssetPath = (userId: string, fileName: string): string => {
  const extension = getFileExtension(fileName);
  return `user_assets/${userId}/${crypto.randomUUID()}.${extension}`;
};

export const uploadAsset = async (file: File): Promise<string> => {
  const validation = await validateImageFile(file);
  if (!validation.ok) throw new Error(validation.error);

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Please sign in to upload.');

  const filePath = buildUserAssetPath(user.id, file.name);
  const { error: uploadError } = await supabase.storage
    .from('assets')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('assets').getPublicUrl(filePath);
  return data.publicUrl;
};
