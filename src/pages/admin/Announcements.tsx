import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { Loader } from '../../components/loader/Loader';
import { RootState } from '../../store';
import { Notification } from '../../types';
import AnnouncementTabs from './AnnouncementTabs';
import './announcement.css';

const formatDate = (value: string) => `${new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
}).format(new Date(value))} Uhr`;

export default function AdminAnnouncementsPage() {
    const auth = useSelector((state: RootState) => state.auth);
    const history = useSelector((state: RootState) => state.adminNotifications);
    const dispatch = useDispatch();
    const [error, setError] = useState('');
    const requestedClubId = useRef('');
    const hasCurrentClubHistory = history.loaded && history.clubId === auth.club_id;

    useEffect(() => {
        if (!auth.club_id || hasCurrentClubHistory || history.loading || requestedClubId.current === auth.club_id) return;
        requestedClubId.current = auth.club_id;
        (async () => {
            dispatch({type: 'adminNotifications/fetchStart', payload: auth.club_id});
            try {
                const response = await fetch('/api/notifications?view=published&limit=100');
                const result: {items?: Notification[]; error?: string} = await response.json();
                if (!response.ok || result.error) throw new Error(result.error ?? 'Die Benachrichtigungen konnten nicht geladen werden.');
                dispatch({type: 'adminNotifications/fetchSuccess', payload: {
                    items: result.items ?? [],
                    clubId: auth.club_id,
                }});
            } catch (requestError) {
                dispatch({type: 'adminNotifications/fetchFailure'});
                setError(requestError instanceof Error ? requestError.message : 'Die Benachrichtigungen konnten nicht geladen werden.');
            }
        })();
    }, [auth.club_id, dispatch, hasCurrentClubHistory, history.loading]);

    return <>
        <p><Link className="icon icon--back" to="/admin">Zurück</Link></p>
        <h1>Benachrichtigungen verwalten</h1>
        <AnnouncementTabs active="history" />
        <p>Hier sehen Sie die bisher veröffentlichten Benachrichtigungen Ihres Vereins.</p>
        {error ? <p className="form-error-message">{error}</p> : null}
        {!hasCurrentClubHistory && history.loading ? <div className="splash"><Loader size="big" text="Benachrichtigungen werden geladen..." /></div>
            : hasCurrentClubHistory && history.items.length ? <div className="admin-announcement-list">
                {history.items.map(notification => <article key={notification._id}>
                    <time>{formatDate(notification.created_at)}</time>
                    <h2>{notification.title}</h2>
                    <p>{notification.body}</p>
                    {notification.link ? <p className="admin-announcement-link-preview">
                        <strong>{notification.link_label ?? (notification.type === 'tournament_published' ? 'Turnier ansehen und anmelden' : 'Details ansehen')}:</strong> {notification.link}
                    </p> : null}
                    <Link
                        className="button-link button-link--secondary"
                        state={{announcement: notification}}
                        to="/admin/announcements/new"
                    >Als neue Benachrichtigung verwenden</Link>
                </article>)}
            </div> : <p>Noch keine Benachrichtigungen veröffentlicht.</p>}
    </>;
}
