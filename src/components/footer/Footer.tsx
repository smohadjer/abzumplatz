import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from './../../store';
// import { getClub } from './../../utils/utils';
import { Link } from 'react-router';
import { useLocation } from 'react-router'

import './footer.css';

export default function Footer() {
    const auth = useSelector((state: RootState) => state.auth);
    const tournaments = useSelector((state: RootState) => state.tournaments);
    const dispatch = useDispatch();
    //const club = getClub();
    const location = useLocation();
    const page_id = location.pathname.substring(1);
    const publishedTournamentIds = tournaments.clubId === auth.club_id
        ? tournaments.value.filter(tournament => tournament.status === 'published').map(tournament => tournament._id)
        : [];
    const publishedTournamentIdsKey = publishedTournamentIds.join(',');
    const seenStorageKey = `seen-tournaments:${auth._id}:${auth.club_id}`;
    const seenTournamentIds = (() => {
        if (typeof window === 'undefined') return [];
        try {
            const storedIds = localStorage.getItem(seenStorageKey);
            const parsedIds: unknown = storedIds ? JSON.parse(storedIds) : [];
            return Array.isArray(parsedIds) && parsedIds.every(id => typeof id === 'string') ? parsedIds : [];
        } catch {
            return [];
        }
    })();
    const hasNewTournament = auth.role !== 'admin'
        && auth.status !== 'inactive'
        && Boolean(auth.club_id)
        && !location.pathname.startsWith('/tournaments')
        && tournaments.loaded
        && tournaments.clubId === auth.club_id
        && publishedTournamentIds.some(id => !seenTournamentIds.includes(id));

    useEffect(() => {
        if (!auth.value || auth.role === 'admin' || auth.status === 'inactive' || !auth.club_id
            || (tournaments.loaded && tournaments.clubId === auth.club_id)) return;
        (async () => {
            const response = await fetch('/api/tournaments');
            if (!response.ok) return;
            const result = await response.json();
            dispatch({type: 'tournaments/fetch', payload: {value: result, loaded: true, clubId: auth.club_id}});
        })();
    }, [auth.club_id, auth.role, auth.status, auth.value, dispatch, tournaments.clubId, tournaments.loaded]);

    useEffect(() => {
        if (!location.pathname.startsWith('/tournaments') || !tournaments.loaded
            || tournaments.clubId !== auth.club_id) return;
        try {
            localStorage.setItem(seenStorageKey, JSON.stringify(publishedTournamentIds));
        } catch {
            // The notification remains non-critical when storage is unavailable.
        }
    }, [auth.club_id, location.pathname, publishedTournamentIdsKey, seenStorageKey, tournaments.clubId, tournaments.loaded]);

    if (auth.value && auth.role === 'admin' && auth.club_deleted) {
        return null;
    }

    return (
        (auth.value) ?
        <footer>
            <Link aria-label="Reservierungen" to="/reservations"><span aria-hidden="true" className={`icon icon--home${page_id === 'reservations' ? ' selected' : ''}`}></span></Link>
            <Link aria-label="Meine Buchungen" to="/bookings"><span aria-hidden="true" className={`icon icon--list${page_id === 'bookings' ? ' selected' : ''}`}></span></Link>
            <Link aria-label={hasNewTournament ? 'Turniere – neues Turnier verfügbar' : 'Turniere'} className="footer-tournament-link" to="/tournaments">
                <span aria-hidden="true" className={`icon icon--trophy${page_id.startsWith('tournaments') ? ' selected' : ''}`}></span>
                {hasNewTournament ? <span aria-hidden="true" className="footer-notification-dot"></span> : null}
            </Link>
            <Link aria-label="Einstellungen" to="/settings"><span aria-hidden="true" className={`icon icon--settings${page_id === 'settings' ? ' selected' : ''}`}></span></Link>
            {auth.role === 'admin' &&
                 <Link aria-label="Administration" to="/admin"><span aria-hidden="true" className={`icon icon--admin${page_id === 'admin' ? ' selected' : ''}`}></span></Link>
            }
        </footer> :
        <footer>
            <Link aria-label="Startseite" to="/"><span aria-hidden="true" className={`icon icon--home${page_id === '' ? ' selected' : ''}`}></span></Link>
            <Link aria-label="Anmelden" to="/login"><span aria-hidden="true" className={`icon icon--login${page_id === 'login' ? ' selected' : ''}`}></span></Link>
            <Link aria-label="Als Spieler registrieren" to="/register/player"><span aria-hidden="true" className={`icon icon--register${page_id === 'register/player' ? ' selected' : ''}`}></span></Link>
            <Link aria-label="Verein registrieren" to="/register/club"><span aria-hidden="true" className={`icon icon--group-add${page_id === 'register/club' ? ' selected' : ''}`}></span></Link>
        </footer>
    )
}
