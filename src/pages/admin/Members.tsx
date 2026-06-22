import { FormEvent, useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './../../store';
import { fetchClub, fetchUsers } from '../../utils/utils';
import { Loader } from '../../components/loader/Loader';
import { Link, useSearchParams } from 'react-router';
import { getMembersLimitForPlan, getPlanName, PLAN_CONFIG } from '../../planConfig';

export default function AdminMembersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') === 'inactive' ? 'inactive' : 'active';
    const [loading, setLoading] = useState(false);
    const [pending, setPending] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>(initialTab);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [inactiveAction, setInactiveAction] = useState<'activate' | 'remove'>('activate');
    const usersData = useSelector((state: RootState) => state.users);
    const user = useSelector((state: RootState) => state.auth);
    const clubs = useSelector((state: RootState) => state.clubs.value);
    const clubData = useSelector((state: RootState) => state.club);
    const dispatch = useDispatch();
    const users = usersData.value;
    const isActiveUser = (member: typeof users[number]) => member.status !== 'inactive';
    const activeUsersCount = users.filter(isActiveUser).length;
    const inactiveUsersCount = users.length - activeUsersCount;
    const visibleUsers = users.filter(member => activeTab === 'active' ? isActiveUser(member) : !isActiveUser(member));
    const currentClubFromList = clubs.find(club => club._id === user.club_id);
    const club = currentClubFromList ?? (clubData.value._id === user.club_id ? clubData.value : null);
    const currentPlanType = club?.access_plan_type ?? club?.plan_type;
    const membersLimit = club?.effective_members_limit ?? getMembersLimitForPlan(currentPlanType);
    const hasMemberCap = membersLimit != null;
    const hasReachedMembersLimit = membersLimit != null && activeUsersCount >= membersLimit;
    const currentPlanName = getPlanName(currentPlanType);
    const hasMembersLimitOverride = Boolean(club?.members_limit_override_active);
    const planUpgradeText = currentPlanType === 'basic'
        ? (
            <>
                Wechseln Sie zum <Link to="/admin/club">{PLAN_CONFIG.pro.label} oder {PLAN_CONFIG.elite.label}</Link>, um diese Einschränkung aufzuheben.
            </>
        )
        : currentPlanType === 'pro'
            ? (
                <>
                    Wechseln Sie zum <Link to="/admin/club">{PLAN_CONFIG.elite.label}</Link>, um diese Einschränkung aufzuheben.
                </>
            )
            : null;

    const setTab = (tab: 'active' | 'inactive') => {
        setActiveTab(tab);
        setSelectedUserIds([]);
        setSearchParams(tab === 'inactive' ? {tab} : {});
    };

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
                loaded: true
            }
        });
    };

    const toggleSelection = (userId: string) => {
        setSelectedUserIds(current => current.includes(userId)
            ? current.filter(id => id !== userId)
            : [...current, userId]
        );
    };

    const selectableUsers = visibleUsers.filter(member => member.role !== 'admin');
    const allVisibleSelected = selectableUsers.length > 0 && selectableUsers.every(member => selectedUserIds.includes(member._id));
    const submitAction = activeTab === 'active' ? 'deactivate' : inactiveAction;
    const submitLabelBase = submitAction === 'deactivate'
        ? 'Mitglieder deaktivieren'
        : submitAction === 'activate'
            ? 'Mitglieder aktivieren'
            : 'Mitglieder entfernen';
    const submitLabel = selectedUserIds.length > 0
        ? `${submitLabelBase} (${selectedUserIds.length})`
        : submitLabelBase;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedUserIds.length) {
            return;
        }
        if (submitAction === 'remove' && !confirm('Möchten Sie die ausgewählten Mitglieder wirklich aus dem Verein entfernen?')) {
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
                    action: submitAction
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

    return (
        loading ? (
            <div className="splash">
                <Loader size="big" text="Loading users..." />
            </div>
        ) : (
            <>
                <p><Link className="icon icon--back" to="/admin">Zurück</Link></p>
                <h1>Mitglieder verwalten</h1>
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
                <form className="members-form" onSubmit={handleSubmit}>
                    {selectableUsers.length > 0 ? (
                        <>
                            {activeTab === 'inactive' ? (
                                <div className="members-selection-bar">
                                    <button
                                        type="button"
                                        className="members-select-all-button"
                                        disabled={pending}
                                        onClick={() => setSelectedUserIds(allVisibleSelected ? [] : selectableUsers.map(member => member._id))}
                                    >
                                        {allVisibleSelected ? 'Auswahl aufheben' : 'Alle auswählen'}
                                    </button>
                                    <div className="members-action-toggle" role="radiogroup" aria-label="Aktion für inaktive Mitglieder">
                                        <label className="members-action-option" htmlFor="members-action-activate">
                                            <input
                                                id="members-action-activate"
                                                type="radio"
                                                name="members-inactive-action"
                                                value="activate"
                                                checked={inactiveAction === 'activate'}
                                                disabled={pending}
                                                onChange={() => setInactiveAction('activate')}
                                            />
                                            <span>Aktivieren</span>
                                        </label>
                                        <label className="members-action-option" htmlFor="members-action-remove">
                                            <input
                                                id="members-action-remove"
                                                type="radio"
                                                name="members-inactive-action"
                                                value="remove"
                                                checked={inactiveAction === 'remove'}
                                                disabled={pending}
                                                onChange={() => setInactiveAction('remove')}
                                            />
                                            <span>Entfernen</span>
                                        </label>
                                    </div>
                                </div>
                            ) : null}
                            <div className="members-batch-actions">
                                <button
                                    type="submit"
                                    className="members-submit-button"
                                    disabled={pending || !selectedUserIds.length}
                                >
                                    {submitLabel}
                                </button>
                                {pending ? <Loader size="small" /> : null}
                            </div>
                        </>
                    ) : null}
                    <ul className="users-list">
                        {visibleUsers.map(user => {
                            const classNames = [
                                user.role === 'admin' ? 'user-list-item--admin' : '',
                                selectedUserIds.includes(user._id) ? 'user-list-item--selected' : '',
                            ].filter(Boolean).join(' ');

                            return <li className={classNames || undefined} key={user._id}>
                                {user.role !== 'admin' ? (
                                    <label className="members-list-item" htmlFor={user._id}>
                                        <input
                                            id={user._id}
                                            type="checkbox"
                                            checked={selectedUserIds.includes(user._id)}
                                            disabled={pending}
                                            onChange={() => toggleSelection(user._id)}
                                        />
                                        <span className="members-list-name">
                                            {user.first_name} {user.last_name}
                                        </span>
                                        <span className="members-list-email"><a href={`mailto:${user.email}`}>{user.email}</a></span>
                                    </label>
                                ) : (
                                    <label className="members-list-item" htmlFor={user._id}>
                                        <input
                                            id={user._id}
                                            type="checkbox"
                                            checked={false}
                                            disabled={true}
                                            onChange={() => undefined}
                                        />
                                        <span className="members-list-name members-list-name--admin">
                                            {user.first_name} {user.last_name} (Admin)
                                        </span>
                                        <span className="members-list-email"><a href={`mailto:${user.email}`}>{user.email}</a></span>
                                    </label>
                                )}
                            </li>;
                        })}
                    </ul>
                </form>
            </>
        )
    )
}
