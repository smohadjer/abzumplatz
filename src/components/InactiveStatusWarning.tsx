import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { RootState } from '../store';
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

  if (!auth.value || auth.status !== 'inactive' || !auth.club_id) {
    return null;
  }

  const adminUser = hasUsersForCurrentClub
    ? users.value.find(user => user.role === 'admin')
    : undefined;
  const adminEmail = adminUser?.email ?? '';
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
    <div className="inactive-status-banner" role="alert">
      <div className="inactive-status-banner-content">
        Ihr Konto muss zunächst von der Vereinsverwaltung aktiviert werden, bevor Sie auf alle Bereiche der Website
        zugreifen können. Falls Sie den falschen Verein ausgewählt haben, können Sie ihn unter{' '}
        <Link to="/profile/edit">„Profil bearbeiten“</Link> wechseln.{' '}
        {adminEmail ? (
          <>
            Wenn Sie Mitglied dieses Vereins sind und Ihr Konto auch nach einiger Zeit noch nicht aktiviert wurde,
            können Sie Ihre Vereinsverwaltung per E-Mail unter <a href={adminMailto}>{adminEmail}</a> kontaktieren.
          </>
        ) : null}
      </div>
    </div>
  );
}
