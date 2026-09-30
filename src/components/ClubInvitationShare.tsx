import { useEffect, useRef, useState } from 'react';
import './club-invitation-share.css';

type Props = {
    clubId: string;
    clubName: string;
    showHeading?: boolean;
};

function getInvitationUrl(clubId: string) {
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    return `${origin}/register/player?club=${encodeURIComponent(clubId)}`;
}

export function ClubInvitationShare({clubId, clubName, showHeading = true}: Props) {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
    const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const invitationUrl = getInvitationUrl(clubId);
    const invitationText = `Unser Verein „${clubName}“ nutzt abzumplatz für Platzreservierungen. Registriere dich über diesen Link. Nach der Registrierung schalten wir dein Konto frei:`;
    const sharedText = `${invitationText}\n${invitationUrl}`;

    useEffect(() => () => {
        if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    }, []);

    const copyInvitationLink = async () => {
        try {
            await navigator.clipboard.writeText(invitationUrl);
            setCopyStatus('copied');
            if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
            copyResetTimer.current = setTimeout(() => setCopyStatus('idle'), 2400);
        } catch {
            setCopyStatus('error');
        }
    };

    const shareInvitation = async () => {
        try {
            await navigator.share({
                title: `${clubName} auf abzumplatz`,
                text: invitationText,
                url: invitationUrl,
            });
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            setCopyStatus('error');
        }
    };

    const mailUrl = `mailto:?subject=${encodeURIComponent(`${clubName} auf abzumplatz`)}&body=${encodeURIComponent(sharedText)}`;
    const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(sharedText)}`;
    const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    return (
        <section
            className="club-invitation"
            {...(showHeading
                ? {'aria-labelledby': `club-invitation-title-${clubId}`}
                : {'aria-label': 'Mitglieder einladen'})}
        >
            {showHeading ? <h2 id={`club-invitation-title-${clubId}`}>Mitglieder einladen</h2> : null}
            <p>Laden Sie Ihre Vereinsmitglieder ein, sich bei Ihrem Verein auf abzumplatz.de zu registrieren und Plätze online zu reservieren.</p>
            <div className="club-invitation-link-row">
                <span id={`club-invitation-link-${clubId}`} className="club-invitation-link">{invitationUrl}</span>
                <button
                    className="club-invitation-copy-button"
                    type="button"
                    aria-label="Einladungslink kopieren"
                    title="Einladungslink kopieren"
                    onClick={() => void copyInvitationLink()}
                >
                    <span className="club-invitation-copy-icon" aria-hidden="true"></span>
                    {copyStatus === 'copied' ? (
                        <span className="club-invitation-copy-tooltip" role="status">Einladungslink kopiert</span>
                    ) : null}
                </button>
            </div>
            <div className="club-invitation-actions">
                {canShare ? (
                    <button className="button-link" type="button" onClick={() => void shareInvitation()}>
                        <span className="club-invitation-action-icon club-invitation-action-icon--share" aria-hidden="true"></span>
                        Teilen
                    </button>
                ) : null}
                <a className="button-link club-invitation-whatsapp-button" href={whatsAppUrl} target="_blank" rel="noreferrer">
                    <span className="club-invitation-action-icon club-invitation-action-icon--whatsapp" aria-hidden="true"></span>
                    WhatsApp
                </a>
                <a className="button-link button-link--secondary" href={mailUrl}>
                    <span className="club-invitation-action-icon club-invitation-action-icon--mail" aria-hidden="true"></span>
                    E-Mail
                </a>
            </div>
            <p className="club-invitation-status" aria-live="polite">
                {copyStatus === 'error' ? 'Der Link konnte nicht automatisch kopiert oder geteilt werden. Bitte kopieren Sie ihn über das Kontextmenü.' : null}
            </p>
        </section>
    );
}
