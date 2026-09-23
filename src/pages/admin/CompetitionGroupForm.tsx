import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { CompetitionGroup, CompetitionType } from '../../types';
import { Loader } from '../../components/loader/Loader';
import { RootState } from '../../store';
import './tournaments.css';

type GroupForm = {
    name: string;
    competition_type_id: CompetitionType['id'];
    sex: '' | NonNullable<CompetitionGroup['sex']>;
    min_age: string;
    max_age: string;
};

const competitionTypeNames: Record<CompetitionType['id'], CompetitionType['name']> = {
    single: 'Einzel',
    double: 'Doppel',
};

const emptyForm: GroupForm = {name: '', competition_type_id: 'single', sex: '', min_age: '', max_age: ''};

const groupToForm = (group: CompetitionGroup): GroupForm => ({
    name: group.name,
    competition_type_id: group.competition_type.id,
    sex: group.sex ?? '',
    min_age: group.min_age?.toString() ?? '',
    max_age: group.max_age?.toString() ?? '',
});

export default function AdminCompetitionGroupFormPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth);
    const groupsData = useSelector((state: RootState) => state.competitionGroups);
    const editing = Boolean(id);
    const cachedGroup = groupsData.clubId === user.club_id
        ? groupsData.value.find(group => group._id === id)
        : undefined;
    const [form, setForm] = useState<GroupForm>(() => cachedGroup ? groupToForm(cachedGroup) : emptyForm);
    const [loading, setLoading] = useState(editing && !cachedGroup);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        if (cachedGroup) {
            setForm(groupToForm(cachedGroup));
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const response = await fetch(`/api/competition-groups?id=${encodeURIComponent(id)}`);
                const group: CompetitionGroup & {error?: string} = await response.json();
                if (!response.ok) throw new Error(group.error ?? 'Konkurrenz konnte nicht geladen werden.');
                setForm(groupToForm(group));
                dispatch({type: 'competitionGroups/upsert', payload: group});
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Konkurrenz konnte nicht geladen werden.');
            } finally {
                setLoading(false);
            }
        })();
    }, [cachedGroup, dispatch, id]);

    const saveGroup = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const response = await fetch(`/api/competition-groups${id ? `?id=${encodeURIComponent(id)}` : ''}`, {
                method: editing ? 'PATCH' : 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: form.name,
                    competition_type: {id: form.competition_type_id, name: competitionTypeNames[form.competition_type_id]},
                    sex: form.sex || undefined,
                    min_age: form.min_age || undefined,
                    max_age: form.max_age || undefined,
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? 'Die Konkurrenz konnte nicht gespeichert werden.');
            dispatch({type: 'competitionGroups/upsert', payload: result});
            navigate('/admin/tournaments?tab=groups');
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Die Konkurrenz konnte nicht gespeichert werden.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="splash"><Loader size="big" text="Konkurrenz wird geladen..." /></div>;

    return <>
        <p><Link className="icon icon--back" to="/admin/tournaments?tab=groups">Zurück</Link></p>
        <h1>{editing ? 'Konkurrenz bearbeiten' : 'Konkurrenz hinzufügen'}</h1>
        <form className="admin-tournament-form" onSubmit={saveGroup}>
            <label htmlFor="group-name">Name</label>
            <input id="group-name" maxLength={100} required value={form.name} onChange={event => setForm(current => ({...current, name: event.target.value}))} />
            <label htmlFor="competition-type">Typ</label>
            <select id="competition-type" value={form.competition_type_id} onChange={event => setForm(current => ({...current, competition_type_id: event.target.value as CompetitionType['id']}))}>
                <option value="single">Einzel</option>
                <option value="double">Doppel</option>
            </select>
            <label htmlFor="competition-sex">Geschlechtsbeschränkung</label>
            <select id="competition-sex" value={form.sex} onChange={event => setForm(current => ({...current, sex: event.target.value as GroupForm['sex']}))}>
                <option value="">Keine</option>
                <option value="male">Herren</option>
                <option value="female">Damen</option>
                <option value="mixed">Mixed</option>
            </select>
            <div className="admin-tournament-date-grid">
                <label>Mindestalter<input min="0" max="120" type="number" value={form.min_age} onChange={event => setForm(current => ({...current, min_age: event.target.value}))} /></label>
                <label>Höchstalter<input min="0" max="120" type="number" value={form.max_age} onChange={event => setForm(current => ({...current, max_age: event.target.value}))} /></label>
            </div>
            {error ? <p className="form-error-message">{error}</p> : null}
            <div className="admin-tournament-form-actions">
                <button disabled={saving} type="submit">{saving ? 'Wird gespeichert...' : 'Speichern'}</button>
                <button disabled={saving} onClick={() => navigate('/admin/tournaments?tab=groups')} type="button">Abbrechen</button>
            </div>
        </form>
    </>;
}
