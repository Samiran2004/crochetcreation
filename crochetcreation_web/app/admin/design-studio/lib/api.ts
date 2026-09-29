import { apiFetch, getApiUrl } from '../../../utils/apiFetch';
import type { DesignAsset, DesignRecord, DesignSummary } from './types';

const base = () => `${getApiUrl()}/api/admin/designs`;

/**
 * The API serializes Mongo documents with their `_id` key (every other admin
 * screen reads it the same way), so normalize once here and let the rest of
 * the Studio work with a plain `id`.
 */
const withId = <T extends { _id?: string; id?: string }>(raw: T) => ({
  ...raw,
  id: raw._id ?? raw.id ?? '',
});

const fail = async (res: Response, fallback: string): Promise<never> => {
  let detail = fallback;
  try {
    const body = await res.json();
    if (typeof body?.detail === 'string') detail = body.detail;
  } catch {
    // A non-JSON error body (a proxy timeout page, say) keeps the fallback.
  }
  throw new Error(detail);
};

export const listDesigns = async (): Promise<DesignSummary[]> => {
  const res = await apiFetch(base());
  if (!res.ok) return fail(res, 'Could not load your designs.');
  const data = await res.json();
  return (data.items ?? []).map(withId) as DesignSummary[];
};

export const getDesign = async (id: string): Promise<DesignRecord> => {
  const res = await apiFetch(`${base()}/${id}`);
  if (!res.ok) return fail(res, 'Could not open that design.');
  return withId(await res.json()) as DesignRecord;
};

export const createDesign = async (payload: {
  name: string;
  width: number;
  height: number;
  preset_key?: string | null;
  canvas_json?: Record<string, unknown> | null;
}): Promise<DesignRecord> => {
  const res = await apiFetch(base(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return fail(res, 'Could not create the design.');
  return withId(await res.json()) as DesignRecord;
};

export const updateDesign = async (
  id: string,
  payload: {
    name?: string;
    width?: number;
    height?: number;
    preset_key?: string | null;
    canvas_json?: Record<string, unknown> | null;
    thumbnail_data_url?: string | null;
  },
): Promise<DesignRecord> => {
  const res = await apiFetch(`${base()}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return fail(res, 'Could not save the design.');
  return withId(await res.json()) as DesignRecord;
};

export const duplicateDesign = async (id: string): Promise<DesignRecord> => {
  const res = await apiFetch(`${base()}/${id}/duplicate`, { method: 'POST' });
  if (!res.ok) return fail(res, 'Could not duplicate the design.');
  return withId(await res.json()) as DesignRecord;
};

export const deleteDesign = async (id: string): Promise<void> => {
  const res = await apiFetch(`${base()}/${id}`, { method: 'DELETE' });
  if (!res.ok) await fail(res, 'Could not delete the design.');
};

export const listAssets = async (): Promise<DesignAsset[]> => {
  const res = await apiFetch(`${base()}/assets/library`);
  if (!res.ok) return fail(res, 'Could not load your uploads.');
  const data = await res.json();
  return (data ?? []).map(withId) as DesignAsset[];
};

export const uploadAsset = async (file: File): Promise<DesignAsset> => {
  const form = new FormData();
  form.append('file', file);
  const res = await apiFetch(`${base()}/assets/upload`, { method: 'POST', body: form });
  if (!res.ok) return fail(res, 'Could not upload that image.');
  return withId(await res.json()) as DesignAsset;
};

export const deleteAsset = async (id: string): Promise<void> => {
  const res = await apiFetch(`${base()}/assets/${id}`, { method: 'DELETE' });
  if (!res.ok) await fail(res, 'Could not delete that upload.');
};

export const publishRender = async (
  dataUrl: string,
  filename?: string,
): Promise<DesignAsset> => {
  const res = await apiFetch(`${base()}/assets/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data_url: dataUrl, filename }),
  });
  if (!res.ok) return fail(res, 'Could not publish that image.');
  return withId(await res.json()) as DesignAsset;
};

export interface UrlImportResult {
  kind: 'svg' | 'image';
  svg: string | null;
  asset: DesignAsset | null;
}

/**
 * Bring in an icon or image from another site (Icons8, a CDN, anywhere).
 *
 * This goes through the API rather than `fetch` in the page because icon
 * hosts rarely send CORS headers — the browser can display such an image but
 * cannot read its bytes, which is exactly what turning an SVG into editable
 * vectors requires.
 */
export const importFromUrl = async (
  url: string,
  filename?: string,
): Promise<UrlImportResult> => {
  const res = await apiFetch(`${base()}/assets/import-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, filename }),
  });
  if (!res.ok) return fail(res, 'Could not import from that link.');
  const data = await res.json();
  return {
    kind: data.kind,
    svg: data.svg ?? null,
    asset: data.asset ? (withId(data.asset) as DesignAsset) : null,
  };
};
