import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { ClubInvitationShare } from '../../components/ClubInvitationShare';
import AdminBackButton from '../../components/AdminBackButton';
import { RootState } from '../../store';
import { fetchClub } from '../../utils/utils';

export default function AdminInvitePage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const user = useSelector((state: RootState) => state.auth);
    const clubData = useSelector((state: RootState) => state.club);
    const clubs = useSelector((state: RootState) => state.clubs.value);
    const dispatch = useDispatch();
    const club = clubData.value._id === user.club_id
        ? clubData.value
        : clubs.find(item => item._id === user.club_id);

    const loadClub = useCallback(async () => {
        setLoading(true);
        setError('');
        const loadedClub = await fetchClub(user.club_id, dispatch);
        if (!loadedClub) {
            setError('Vereinsdaten konnten nicht geladen werden.');
        }
        setLoading(false);
    }, [dispatch, user.club_id]);

    useEffect(() => {
        if (!club) {
            void loadClub();
        }
    }, [club, loadClub]);

    return (
        <>
            <p><AdminBackButton /></p>
            <h1>Mitglieder einladen</h1>
            {club ? <ClubInvitationShare clubId={club._id} clubName={club.name} showHeading={false} /> : null}
            {loading ? <p role="status">Vereinsdaten werden geladen…</p> : null}
            {!loading && error ? (
                <div role="alert">
                    <p>{error}</p>
                    <p>
                        <button className="button-link" type="button" onClick={() => void loadClub()}>Erneut versuchen</button>{' '}
                        <Link to="/admin">Zur Administration</Link>
                    </p>
                </div>
            ) : null}
        </>
    );
}
