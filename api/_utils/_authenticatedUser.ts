import { Collection, ObjectId, WithId } from 'mongodb';
import { DBUser, JwtPayload } from '../../src/types.js';
import { getJwtPayload } from '../verifyAuth.js';
import type { VercelRequest } from './_apiTypes.js';
import { createAppError } from './_errors.js';

// Resolves the authenticated user from the JWT and reloads the current user
// record from MongoDB. Optionally enforces that the current DB status is active.
type AuthenticatedUserOptions = {
  requireActive?: boolean;
};

export type AuthenticatedUserContext = {
  payload: JwtPayload;
  user: WithId<DBUser>;
};

export async function getAuthenticatedUserContext(
  req: VercelRequest,
  users: Collection<DBUser>,
  options: AuthenticatedUserOptions = {}
): Promise<AuthenticatedUserContext> {
  const payload = await getJwtPayload(req);
  if (!payload) {
    throw createAppError('AUTHENTICATION_REQUIRED');
  }

  const user = await users.findOne({
    _id: ObjectId.createFromHexString(payload._id)
  });
  if (!user) {
    throw createAppError('USER_NOT_FOUND');
  }

  if (options.requireActive && user.status !== 'active') {
    throw createAppError('USER_INACTIVE');
  }

  return { payload, user };
}
