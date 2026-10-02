import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { CompetitionGroup, Tournament, TournamentPaymentMethod, TournamentStatus } from '../../types';
import { Loader } from '../../components/loader/Loader';
import AdminBackButton from '../../components/AdminBackButton';
import { RootState } from '../../store';
import '../../components/form/Form.css';
import './tournaments.css';

type TournamentForm = {
    name: string;
    description: string;
    format: string;
    start_date: string;
    end_date: string;
    registration_deadline: string;
    draw: string;
    entry_fee: string;
    payment_method: '' | TournamentPaymentMethod;
    status: TournamentStatus;
    notify_members_on_publish: boolean;
    group_ids: string[];
};

const emptyForm: TournamentForm = {
    name: '', description: '', format: '', start_date: '', end_date: '', registration_deadline: '', draw: '', entry_fee: '0', payment_method: '',
    status: 'draft', notify_members_on_publish: true, group_ids: [],
};

const statusLabels: Record<TournamentStatus, string> = {
    draft: 'Entwurf', published: 'Veröffentlicht',
};

const tournamentFormats = [
    'K.-o.-System',
    'K.-o.-System mit Nebenrunde',
    'Jeder gegen jeden',
    'Gruppenphase mit K.-o.-Runde',
];

const toDateTimeLocal = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const tournamentToForm = (tournament: Tournament): TournamentForm => ({
    name: tournament.name,
    description: tournament.description ?? '',
    format: tournament.format ?? '',
    start_date: tournament.start_date,
    end_date: tournament.end_date,
    registration_deadline: toDateTimeLocal(tournament.registration_deadline),
    draw: tournament.draw ? toDateTimeLocal(tournament.draw) : '',
    entry_fee: tournament.entry_fee?.toString() ?? '',
    payment_method: tournament.payment_method ?? '',
    status: tournament.status,
    notify_members_on_publish: tournament.notify_members_on_publish !== false,
    group_ids: tournament.groups.map(group => group.source_group_id),
});

