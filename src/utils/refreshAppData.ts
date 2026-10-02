import { AppDispatch } from '../store';
import { AuthenticatedUser, NotificationsResponse } from '../types';

type RefreshAuth = Pick<AuthenticatedUser, '_id' | 'club_id'>;

async function refreshNotifications(dispatch: AppDispatch, auth: RefreshAuth, signal: AbortSignal) {
    const response = await fetch('/api/notifications?limit=100', {signal});
    const result: NotificationsResponse & {error?: string} = await response.json();
    if (!response.ok || result.error) {
        throw new Error(result.error ?? 'Benachrichtigungen konnten nicht aktualisiert werden.');
    }
    dispatch({type: 'notifications/fetch', payload: {
        value: result.items,
        unreadCount: result.unread_count,
        dismissedCount: result.dismissed_count,
        fetchedAt: Date.now(),
        clubId: auth.club_id,
        userId: auth._id,
    }});
}

export async function refreshAppData(dispatch: AppDispatch, auth: RefreshAuth, signal: AbortSignal) {
    const refreshTasks = [
        refreshNotifications(dispatch, auth, signal),
    ];
    const results = await Promise.allSettled(refreshTasks);
    const failedResult = results.find(result => result.status === 'rejected');
    if (failedResult?.status === 'rejected') throw failedResult.reason;
}
