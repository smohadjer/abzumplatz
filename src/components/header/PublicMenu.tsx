import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import packageJson from '../../../package.json';

const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onOpen: () => void;
};

export default function PublicMenu({isOpen, onClose, onOpen}: Props) {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const drawerRef = useRef<HTMLElement>(null);

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

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className="header-public-menu-button"
                aria-label="Menü öffnen"
                aria-expanded={isOpen}
                aria-controls="public-menu"
                onClick={onOpen}
            >
                <span className="header-menu-icon" aria-hidden="true"></span>
            </button>

            <div className={`account-menu-layer${isOpen ? ' account-menu-layer--open' : ''}`} aria-hidden={!isOpen}>
                <button className="account-menu-backdrop" type="button" aria-label="Menü schließen" onClick={() => closeMenu()}></button>
                <aside ref={drawerRef} id="public-menu" className="account-menu" role="dialog" aria-modal="true" aria-labelledby="public-menu-title" inert={!isOpen}>
                    <div className="account-menu-header">
                        <h2 id="public-menu-title">Weitere Seiten</h2>
                        <button className="account-menu-close" type="button" aria-label="Menü schließen" onClick={() => closeMenu()}>&times;</button>
                    </div>

                    <nav aria-label="Weitere Seiten">
                        <div className="account-menu-group">
                            <Link to="/faq">FAQ</Link>
                            <Link to="/support">Support</Link>
                        </div>
                        <div className="account-menu-group">
                            <Link to="/impressum">Impressum</Link>
                        </div>
                    </nav>

                    <div className="account-menu-footer">
                        <span>App-Version: {packageJson.version}</span>
                    </div>
                </aside>
            </div>
        </>
    );
}
