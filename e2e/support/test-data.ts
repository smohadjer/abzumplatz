export const club = {
  _id: 'club-1',
  name: 'TC Playwright',
  courts: [{ status: 'active' }, { status: 'active' }],
  reservations_limit: 3,
  start_hour: 8,
  end_hour: 20,
  timezone: 'UTC',
  access_plan_type: 'basic',
  next_plan_type: 'basic',
};

export const player = {
  _id: 'player-1',
  first_name: 'Paula',
  last_name: 'Playwright',
  email: 'paula@example.test',
  club_id: club._id,
  role: 'player',
  status: 'active',
};

export const admin = {
  _id: 'admin-1',
  first_name: 'Ada',
  last_name: 'Admin',
  role: 'admin',
};
