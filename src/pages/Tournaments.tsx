import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tournament, TournamentGroup, TournamentRegistration } from '../types';
import { RootState } from '../store';
import { Loader } from '../components/loader/Loader';
import { getZonedDateTime } from '../utils/reservationTime';
import './tournaments.css';

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
const memberName = (member?: {first_name: string; last_name: string}) =>
    member ? `${member.first_name} ${member.last_name}`.trim() : 'Unbekanntes Mitglied';
type TournamentFilter = 'all' | 'mine' | 'upcoming' | 'running' | 'past';
const tournamentFilters: Array<{id: TournamentFilter; label: string}> = [
    {id: 'all', label: 'Alle'},
    {id: 'mine', label: 'Meine Turniere'},
    {id: 'upcoming', label: 'Bevorstehend'},
    {id: 'running', label: 'Laufend'},
    {id: 'past', label: 'Vergangen'},
];

export default function TournamentsPage() {
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth);
    const tournamentsData = useSelector((state: RootState) => state.tournaments);
    const usersData = useSelector((state: RootState) => state.users);
    const club = useSelector((state: RootState) => state.clubs.value.find(club => club._id === user.club_id));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tournamentFilter, setTournamentFilter] = useState<TournamentFilter>('all');
    const [expandedGroup, setExpandedGroup] = useState('');
    const [pendingGroup, setPendingGroup] = useState('');
    const [doubleRegistrationGroup, setDoubleRegistrationGroup] = useState('');
    const [partnerUserId, setPartnerUserId] = useState('');
    const [groupMessages, setGroupMessages] = useState<Record<string, {type: 'error' | 'success'; text: string}>>({});
    const [registrations, setRegistrations] = useState<Record<string, TournamentRegistration[]>>({});
    const activeMembers = usersData.clubId === user.club_id
        ? usersData.value.filter(member => member.status === 'active') : [];
    const tournaments = tournamentsData.clubId === user.club_id
        ? tournamentsData.value.filter(tournament => tournament.status === 'published') : [];
    const today = getZonedDateTime(new Date(), club?.timezone ?? 'Europe/Berlin').date;
    const tournamentMatchesFilter = (tournament: Tournament, filter: TournamentFilter) => {
        if (filter === 'all') return true;
        if (filter === 'mine') return Object.keys(tournament.current_user_registrations ?? {}).length > 0;
        if (filter === 'upcoming') return tournament.start_date > today;
        if (filter === 'running') return tournament.start_date <= today && tournament.end_date >= today;
        return tournament.end_date < today;
    };
    const filteredTournaments = tournaments.filter(tournament => tournamentMatchesFilter(tournament, tournamentFilter));
    const closeGroupDialog = () => {
        setExpandedGroup('');
        setDoubleRegistrationGroup('');
        setPartnerUserId('');
    };

    useEffect(() => {
        const usersCurrent = usersData.loaded && usersData.clubId === user.club_id;
        const tournamentsCurrent = tournamentsData.loaded
            && tournamentsData.clubId === user.club_id
            && tournamentsData.value.every(tournament => Number.isFinite(tournament.registrants_count)
                && Array.isArray(tournament.groups)
                && tournament.group_registrants_count !== undefined
                && tournament.current_user_registrations !== undefined);
        if (tournamentsCurrent && usersCurrent) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const [tournamentsResponse, usersResponse] = await Promise.all([
                    tournamentsCurrent ? null : fetch('/api/tournaments'),
                    usersCurrent ? null : fetch(`/api/users?club_id=${encodeURIComponent(user.club_id)}`),
                ]);
                if (tournamentsResponse) {
                    const result = await tournamentsResponse.json();
                    if (!tournamentsResponse.ok) throw new Error(result.error ?? 'Turniere konnten nicht geladen werden.');
                    dispatch({type: 'tournaments/fetch', payload: {value: result, loaded: true, clubId: user.club_id}});
                }
                if (usersResponse) {
                    const result = await usersResponse.json();
                    if (!usersResponse.ok) throw new Error(result.error ?? 'Mitglieder konnten nicht geladen werden.');
                    dispatch({type: 'users/fetch', payload: {value: result, loaded: true, clubId: user.club_id}});
                }
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Turniere konnten nicht geladen werden.');
            } finally {
                setLoading(false);
            }
        })();
    }, [dispatch, tournamentsData.clubId, tournamentsData.loaded, tournamentsData.value, user.club_id, usersData.clubId, usersData.loaded]);

    useEffect(() => {
        if (!expandedGroup) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeGroupDialog();
        };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [expandedGroup]);

    const toggleGroup = async (tournament: Tournament, groupId: string) => {
        const key = `${tournament._id}:${groupId}`;
        if (expandedGroup === key) {
            closeGroupDialog();
            return;
        }
        setExpandedGroup(key);
        if (registrations[tournament._id] !== undefined) return;
        setPendingGroup(key);
        setError('');
        try {
            const response = await fetch(`/api/tournament-registrations?tournament_id=${encodeURIComponent(tournament._id)}`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? 'Anmeldungen konnten nicht geladen werden.');
            setRegistrations(current => ({...current, [tournament._id]: result}));
        } catch (registrationError) {
            setError(registrationError instanceof Error ? registrationError.message : 'Anmeldungen konnten nicht geladen werden.');
            closeGroupDialog();
        } finally {
            setPendingGroup('');
        }
    };

    const updateTournamentRegistration = (
        tournament: Tournament,
        groupId: string,
        participantDifference: number,
        registrationDifference: number,
        registration?: TournamentRegistration,
    ) => {
        const currentUserRegistrations = {...(tournament.current_user_registrations ?? {})};
        if (registration) currentUserRegistrations[groupId] = registration;
        else delete currentUserRegistrations[groupId];
        dispatch({
            type: 'tournaments/upsert',
            payload: {
                ...tournament,
                registrants_count: Math.max(0, (tournament.registrants_count ?? 0) + participantDifference),
                group_registrants_count: {
                    ...(tournament.group_registrants_count ?? {}),
                    [groupId]: Math.max(0, (tournament.group_registrants_count?.[groupId] ?? 0) + registrationDifference),
                },
                current_user_registrations: currentUserRegistrations,
            },
        });
    };

    const startDoubleRegistration = async (tournament: Tournament, group: TournamentGroup) => {
        const key = `${tournament._id}:${group._id}`;
        setDoubleRegistrationGroup(key);
        setPartnerUserId('');
        if (expandedGroup !== key) await toggleGroup(tournament, group._id);
    };

    const register = async (tournament: Tournament, group: TournamentGroup, partnerId?: string) => {
        const key = `${tournament._id}:${group._id}`;
        setPendingGroup(key);
        setGroupMessages(current => {
            const next = {...current};
            delete next[key];
            return next;
        });
        try {
            const response = await fetch('/api/tournament-registrations', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    tournament_id: tournament._id,
                    group_id: group._id,
                    ...(partnerId ? {user_ids: [user._id, partnerId]} : {}),
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? 'Die Anmeldung ist fehlgeschlagen.');
            setRegistrations(current => current[tournament._id] === undefined
                ? current
                : {...current, [tournament._id]: [...current[tournament._id], result]});
            updateTournamentRegistration(tournament, group._id, result.user_ids.length, 1, result);
            setDoubleRegistrationGroup('');
            setPartnerUserId('');
            setGroupMessages(current => ({
                ...current,
                [key]: {type: 'success', text: `Sie sind für ${group.name} angemeldet.`},
            }));
        } catch (registrationError) {
            setGroupMessages(current => ({
                ...current,
                [key]: {
                    type: 'error',
                    text: registrationError instanceof Error ? registrationError.message : 'Die Anmeldung ist fehlgeschlagen.',
                },
            }));
        } finally {
            setPendingGroup('');
        }
    };

    const unregister = async (tournament: Tournament, registration: TournamentRegistration) => {
        if (!confirm('Möchten Sie sich wirklich von dieser Konkurrenz abmelden?')) return;
        const key = `${tournament._id}:${registration.group_id}`;
        setPendingGroup(key);
        setGroupMessages(current => {
            const next = {...current};
            delete next[key];
            return next;
        });
        try {
            const response = await fetch(`/api/tournament-registrations?id=${encodeURIComponent(registration._id)}`, {method: 'DELETE'});
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? 'Die Abmeldung ist fehlgeschlagen.');
            setRegistrations(current => current[tournament._id] === undefined
                ? current
                : {
                    ...current,
                    [tournament._id]: current[tournament._id].filter(item => item._id !== registration._id),
                });
            updateTournamentRegistration(tournament, registration.group_id, -registration.user_ids.length, -1);
            setGroupMessages(current => ({
                ...current,
                [key]: {type: 'success', text: 'Sie sind von dieser Konkurrenz abgemeldet.'},
            }));
        } catch (registrationError) {
            setGroupMessages(current => ({
                ...current,
                [key]: {
                    type: 'error',
                    text: registrationError instanceof Error ? registrationError.message : 'Die Abmeldung ist fehlgeschlagen.',
                },
            }));
        } finally {
            setPendingGroup('');
        }
    };

    const [selectedTournamentId, selectedGroupId] = expandedGroup.split(':');
    const selectedTournament = tournaments.find(tournament => tournament._id === selectedTournamentId);
    const selectedGroup = selectedTournament?.groups.find(group => group._id === selectedGroupId);
    const selectedRegistrations = selectedTournament
        ? (registrations[selectedTournament._id] ?? []).filter(item => item.group_id === selectedGroupId)
        : [];
    const selectedRegistrationsLoaded = selectedTournament
        ? registrations[selectedTournament._id] !== undefined
        : false;
    const selectedOwnRegistration = selectedTournament
        ? selectedRegistrations.find(item => item.user_ids.includes(user._id))
            ?? selectedTournament.current_user_registrations?.[selectedGroupId]
        : undefined;
    const selectedRegistrationCount = selectedTournament
        ? registrations[selectedTournament._id] === undefined
            ? selectedTournament.group_registrants_count?.[selectedGroupId] ?? 0
            : selectedRegistrations.length
        : 0;
    const selectedRegistrationOpen = Boolean(selectedTournament
        && selectedTournament.status === 'published'
        && new Date(selectedTournament.registration_deadline).getTime() >= Date.now());
    const selectedDoubles = selectedGroup?.competition_type.id === 'double';
    const selectedKey = selectedTournament && selectedGroup ? `${selectedTournament._id}:${selectedGroup._id}` : '';
    const selectedRegisteredUserIds = new Set(selectedRegistrations.flatMap(registration => registration.user_ids));
    const selectedPartnerOptions = activeMembers.filter(member => member._id !== user._id && !selectedRegisteredUserIds.has(member._id));

    if (loading) return <div className="splash"><Loader size="big" text="Turniere werden geladen..." /></div>;

    return <>
        <h1>Turniere</h1>
        {error ? <p className="form-error-message">{error}</p> : null}
        <div aria-label="Turniere filtern" className="tournament-filters" role="tablist">
            {tournamentFilters.map(filter => <button
                aria-selected={tournamentFilter === filter.id}
                className={tournamentFilter === filter.id ? 'active' : ''}
                key={filter.id}
                onClick={() => setTournamentFilter(filter.id)}
                role="tab"
                type="button"
            >{filter.label} ({tournaments.filter(tournament => tournamentMatchesFilter(tournament, filter.id)).length})</button>)}
        </div>
        {filteredTournaments.length ? <div className="tournament-list">{filteredTournaments.map(tournament => <article key={tournament._id}>
            {Object.keys(tournament.current_user_registrations ?? {}).length ? <div className="tournament-user-status">
                {tournament.end_date < today ? 'Teilgenommen an' : 'Angemeldet in'}{' '}
                {tournament.groups
                    .filter(group => tournament.current_user_registrations?.[group._id])
                    .map(group => group.name)
                    .join(', ')}
            </div> : tournament.status === 'published' && new Date(tournament.registration_deadline).getTime() >= Date.now()
                ? <div className="tournament-user-status tournament-user-status--none">
                    Sie haben sich für dieses Turnier nicht angemeldet. Klicken Sie auf eine Konkurrenz, um sich anzumelden.
                </div>
                : null}
            <div className="tournament-heading">
                <div>
                    <h2>{tournament.name}</h2>
                </div>
                <div className="tournament-heading-meta">
                    {tournament.start_date > today ? <div
                        aria-label={`Noch ${daysBetween(today, tournament.start_date)} ${daysBetween(today, tournament.start_date) === 1 ? 'Tag' : 'Tage'} bis zum Start`}
                        className="tournament-countdown"
                    >
                        <strong>{daysBetween(today, tournament.start_date)}</strong>
                        <span>{daysBetween(today, tournament.start_date) === 1 ? 'Tag' : 'Tage'}<small>bis zum Start</small></span>
                    </div> : tournament.end_date < today ? <div className="tournament-finished">
                        <strong>Beendet</strong>
                        <small>Turnier vorbei</small>
                    </div> : null}
                </div>
            </div>
            {tournament.description ? <p className="tournament-description">{tournament.description}</p> : null}
            <dl>
                <div><dt>Datum</dt><dd>{formatTournamentDate(tournament)}</dd></div>
                <div><dt>Meldeschluss</dt><dd>{formatDeadline(tournament.registration_deadline)}</dd></div>
                <div><dt>Auslosung</dt><dd>{tournament.draw ? formatDeadline(tournament.draw) : 'Noch nicht festgelegt'}</dd></div>
                <div><dt>Startgeld</dt><dd>{formatEntryFee(tournament.entry_fee)}</dd></div>
                {tournament.entry_fee !== 0 ? <div><dt>Zahlungsart</dt><dd>{tournament.payment_method ? paymentMethodLabels[tournament.payment_method] : 'Noch nicht festgelegt'}</dd></div> : null}
                {tournament.format ? <div><dt>Spielmodus</dt><dd>{tournament.format}</dd></div> : null}
                <div><dt>Teilnehmende</dt><dd>{tournament.registrants_count ?? 0}</dd></div>
                <div className="tournament-groups-row">
                    <dt>Konkurrenzen ({tournament.groups.length})</dt>
                    <dd>{tournament.groups.map((group, index) => <span key={group._id}>
                        {index > 0 ? ', ' : null}
                        <button className="tournament-group-link" onClick={() => toggleGroup(tournament, group._id)} type="button">
                            {group.name} ({tournament.group_registrants_count?.[group._id] ?? 0})
                        </button>
                    </span>)}</dd>
                </div>
            </dl>
        </article>)}</div> : <p>{tournaments.length ? 'Keine passenden Turniere vorhanden.' : 'Derzeit sind keine Turniere verfügbar.'}</p>}
        {selectedTournament && selectedGroup ? <div
            className="tournament-dialog-backdrop"
            onMouseDown={event => {
                if (event.target === event.currentTarget) closeGroupDialog();
            }}
        >
            <section aria-labelledby="tournament-dialog-title" aria-modal="true" className="tournament-dialog" role="dialog">
                <header>
                    <div>
                        <h2 id="tournament-dialog-title">{selectedGroup.name} ({selectedRegistrationCount})</h2>
                        <p>{selectedTournament.name}</p>
                    </div>
                    <button aria-label="Schließen" autoFocus className="tournament-dialog-close" onClick={closeGroupDialog} type="button">×</button>
                </header>
                {!selectedRegistrationsLoaded ? <Loader size="small" text="Anmeldungen werden geladen..." /> : <>
                    {selectedTournament.status === 'published' ? <div className="tournament-group-row">
                        {selectedOwnRegistration
                            ? <button className="tournament-unregister-button" disabled={!selectedRegistrationOpen || pendingGroup === selectedKey} onClick={() => unregister(selectedTournament, selectedOwnRegistration)} type="button">{pendingGroup === selectedKey ? 'Wird abgemeldet…' : 'Abmelden'}</button>
                            : <button className="tournament-register-button" disabled={!selectedRegistrationOpen || pendingGroup === selectedKey} onClick={() => selectedDoubles ? startDoubleRegistration(selectedTournament, selectedGroup) : register(selectedTournament, selectedGroup)} type="button">{pendingGroup === selectedKey ? 'Wird geladen…' : 'Anmelden'}</button>}
                    </div> : null}
                    {selectedDoubles && doubleRegistrationGroup === selectedKey && !selectedOwnRegistration ? <form className="tournament-double-registration" onSubmit={event => {event.preventDefault(); register(selectedTournament, selectedGroup, partnerUserId);}}>
                        <label htmlFor={`partner-${selectedKey}`}>Partner/in</label>
                        <select id={`partner-${selectedKey}`} required value={partnerUserId} onChange={event => setPartnerUserId(event.target.value)}>
                            <option value="">Bitte auswählen</option>
                            {selectedPartnerOptions.map(member => <option key={member._id} value={member._id}>{member.last_name}, {member.first_name}</option>)}
                        </select>
                        <div>
                            <button disabled={pendingGroup === selectedKey || !partnerUserId} type="submit">{pendingGroup === selectedKey ? 'Wird angemeldet…' : 'Mit Partner/in anmelden'}</button>
                            <button disabled={pendingGroup === selectedKey} onClick={() => {setDoubleRegistrationGroup(''); setPartnerUserId('');}} type="button">Abbrechen</button>
                        </div>
                        {!selectedPartnerOptions.length ? <p>Keine verfügbaren Partner/innen.</p> : null}
                    </form> : null}
                    {groupMessages[selectedKey] ? <p className={groupMessages[selectedKey].type === 'error' ? 'form-error-message tournament-registration-message' : 'tournament-registration-success'} role="status">{groupMessages[selectedKey].text}</p> : null}
                    {!selectedRegistrationOpen ? <p className="tournament-registration-note">Die Anmeldung ist geschlossen.</p> : null}
                    {selectedRegistrations.length ? <ul className="tournament-participants">{selectedRegistrations.map(registration => <li key={registration._id}>{registration.users?.map(memberName).join(' / ') || 'Unbekanntes Mitglied'}</li>)}</ul> : <p>Noch keine Anmeldungen.</p>}
                </>}
            </section>
        </div> : null}
    </>;
}
