import { FormEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Notification } from '../../types';
import { RootState } from '../../store';
import AnnouncementTabs from './AnnouncementTabs';
import '../../components/header/notifications.css';
import './announcement.css';

const formatDate = (value: Date) => new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
}).format(value);

const internalPages = [
    {value: '/', label: 'Startseite', linkLabel: 'Startseite besuchen'},
    {value: '/reservations', label: 'Platzreservierung', linkLabel: 'Platz reservieren'},
    {value: '/bookings', label: 'Meine Buchungen', linkLabel: 'Buchungen ansehen'},
    {value: '/tournaments', label: 'Turniere', linkLabel: 'Turniere ansehen'},
    {value: '/profile', label: 'Profil', linkLabel: 'Profil ansehen'},
    {value: '/profile/edit', label: 'Profil bearbeiten', linkLabel: 'Profil bearbeiten'},
    {value: '/rules', label: 'Vereinsregeln', linkLabel: 'Vereinsregeln ansehen'},
    {value: '/support', label: 'Support', linkLabel: 'Support öffnen'},
    {value: '/faq', label: 'FAQ', linkLabel: 'FAQ ansehen'},
    {value: '/impressum', label: 'Impressum', linkLabel: 'Impressum ansehen'},
];

export default function AdminAnnouncementFormPage() {
    const location = useLocation();
    const {id} = useParams();
    const editing = Boolean(id);
    const navigationNotification = (location.state as {announcement?: Notification} | null)?.announcement;
    const history = useSelector((state: RootState) => state.adminNotifications);
    const cachedNotification = editing ? history.items.find(item => item._id === id) : undefined;
    const initialNotification = editing
        ? (navigationNotification?._id === id ? navigationNotification : cachedNotification)
        : navigationNotification;
    const [title, setTitle] = useState(initialNotification?.title ?? '');
    const [body, setBody] = useState(initialNotification?.body ?? '');
    const [link, setLink] = useState(initialNotification?.link ?? '');
    const [linkLabel, setLinkLabel] = useState(initialNotification?.link_label ?? '');
    const [loading, setLoading] = useState(editing && !initialNotification);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [previewedAt, setPreviewedAt] = useState<Date | null>(null);
    const previewDialogRef = useRef<HTMLDialogElement>(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const clubId = useSelector((state: RootState) => state.auth.club_id);

    useEffect(() => {
        if (!initialNotification) {
            if (!editing) {
                setTitle('');
                setBody('');
                setLink('');
                setLinkLabel('');
                setPreviewedAt(null);
            }
            return;
        }
        setTitle(initialNotification.title);
        setBody(initialNotification.body);
        setLink(initialNotification.link ?? '');
        setLinkLabel(initialNotification.link_label ?? '');
        setPreviewedAt(null);
        setLoading(false);
    }, [editing, initialNotification, location.key]);

    useEffect(() => {
        if (!editing || !id || initialNotification) return;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`/api/notifications?view=published&id=${encodeURIComponent(id)}`);
                const result: {items?: Notification[]; error?: string} = await response.json();
                if (!response.ok || result.error) throw new Error(result.error ?? 'Die Benachrichtigung konnte nicht geladen werden.');
                const notification = result.items?.[0];
                if (!notification) throw new Error('Benachrichtigung nicht gefunden.');
                setTitle(notification.title);
                setBody(notification.body);
                setLink(notification.link ?? '');
                setLinkLabel(notification.link_label ?? '');
            } catch (requestError) {
                setError(requestError instanceof Error ? requestError.message : 'Die Benachrichtigung konnte nicht geladen werden.');
            } finally {
                setLoading(false);
            }
        })();
    }, [editing, id, initialNotification]);

    useEffect(() => {
        const dialog = previewDialogRef.current;
        if (previewedAt && dialog && !dialog.open) dialog.showModal();
        if (!previewedAt && dialog?.open) dialog.close();
    }, [previewedAt]);

    const closePreviewOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
        if (event.target === event.currentTarget) setPreviewedAt(null);
    };

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const response = await fetch(editing ? `/api/notifications?action=edit&id=${encodeURIComponent(id ?? '')}` : '/api/notifications', {
                method: editing ? 'PATCH' : 'POST',
                headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
                body: JSON.stringify({title, body, link, link_label: linkLabel}),
            });
            const result: {notification?: Notification; error?: string} = await response.json();
            if (!response.ok || result.error) throw new Error(result.error ?? `Die Benachrichtigung konnte nicht ${editing ? 'gespeichert' : 'veröffentlicht'} werden.`);
            if (result.notification) {
                dispatch({type: editing ? 'adminNotifications/update' : 'adminNotifications/add', payload: {item: result.notification, clubId}});
            }
            dispatch({type: 'appRefresh/request'});
            navigate('/admin/announcements');
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : `Die Benachrichtigung konnte nicht ${editing ? 'gespeichert' : 'veröffentlicht'} werden.`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="splash">Benachrichtigung wird geladen…</div>;

    return <>
        <p><Link className="icon icon--back" to={editing ? '/admin/announcements' : '/admin'}>Zurück</Link></p>
        <h1>{editing ? 'Benachrichtigung bearbeiten' : 'Benachrichtigung veröffentlichen'}</h1>
        <AnnouncementTabs active={editing ? 'history' : 'new'} />
        <p>{editing ? 'Die Änderungen erscheinen bei allen Vereinsmitgliedern.' : 'Die Benachrichtigung erscheint bei allen Vereinsmitgliedern.'}</p>
        {!editing ? <div className="admin-announcement-reset-row">
            <button
                className="button-link button-link--secondary admin-announcement-reset"
                disabled={saving || (!title && !body && !link && !linkLabel)}
                onClick={() => navigate('/admin/announcements/new', {replace: true})}
                type="button"
            ><span aria-hidden="true" className="admin-announcement-reset-icon"></span> Zurücksetzen</button>
        </div> : null}
        <p className="admin-announcement-required-note"><span aria-hidden="true">*</span> Pflichtfeld</p>
        <form className="admin-announcement-form" onSubmit={save}>
            <label htmlFor="announcement-title">Titel <span aria-hidden="true">*</span></label>
            <input id="announcement-title" maxLength={150} onChange={event => setTitle(event.target.value)} required value={title} />
            <label htmlFor="announcement-body">Text <span aria-hidden="true">*</span></label>
            <textarea id="announcement-body" maxLength={3000} onChange={event => setBody(event.target.value)} required rows={7} value={body} />
            <fieldset className="admin-announcement-link-fields">
                <legend>Verlinkung (optional)</legend>
                <label htmlFor="announcement-link">Interne Zielseite</label>
                <select id="announcement-link" onChange={event => {
                    const nextLink = event.target.value;
                    const nextDefaultLabel = internalPages.find(page => page.value === nextLink)?.linkLabel ?? '';
                    setLink(nextLink);
                    setLinkLabel(nextDefaultLabel);
                }} value={link}>
                    <option value="">Keine Verlinkung</option>
                    {link && !internalPages.some(page => page.value === link) ? <option value={link}>Aktueller Link ({link})</option> : null}
                    {internalPages.map(page => <option key={page.value} value={page.value}>{page.label}</option>)}
                </select>
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
                <button className="button-link" disabled={saving} type="submit">{saving ? `Wird ${editing ? 'gespeichert' : 'veröffentlicht'}...` : editing ? 'Speichern' : 'Veröffentlichen'}</button>
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
            <div className="admin-announcement-preview-content notification-drawer">
                <div className="account-menu-header">
                    <h2 id="announcement-preview-title">Benachrichtigungen</h2>
                    <button className="account-menu-close" type="button" aria-label="Vorschau schließen" onClick={() => setPreviewedAt(null)}>&times;</button>
                </div>
                <div className="notification-list">
                    <article className="notification-card--unread">
                        <div className="notification-card-top">
                            <div className="notification-card-title-block">
                                <div className="notification-card-heading">
                                    <h3>{title || 'Titel der Benachrichtigung'}</h3>
                                </div>
                                <time>{formatDate(previewedAt ?? new Date())}</time>
                            </div>
                            <div className="notification-card-controls">
                                <span className="notification-unread-label">Neu</span>
                                <button aria-label="Als gelesen markieren" className="notification-mark-read" tabIndex={-1} type="button">&#10003;</button>
                                <button aria-label="Benachrichtigung entfernen" className="notification-dismiss" tabIndex={-1} type="button">&times;</button>
                            </div>
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
