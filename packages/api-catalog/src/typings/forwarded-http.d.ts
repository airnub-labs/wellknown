declare module 'forwarded-http' {
  import type { IncomingMessage } from 'http';

  export interface ForwardedHttpResult {
    host?: string;
    proto?: string;
    port?: number | string;
    ips?: string[];
  }

  export interface ForwardedHttpOptions {
    filter?: string | string[];
    allowPrivate?: boolean;
  }

  function forwarded(
    req: IncomingMessage,
    options?: ForwardedHttpOptions
  ): ForwardedHttpResult;

  export = forwarded;
}
