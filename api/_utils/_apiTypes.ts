// We added this file to avoid installing @vercel/node just for request/response types, since that package pulls in many vulnerabilities.
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'http';
type QueryValue = string | string[] | undefined;

type ApiHeaders = IncomingHttpHeaders & {
    authorization?: string;
    host?: string;
    'x-forwarded-proto'?: string | string[];
};

export interface VercelRequest extends IncomingMessage {
    body: any;
    cookies?: Record<string, string | undefined>;
    headers: ApiHeaders;
    method?: string;
    query?: Record<string, QueryValue>;
}

export interface VercelResponse<T = any> extends ServerResponse<IncomingMessage> {
    json: (body: T) => VercelResponse<T>;
    send: (body: T) => VercelResponse<T>;
    status: (statusCode: number) => VercelResponse<T>;
}
