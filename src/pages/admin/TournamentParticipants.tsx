import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Tournament, TournamentRegistration } from '../../types';
import { RootState } from '../../store';
import { Loader } from '../../components/loader/Loader';
import './tournaments.css';

const memberName = (member?: {first_name: string; last_name: string}) =>
    member ? `${member.first_name} ${member.last_name}`.trim() : 'Unbekanntes Mitglied';

export default function AdminTournamentParticipantsPage() {
    const {id = ''} = useParams();
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth);
    const tournamentsData = useSelector((state: RootState) => state.tournaments);
    const usersData = useSelector((state: RootState) => state.users);
    const [tournament, setTournament] = useState<Tournament | null>(
        tournamentsData.clubId === user.club_id
            ? tournamentsData.value.find(item => item._id === id && Array.isArray(item.groups)) ?? null
            : null
    );
    const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
    const [groupId, setGroupId] = useState('');
    const [userId, setUserId] = useState('');
    const [partnerUserId, setPartnerUserId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const loadedKey = useRef('');

    const tournamentGroups = tournament?.groups ?? [];
    const selectedGroup = tournamentGroups.find(group => group._id === groupId);
    const activeMembers = usersData.clubId === user.club_id
        ? usersData.value.filter(member => member.status !== 'inactive') : [];
    const registrationsByGroup = useMemo(() => {
        const grouped = new Map<string, TournamentRegistration[]>();
        registrations.forEach(registration => {
            const existing = grouped.get(registration.group_id) ?? [];
            existing.push(registration);
            grouped.set(registration.group_id, existing);
        });
        return grouped;
    }, [registrations]);

    useEffect(() => {
        const currentKey = `${user.club_id}:${id}`;
        if (loadedKey.current === currentKey) return;
        loadedKey.current = currentKey;
        (async () => {
            try {
                const cachedTournament = tournamentsData.clubId === user.club_id
                    ? tournamentsData.value.find(item => item._id === id && Array.isArray(item.groups)) : undefined;
                const [tournamentResponse, usersResponse, registrationsResponse] = await Promise.all([
                    cachedTournament ? null : fetch(`/api/tournaments?id=${encodeURIComponent(id)}`),
                    usersData.loaded && usersData.clubId === user.club_id ? null : fetch(`/api/users?club_id=${encodeURIComponent(user.club_id)}`),
                    fetch(`/api/tournament-registrations?tournament_id=${encodeURIComponent(id)}`),
                ]);

                if (tournamentResponse) {
                    const result = await tournamentResponse.json();
                    if (!tournamentResponse.ok) throw new Error(result.error ?? 'Turnier konnte nicht geladen werden.');
                    setTournament(result);
                    dispatch({type: 'tournaments/upsert', payload: result});
                }
                if (usersResponse) {
                    const result = await usersResponse.json();
                    if (!usersResponse.ok) throw new Error(result.error ?? 'Mitglieder konnten nicht geladen werden.');
                    dispatch({type: 'users/fetch', payload: {value: result, loaded: true, clubId: user.club_id}});
                }
                const registrationResult = await registrationsResponse.json();
                if (!registrationsResponse.ok) throw new Error(registrationResult.error ?? 'Teilnehmende konnten nicht geladen werden.');
                setRegistrations(registrationResult);
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Die Daten konnten nicht geladen werden.');
            } finally {
                setLoading(false);
            }
        })();
    }, [dispatch, id, tournamentsData.clubId, tournamentsData.value, user.club_id, usersData.clubId, usersData.loaded]);

    useEffect(() => {
        if (!groupId && tournamentGroups.length) setGroupId(tournamentGroups[0]._id);
    }, [groupId, tournamentGroups]);

    const addRegistration = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const response = await fetch('/api/tournament-registrations', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    tournament_id: id,
                    group_id: groupId,
                    user_ids: selectedGroup?.competition_type.id === 'double' ? [userId, partnerUserId] : [userId],
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? 'Die Anmeldung konnte nicht hinzugefügt werden.');
            setRegistrations(current => [...current, result]);
            if (tournament) {
                const updatedTournament = {
                    ...tournament,
                    registrants_count: (tournament.registrants_count ?? 0) + result.user_ids.length,
                };
                setTournament(updatedTournament);
                dispatch({type: 'tournaments/upsert', payload: updatedTournament});
            }
            setUserId('');
            setPartnerUserId('');
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Die Anmeldung konnte nicht hinzugefügt werden.');
        } finally {
            setSaving(false);
        }
    };

    const removeRegistration = async (registration: TournamentRegistration) => {
        const registrationNames = registration.users?.map(memberName).join(' / ') || 'diesem Mitglied';
        if (!confirm(`Möchten Sie die Anmeldung von ${registrationNames} wirklich entfernen?`)) return;
        setError('');
        try {
            const response = await fetch(`/api/tournament-registrations?id=${encodeURIComponent(registration._id)}`, {method: 'DELETE'});
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? 'Die Anmeldung konnte nicht entfernt werden.');
            setRegistrations(current => current.filter(item => item._id !== registration._id));
            if (tournament) {
                const updatedTournament = {
                    ...tournament,
                    registrants_count: Math.max(0, (tournament.registrants_count ?? 0) - registration.user_ids.length),
                };
                setTournament(updatedTournament);
                dispatch({type: 'tournaments/upsert', payload: updatedTournament});
            }
        } catch (removeError) {
            setError(removeError instanceof Error ? removeError.message : 'Die Anmeldung konnte nicht entfernt werden.');
        }
    };

    if (loading) return <div className="splash"><Loader size="big" text="Teilnehmende werden geladen..." /></div>;

    return <>
        <p><Link className="icon icon--back" to="/admin/tournaments">Zurück</Link></p>
        <h1>Teilnehmende: {tournament?.name ?? 'Turnier'}</h1>
        {error ? <p className="form-error-message">{error}</p> : null}

        <form className="admin-participant-form" onSubmit={addRegistration}>
            <h2>Anmeldung hinzufügen</h2>
            <label>Konkurrenz<select required value={groupId} onChange={event => {setGroupId(event.target.value); setPartnerUserId('');}}>{tournamentGroups.map(group => <option key={group._id} value={group._id}>{group.name}</option>)}</select></label>
            <label>Mitglied<select required value={userId} onChange={event => setUserId(event.target.value)}><option value="">Bitte auswählen</option>{activeMembers.map(member => <option key={member._id} value={member._id}>{member.last_name}, {member.first_name}</option>)}</select></label>
            {selectedGroup?.competition_type.id === 'double' ? <label>Partner/in<select required value={partnerUserId} onChange={event => setPartnerUserId(event.target.value)}><option value="">Bitte auswählen</option>{activeMembers.filter(member => member._id !== userId).map(member => <option key={member._id} value={member._id}>{member.last_name}, {member.first_name}</option>)}</select></label> : null}
            <button disabled={saving || !tournamentGroups.length} type="submit">{saving ? 'Wird hinzugefügt...' : 'Hinzufügen'}</button>
        </form>

        <div className="admin-participant-groups">
            {tournamentGroups.map(group => {
                const groupRegistrations = registrationsByGroup.get(group._id) ?? [];
                const registrationCount = groupRegistrations.length;
                return <section key={group._id}>
                    <h2>{group.name} <small>{registrationCount}</small></h2>
                    {groupRegistrations.length ? <ul>{groupRegistrations.map(registration => <li key={registration._id}>
                        <span>{registration.users?.map(memberName).join(' / ') || 'Unbekanntes Mitglied'}</span>
                        <button className="delete-action-button" onClick={() => removeRegistration(registration)} type="button">Entfernen</button>
                    </li>)}</ul> : <p>Noch keine Anmeldungen.</p>}
                </section>;
            })}
        </div>
    </>;
}
