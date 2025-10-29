/* middleware for vercel edge runtime */
import { next } from '@vercel/edge';
import {jwtVerify} from 'jose';
import { RequestCookies } from '@edge-runtime/cookies'

// middleware only runs for these paths
export const config = {
  matcher: [
    '/api/reservations',
    '/api/clubs',
  ]
};

if (typeof EdgeRuntime === 'string') {
  console.log('******* EdgeRuntime *********');
}

export default async function middleware(req) {
  const url = new URL(req.url);
  console.log('middleware: ', req.method, url.pathname);

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

      // only admins can post to /api/clubs
      if (url.pathname === '/api/clubs' && response.payload.role !== 'admin') {
        throw new Error('Only admins are allowed to register clubs');
      }

      next();
    } catch(error) {
      return new Response(error, {
        status: 500
      });
      //console.log('No jwt token or invalid jwt token, redirecting to login page');
      //url.pathname = '/login';
      //return Response.redirect(url, 302);
    }
  } else {
    return new Response('authorization token not found', {
      status: 500
    });
    // console.log('no authorization header or jwt cookie, redirecting to login page');
    // url.pathname = '/login';
    // return Response.redirect(url, 302);
  }
}
