import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Tournament, TournamentStatus } from '../../types';
import { Loader } from '../../components/loader/Loader';
import AdminBackButton from '../../components/AdminBackButton';
import { RootState } from '../../store';
import { getZonedDateTime } from '../../utils/reservationTime';
import '../settings.css';
import './tournaments.css';

const statusLabels: Record<TournamentStatus, string> = {
    draft: 'Entwurf',
    published: 'Veröffentlicht',
};

const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('de-DE');
const formatSingleDayDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
});
const formatDeadline = (value: string) => `${new Date(value).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})} Uhr`;
const formatEntryFee = (value?: number) => value === undefined ? 'Noch nicht festgelegt' : value === 0 ? 'Kostenlos' : `${value} €`;
const paymentMethodLabels = {cash: 'Barzahlung', bank_transfer: 'Überweisung'} as const;
const formatTournamentDate = (tournament: Tournament) => tournament.start_date === tournament.end_date
    ? formatSingleDayDate(tournament.start_date)
    : `${formatDate(tournament.start_date)} bis ${formatDate(tournament.end_date)}`;
const daysBetween = (from: string, to: string) => {
    const toUtc = (value: string) => {
        const [year, month, day] = value.split('-').map(Number);
        return Date.UTC(year, month - 1, day);
    };
    return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
};

type TournamentFilter = 'all' | 'upcoming' | 'running' | 'past';

const tournamentFilters: Array<{id: TournamentFilter; label: string}> = [
    {id: 'all', label: 'Alle'},
    {id: 'upcoming', label: 'Bevorstehend'},
    {id: 'running', label: 'Laufend'},
    {id: 'past', label: 'Vergangen'},
];

