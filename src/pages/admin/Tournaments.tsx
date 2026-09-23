import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { CompetitionGroup, Tournament, TournamentStatus } from '../../types';
import { Loader } from '../../components/loader/Loader';
import { RootState } from '../../store';
import { getZonedDateTime } from '../../utils/reservationTime';
import '../settings.css';
import './tournaments.css';

const statusLabels: Record<TournamentStatus, string> = {
    draft: 'Entwurf',
    published: 'Veröffentlicht',
};

const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('de-DE');
const formatDeadline = (value: string) => `${new Date(value).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})} Uhr`;
const formatEntryFee = (value?: number) => value === undefined ? 'Noch nicht festgelegt' : value === 0 ? 'Kostenlos' : `${value} €`;
const paymentMethodLabels = {cash: 'Barzahlung', bank_transfer: 'Überweisung'} as const;
const formatTournamentDate = (tournament: Tournament) => tournament.start_date === tournament.end_date
    ? formatDate(tournament.start_date)
    : `${formatDate(tournament.start_date)} bis ${formatDate(tournament.end_date)}`;
const daysBetween = (from: string, to: string) => {
    const toUtc = (value: string) => {
        const [year, month, day] = value.split('-').map(Number);
        return Date.UTC(year, month - 1, day);
    };
    return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
};

type GroupFilter = 'all' | 'men' | 'women' | 'mixed' | 'youth' | 'senior';
type TournamentFilter = 'all' | 'upcoming' | 'running' | 'past';

const tournamentFilters: Array<{id: TournamentFilter; label: string}> = [
    {id: 'all', label: 'Alle'},
    {id: 'upcoming', label: 'Bevorstehend'},
    {id: 'running', label: 'Laufend'},
    {id: 'past', label: 'Vergangen'},
];

const groupFilters: Array<{id: GroupFilter; label: string}> = [
    {id: 'all', label: 'Alle'},
    {id: 'men', label: 'Herren'},
    {id: 'women', label: 'Damen'},
    {id: 'mixed', label: 'Mixed'},
    {id: 'youth', label: 'Jugend'},
    {id: 'senior', label: 'Senioren'},
];

const groupMatchesFilter = (group: CompetitionGroup, filter: GroupFilter) => {
    if (filter === 'all') return true;
    if (filter === 'youth') return group.max_age !== undefined;
    if (filter === 'senior') return group.min_age !== undefined;
    if (filter === 'mixed') return group.sex === 'mixed';
    return filter === 'men' ? group.sex === 'male' : group.sex === 'female';
};