export default function AdminTournamentFormPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth);
    const groupsData = useSelector((state: RootState) => state.competitionGroups);
    const tournamentsData = useSelector((state: RootState) => state.tournaments);
    const editing = Boolean(id);
    const groupsCurrent = groupsData.loaded && groupsData.clubId === user.club_id;
    const cachedTournament = tournamentsData.clubId === user.club_id
        ? tournamentsData.value.find(tournament => tournament._id === id && Array.isArray(tournament.groups))
        : undefined;
    const [form, setForm] = useState<TournamentForm>(() => cachedTournament ? tournamentToForm(cachedTournament) : emptyForm);
    const groups: CompetitionGroup[] = groupsData.clubId === user.club_id ? groupsData.value : [];
    const [loading, setLoading] = useState(!groupsCurrent || (editing && !cachedTournament));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const unavailableGroups = (cachedTournament?.groups ?? []).filter(group =>
        !groups.some(template => template._id === group.source_group_id)
    );

    useEffect(() => {
        if (cachedTournament) setForm(tournamentToForm(cachedTournament));

        (async () => {
            try {
                const [groupsResponse, tournamentResponse] = await Promise.all([
                    groupsCurrent ? null : fetch('/api/competition-groups'),
                    id && !cachedTournament ? fetch(`/api/tournaments?id=${encodeURIComponent(id)}`) : Promise.resolve(null),
                ]);
                if (groupsResponse) {
                    const groupsResult = await groupsResponse.json();
                    if (!groupsResponse.ok) throw new Error(groupsResult.error ?? 'Konkurrenzen konnten nicht geladen werden.');
                    dispatch({type: 'competitionGroups/fetch', payload: {value: groupsResult, loaded: true, clubId: user.club_id}});
                }
                if (tournamentResponse) {
                    const tournament: Tournament & {error?: string} = await tournamentResponse.json();
                    if (!tournamentResponse.ok) throw new Error(tournament.error ?? 'Turnier konnte nicht geladen werden.');
                    setForm(tournamentToForm(tournament));
                    dispatch({type: 'tournaments/upsert', payload: tournament});
                }
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Die Daten konnten nicht geladen werden.');
            } finally {
                setLoading(false);
            }
        })();
    }, [cachedTournament, dispatch, groupsCurrent, id, user.club_id]);

    const toggleGroup = (groupId: string) => setForm(current => ({
        ...current,
        group_ids: current.group_ids.includes(groupId)
            ? current.group_ids.filter(currentId => currentId !== groupId)
            : [...current.group_ids, groupId],
    }));

    const saveTournament = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const response = await fetch(`/api/tournaments${id ? `?id=${encodeURIComponent(id)}` : ''}`, {
                method: editing ? 'PATCH' : 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    ...form,
                    registration_deadline: new Date(form.registration_deadline).toISOString(),
                    draw: form.draw ? new Date(form.draw).toISOString() : undefined,
                    entry_fee: form.entry_fee === '' ? undefined : Number(form.entry_fee),
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? 'Das Turnier konnte nicht gespeichert werden.');
            dispatch({type: 'tournaments/upsert', payload: result});
            if (result.status === 'published' && result.notify_members_on_publish !== false) {
                dispatch({type: 'appRefresh/request'});
                dispatch({type: 'adminNotifications/reset'});
            }
            navigate('/admin/tournaments');
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Das Turnier konnte nicht gespeichert werden.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="splash"><Loader size="big" text="Turnier wird geladen..." /></div>;

    return <>
        <p><AdminBackButton fallback="/admin/tournaments" fallbackLabel="Zu den Turnieren" /></p>
        <h1>{editing ? 'Turnier bearbeiten' : 'Turnier hinzufügen'}</h1>
        <form className="form-react admin-tournament-edit-form" onSubmit={saveTournament}>
            <div className="row"><label htmlFor="tournament-name">Turniername: *</label><div><input id="tournament-name" maxLength={150} required value={form.name} onChange={event => setForm(current => ({...current, name: event.target.value}))} /></div></div>
            <div className="row"><label htmlFor="tournament-description">Beschreibung:</label><div><textarea id="tournament-description" maxLength={3000} rows={4} value={form.description} onChange={event => setForm(current => ({...current, description: event.target.value}))} /></div></div>
            <div className="row"><label htmlFor="tournament-format">Spielmodus:</label><div><select id="tournament-format" value={form.format} onChange={event => setForm(current => ({...current, format: event.target.value}))}>
                <option value="">Noch nicht festgelegt</option>
                {form.format && !tournamentFormats.includes(form.format) ? <option value={form.format}>{form.format}</option> : null}
                {tournamentFormats.map(format => <option key={format} value={format}>{format}</option>)}
            </select></div></div>
            <div className="row"><label htmlFor="tournament-start-date">Startdatum: *</label><div><input id="tournament-start-date" type="date" required value={form.start_date} onChange={event => setForm(current => ({...current, start_date: event.target.value}))} /></div></div>
            <div className="row"><label htmlFor="tournament-end-date">Enddatum: *</label><div><input id="tournament-end-date" type="date" required min={form.start_date || undefined} value={form.end_date} onChange={event => setForm(current => ({...current, end_date: event.target.value}))} /></div></div>
            <div className="row"><label htmlFor="tournament-registration-deadline">Meldeschluss: *</label><div><input id="tournament-registration-deadline" type="datetime-local" required value={form.registration_deadline} onChange={event => setForm(current => ({...current, registration_deadline: event.target.value}))} /></div></div>
            <div className="row"><label htmlFor="tournament-draw">Auslosung:</label><div><input id="tournament-draw" type="datetime-local" value={form.draw} onChange={event => setForm(current => ({...current, draw: event.target.value}))} /></div></div>
            <div className="row"><label htmlFor="tournament-entry-fee">Startgeld (€):</label><div><input id="tournament-entry-fee" min="0" step="1" type="number" value={form.entry_fee} onChange={event => setForm(current => ({...current, entry_fee: event.target.value}))} /></div></div>
            <div className="row"><label htmlFor="tournament-payment-method">Zahlungsart:</label><div><select id="tournament-payment-method" value={form.payment_method} onChange={event => setForm(current => ({...current, payment_method: event.target.value as TournamentForm['payment_method']}))}>
                    <option value="">Noch nicht festgelegt</option>
                    <option value="cash">Barzahlung</option>
                    <option value="bank_transfer">Überweisung</option>
                </select></div></div>
            <div className="row">
                <fieldset className="admin-tournament-status">
                    <legend>Status:</legend>
                    <div>{Object.entries(statusLabels).map(([value, label]) => <label key={value}>
                        <input
                            checked={form.status === value}
                            name="tournament-status"
                            onChange={() => setForm(current => ({...current, status: value as TournamentStatus}))}
                            type="radio"
                            value={value}
                        />
                        {label}
                    </label>)}</div>
                </fieldset>
            </div>
            <fieldset className="admin-tournament-groups row">
                <legend>Konkurrenzen:</legend>
                {groups.length ? groups.map(group => <label key={group._id}>
                    <input checked={form.group_ids.includes(group._id)} onChange={() => toggleGroup(group._id)} type="checkbox" />
                    <span>{group.name} <small>({group.competition_type.name})</small></span>
                </label>) : null}
                {unavailableGroups.map(group => <label key={group.source_group_id}>
                    <input checked={form.group_ids.includes(group.source_group_id)} onChange={() => toggleGroup(group.source_group_id)} type="checkbox" />
                    <span>{group.name} <small>({group.competition_type.name}, Vorlage gelöscht)</small></span>
                </label>)}
                {!groups.length && !unavailableGroups.length ? <p>Für diesen Verein sind noch keine Konkurrenzen angelegt.</p> : null}
            </fieldset>
            <label className="admin-tournament-notification row" htmlFor="tournament-notify-members">
                <input
                    checked={form.notify_members_on_publish}
                    id="tournament-notify-members"
                    onChange={event => setForm(current => ({...current, notify_members_on_publish: event.target.checked}))}
                    type="checkbox"
                />
                Mitglieder benachrichtigen, wenn das Turnier veröffentlicht wird
            </label>
            {error ? <p className="form-error-message">{error}</p> : null}
            <div className="row admin-tournament-form-actions">
                <button className="primary-action-button" disabled={saving || form.group_ids.length === 0} type="submit">{saving ? 'Wird gespeichert...' : 'Speichern'}</button>
                <button disabled={saving} onClick={() => navigate('/admin/tournaments')} type="button">Abbrechen</button>
            </div>
        </form>
    </>;
}
