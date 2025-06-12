/* middleware for vercel edge runtime */
import { next } from '@vercel/edge';
import {jwtVerify} from 'jose';
import { RequestCookies } from '@edge-runtime/cookies'

// middleware only runs for these paths
export const config = {
  matcher: [
    '/api/reservations'
  ]
};

if (typeof EdgeRuntime === 'string') {
  console.log('******* EdgeRuntime *********');
}

export default async function middleware(req) {
  console.log('middleware: ', req.method, req.url);
  const url = new URL(req.url);

  // only POST requests are restricted
  if (req.method === 'GET') {
    return next();
  }

  const cookies = new RequestCookies(req.headers)
  const jwt = cookies.get('jwt')?.value;
  const authHeader = req.headers.get('authorization');
  const hasBearerAuthHeader = authHeader && authHeader.startsWith('Bearer ');
  const token = hasBearerAuthHeader ? authHeader.split(' ')[1] : jwt;

  if (token) {
    const secret = new TextEncoder().encode(process.env.jwtSecret);
    try {
      const response = await jwtVerify(token, secret);
      next();
    } catch(err) {
      return Response.json({
        'error': 'no jwt token or invalid jwt token'
      });

      //console.log('No jwt token or invalid jwt token, redirecting to login page');
      //url.pathname = '/login';
      //return Response.redirect(url, 302);
    }
  } else {
    return Response.json({
      'error': 'authorization header not found'
    });

    // console.log('no authorization header or jwt cookie, redirecting to login page');
    // url.pathname = '/login';
    // return Response.redirect(url, 302);
  }
}
