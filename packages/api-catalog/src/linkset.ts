import type { LinkObject } from './types';

export interface LinksetContext {
  anchor: string;
  'service-desc'?: LinkObject[];
  'service-doc'?: LinkObject[];
  'service-meta'?: LinkObject[];
  status?: LinkObject[];
  item?: LinkObject[];
  'api-catalog'?: LinkObject[] | string;
  [rel: string]: LinkObject[] | string | undefined;
}

export interface LinksetMetadata {
  profile?: string | string[];
  publisher?: string;
  [key: string]: unknown;
}

export interface ApiCatalogLinkset {
  linkset: LinksetContext[];
  'linkset-metadata'?: LinksetMetadata[];
}
