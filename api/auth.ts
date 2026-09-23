import type { VercelRequest, VercelResponse } from './_utils/_apiTypes.js';
import loginHandler from './_auth/login.js';
import logoutHandler from './_auth/logout.js';

const handlers = {
  login: loginHandler,
  logout: logoutHandler,
} as const;

export default async (req: VercelRequest, res: VercelResponse) => {
  const action = req.query?.action;
  if (Array.isArray(action) || !action || !(action in handlers)) {
    return res.status(404).json({error: 'Authentication action not found'});
  }

  return handlers[action as keyof typeof handlers](req, res);
};
