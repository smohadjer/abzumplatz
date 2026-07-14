import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { getInactiveUserMessage } from '../messages';
import { fetchUsers, getClub } from '../utils/utils';

export default function InactiveStatusWarning() {
  const auth = useSelector((state: RootState) => state.auth);
  const users = useSelector((state: RootState) => state.users);
  const dispatch = useDispatch();
  const club = getClub();
  const hasUsersForCurrentClub = users.loaded && users.clubId === auth.club_id;

  useEffect(() => {
    if (auth.value && auth.status === 'inactive' && auth.club_id && !hasUsersForCurrentClub) {
      fetchUsers(auth.club_id, dispatch);
    }
  }, [auth.club_id, auth.status, auth.value, dispatch, hasUsersForCurrentClub]);

  if (!auth.value || auth.status !== 'inactive') {
    return null;
  }

  const adminUser = hasUsersForCurrentClub
    ? users.value.find(user => user.role === 'admin')
    : undefined;
  const adminEmail = adminUser?.email ?? '';
  const adminName = adminUser
    ? `${adminUser.first_name} ${adminUser.last_name}`.trim()
    : '';
  const fullName = `${auth.first_name} ${auth.last_name}`.trim();
  const subjectClubName = club?.name ? ` ${club.name}` : '';
  const subjectName = fullName ? ` - ${fullName}` : '';
  const subject = `Bitte um Freischaltung meines Kontos${subjectClubName}${subjectName}`;
  const body = [
    'Hallo,',
    '',
    'mein Konto ist aktuell inaktiv. Könnten Sie meinen Zugang bitte prüfen und freischalten?',
    '',
    fullName ? `Vielen Dank\n${fullName}` : 'Vielen Dank'
  ].join('\n');
  const adminMailto = `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="inactive-status-warning" role="alert">
      {adminName ? (
        <>
          Ihr Konto ist derzeit inaktiv. Bitte kontaktieren Sie Ihren Vereinsadministrator{' '}
          <a href={adminMailto}>{adminName}</a>.
        </>
      ) : (
        getInactiveUserMessage()
      )}
    </div>
  );
}
