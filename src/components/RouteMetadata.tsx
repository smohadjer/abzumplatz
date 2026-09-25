import { useEffect } from 'react';
import { useLocation } from 'react-router';

type Metadata = {
    title: string;
    description: string;
    indexable: boolean;
};

const publicMetadata: Record<string, Metadata> = {
    '/': {
        title: 'abzumplatz – Tennisplatzreservierung und Vereinsverwaltung',
        description: 'Die intuitive Plattform für Platzreservierung und Vereinsverwaltung in Tennisvereinen.',
        indexable: true
    },
    '/faq': {
        title: 'Häufige Fragen zu abzumplatz',
        description: 'Antworten zur Tennisplatzreservierung, Vereinsverwaltung, Registrierung und Nutzung von abzumplatz.',
        indexable: true
    },
    '/support': {
        title: 'Support und Kontakt – abzumplatz',
        description: 'Support, Kontakt und persönliche Hilfe bei Fragen zur Nutzung von abzumplatz.',
        indexable: true
    },
    '/impressum': {
        title: 'Impressum – abzumplatz',
        description: 'Impressum und Anbieterinformationen von abzumplatz.',
        indexable: true
    }
};

const privateTitles: Record<string, string> = {
    '/login': 'Einloggen – abzumplatz',
    '/register/player': 'Spieler registrieren – abzumplatz',
    '/register/club': 'Verein registrieren – abzumplatz',
    '/forgot-password': 'Passwort zurücksetzen – abzumplatz',
    '/reset-password': 'Neues Passwort festlegen – abzumplatz',
    '/reservations': 'Platzreservierung – abzumplatz',
    '/bookings': 'Meine Buchungen – abzumplatz',
    '/tournaments': 'Turniere – abzumplatz',
    '/profile': 'Profil – abzumplatz',
    '/rules': 'Vereinsregeln – abzumplatz',
    '/select-club': 'Verein auswählen – abzumplatz',
    '/admin': 'Administration – abzumplatz'
};

function setMeta(name: string, content: string) {
    let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
    if (!element) {
        element = document.createElement('meta');
        element.name = name;
        document.head.append(element);
    }
    element.content = content;
}

function getPrivateTitle(pathname: string) {
    const exactTitle = privateTitles[pathname];
    if (exactTitle) return exactTitle;
    if (pathname.startsWith('/admin')) return privateTitles['/admin'];
    if (pathname.startsWith('/tournaments')) return privateTitles['/tournaments'];
    if (pathname.startsWith('/profile')) return privateTitles['/profile'];
    return 'Seite nicht gefunden – abzumplatz';
}

export default function RouteMetadata() {
    const {pathname} = useLocation();

    useEffect(() => {
        const metadata = publicMetadata[pathname] ?? {
            title: getPrivateTitle(pathname),
            description: 'Geschützter Anwendungsbereich von abzumplatz.',
            indexable: false
        };

        document.title = metadata.title;
        setMeta('description', metadata.description);
        setMeta('robots', metadata.indexable ? 'index, follow' : 'noindex, follow');

        const existingCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (metadata.indexable) {
            const canonical = existingCanonical ?? document.createElement('link');
            canonical.rel = 'canonical';
            canonical.href = new URL(pathname, 'https://abzumplatz.de').href;
            if (!existingCanonical) document.head.append(canonical);
        } else {
            existingCanonical?.remove();
        }
    }, [pathname]);

    return null;
}
