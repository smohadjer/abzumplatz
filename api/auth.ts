import type { VercelRequest, VercelResponse } from './_utils/_apiTypes.js';
import loginHandler from './_auth/login.js';
import logoutHandler from './_auth/logout.js';
import verifyHandler from './_auth/verify.js';
import forgotPasswordHandler from './_auth/forgot-password.js';
import contactHandler from './_contact/contact.js';
import deleteAccountHandler from './_auth/delete-account.js';

const handlers = {
  login: loginHandler,
  logout: logoutHandler,
  verify: verifyHandler,
  'forgot-password': forgotPasswordHandler,
  contact: contactHandler,
  'delete-account': deleteAccountHandler,
} as const;

export default async (req: VercelRequest, res: VercelResponse) => {
  const action = req.query?.action;
  if (Array.isArray(action) || !action || !(action in handlers)) {
    return res.status(404).json({error: 'Authentication action not found'});
  }

  return handlers[action as keyof typeof handlers](req, res);
};
