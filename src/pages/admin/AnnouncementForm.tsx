import { FormEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router';
import { Notification } from '../../types';
import { RootState } from '../../store';
import AnnouncementTabs from './AnnouncementTabs';
import '../../components/header/notifications.css';
import './announcement.css';

const formatDate = (value: Date) => `${new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
}).format(value)} Uhr`;

export default function AdminAnnouncementFormPage() {
    const location = useLocation();
    const reusedNotification = (location.state as {announcement?: Notification} | null)?.announcement;
    const [title, setTitle] = useState(reusedNotification?.title ?? '');
    const [body, setBody] = useState(reusedNotification?.body ?? '');
    const [link, setLink] = useState(reusedNotification?.link ?? '');
    const [linkLabel, setLinkLabel] = useState(reusedNotification?.link_label ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [previewedAt, setPreviewedAt] = useState<Date | null>(null);
    const previewDialogRef = useRef<HTMLDialogElement>(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const clubId = useSelector((state: RootState) => state.auth.club_id);

    useEffect(() => {
        setTitle(reusedNotification?.title ?? '');
        setBody(reusedNotification?.body ?? '');
        setLink(reusedNotification?.link ?? '');
        setLinkLabel(reusedNotification?.link_label ?? '');
        setPreviewedAt(null);
    }, [location.key, reusedNotification]);

    useEffect(() => {
        const dialog = previewDialogRef.current;
        if (previewedAt && dialog && !dialog.open) dialog.showModal();
        if (!previewedAt && dialog?.open) dialog.close();
    }, [previewedAt]);

    const closePreviewOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
        if (event.target === event.currentTarget) setPreviewedAt(null);
    };

    const publish = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
                body: JSON.stringify({title, body, link, link_label: linkLabel}),
            });
            const result: {notification?: Notification; error?: string} = await response.json();
            if (!response.ok || result.error) throw new Error(result.error ?? 'Die Benachrichtigung konnte nicht veröffentlicht werden.');
            if (result.notification) {
                dispatch({type: 'adminNotifications/add', payload: {item: result.notification, clubId}});
            }
            dispatch({type: 'appRefresh/request'});
            navigate('/admin/announcements');
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Die Benachrichtigung konnte nicht veröffentlicht werden.');
        } finally {
            setSaving(false);
        }
    };

    return <>
        <p><Link className="icon icon--back" to="/admin">Zurück</Link></p>
        <h1>Benachrichtigung veröffentlichen</h1>
        <AnnouncementTabs active="new" />
        <p>Die Benachrichtigung erscheint bei allen Vereinsmitgliedern.</p>
        <div className="admin-announcement-reset-row">
            <button
                className="button-link button-link--secondary admin-announcement-reset"
                disabled={saving || (!title && !body && !link && !linkLabel)}
                onClick={() => navigate('/admin/announcements/new', {replace: true})}
                type="button"
            ><span aria-hidden="true" className="admin-announcement-reset-icon"></span> Zurücksetzen</button>
        </div>
        <p className="admin-announcement-required-note"><span aria-hidden="true">*</span> Pflichtfeld</p>
        <form className="admin-announcement-form" onSubmit={publish}>
            <label htmlFor="announcement-title">Titel <span aria-hidden="true">*</span></label>
            <input id="announcement-title" maxLength={150} onChange={event => setTitle(event.target.value)} required value={title} />
            <label htmlFor="announcement-body">Text <span aria-hidden="true">*</span></label>
            <textarea id="announcement-body" maxLength={3000} onChange={event => setBody(event.target.value)} required rows={7} value={body} />
            <fieldset className="admin-announcement-link-fields">
                <legend>Verlinkung (optional)</legend>
                <label htmlFor="announcement-link">Interner Link</label>
                <input id="announcement-link" onChange={event => setLink(event.target.value)} pattern="/.*" placeholder="/tournaments" value={link} />
                <small>Zum Beispiel /tournaments oder /rules</small>
                <label htmlFor="announcement-link-label">Link-Beschriftung</label>
                <input
                    disabled={!link}
                    id="announcement-link-label"
                    maxLength={100}
                    onChange={event => setLinkLabel(event.target.value)}
                    placeholder="Details ansehen"
                    value={linkLabel}
                />
            </fieldset>
            {error ? <p className="form-error-message">{error}</p> : null}
            <div className="admin-announcement-actions">
                <button
                    className="button-link button-link--secondary"
                    disabled={saving || !title.trim() || !body.trim()}
                    onClick={() => setPreviewedAt(new Date())}
                    type="button"
                >Vorschau</button>
                <button className="button-link" disabled={saving} type="submit">{saving ? 'Wird veröffentlicht...' : 'Veröffentlichen'}</button>
            </div>
        </form>
        <dialog
            aria-labelledby="announcement-preview-title"
            className="admin-announcement-preview"
            onCancel={() => setPreviewedAt(null)}
            onClick={closePreviewOnBackdrop}
            onClose={() => setPreviewedAt(null)}
            ref={previewDialogRef}
        >
            <div className="admin-announcement-preview-content">
            <h2 id="announcement-preview-title">Vorschau</h2>
            <div className="notification-list">
                <article className="notification-card--unread">
                    <button
                        aria-label="Vorschau schließen"
                        className="notification-dismiss"
                        onClick={() => setPreviewedAt(null)}
                        title="Vorschau schließen"
                        type="button"
                    >&times;</button>
                    <time>{formatDate(previewedAt ?? new Date())}</time>
                    <div className="notification-card-heading">
                        <h2>{title || 'Titel der Benachrichtigung'}</h2>
                        <span className="notification-unread-label">Neu</span>
                    </div>
                    <p>{body || 'Text der Benachrichtigung'}</p>
                    {link ? <p className="notification-actions">
                        <a className="notification-action-link" href={link} onClick={event => event.preventDefault()}>{linkLabel.trim() || 'Details ansehen'}</a>
                    </p> : null}
                </article>
            </div>
            </div>
        </dialog>
    </>;
}
