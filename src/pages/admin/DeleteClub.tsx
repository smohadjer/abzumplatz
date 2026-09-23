import { FormEvent, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router';
import { RootState } from '../../store';
import '../settings.css';

export default function AdminDeleteClubPage() {
    const user = useSelector((state: RootState) => state.auth);
    const club = useSelector((state: RootState) => state.clubs.value.find(item => item._id === user.club_id));
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [pending, setPending] = useState(false);

    const deleteClub = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPending(true);
        setError('');
        try {
            const response = await fetch(`/api/clubs?id=${encodeURIComponent(user.club_id)}`, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({password}),
            });
            const data = await response.json();
            if (!response.ok || data.error) {
                throw new Error(data.error ?? 'Der Verein konnte nicht gelöscht werden.');
            }
            dispatch({type: 'club/fetch', payload: {value: data, loaded: true}});
            dispatch({type: 'clubs/upsert', payload: {value: data}});
            dispatch({type: 'auth/setClubDeleted', payload: {club_deleted: true}});
            navigate('/admin');
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Der Verein konnte nicht gelöscht werden.');
        } finally {
            setPending(false);
        }
    };

    return (
        <>
            <p><Link className="icon icon--back" to="/admin">Zurück</Link></p>
            <h1>Verein löschen</h1>
            <div className="admin-deleted-club-warning">
                <p><strong>Sie löschen {club?.name || 'Ihren Verein'}.</strong></p>
                <p>Mitglieder verlieren den Zugriff auf den Verein und werden aufgefordert, einen neuen Verein auszuwählen. Aktive Reservierungen können danach nicht mehr genutzt werden.</p>
                <p>Der Verein kann anschließend auf der Admin-Seite wiederhergestellt werden.</p>
            </div>
            <form className="admin-delete-confirmation" onSubmit={deleteClub}>
                <p><strong>Löschen bestätigen</strong></p>
                <label htmlFor="admin-delete-password">Aktuelles Passwort</label>
                <input
                    id="admin-delete-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                />
                <div className="admin-delete-confirmation-actions">
                    <button type="submit" className="admin-delete-confirm-button" disabled={pending || !password}>
                        {pending ? 'Verein wird gelöscht...' : 'Verein löschen'}
                    </button>
                    <Link to="/admin">Abbrechen</Link>
                </div>
            </form>
            {error ? <p className="settings-delete-error">{error}</p> : null}
        </>
    );
}