export default function AdminTournamentsPage() {
    const {id: tournamentId} = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth);
    const tournamentsData = useSelector((state: RootState) => state.tournaments);
    const club = useSelector((state: RootState) => state.clubs.value.find(club => club._id === user.club_id));
    const tournaments = tournamentsData.value;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tournamentFilter, setTournamentFilter] = useState<TournamentFilter>('all');
    const today = getZonedDateTime(new Date(), club?.timezone ?? 'Europe/Berlin').date;
    const filteredTournaments = tournaments
        .filter(tournament => {
            if (tournamentFilter === 'all') return true;
            if (tournamentFilter === 'upcoming') return tournament.start_date > today;
            if (tournamentFilter === 'running') return tournament.start_date <= today && tournament.end_date >= today;
            return tournament.end_date < today;
        })
        .sort((first, second) => {
            const firstIsPast = first.end_date < today;
            const secondIsPast = second.end_date < today;
            if (firstIsPast !== secondIsPast) return firstIsPast ? 1 : -1;
            const dateOrder = firstIsPast
                ? second.end_date.localeCompare(first.end_date)
                : first.start_date.localeCompare(second.start_date);
            return dateOrder || first.name.localeCompare(second.name, 'de');
        });
    const detailTournament = tournamentId ? tournaments.find(tournament => tournament._id === tournamentId) : undefined;
    const displayedTournaments = tournamentId ? detailTournament ? [detailTournament] : [] : filteredTournaments;
    const tournamentCount = (filter: TournamentFilter) => tournaments.filter(tournament => {
        if (filter === 'all') return true;
        if (filter === 'upcoming') return tournament.start_date > today;
        if (filter === 'running') return tournament.start_date <= today && tournament.end_date >= today;
        return tournament.end_date < today;
    }).length;
    useEffect(() => {
        const tournamentsCurrent = tournamentsData.loaded
            && tournamentsData.clubId === user.club_id
            && tournamentsData.value.every(tournament => Number.isFinite(tournament.registrants_count) && Array.isArray(tournament.groups));
        if (tournamentsCurrent) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const tournamentsResponse = await fetch('/api/tournaments');
                if (tournamentsResponse) {
                    const result = await tournamentsResponse.json();
                    if (!tournamentsResponse.ok) throw new Error(result.error ?? 'Turniere konnten nicht geladen werden.');
                    dispatch({type: 'tournaments/fetch', payload: {value: result, loaded: true, clubId: user.club_id}});
                }
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Die Daten konnten nicht geladen werden.');
            } finally {
                setLoading(false);
            }
        })();
    }, [dispatch, tournamentsData.clubId, tournamentsData.loaded, user.club_id]);

    const deleteTournament = async (tournament: Tournament) => {
        const warning = tournament.end_date < today
            ? `„${tournament.name}“ liegt in der Vergangenheit. Das Turnier wird ausgeblendet, die zugehörigen Daten bleiben erhalten. Möchten Sie es wirklich löschen?`
            : `Möchten Sie „${tournament.name}“ wirklich löschen?`;
        if (!confirm(warning)) return;
        setError('');
        try {
            const response = await fetch(`/api/tournaments?id=${encodeURIComponent(tournament._id)}`, {method: 'DELETE'});
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? 'Das Turnier konnte nicht gelöscht werden.');
            dispatch({type: 'tournaments/remove', payload: tournament._id});
            if (tournamentId) navigate('/admin/tournaments');
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Das Turnier konnte nicht gelöscht werden.');
        }
    };

    if (loading) return <div className="splash"><Loader size="big" text="Turniere werden geladen..." /></div>;

    return (
        <>
            <p><AdminBackButton
                fallback={tournamentId ? '/admin/tournaments' : '/admin'}
                fallbackLabel={tournamentId ? 'Zu den Turnieren' : 'Zur Administration'}
            /></p>
            {!tournamentId ? <h1>Turniere verwalten</h1> : null}
            {tournamentId && !detailTournament ? <h1>Turnier</h1> : null}
            {error ? <p className="form-error-message">{error}</p> : null}

            <section className="admin-management-section">
                {!tournamentId ? <><p className="admin-competition-groups-description">Hier verwalten Sie die bevorstehenden und vergangenen Turniere Ihres Vereins.</p>
                <div className="admin-management-primary-actions">
                    <Link className="button-link icon icon--trophy" to="/admin/tournaments/new">Neues Turnier erstellen</Link>
                </div>
                <fieldset className="admin-filter-options">
                    <legend>Filter:</legend>
                    {tournamentFilters.map(filter => <label className="admin-filter-option" key={filter.id}>
                        <input
                            checked={tournamentFilter === filter.id}
                            name="tournament-filter"
                            onChange={() => setTournamentFilter(filter.id)}
                            type="radio"
                            value={filter.id}
                        />
                        <span>{filter.label} ({tournamentCount(filter.id)})</span>
                    </label>)}
                </fieldset></> : null}
                {displayedTournaments.length ? <div className={`admin-management-list${tournamentId ? ' admin-tournament-detail' : ''}`}>
                    {displayedTournaments.map(tournament => (
                        <article className={`admin-tournament-card${!tournamentId ? ' admin-management-compact-row admin-tournament-card--overview' : ''}`} key={tournament._id}>
                            {tournamentId ? <div className="admin-tournament-page-heading">
                                <h1>{tournament.name}</h1>
                                {tournament.start_date > today ? <div
                                    aria-label={`Noch ${daysBetween(today, tournament.start_date)} ${daysBetween(today, tournament.start_date) === 1 ? 'Tag' : 'Tage'} bis zum Start`}
                                    className="admin-tournament-countdown"
                                >
                                    <strong>{daysBetween(today, tournament.start_date)}</strong>
                                    <span>{daysBetween(today, tournament.start_date) === 1 ? 'Tag' : 'Tage'}<small>bis zum Start</small></span>
                                </div> : tournament.end_date < today ? <div className="admin-tournament-finished"><strong>Beendet</strong><small>Turnier vorbei</small></div> : null}
                            </div> : null}
                            {!tournamentId ? <>
                                <div className="admin-tournament-overview-summary">
                                    <h2><Link to={`/admin/tournaments/${tournament._id}`}>{tournament.name}</Link></h2>
                                    <p className="admin-tournament-summary-date icon icon--inline icon--calendar">{formatTournamentDate(tournament)}</p>
                                    <p className={`admin-tournament-overview-status${tournament.end_date < today ? ' admin-tournament-overview-status--past' : ''}`}>
                                        {tournament.start_date > today
                                            ? `Bevorstehend · noch ${daysBetween(today, tournament.start_date)} ${daysBetween(today, tournament.start_date) === 1 ? 'Tag' : 'Tage'}`
                                            : tournament.end_date < today ? 'Beendet' : 'Laufend'}
                                    </p>
                                </div>
                                <div className="admin-management-actions">
                                    <Link
                                        className="button-link button-link--secondary"
                                        onClick={event => {
                                            if (tournament.end_date < today && !confirm('Dieses Turnier liegt in der Vergangenheit. Möchten Sie es trotzdem bearbeiten?')) {
                                                event.preventDefault();
                                            }
                                        }}
                                        to={`/admin/tournaments/${tournament._id}/edit`}
                                    >Bearbeiten</Link>
                                    <button className="delete-action-button delete-action-button--subtle" onClick={() => deleteTournament(tournament)} type="button">Löschen</button>
                                </div>
                            </> : null}
                            {tournamentId && tournament.description ? <p>{tournament.description}</p> : null}
                            {tournamentId ? <>
                            <section className="admin-tournament-details admin-tournament-detail-section">
                                <h2>Turnierdaten</h2>
                                <dl>
                                    <div><dt>Datum</dt><dd>{formatTournamentDate(tournament)}</dd></div>
                                    <div><dt>Meldeschluss</dt><dd>{formatDeadline(tournament.registration_deadline)}</dd></div>
                                    <div><dt>Auslosung</dt><dd>{tournament.draw ? formatDeadline(tournament.draw) : 'Noch nicht festgelegt'}</dd></div>
                                    <div><dt>Startgeld</dt><dd>{formatEntryFee(tournament.entry_fee)}</dd></div>
                                    {tournament.entry_fee !== 0 ? <div><dt>Zahlungsart</dt><dd>{tournament.payment_method ? paymentMethodLabels[tournament.payment_method] : 'Noch nicht festgelegt'}</dd></div> : null}
                                    <div><dt>Status</dt><dd>{statusLabels[tournament.status]}</dd></div>
                                    {tournament.format ? <div><dt>Spielmodus</dt><dd>{tournament.format}</dd></div> : null}
                                    <div><dt>Teilnehmende</dt><dd>{tournament.registrants_count ?? 0}</dd></div>
                                </dl>
                            </section>
                            <section className="admin-tournament-detail-section">
                                <h2>Konkurrenzen</h2>
                                <p>{tournament.groups.length ? tournament.groups.map(group => group.name).join(', ') : 'Noch keine Daten verfügbar.'}</p>
                            </section>
                            <section className="admin-tournament-detail-section">
                                <h2>Auslosung</h2>
                                <p>Noch keine Daten verfügbar.</p>
                            </section>
                            <section className="admin-tournament-detail-section">
                                <h2>Ergebnisse</h2>
                                <p>Noch keine Daten verfügbar.</p>
                            </section>
                            </> : null}
                            {tournamentId ? <div className="admin-management-actions">
                                <Link className="button-link button-link--secondary" to={`/admin/tournaments/${tournament._id}/participants`}>Teilnehmende</Link>
                                <Link
                                    className="button-link button-link--secondary"
                                    onClick={event => {
                                        if (tournament.end_date < today && !confirm('Dieses Turnier liegt in der Vergangenheit. Möchten Sie es trotzdem bearbeiten?')) {
                                            event.preventDefault();
                                        }
                                    }}
                                    to={`/admin/tournaments/${tournament._id}/edit`}
                                >Bearbeiten</Link>
                                <button className="delete-action-button delete-action-button--subtle" onClick={() => deleteTournament(tournament)} type="button">Löschen</button>
                            </div> : null}
                        </article>
                    ))}
                </div> : <p>{tournamentId ? 'Turnier nicht gefunden.' : tournaments.length ? 'Keine passenden Turniere vorhanden.' : 'Noch keine Turniere angelegt.'}</p>}
            </section>
        </>
    );
}
