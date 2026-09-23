import type { VercelRequest, VercelResponse } from './_utils/_apiTypes.js';
import competitionGroupsHandler from './_tournament/competition-groups.js';
import registrationsHandler from './_tournament/tournament-registrations.js';
import tournamentsHandler from './_tournament/tournaments.js';

const handlers = {
  'competition-groups': competitionGroupsHandler,
  registrations: registrationsHandler,
  tournaments: tournamentsHandler,
} as const;

export default async (req: VercelRequest, res: VercelResponse) => {
  const resource = req.query?.resource;
  if (Array.isArray(resource) || !resource || !(resource in handlers)) {
    return res.status(404).json({error: 'Tournament resource not found'});
  }

  return handlers[resource as keyof typeof handlers](req, res);
};
