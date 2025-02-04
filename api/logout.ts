export default async (req, res) => {
    // console.log('Redirecting to login page');
    // res.setHeader('Location', '/login');
    res.setHeader('Set-Cookie', ['jwt=deleted; HttpOnly; expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/;']);
    res.json({
        message: 'Logging out'
    });
}

