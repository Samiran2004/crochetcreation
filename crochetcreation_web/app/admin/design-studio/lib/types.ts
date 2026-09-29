export interface DesignSummary {
  id: string;
  name: string;
  width: number;
  height: number;
  preset_key?: string | null;
  thumbnail_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DesignRecord extends DesignSummary {
  canvas_json?: Record<string, unknown> | null;
}

export interface DesignAsset {
  id: string;
  url: string;
  public_id: string;
  width?: number | null;
  height?: number | null;
  filename?: string | null;
  created_at: string;
}

/** What the inspector needs to know about the current selection. */
export type SelectionKind =
  | 'none'
  | 'text'
  | 'image'
  | 'shape'
  | 'path'
  | 'group'
  | 'multiple';

export interface LayerNode {
  id: string;
  name: string;
  kind: SelectionKind;
  locked: boolean;
  visible: boolean;
  selected: boolean;
  opacity: number;
  /** Small PNG preview of the object, rendered on the fly. */
  thumbnail?: string;
}
