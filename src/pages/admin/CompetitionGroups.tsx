import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { CompetitionGroup } from '../../types';
import { Loader } from '../../components/loader/Loader';
import AdminBackButton from '../../components/AdminBackButton';
import { RootState } from '../../store';
import '../settings.css';
import './tournaments.css';

type GroupFilter = 'all' | 'men' | 'women' | 'mixed' | 'youth' | 'senior';

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
    const isUnrestrictedAdultGroup = group.min_age === undefined && group.max_age === undefined;
    return isUnrestrictedAdultGroup && (filter === 'men' ? group.sex === 'male' : group.sex === 'female');
};

export default function AdminCompetitionGroupsPage() {
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth);
    const groupsData = useSelector((state: RootState) => state.competitionGroups);
    const groups = groupsData.clubId === user.club_id ? groupsData.value : [];
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [resettingGroups, setResettingGroups] = useState(false);
    const [resetGroupsMessage, setResetGroupsMessage] = useState('');
    const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
    const filteredGroups = groups.filter(group => groupMatchesFilter(group, groupFilter));
    const groupCount = (filter: GroupFilter) => groups.filter(group => groupMatchesFilter(group, filter)).length;

    useEffect(() => {
        const groupsCurrent = groupsData.loaded && groupsData.clubId === user.club_id;
        if (groupsCurrent) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const response = await fetch('/api/competition-groups');
                const result = await response.json();
                if (!response.ok) throw new Error(result.error ?? 'Konkurrenzen konnten nicht geladen werden.');
                dispatch({type: 'competitionGroups/fetch', payload: {value: result, loaded: true, clubId: user.club_id}});
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Konkurrenzen konnten nicht geladen werden.');
            } finally {
                setLoading(false);
            }
        })();
    }, [dispatch, groupsData.clubId, groupsData.loaded, user.club_id]);

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

    const resetDefaultGroups = async () => {
        if (!confirm('Möchten Sie wirklich alle Konkurrenzen zurücksetzen? Alle eigenen und geänderten Konkurrenzen werden gelöscht und durch die Standardkonkurrenzen ersetzt. Bereits erstellte Turniere bleiben unverändert.')) return;
        setError('');
        setResetGroupsMessage('');
        setResettingGroups(true);
        try {
            const response = await fetch('/api/competition-groups', {
                method: 'POST',
                headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
                body: JSON.stringify({action: 'reset_defaults'}),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? 'Die Konkurrenzen konnten nicht zurückgesetzt werden.');
            dispatch({type: 'competitionGroups/fetch', payload: {value: result.groups, loaded: true, clubId: user.club_id}});
            setResetGroupsMessage(`${result.reset_count} Standardkonkurrenzen wurden wiederhergestellt.`);
        } catch (resetError) {
            setError(resetError instanceof Error ? resetError.message : 'Die Konkurrenzen konnten nicht zurückgesetzt werden.');
        } finally {
            setResettingGroups(false);
        }
    };

    if (loading) return <div className="splash"><Loader size="big" text="Konkurrenzen werden geladen..." /></div>;

    return <>
        <p><AdminBackButton /></p>
        <h1>Konkurrenzen verwalten</h1>
        {error ? <p className="form-error-message">{error}</p> : null}
        <p className="admin-competition-groups-description">Hier verwalten Sie die Konkurrenzen, die beim Erstellen eines Turniers zur Auswahl stehen. Änderungen wirken sich nicht auf bereits erstellte Turniere aus.</p>
        <div className="admin-management-primary-actions">
            <Link className="button-link icon icon--group-add" to="/admin/competition-groups/new">Neue Konkurrenz erstellen</Link>
            <button className="button-link button-link--danger icon icon--undo" disabled={resettingGroups} onClick={() => void resetDefaultGroups()} type="button">
                {resettingGroups ? 'Wird zurückgesetzt...' : 'Alle Konkurrenzen zurücksetzen'}
            </button>
        </div>
        {resetGroupsMessage ? <p className="admin-reset-default-groups-message" role="status">{resetGroupsMessage}</p> : null}
        <fieldset className="admin-filter-options">
            <legend>Filter:</legend>
            {groupFilters.map(filter => <label className="admin-filter-option" key={filter.id}>
                <input checked={groupFilter === filter.id} name="group-filter" onChange={() => setGroupFilter(filter.id)} type="radio" value={filter.id} />
                <span>{filter.label} ({groupCount(filter.id)})</span>
            </label>)}
        </fieldset>
        {filteredGroups.length ? <div className="admin-management-list">
            {filteredGroups.map(group => <article className="admin-management-compact-row admin-competition-group-row" key={group._id}>
                <p><strong>{group.name}</strong> <span>{group.competition_type.name}</span></p>
                <div className="admin-management-actions">
                    <Link className="button-link button-link--secondary" to={`/admin/competition-groups/${group._id}/edit`}>Bearbeiten</Link>
                    <button className="delete-action-button delete-action-button--subtle" onClick={() => deleteGroup(group)} type="button">Löschen</button>
                </div>
            </article>)}
        </div> : <p>{groups.length ? 'Keine passenden Konkurrenzen vorhanden.' : 'Noch keine Konkurrenzen angelegt.'}</p>}
    </>;
}