export default function AdminTournamentsPage() {
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') === 'groups' ? 'groups' : 'tournaments';
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth);
    const tournamentsData = useSelector((state: RootState) => state.tournaments);
    const groupsData = useSelector((state: RootState) => state.competitionGroups);
    const club = useSelector((state: RootState) => state.clubs.value.find(club => club._id === user.club_id));
    const tournaments = tournamentsData.value;
    const groups = groupsData.value;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tournamentFilter, setTournamentFilter] = useState<TournamentFilter>('all');
    const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
    const filteredGroups = groups.filter(group => groupMatchesFilter(group, groupFilter));
    const today = getZonedDateTime(new Date(), club?.timezone ?? 'Europe/Berlin').date;
    const filteredTournaments = tournaments.filter(tournament => {
        if (tournamentFilter === 'all') return true;
        if (tournamentFilter === 'upcoming') return tournament.start_date > today;
        if (tournamentFilter === 'running') return tournament.start_date <= today && tournament.end_date >= today;
        return tournament.end_date < today;
    });
    const tournamentCount = (filter: TournamentFilter) => tournaments.filter(tournament => {
        if (filter === 'all') return true;
        if (filter === 'upcoming') return tournament.start_date > today;
        if (filter === 'running') return tournament.start_date <= today && tournament.end_date >= today;
        return tournament.end_date < today;
    }).length;
    const groupCount = (filter: GroupFilter) => groups.filter(group => groupMatchesFilter(group, filter)).length;

    useEffect(() => {
        const tournamentsCurrent = tournamentsData.loaded
            && tournamentsData.clubId === user.club_id
            && tournamentsData.value.every(tournament => Number.isFinite(tournament.registrants_count) && Array.isArray(tournament.groups));
        const groupsCurrent = groupsData.loaded && groupsData.clubId === user.club_id;
        if (tournamentsCurrent && groupsCurrent) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const [tournamentsResponse, groupsResponse] = await Promise.all([
                    tournamentsCurrent ? null : fetch('/api/tournaments'),
                    groupsCurrent ? null : fetch('/api/competition-groups'),
                ]);
                if (tournamentsResponse) {
                    const result = await tournamentsResponse.json();
                    if (!tournamentsResponse.ok) throw new Error(result.error ?? 'Turniere konnten nicht geladen werden.');
                    dispatch({type: 'tournaments/fetch', payload: {value: result, loaded: true, clubId: user.club_id}});
                }
                if (groupsResponse) {
                    const result = await groupsResponse.json();
                    if (!groupsResponse.ok) throw new Error(result.error ?? 'Konkurrenzen konnten nicht geladen werden.');
                    dispatch({type: 'competitionGroups/fetch', payload: {value: result, loaded: true, clubId: user.club_id}});
                }
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Die Daten konnten nicht geladen werden.');
            } finally {
                setLoading(false);
            }
        })();
    }, [dispatch, groupsData.clubId, groupsData.loaded, tournamentsData.clubId, tournamentsData.loaded, user.club_id]);

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
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Das Turnier konnte nicht gelöscht werden.');
        }
    };

    const deleteGroup = async (group: CompetitionGroup) => {
        if (!confirm(`Möchten Sie die Konkurrenz „${group.name}“ wirklich löschen?`)) return;
        setError('');
        try {
            const response = await fetch(`/api/competition-groups?id=${encodeURIComponent(group._id)}`, {method: 'DELETE'});
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? 'Die Konkurrenz konnte nicht gelöscht werden.');
            dispatch({type: 'competitionGroups/remove', payload: group._id});
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Die Konkurrenz konnte nicht gelöscht werden.');
        }
    };

    if (loading) return <div className="splash"><Loader size="big" text="Turniere werden geladen..." /></div>;

    return (
        <>
            <p><Link className="icon icon--back" to="/admin">Zurück</Link></p>
            <h1>Turniere/Konkurrenzen verwalten</h1>
            {error ? <p className="form-error-message">{error}</p> : null}

            <nav aria-label="Turnierverwaltung" className="admin-management-tabs">
                <Link
                    aria-current={activeTab === 'tournaments' ? 'page' : undefined}
                    className={activeTab === 'tournaments' ? 'active' : ''}
                    to="/admin/tournaments"
                >Turniere</Link>
                <Link
                    aria-current={activeTab === 'groups' ? 'page' : undefined}
                    className={activeTab === 'groups' ? 'active' : ''}
                    to="/admin/tournaments?tab=groups"
                >Konkurrenzen</Link>
            </nav>

            {activeTab === 'tournaments' ? <section className="admin-management-section">
                <ul className="settings-links admin-management-create-link">
                    <li><Link to="/admin/tournaments/new">Turnier hinzufügen</Link></li>
                </ul>
                <p className="admin-competition-groups-description">Hier verwalten Sie die bevorstehenden und vergangenen Turniere Ihres Vereins.</p>
                <div aria-label="Turniere filtern" className="admin-management-filters" role="tablist">
                    {tournamentFilters.map(filter => <button
                        aria-selected={tournamentFilter === filter.id}
                        className={tournamentFilter === filter.id ? 'active' : ''}
                        key={filter.id}
                        onClick={() => setTournamentFilter(filter.id)}
                        role="tab"
                        type="button"
                    >{filter.label} ({tournamentCount(filter.id)})</button>)}
                </div>
                {filteredTournaments.length ? <div className="admin-management-list">
                    {filteredTournaments.map(tournament => (
                        <article className="admin-tournament-card" key={tournament._id}>
                            <div className="admin-tournament-heading">
                                <h2>{tournament.name}</h2>
                                {tournament.start_date > today ? <div
                                    aria-label={`Noch ${daysBetween(today, tournament.start_date)} ${daysBetween(today, tournament.start_date) === 1 ? 'Tag' : 'Tage'} bis zum Start`}
                                    className="admin-tournament-countdown"
                                >
                                    <strong>{daysBetween(today, tournament.start_date)}</strong>
                                    <span>{daysBetween(today, tournament.start_date) === 1 ? 'Tag' : 'Tage'}<small>bis zum Start</small></span>
                                </div> : tournament.end_date < today ? <div className="admin-tournament-finished">
                                    <strong>Beendet</strong>
                                    <small>Turnier vorbei</small>
                                </div> : null}
                            </div>
                            <div className="admin-tournament-details">
                                <dl>
                                    <div><dt>Datum</dt><dd>{formatTournamentDate(tournament)}</dd></div>
                                    <div><dt>Meldeschluss</dt><dd>{formatDeadline(tournament.registration_deadline)}</dd></div>
                                    <div><dt>Auslosung</dt><dd>{tournament.draw ? formatDeadline(tournament.draw) : 'Noch nicht festgelegt'}</dd></div>
                                    <div><dt>Startgeld</dt><dd>{formatEntryFee(tournament.entry_fee)}</dd></div>
                                    {tournament.entry_fee !== 0 ? <div><dt>Zahlungsart</dt><dd>{tournament.payment_method ? paymentMethodLabels[tournament.payment_method] : 'Noch nicht festgelegt'}</dd></div> : null}
                                    <div><dt>Status</dt><dd>{statusLabels[tournament.status]}</dd></div>
                                    {tournament.format ? <div><dt>Spielmodus</dt><dd>{tournament.format}</dd></div> : null}
                                    <div><dt>Teilnehmende</dt><dd>{tournament.registrants_count ?? 0}</dd></div>
                                    <div className="admin-tournament-competitions-row"><dt>Konkurrenzen ({tournament.groups.length})</dt><dd>{tournament.groups.map(group => group.name).join(', ')}</dd></div>
                                </dl>
                            </div>
                            <div className="admin-management-actions">
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
                                <button className="admin-delete-button" onClick={() => deleteTournament(tournament)} type="button">Löschen</button>
                            </div>
                        </article>
                    ))}
                </div> : <p>{tournaments.length ? 'Keine passenden Turniere vorhanden.' : 'Noch keine Turniere angelegt.'}</p>}
            </section> : null}

            {activeTab === 'groups' ? <section className="admin-management-section">
                <ul className="settings-links admin-management-create-link">
                    <li><Link to="/admin/tournaments/groups/new">Konkurrenz hinzufügen</Link></li>
                </ul>
                <p className="admin-competition-groups-description">Hier verwalten Sie die Konkurrenzen, die beim Erstellen eines Turniers zur Auswahl stehen. Änderungen wirken sich nicht auf bereits erstellte Turniere aus.</p>
                <div aria-label="Konkurrenzen filtern" className="admin-management-filters" role="tablist">
                    {groupFilters.map(filter => <button
                        aria-selected={groupFilter === filter.id}
                        className={groupFilter === filter.id ? 'active' : ''}
                        key={filter.id}
                        onClick={() => setGroupFilter(filter.id)}
                        role="tab"
                        type="button"
                    >{filter.label} ({groupCount(filter.id)})</button>)}
                </div>
                {filteredGroups.length ? <div className="admin-management-list">
                    {filteredGroups.map(group => (
                        <article className="admin-competition-group-row" key={group._id}>
                            <p><strong>{group.name}</strong> <span>{group.competition_type.name}</span></p>
                            <div className="admin-management-actions">
                                <Link className="button-link button-link--secondary" to={`/admin/tournaments/groups/${group._id}/edit`}>Bearbeiten</Link>
                                <button className="admin-delete-button" onClick={() => deleteGroup(group)} type="button">Löschen</button>
                            </div>
                        </article>
                    ))}
                </div> : <p>{groups.length ? 'Keine passenden Konkurrenzen vorhanden.' : 'Noch keine Konkurrenzen angelegt.'}</p>}
            </section> : null}
        </>
    );
}
