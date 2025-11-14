export interface LinkObject {
  href: string;
  type?: string;
  hreflang?: string | string[];
  title?: string | string[];
  profile?: string | string[];
}

export type ApiSpecKind = 'openapi' | 'asyncapi' | 'graphql' | 'json-schema' | 'other';

export interface ApiSpecRef extends LinkObject {
  rel?: 'service-desc' | 'service-doc' | 'service-meta' | 'status' | string;
  kind?: ApiSpecKind;
}

export type TrustProxySetting =
  | boolean
  | string
  | string[]
  | ((addr: string, index: number) => boolean);

export type OriginStrategy =
  | {
      kind: 'fromRequest';
      trustProxy?: TrustProxySetting;
      basePath?: string;
    }
  | {
      kind: 'fixed';
      origin: string;
      basePath?: string;
    };

export interface ApiEntryConfig {
  id: string;
  title?: string;
  description?: string;
  basePath?: string;
  absoluteAnchor?: string;
  specs: ApiSpecRef[];
}

export interface ApiCatalogConfig {
  publisher?: string;
  originStrategy?: OriginStrategy;
  apis: ApiEntryConfig[];
}
