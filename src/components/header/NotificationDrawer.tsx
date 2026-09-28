import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router';
import { RootState } from '../../store';
import { Notification, NotificationsResponse } from '../../types';
import { Loader } from '../loader/Loader';
import './notifications.css';

const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const formatDate = (value: string) => new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
}).format(new Date(value));

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onOpen: () => void;
    unreadCount: number;
};

export default function NotificationDrawer({isOpen, onClose, onOpen, unreadCount}: Props) {
    const auth = useSelector((state: RootState) => state.auth);
    const notifications = useSelector((state: RootState) => state.notifications);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const drawerRef = useRef<HTMLElement>(null);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const hasCurrentUserNotifications = notifications.loaded
        && notifications.clubId === auth.club_id
        && notifications.userId === auth._id;

    const closeDrawer = (restoreFocus = true) => {
        onClose();
        if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
    };

    useEffect(() => {
        if (isOpen && !hasCurrentUserNotifications) dispatch({type: 'appRefresh/request'});
    }, [dispatch, hasCurrentUserNotifications, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const scrollContainer = document.querySelector<HTMLElement>('main');
        const previousOverflowY = scrollContainer?.style.overflowY ?? '';
        if (scrollContainer) scrollContainer.style.overflowY = 'hidden';
        drawerRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeDrawer();
                return;
            }
            if (event.key !== 'Tab' || !drawerRef.current) return;
            const elements = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(focusableSelector));
            if (!elements.length) return;
            const firstElement = elements[0];
            const lastElement = elements[elements.length - 1];
            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            if (scrollContainer) scrollContainer.style.overflowY = previousOverflowY;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const markRead = async (notification: Notification) => {
        if (notification.read_at) return;
        const response = await fetch(`/api/notifications?id=${encodeURIComponent(notification._id)}`, {method: 'PATCH'});
        const result = await response.json();
        if (!response.ok || result.error) throw new Error(result.error ?? 'Die Benachrichtigung konnte nicht als gelesen markiert werden.');
        dispatch({type: 'notifications/markRead', payload: {id: notification._id, readAt: new Date().toISOString()}});
        dispatch({type: 'appRefresh/request'});
    };

    const markAllRead = async () => {
        setUpdating(true);
        setError('');
        try {
            const response = await fetch('/api/notifications?id=all', {method: 'PATCH'});
            const result = await response.json();
            if (!response.ok || result.error) throw new Error(result.error ?? 'Die Benachrichtigungen konnten nicht als gelesen markiert werden.');
            dispatch({type: 'notifications/markAllRead', payload: new Date().toISOString()});
            dispatch({type: 'appRefresh/request'});
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Die Benachrichtigungen konnten nicht aktualisiert werden.');
        } finally {
            setUpdating(false);
        }
    };

    const dismissNotification = async (notification: Notification) => {
        const index = notifications.value.findIndex(item => item._id === notification._id);
        dispatch({type: 'notifications/dismiss', payload: notification._id});
        try {
            const response = await fetch(`/api/notifications?id=${encodeURIComponent(notification._id)}`, {method: 'DELETE'});
            const result = await response.json();
            if (!response.ok || result.error) throw new Error(result.error ?? 'Die Benachrichtigung konnte nicht entfernt werden.');
        } catch (requestError) {
            dispatch({type: 'notifications/restoreDismissedItem', payload: {notification, index}});
            throw requestError;
        }
    };

    const restoreDismissed = async () => {
        setRestoring(true);
        setError('');
        try {
            const restoreResponse = await fetch('/api/notifications?action=restore-dismissed', {method: 'PATCH'});
            const restoreResult = await restoreResponse.json();
            if (!restoreResponse.ok || restoreResult.error) {
                throw new Error(restoreResult.error ?? 'Entfernte Benachrichtigungen konnten nicht wiederhergestellt werden.');
            }
            const response = await fetch('/api/notifications?limit=100');
            const result: NotificationsResponse & {error?: string} = await response.json();
            if (!response.ok || result.error) throw new Error(result.error ?? 'Benachrichtigungen konnten nicht geladen werden.');
            dispatch({type: 'notifications/fetch', payload: {
                value: result.items,
                unreadCount: result.unread_count,
                dismissedCount: result.dismissed_count,
                clubId: auth.club_id,
                userId: auth._id,
            }});
            dispatch({type: 'appRefresh/request'});
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Entfernte Benachrichtigungen konnten nicht wiederhergestellt werden.');
        } finally {
            setRestoring(false);
        }
    };

    const openNotificationLink = (event: React.MouseEvent<HTMLAnchorElement>, notification: Notification) => {
        event.preventDefault();
        const navigateToNotification = async () => {
            if (!notification.read_at) await markRead(notification);
            closeDrawer(false);
            navigate(notification.link!);
        };
        void navigateToNotification().catch(requestError => setError(requestError.message));
    };

    return <>
        <button
            aria-controls="notification-drawer"
            aria-expanded={isOpen}
            aria-label={unreadCount ? `Benachrichtigungen – ${unreadCount} ungelesen` : 'Benachrichtigungen'}
            className="header-notification-link"
            onClick={onOpen}
            ref={triggerRef}
            type="button"
        >
            <span aria-hidden="true" className="icon icon--notifications"></span>
            {unreadCount ? <span aria-hidden="true" className="header-notification-dot">
                {unreadCount > 99 ? '99+' : unreadCount}
            </span> : null}
        </button>

        <div className={`account-menu-layer${isOpen ? ' account-menu-layer--open' : ''}`} aria-hidden={!isOpen}>
            <button className="account-menu-backdrop" type="button" aria-label="Benachrichtigungen schließen" onClick={() => closeDrawer()}></button>
            <aside
                aria-labelledby="notification-drawer-title"
                aria-modal="true"
                className="account-menu notification-drawer"
                id="notification-drawer"
                inert={!isOpen}
                ref={drawerRef}
                role="dialog"
            >
                <div className="account-menu-header">
                    <h2 id="notification-drawer-title">Benachrichtigungen</h2>
                    <button className="account-menu-close" type="button" aria-label="Benachrichtigungen schließen" onClick={() => closeDrawer()}>&times;</button>
                </div>
                <div className="notification-drawer-summary-actions">
                    {notifications.dismissedCount > 0 ? <button disabled={restoring} onClick={restoreDismissed} type="button">
                        {restoring ? 'Wird wiederhergestellt...' : 'Entfernte wiederherstellen'}
                    </button> : null}
                    {unreadCount > 0 ? <button disabled={updating} onClick={markAllRead} type="button">
                        {updating ? 'Wird aktualisiert...' : 'Alle als gelesen markieren'}
                    </button> : null}
                </div>
                {error ? <p className="form-error-message">{error}</p> : null}
                {!hasCurrentUserNotifications ? <div className="notification-drawer-loading"><Loader text="Benachrichtigungen werden geladen..." /></div>
                    : notifications.value.length ? <div className="notification-list">
                        {notifications.value.map(notification => <article className={notification.read_at ? '' : 'notification-card--unread'} key={notification._id}>
                            <div className="notification-card-top">
                                <div className="notification-card-title-block">
                                    <div className="notification-card-heading">
                                        <h3>{notification.title}</h3>
                                    </div>
                                    <time dateTime={notification.created_at}>{formatDate(notification.created_at)}</time>
                                </div>
                                <div className="notification-card-controls">
                                    {!notification.read_at ? <span className="notification-unread-label">Neu</span> : null}
                                    {!notification.read_at ? <button
                                        aria-label="Als gelesen markieren"
                                        className="notification-mark-read"
                                        onClick={() => void markRead(notification).catch(requestError => setError(requestError.message))}
                                        title="Als gelesen markieren"
                                        type="button"
                                    >&#10003;</button> : null}
                                    <button
                                        aria-label="Benachrichtigung entfernen"
                                        className="notification-dismiss"
                                        onClick={() => void dismissNotification(notification).catch(requestError => setError(requestError.message))}
                                        title="Benachrichtigung entfernen"
                                        type="button"
                                    >&times;</button>
                                </div>
                            </div>
                            <p>{notification.body}</p>
                            {notification.link ? <p className="notification-actions">
                                <Link className="notification-action-link" onClick={event => openNotificationLink(event, notification)} to={notification.link}>
                                    {notification.link_label ?? (notification.type === 'tournament_published' ? 'Turnier ansehen und anmelden' : 'Details ansehen')}
                                </Link>
                            </p> : null}
                        </article>)}
                    </div> : <p>Noch keine Benachrichtigungen vorhanden.</p>}
            </aside>
        </div>
    </>;
}
