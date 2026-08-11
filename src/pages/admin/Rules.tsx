import { FormEvent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router';
import { defaultClubRules } from '../../clubRules';
import { Loader } from '../../components/loader/Loader';
import { RootState } from '../../store';
import { Club } from '../../types';
import { fetchClub } from '../../utils/utils';
import './rules.css';

type RulesResponse = {
    error?: string;
    data?: {
        club_id: string;
        clubs: Club[];
    };
};

export default function AdminRulesPage() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [rules, setRules] = useState<string[]>([]);
    const user = useSelector((state: RootState) => state.auth);
    const clubData = useSelector((state: RootState) => state.club);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const clubId = user.club_id;

    useEffect(() => {
        if (!clubData.loaded || clubData.value._id !== clubId) {
            (async () => {
                setLoading(true);
                await fetchClub(clubId, dispatch);
                setLoading(false);
            })();
        }
    }, [clubData.loaded, clubData.value._id, clubId, dispatch]);

    useEffect(() => {
        if (clubData.loaded && clubData.value._id === clubId) {
            setRules(Array.isArray(clubData.value.rules) ? clubData.value.rules : defaultClubRules);
        }
    }, [clubData.loaded, clubData.value._id, clubId]);

    const updateRule = (index: number, value: string) => {
        setRules(current => current.map((rule, ruleIndex) => ruleIndex === index ? value : rule));
    };

    const moveRule = (index: number, direction: -1 | 1) => {
        setRules(current => {
            const targetIndex = index + direction;
            if (targetIndex < 0 || targetIndex >= current.length) return current;
            const updated = [...current];
            [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
            return updated;
        });
    };

    const saveRules = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedRules = rules.map(rule => rule.trim()).filter(Boolean);

        setError('');
        setSaving(true);
        try {
            const response = await fetch('/api/clubs', {
                method: 'POST',
                headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
                body: JSON.stringify({club_id: clubId, update_type: 'rules', rules: normalizedRules}),
            });
            const result: RulesResponse = await response.json();
            if (!response.ok || result.error || !result.data) {
                setError(typeof result.error === 'string' ? result.error : 'Die Regeln konnten nicht gespeichert werden.');
                return;
            }

            dispatch({type: 'clubs/fetch', payload: {value: result.data.clubs}});
            const updatedClub = result.data.clubs.find(club => club._id === clubId);
            dispatch({type: 'club/fetch', payload: {value: updatedClub, loaded: true}});
            navigate('/admin');
        } catch {
            setError('Die Regeln konnten nicht gespeichert werden.');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !clubData.loaded || clubData.value._id !== clubId) {
        return <div className="splash"><Loader size="big" text="Regeln werden geladen..." /></div>;
    }

    return (
        <>
            <p><Link className="icon icon--back" to="/admin">Zurück</Link></p>
            <h1>Regeln verwalten</h1>
            <form className="admin-rules-form" onSubmit={saveRules}>
                <ol>
                    {rules.map((rule, index) => (
                        <li key={index}>
                            <textarea
                                aria-label={`Regel ${index + 1}`}
                                disabled={saving}
                                maxLength={2000}
                                onChange={event => updateRule(index, event.target.value)}
                                required
                                rows={4}
                                value={rule}
                            />
                            <div className="admin-rule-actions">
                                <button disabled={saving || index === 0} onClick={() => moveRule(index, -1)} type="button">Nach oben</button>
                                <button disabled={saving || index === rules.length - 1} onClick={() => moveRule(index, 1)} type="button">Nach unten</button>
                                <button disabled={saving} onClick={() => setRules(current => current.filter((_, ruleIndex) => ruleIndex !== index))} type="button">Entfernen</button>
                            </div>
                        </li>
                    ))}
                </ol>
                <div className="admin-rules-list-actions">
                    <button disabled={saving || rules.length >= 50} onClick={() => setRules(current => [...current, ''])} type="button">Regel hinzufügen</button>
                    <button disabled={saving} onClick={() => setRules([...defaultClubRules])} type="button">Standardregeln wiederherstellen</button>
                </div>
                {error ? <p className="form-error-message">{error}</p> : null}
                <button disabled={saving} type="submit">{saving ? 'Wird gespeichert...' : 'Speichern'}</button>
            </form>
        </>
    );
}
