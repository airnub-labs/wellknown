import type { ApiCatalogLinkset } from './linkset';
import { RFC9727_PROFILE, API_CATALOG_PATH, LINKSET_CONTENT_TYPE, API_CATALOG_LINK_REL } from './constants';

export interface ApiCatalogResponse {
  body: string | null;
  headers: Record<string, string>;
  status: number;
}

/**
 * Create a GET response for the API catalog endpoint
 */
export function createGetResponse(linkset: ApiCatalogLinkset, origin: string): ApiCatalogResponse {
  const catalogUrl = `${origin}${API_CATALOG_PATH}`;
  return {
    body: JSON.stringify(linkset),
    headers: {
      'Content-Type': LINKSET_CONTENT_TYPE,
      Link: `<${catalogUrl}>; rel="${API_CATALOG_LINK_REL}"`,
    },
    status: 200,
  };
}

/**
 * Create a HEAD response for the API catalog endpoint
 */
export function createHeadResponse(origin: string): ApiCatalogResponse {
  const catalogUrl = `${origin}${API_CATALOG_PATH}`;
  return {
    body: null,
    headers: {
      'Content-Type': LINKSET_CONTENT_TYPE,
      Link: `<${catalogUrl}>; rel="${API_CATALOG_LINK_REL}"`,
    },
    status: 200,
  };
}

/**
 * Export constants for users who need them
 */
export { RFC9727_PROFILE, API_CATALOG_PATH, LINKSET_CONTENT_TYPE, API_CATALOG_LINK_REL };
