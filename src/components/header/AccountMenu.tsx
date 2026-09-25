import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router';
import packageJson from '../../../package.json';
import { RootState } from '../../store';
import { onLogout } from '../../utils/utils';

const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function AccountMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const dispatch = useDispatch();
    const auth = useSelector((state: RootState) => state.auth);
    const location = useLocation();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const drawerRef = useRef<HTMLElement>(null);

    const closeMenu = (restoreFocus = true) => {
        setIsOpen(false);
        if (restoreFocus) {
            requestAnimationFrame(() => triggerRef.current?.focus());
        }
    };

    useEffect(() => {
        setIsOpen(false);
    }, [location.key]);

    useEffect(() => {
        if (!isOpen) return;

        const scrollContainer = document.querySelector<HTMLElement>('main');
        const previousOverflowY = scrollContainer?.style.overflowY ?? '';
        if (scrollContainer) scrollContainer.style.overflowY = 'hidden';
        drawerRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
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
    }, [isOpen]);

    const handleLogout = () => {
        if (!confirm('Möchten Sie sich wirklich ausloggen?')) return;
        closeMenu(false);
        onLogout(dispatch);
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
                onClick={() => setIsOpen(true)}
            >
                <span className="icon icon--account" aria-hidden="true"></span>
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
                            <Link to="/rules">Regeln</Link>
                        </div>
                        <div className="account-menu-group">
                            <Link to="/support">Support</Link>
                            <Link to="/faq">FAQ</Link>
                        </div>
                        <div className="account-menu-group">
                            <Link to="/impressum">Impressum</Link>
                        </div>
                    </nav>

                    <div className="account-menu-footer">
                        <button type="button" className="account-menu-logout" onClick={handleLogout}>
                            <span className="icon icon--logout" aria-hidden="true"></span>
                            Ausloggen
                        </button>
                        <span>App-Version: {packageJson.version}</span>
                    </div>
                </aside>
            </div>
        </>
    );
}
