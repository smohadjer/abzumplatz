import { FormEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import packageJson from '../../../package.json';
import { RootState } from '../../store';
import { onLogout } from '../../utils/utils';

const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onOpen: () => void;
};

export default function AccountMenu({isOpen, onClose, onOpen}: Props) {
    const dispatch = useDispatch();
    const auth = useSelector((state: RootState) => state.auth);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const drawerRef = useRef<HTMLElement>(null);
    const deleteAccountButtonRef = useRef<HTMLButtonElement>(null);
    const deleteAccountDialogRef = useRef<HTMLDialogElement>(null);
    const deleteAccountPasswordRef = useRef<HTMLInputElement>(null);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setPortalContainer(document.body);
    }, []);

    const closeMenu = (restoreFocus = true) => {
        onClose();
        if (restoreFocus) {
            requestAnimationFrame(() => triggerRef.current?.focus());
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        const scrollContainer = document.querySelector<HTMLElement>('main');
        const previousOverflowY = scrollContainer?.style.overflowY ?? '';
        if (scrollContainer) scrollContainer.style.overflowY = 'hidden';
        drawerRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !showDeleteAccount) {
                event.preventDefault();
                closeMenu();
                return;
            }

            if (event.key !== 'Tab' || !drawerRef.current) return;
            const focusableElements = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(focusableSelector));
            if (!focusableElements.length) return;
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

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
    }, [isOpen, showDeleteAccount]);

    useEffect(() => {
        const dialog = deleteAccountDialogRef.current;
        if (!dialog) return;
        if (showDeleteAccount && !dialog.open) {
            dialog.showModal();
            deleteAccountPasswordRef.current?.focus();
        }
        if (!showDeleteAccount && dialog.open) dialog.close();
    }, [showDeleteAccount, portalContainer]);

    const closeDeleteAccountDialog = () => {
        deleteAccountDialogRef.current?.close();
    };

    const handleLogout = () => {
        if (!confirm('Möchten Sie sich wirklich ausloggen?')) return;
        closeMenu(false);
        onLogout(dispatch);
    };

    const handleDeleteAccount = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!confirm('Möchten Sie Ihr Konto wirklich dauerhaft löschen?')) return;

        setDeletingAccount(true);
        setDeleteError('');
        try {
            const response = await fetch('/api/auth?action=delete-account', {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({password: deletePassword}),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? 'Das Konto konnte nicht gelöscht werden.');
            window.location.assign('/');
        } catch (error) {
            setDeleteError(error instanceof Error ? error.message : 'Das Konto konnte nicht gelöscht werden.');
            setDeletingAccount(false);
        }
    };

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className="header-account-button"
                aria-label="Menü öffnen"
                aria-expanded={isOpen}
                aria-controls="account-menu"
                onClick={onOpen}
            >
                <span className="header-menu-icon" aria-hidden="true"></span>
            </button>

            <div className={`account-menu-layer${isOpen ? ' account-menu-layer--open' : ''}`} aria-hidden={!isOpen}>
                <button className="account-menu-backdrop" type="button" aria-label="Menü schließen" onClick={() => closeMenu()}></button>
                <aside ref={drawerRef} id="account-menu" className="account-menu" role="dialog" aria-modal="true" aria-labelledby="account-menu-title" inert={!isOpen}>
                    <div className="account-menu-header">
                        <div className="account-menu-user">
                            <h2 id="account-menu-title">{auth.first_name} {auth.last_name}{auth.role === 'admin' ? ' (Admin)' : ''}</h2>
                            <span>{auth.email}</span>
                        </div>
                        <button className="account-menu-close" type="button" aria-label="Menü schließen" onClick={() => closeMenu()}>&times;</button>
                    </div>

                    <nav aria-label="Konto und weitere Seiten">
                        <div className="account-menu-group">
                            <Link to="/profile">Mein Profil</Link>
                        </div>
                        <div className="account-menu-group">
                            <Link to="/rules">Vereinsregeln</Link>
                        </div>
                        <div className="account-menu-group">
                            <Link to="/support">Support</Link>
                            <Link to="/faq">FAQ</Link>
                        </div>
                        <div className="account-menu-group">
                            <Link to="/impressum">Impressum</Link>
                            <Link to="/privacy">Datenschutz</Link>
                            <Link to="/terms">Nutzungsbedingungen</Link>
                        </div>
                        <div className="account-menu-group account-menu-logout-group">
                            <button type="button" className="account-menu-logout" onClick={handleLogout}>
                                <span className="icon icon--logout" aria-hidden="true"></span>
                                Ausloggen
                            </button>
                            {auth.role !== 'admin' ? <>
                                <button
                                    aria-expanded={showDeleteAccount}
                                    className="account-menu-delete-account"
                                    ref={deleteAccountButtonRef}
                                    onClick={() => {
                                        setShowDeleteAccount(true);
                                        setDeleteError('');
                                    }}
                                    type="button"
                                >
                                    <span className="icon icon--delete" aria-hidden="true"></span>
                                    Konto löschen
                                </button>
                            </> : null}
                        </div>
                    </nav>

                    <div className="account-menu-footer">
                        <span>Version: {packageJson.version}</span>
                    </div>
                </aside>
            </div>
            {portalContainer && auth.role !== 'admin' ? createPortal((
                <dialog
                    aria-labelledby="account-delete-title"
                    className="account-delete-dialog"
                    onCancel={() => setShowDeleteAccount(false)}
                    onClose={() => {
                        setShowDeleteAccount(false);
                        setDeletePassword('');
                        setDeleteError('');
                        requestAnimationFrame(() => deleteAccountButtonRef.current?.focus());
                    }}
                    ref={deleteAccountDialogRef}
                >
                    <button aria-label="Schließen" className="account-delete-dialog-close popup-close-icon" onClick={closeDeleteAccountDialog} type="button"></button>
                    <h2 id="account-delete-title">Konto löschen</h2>
                    <p>Ihr Konto und die damit verknüpften App-Daten werden dauerhaft gelöscht. Gesetzlich aufzubewahrende Daten bleiben davon unberührt. Diese Aktion kann nicht rückgängig gemacht werden.</p>
                    <form className="account-menu-delete-form" onSubmit={handleDeleteAccount}>
                        <label htmlFor="account-delete-password">Aktuelles Passwort:</label>
                        <input
                            autoComplete="current-password"
                            id="account-delete-password"
                            onChange={event => setDeletePassword(event.target.value)}
                            ref={deleteAccountPasswordRef}
                            required
                            type="password"
                            value={deletePassword}
                        />
                        <div className="account-delete-dialog-actions">
                            <button className="delete-action-button" disabled={deletingAccount || !deletePassword} type="submit">
                                {deletingAccount ? 'Konto wird gelöscht…' : 'Löschen bestätigen'}
                            </button>
                            <button className="button-link button-link--secondary" disabled={deletingAccount} onClick={closeDeleteAccountDialog} type="button">Abbrechen</button>
                        </div>
                        {deleteError ? <p className="form-error-message" role="alert">{deleteError}</p> : null}
                    </form>
                </dialog>
            ), portalContainer) : null}
        </>
    );
}
