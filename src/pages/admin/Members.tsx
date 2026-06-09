import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './../../store';
import { fetchUsers } from '../../utils/utils';
import { Loader } from '../../components/loader/Loader';
import { Link, useSearchParams } from 'react-router';

export default function AdminMembersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') === 'inactive' ? 'inactive' : 'active';
    const [loading, setLoading] = useState(false);
    const [pending, setPending] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>(initialTab);
    const usersData = useSelector((state: RootState) => state.users);
    const user = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const users = usersData.value;
    const isActiveUser = (member: typeof users[number]) => member.status !== 'inactive';
    const activeUsersCount = users.filter(isActiveUser).length;
    const inactiveUsersCount = users.length - activeUsersCount;
    const visibleUsers = users.filter(member => activeTab === 'active' ? isActiveUser(member) : !isActiveUser(member));

    const setTab = (tab: 'active' | 'inactive') => {
        setActiveTab(tab);
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
    }, []);

    const updateUserInStore = (updatedUser: { _id: string; status: string }) => {
        const users = usersData.value.map(user => {
            if (user._id === updatedUser._id) {
                return {
                    ...user,
                    status: updatedUser.status
                }
            } else {
                return user;
            }
        });
        dispatch({
            type: 'users/fetch',
            payload: {
                value: users,
                loaded: true
            }
        });
    };

    const removeUserFromStore = (userId: string) => {
        dispatch({
            type: 'users/fetch',
            payload: {
                value: usersData.value.filter(user => user._id !== userId),
                loaded: true
            }
        });
    };

    const handleStatusChange = async (userId: string, status: 'active' | 'inactive') => {
        setPending(true);
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    status
                })
            });
            const data = await response.json();
            if (!response.ok || data.error) {
                throw new Error(data.error ?? 'Status konnte nicht geändert werden.');
            }
            updateUserInStore(data);
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Status konnte nicht geändert werden.');
        } finally {
            setPending(false);
        }
    };

    const handleRemove = async (userId: string) => {
        if (!confirm('Möchten Sie dieses inaktive Mitglied wirklich aus dem Verein entfernen?')) {
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
                    user_id: userId,
                    action: 'remove'
                })
            });
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error ?? 'Mitglied konnte nicht entfernt werden.');
            }

            removeUserFromStore(userId);
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Mitglied konnte nicht entfernt werden.');
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
                <h1><span style={{ marginRight: '0.5rem' }}>Mitgliederliste</span>
                    {pending ? <Loader size="small" /> : null}
                </h1>
                <p><Link className="icon icon--back" to="/admin">Zurück</Link></p>
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
                <ul className="users-list">
	                {visibleUsers.map(user => {
	                        const classNames = [
	                            user.role === 'admin' ? 'user-list-item--admin' : '',
	                            isActiveUser(user) ? '' : 'user-list-item--inactive',
	                        ].filter(Boolean).join(' ');

	                        return <li className={classNames || undefined} key={user._id}>
                            <div className="members-list-item">
                                <span className={user.role === 'admin' ? 'members-list-name members-list-name--admin' : 'members-list-name'}>
                                    {user.first_name} {user.last_name}{user.role === 'admin' ? ' (Admin)' : ''}
                                </span>
	                                <span>(<a href={`mailto:${user.email}`}>{user.email}</a>)</span>
                            </div>
                                {user.role !== 'admin' ? (
                                    <button
                                        type="button"
                                        className="button-link members-action-button"
                                        disabled={pending}
                                        onClick={() => handleStatusChange(user._id, isActiveUser(user) ? 'inactive' : 'active')}
                                    >
                                        {isActiveUser(user) ? 'Deaktivieren' : 'Aktivieren'}
                                    </button>
                                ) : null}
                                {!isActiveUser(user) && user.role !== 'admin' ? (
                                    <button
                                        type="button"
                                        className="button-link members-action-button"
                                        disabled={pending}
                                        onClick={() => handleRemove(user._id)}
                                    >
                                        Aus Verein entfernen
                                    </button>
                                ) : null}
	                        </li>;
                    })}
                </ul>
            </>
        )
    )
}
