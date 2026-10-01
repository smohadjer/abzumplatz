import { useState, useEffect } from "react";
import type { SyntheticEvent } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './../../store';
import { fetchClub, fetchUsers } from '../../utils/utils';
import { Loader } from '../../components/loader/Loader';
import AdminBackButton from '../../components/AdminBackButton';
import { Link, useSearchParams } from 'react-router';
import { getMembersLimitForPlan, getPlanName, PLAN_CONFIG } from '../../planConfig';
import './members.css';

const sexLabels = {male: 'M', female: 'W'} as const;
type MemberSortKey = 'first_name' | 'last_name' | 'sex' | 'age' | 'email';

export default function AdminMembersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') === 'inactive' ? 'inactive' : 'active';
    const [loading, setLoading] = useState(false);
    const [pending, setPending] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>(initialTab);
    const [memberFilter, setMemberFilter] = useState<'all' | 'men' | 'women' | 'youth'>('all');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [sort, setSort] = useState<{key: MemberSortKey; direction: 'asc' | 'desc'}>({
        key: 'last_name',
        direction: 'asc',
    });
    const usersData = useSelector((state: RootState) => state.users);
    const user = useSelector((state: RootState) => state.auth);
    const clubs = useSelector((state: RootState) => state.clubs.value);
    const clubData = useSelector((state: RootState) => state.club);
    const dispatch = useDispatch();
    const users = usersData.value;
    const normalizeNamePart = (value: string) => value.trim().toLocaleLowerCase('de-DE');
    const getNormalizedMemberName = (member: typeof users[number]) =>
        `${normalizeNamePart(member.first_name)} ${normalizeNamePart(member.last_name)}`;
    const isActiveUser = (member: typeof users[number]) => member.status !== 'inactive';
    const memberNameCounts = users.reduce((counts, member) => {
        if (!isActiveUser(member)) {
            return counts;
        }
        const normalizedName = getNormalizedMemberName(member);
        counts.set(normalizedName, (counts.get(normalizedName) ?? 0) + 1);
        return counts;
    }, new Map<string, number>());
    const hasDuplicateName = (member: typeof users[number]) =>
        isActiveUser(member) && (memberNameCounts.get(getNormalizedMemberName(member)) ?? 0) > 1;
    const activeUsersCount = users.filter(isActiveUser).length;
    const inactiveUsersCount = users.length - activeUsersCount;
    const currentYear = new Date().getFullYear();
    const statusFilteredUsers = users.filter(member => activeTab === 'active' ? isActiveUser(member) : !isActiveUser(member));
    const memberFilterCounts = statusFilteredUsers.reduce((counts, member) => {
        if (member.sex === 'male') counts.men += 1;
        if (member.sex === 'female') counts.women += 1;
        if (member.birth_year && currentYear - member.birth_year < 18) {
            counts.youth += 1;
        }
        return counts;
    }, {men: 0, women: 0, youth: 0});
    const filteredUsers = statusFilteredUsers.filter(member => {
        if (activeTab === 'inactive' || memberFilter === 'all') return true;
        if (memberFilter === 'youth') {
            return Boolean(member.birth_year && currentYear - member.birth_year < 18);
        }
        return memberFilter === 'men' ? member.sex === 'male' : member.sex === 'female';
    });
    const visibleUsers = [...filteredUsers].sort((left, right) => {
        const getSortValue = (member: typeof users[number]) => {
            if (sort.key === 'age') {
                return member.birth_year ? currentYear - member.birth_year : null;
            }
            if (sort.key === 'sex') {
                return member.sex ? sexLabels[member.sex] : null;
            }
            return member[sort.key] || null;
        };
        const leftValue = getSortValue(left);
        const rightValue = getSortValue(right);

        if (leftValue === null) return rightValue === null ? 0 : 1;
        if (rightValue === null) return -1;

        const comparison = typeof leftValue === 'number' && typeof rightValue === 'number'
            ? leftValue - rightValue
            : String(leftValue).localeCompare(String(rightValue), 'de-DE', {sensitivity: 'base'});
        return sort.direction === 'asc' ? comparison : -comparison;
    });
    const currentClubFromList = clubs.find(club => club._id === user.club_id);
    const club = currentClubFromList ?? (clubData.value._id === user.club_id ? clubData.value : null);
    const currentPlanType = club?.access_plan_type;
    const membersLimit = club?.effective_members_limit ?? getMembersLimitForPlan(currentPlanType);
    const hasMemberCap = membersLimit != null;
    const hasReachedMembersLimit = membersLimit != null && activeUsersCount >= membersLimit;
    const currentPlanName = getPlanName(currentPlanType);
    const hasMembersLimitOverride = Boolean(club?.members_limit_override_active);
    const planUpgradeText = currentPlanType === 'basic'
        ? (
            <>
                Wechseln Sie zum <Link to="/admin/club">{PLAN_CONFIG.pro.label}</Link>, um diese Einschränkung aufzuheben.
            </>
        )
        : null;

    const setTab = (tab: 'active' | 'inactive') => {
        setActiveTab(tab);
        setSelectedUserIds([]);
        setSearchParams(tab === 'inactive' ? {tab} : {});
    };

    const setFilter = (filter: typeof memberFilter) => {
        setMemberFilter(filter);
        setSelectedUserIds([]);
    };

    const changeSort = (key: MemberSortKey) => {
        setSort(current => current.key === key
            ? {...current, direction: current.direction === 'asc' ? 'desc' : 'asc'}
            : {key, direction: 'asc'}
        );
    };

    const sortableHeader = (key: MemberSortKey, label: string) => (
        <th aria-sort={sort.key === key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
            <button className="members-sort-button" type="button" onClick={() => changeSort(key)}>
                <span>{label}</span>
                {sort.key === key ? <span className="members-sort-indicator" aria-hidden="true">{sort.direction === 'asc' ? '↑' : '↓'}</span> : null}
            </button>
        </th>
    );

    useEffect(() => {
        if (!usersData.loaded) {
            (async () => {
                setLoading(true);
                await fetchUsers(user.club_id, dispatch);
                setLoading(false);
            })();
        }
    }, [dispatch, user.club_id, usersData.loaded]);

    useEffect(() => {
        if (!currentClubFromList && (!clubData.loaded || clubData.value._id !== user.club_id)) {
            fetchClub(user.club_id, dispatch);
        }
    }, [clubData.loaded, clubData.value._id, currentClubFromList, dispatch, user.club_id]);

    const updateUsersInStore = (updatedUsers: Array<{ _id: string; status: string }>, removedUserIds: string[] = []) => {
        const updatedUserMap = new Map(updatedUsers.map(updatedUser => [updatedUser._id, updatedUser.status]));
        const remainingUsers = usersData.value
            .filter(user => !removedUserIds.includes(user._id))
            .map(user => {
                if (updatedUserMap.has(user._id)) {
                    return {
                        ...user,
                        status: updatedUserMap.get(user._id)!
                    };
                } else {
                    return user;
                }
            });
        dispatch({
            type: 'users/fetch',
            payload: {
                value: remainingUsers,
                loaded: true,
                clubId: user.club_id
            }
        });
    };

    const toggleSelection = (userId: string) => {
        setSelectedUserIds(current => current.includes(userId)
            ? current.filter(id => id !== userId)
            : [...current, userId]
        );
    };

    const showAdminDeactivationHint = () => {
        alert('Administratoren können nicht deaktiviert werden.');
    };

    const selectionCount = selectedUserIds.length ? ` (${selectedUserIds.length})` : '';

    const updateSelectedUsers = async (action: 'activate' | 'deactivate' | 'remove') => {
        if (!selectedUserIds.length) {
            return;
        }
        if (action === 'remove' && !confirm('Möchten Sie die ausgewählten Mitglieder wirklich aus dem Verein entfernen?')) {
            return;
        }

        setPending(true);
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_ids: selectedUserIds,
                    action
                })
            });
            const data = await response.json();
            if (!response.ok || data.error) {
                throw new Error(data.error ?? 'Mitglieder konnten nicht aktualisiert werden.');
            }
            updateUsersInStore(data.updatedUsers ?? [], data.removedUserIds ?? []);
            setSelectedUserIds([]);
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Mitglieder konnten nicht aktualisiert werden.');
        } finally {
            setPending(false);
        }
    };

    const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        void updateSelectedUsers('deactivate');
    };

    return (
        loading ? (
            <div className="splash">
                <Loader size="big" text="Loading users..." />
            </div>
        ) : (
            <>
                <p><AdminBackButton /></p>
                <h1>Mitglieder verwalten</h1>
                {hasMemberCap ? (
                    <>
                        {hasReachedMembersLimit ? (
                            <p className="hint hint-box members-warning-box">
                                Achtung: Das aktuelle Mitgliederlimit von {membersLimit} aktiven Mitgliedern ist erreicht.
                            </p>
                        ) : null}
                        {hasMembersLimitOverride ? (
                            <p className="hint hint-box members-warning-box">
                                Achtung: Das Mitgliederlimit wird aktuell zentral auf {membersLimit} aktive Mitglieder erzwungen. Diese Grenze gilt unabhängig vom gewählten Plan.
                            </p>
                        ) : (
                            <p>
                                Im {currentPlanName} Plan sind maximal {membersLimit} aktive Mitglieder erlaubt. {planUpgradeText}
                            </p>
                        )}
                    </>
                ) : null}
                <div className="members-tabs" role="tablist" aria-label="Mitgliederstatus">
                    <button
                        type="button"
                        className={activeTab === 'active' ? 'members-tab members-tab--active' : 'members-tab'}
                        disabled={pending}
                        onClick={() => setTab('active')}
                        role="tab"
                        aria-selected={activeTab === 'active'}
                    >
                        Aktive Mitglieder ({activeUsersCount})
                    </button>
                    <button
                        type="button"
                        className={activeTab === 'inactive' ? 'members-tab members-tab--active' : 'members-tab'}
                        disabled={pending}
                        onClick={() => setTab('inactive')}
                        role="tab"
                        aria-selected={activeTab === 'inactive'}
                    >
                        Inaktive Mitglieder ({inactiveUsersCount})
                    </button>
                </div>
                {activeTab === 'active' ? (
                    <fieldset className="members-filter-options">
                        <legend>Filter:</legend>
                        {([
                            ['all', 'Alle'],
                            ['men', 'Männlich'],
                            ['women', 'Weiblich'],
                            ['youth', 'Jugend U18'],
                        ] as const).map(([filter, label]) => (
                            <label className="members-filter-option" key={filter}>
                                <input
                                    type="radio"
                                    name="member-filter"
                                    value={filter}
                                    checked={memberFilter === filter}
                                    disabled={pending}
                                    onChange={() => setFilter(filter)}
                                />
                                <span>{label} ({filter === 'all' ? statusFilteredUsers.length : memberFilterCounts[filter]})</span>
                            </label>
                        ))}
                </fieldset>
                ) : null}
                <form className="members-form" onSubmit={handleSubmit}>
                    <div className="members-controls">
                        <div className="members-batch-actions">
                            {activeTab === 'inactive' ? (
                                <>
                                    <button
                                        type="button"
                                        className="members-submit-button"
                                        disabled={pending || !selectedUserIds.length}
                                        onClick={() => void updateSelectedUsers('activate')}
                                    >
                                        Aktivieren{selectionCount}
                                    </button>
                                    <button
                                        type="button"
                                        className="members-submit-button members-submit-button--danger"
                                        disabled={pending || !selectedUserIds.length}
                                        onClick={() => void updateSelectedUsers('remove')}
                                    >
                                        Entfernen{selectionCount}
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="submit"
                                    className="members-submit-button"
                                    disabled={pending || !selectedUserIds.length}
                                >
                                    Deaktivieren{selectionCount}
                                </button>
                            )}
                            {pending ? <Loader size="small" /> : null}
                        </div>
                    </div>
                    <div className="members-table-wrapper">
                    <table className="members-table">
                        <thead>
                            <tr>
                                <th className="members-table-selection"><span className="visually-hidden">Auswahl</span></th>
                                {sortableHeader('first_name', 'Vorname')}
                                {sortableHeader('last_name', 'Nachname')}
                                {sortableHeader('sex', 'Geschl.')}
                                {sortableHeader('age', 'Alter')}
                                {sortableHeader('email', 'E-Mail')}
                            </tr>
                        </thead>
                        <tbody>
                        {visibleUsers.map(user => {
                            const duplicateName = hasDuplicateName(user);
                            const classNames = [
                                user.role === 'admin' ? 'user-list-item--admin' : '',
                                selectedUserIds.includes(user._id) ? 'user-list-item--selected' : '',
                                duplicateName ? 'user-list-item--duplicate-name' : '',
                            ].filter(Boolean).join(' ');

                            const age = user.birth_year ? currentYear - user.birth_year : null;

                            return <tr className={classNames || undefined} key={user._id}>
                                <td
                                    className="members-table-selection"
                                    onClick={user.role === 'admin' ? showAdminDeactivationHint : undefined}
                                >
                                    {user.role !== 'admin' ? (
                                        <input
                                            id={user._id}
                                            type="checkbox"
                                            aria-label={`${user.first_name} ${user.last_name} auswählen`}
                                            checked={selectedUserIds.includes(user._id)}
                                            disabled={pending}
                                            onChange={() => toggleSelection(user._id)}
                                        />
                                    ) : (
                                        <input
                                            id={user._id}
                                            className="members-admin-checkbox"
                                            type="checkbox"
                                            aria-label={`${user.first_name} ${user.last_name} kann nicht deaktiviert werden`}
                                            checked={false}
                                            disabled
                                        />
                                    )}
                                </td>
                                <td className={user.role === 'admin' ? 'members-list-name--admin' : undefined}>
                                    <label
                                        className={user.role === 'admin' ? 'members-name-label members-name-label--admin' : 'members-name-label'}
                                        htmlFor={user._id}
                                        onClick={user.role === 'admin' ? showAdminDeactivationHint : undefined}
                                    >
                                        {user.first_name}
                                    </label>
                                </td>
                                <td className={user.role === 'admin' ? 'members-list-name--admin' : undefined}>
                                    <label
                                        className={user.role === 'admin' ? 'members-name-label members-name-label--admin' : 'members-name-label'}
                                        htmlFor={user._id}
                                        onClick={user.role === 'admin' ? showAdminDeactivationHint : undefined}
                                    >
                                        {user.last_name}{user.role === 'admin' ? ' (Admin)' : ''}
                                        {duplicateName ? <span className="members-duplicate-name-badge">Doppelter Name</span> : null}
                                    </label>
                                </td>
                                <td>{user.sex ? sexLabels[user.sex] : '-'}</td>
                                <td>{age ?? '-'}</td>
                                <td className="members-list-email"><a href={`mailto:${user.email}`}>{user.email}</a></td>
                            </tr>;
                        })}
                        </tbody>
                    </table>
                    </div>
                </form>
            </>
        )
    )
}
