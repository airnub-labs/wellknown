import { IncomingMessage } from 'http';
import { Socket } from 'net';

interface MockRequestInit {
  headers?: Record<string, string | undefined>;
  encrypted?: boolean;
  remoteAddress?: string;
}

export function createMockRequest(init: MockRequestInit = {}): IncomingMessage {
  const socket = new Socket();
  (socket as unknown as { encrypted?: boolean }).encrypted = init.encrypted ?? false;
  Object.defineProperty(socket, 'remoteAddress', {
    value: init.remoteAddress ?? '127.0.0.1',
    configurable: true,
  });
  Object.defineProperty(socket, 'remotePort', {
    value: 443,
    configurable: true,
  });

  const req = new IncomingMessage(socket as Socket);
  req.headers = init.headers ?? {};
  return req;
}
