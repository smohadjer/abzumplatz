import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { fetchClub, onLogout } from "../../utils/utils";
import "../settings.css";

export default function AdminHomePage() {
    const [updatingClubStatus, setUpdatingClubStatus] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const user = useSelector((state: RootState) => state.auth);
    const clubData = useSelector((state: RootState) => state.club);
    const dispatch = useDispatch();
    const club = clubData.value;
    const isClubDeleted = user.club_deleted || Boolean(club.deleted_at);
    const deletedAtLabel = club.deleted_at
        ? new Date(club.deleted_at).toLocaleString('de-DE')
        : null;

    useEffect(() => {
        if (!clubData.loaded || clubData.value._id !== user.club_id) {
            void fetchClub(user.club_id, dispatch);
        }
    }, [clubData.loaded, clubData.value._id, dispatch, user.club_id]);

    const restoreClub = async () => {
        if (!confirm('Möchten Sie diesen Verein wirklich wiederherstellen?')) {
            return;
        }

        setUpdatingClubStatus(true);
        setDeleteError(null);

        try {
            const response = await fetch(`/api/clubs?id=${encodeURIComponent(user.club_id)}`, {
                method: 'PATCH',
            });
            const data = await response.json();
            if (!response.ok || data.error) {
                throw new Error(data.error ?? 'Der Verein konnte nicht wiederhergestellt werden.');
            }

            dispatch({
                type: 'club/fetch',
                payload: {
                    value: data,
                    loaded: true,
                }
            });
            dispatch({
                type: 'clubs/upsert',
                payload: {value: data}
            });
            dispatch({
                type: 'auth/setClubDeleted',
                payload: {club_deleted: Boolean(data.deleted_at)}
            });
            if (data.invoice_email_error) {
                setDeleteError('Der Verein wurde wiederhergestellt und der neue Abrechnungszeitraum wurde angelegt, aber die Rechnungs-E-Mail konnte nicht gesendet werden. Sie können die Rechnung unter Abrechnungen erneut senden.');
            }
        } catch (error) {
            setDeleteError(error instanceof Error ? error.message : 'Der Vereinsstatus konnte nicht aktualisiert werden.');
        } finally {
            setUpdatingClubStatus(false);
        }
    };

    if (isClubDeleted) {
        return (
            <>
                <h1>Admin</h1>
                <div className="admin-deleted-club-warning">
                    <p><strong>Dieser Verein wurde gelöscht.</strong></p>
                    {deletedAtLabel ? <p>Gelöscht am: {deletedAtLabel}</p> : null}
                    <p>Mitglieder sehen beim nächsten Einloggen einen Hinweis und werden aufgefordert, einen neuen Verein auszuwählen.</p>
                </div>
                <ul className="settings-links">
                    <li>
                        <button
                            type="button"
                            className="settings-danger-button settings-restore-button"
                            disabled={updatingClubStatus}
                            onClick={restoreClub}
                        >
                            {updatingClubStatus ? 'Verein wird wiederhergestellt...' : 'Verein wiederherstellen'}
                        </button>
                    </li>
                    <li>
                        <a className="settings-logout-link" href="#" onClick={(event) => {
                            event.preventDefault();
                            if (confirm('Möchten Sie sich wirklich ausloggen?')) {
                                onLogout(dispatch);
                            }
                        }}>Ausloggen</a>
                    </li>
                </ul>
                {deleteError ? <p className="settings-delete-error">{deleteError}</p> : null}
            </>
        );
    }

    return (
        <>
            <h1>Admin</h1>
            <ul className="settings-links admin-home-links">
                <li><Link className="settings-icon-link settings-checklist-link" to="/admin/checklist">Einrichtungscheckliste</Link></li>
                <li><Link className="settings-icon-link settings-members-link" to="/admin/members">Mitglieder verwalten</Link></li>
                <li><Link className="settings-icon-link settings-invite-link" to="/admin/invite">Mitglieder einladen</Link></li>
                <li><Link className="settings-icon-link settings-club-link" to="/admin/club">Vereinseinstellungen</Link></li>
                <li><Link className="settings-icon-link settings-courts-link" to="/admin/courts">Plätze sperren</Link></li>
                <li><Link className="settings-icon-link settings-rules-link" to="/admin/rules">Vereinsregeln</Link></li>
                <li><Link className="settings-icon-link settings-tournaments-link" to="/admin/tournaments">Turniere</Link></li>
                <li><Link className="settings-icon-link settings-notifications-link" to="/admin/announcements">Benachrichtigungen</Link></li>
                <li><Link className="settings-icon-link settings-billings-link" to="/admin/billings">Abrechnungen</Link></li>
                <li><Link className="settings-icon-link settings-delete-club-link" to="/admin/club/delete">Verein löschen</Link></li>
            </ul>
        </>
    )
}
