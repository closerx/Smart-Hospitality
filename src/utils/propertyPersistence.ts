import { supabase } from '../lib/supabase';
import { PropertyStatus } from '../types/property';

export interface PropertyMetadata {
  deletionReason?: string;
  deletionRequestedAt?: string;
  deletionRequestedBy?: string;
  previousStatus?: PropertyStatus;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
}

/**
 * Unpacks clean description and metadata JSON from a stored description string.
 */
export function unpackPropertyMetadata(rawDescription: string | undefined | null): {
  cleanDescription: string;
  meta: PropertyMetadata;
} {
  if (!rawDescription) {
    return { cleanDescription: '', meta: {} };
  }

  const match = rawDescription.match(/<!--meta:([\s\S]*?)-->/);
  let meta: PropertyMetadata = {};
  if (match && match[1]) {
    try {
      meta = JSON.parse(match[1]);
    } catch {
      meta = {};
    }
  }

  const cleanDescription = rawDescription.replace(/<!--meta:[\s\S]*?-->/g, '').trim();
  return { cleanDescription, meta };
}

/**
 * Packs metadata into a description string in a non-destructive HTML comment format.
 */
export function packPropertyMetadata(
  existingDescription: string | undefined | null,
  newMeta: Partial<PropertyMetadata>
): string {
  const { cleanDescription, meta: existingMeta } = unpackPropertyMetadata(existingDescription);
  const mergedMeta: PropertyMetadata = { ...existingMeta, ...newMeta };

  // Remove keys that are null or undefined
  for (const key of Object.keys(mergedMeta) as (keyof PropertyMetadata)[]) {
    if (mergedMeta[key] === null || mergedMeta[key] === undefined || mergedMeta[key] === '') {
      delete mergedMeta[key];
    }
  }

  const hasMeta = Object.keys(mergedMeta).length > 0;
  if (!hasMeta) {
    return cleanDescription;
  }

  const metaTag = `<!--meta:${JSON.stringify(mergedMeta)}-->`;
  return cleanDescription ? `${cleanDescription}\n\n${metaTag}` : metaTag;
}

/**
 * Safely updates a property row in Supabase.
 * - Packs lifecycle metadata (deletionReason, rejectionReason, etc.) into description
 * - Automatically handles PGRST204 missing column errors by pruning unsupported columns and retrying
 */
export async function safeUpdateProperty(
  propertyId: string,
  updates: {
    status?: PropertyStatus;
    description?: string;
    currentDescription?: string | null;
    deletionReason?: string | null;
    deletionRequestedAt?: string | null;
    deletionRequestedBy?: string | null;
    previousStatus?: PropertyStatus | null;
    rejectionReason?: string | null;
    reviewedAt?: string | null;
    reviewedBy?: string | null;
    reviewerNotes?: string | null;
    [key: string]: any;
  }
): Promise<void> {
  const now = new Date().toISOString();

  // Extract metadata fields to be encoded
  const metaFields: Partial<PropertyMetadata> = {};
  if (updates.deletionReason !== undefined) metaFields.deletionReason = updates.deletionReason || undefined;
  if (updates.deletionRequestedAt !== undefined) metaFields.deletionRequestedAt = updates.deletionRequestedAt || undefined;
  if (updates.deletionRequestedBy !== undefined) metaFields.deletionRequestedBy = updates.deletionRequestedBy || undefined;
  if (updates.previousStatus !== undefined) metaFields.previousStatus = updates.previousStatus || undefined;
  if (updates.rejectionReason !== undefined) metaFields.rejectionReason = updates.rejectionReason || undefined;
  if (updates.reviewedAt !== undefined) metaFields.reviewedAt = updates.reviewedAt || undefined;
  if (updates.reviewedBy !== undefined) metaFields.reviewedBy = updates.reviewedBy || undefined;
  if (updates.reviewerNotes !== undefined) metaFields.reviewerNotes = updates.reviewerNotes || undefined;

  const baseDescription = updates.description !== undefined ? updates.description : updates.currentDescription;
  const packedDescription = packPropertyMetadata(baseDescription, metaFields);

  const payload: Record<string, any> = {
    updated_at: now,
    ...updates,
    description: packedDescription,
  };

  delete payload.currentDescription;

  let attempts = 0;
  while (attempts < 15) {
    attempts++;
    const { error } = await supabase
      .from('properties')
      .update(payload)
      .eq('id', propertyId);

    if (!error) {
      return;
    }

    // Auto-heal missing column error (PGRST204)
    if (error.code === 'PGRST204' || (error.message && error.message.includes('Could not find the'))) {
      const match = error.message.match(/Could not find the '([^']+)' column/i);
      if (match && match[1]) {
        const missingCol = match[1];
        delete payload[missingCol];
        continue;
      }
    }

    throw error;
  }
}
