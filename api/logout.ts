import { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
    // console.log('Redirecting to login page');
    // res.setHeader('Location', '/login');
    res.setHeader('Set-Cookie', ['jwt=deleted; HttpOnly; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/;']);
    return res.json({
        message: 'Logging out'
    });
}
