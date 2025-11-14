declare module 'proxy-addr' {
  import type { IncomingMessage } from 'http';

  export type TrustFunction = (addr: string, index: number) => boolean;

  export interface ProxyAddr {
    (req: IncomingMessage, trust?: TrustFunction | string | string[]): string;
    all(req: IncomingMessage, trust?: TrustFunction | string | string[]): string[];
    compile(val: string | string[]): TrustFunction;
  }

  const proxyaddr: ProxyAddr;
  export = proxyaddr;
}
