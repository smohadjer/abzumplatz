import { Link } from 'react-router';

export default function AnnouncementTabs({active}: {active: 'history' | 'new'}) {
    return <nav aria-label="Benachrichtigungsverwaltung" className="admin-announcement-tabs">
        <Link
            aria-current={active === 'history' ? 'page' : undefined}
            className={active === 'history' ? 'active' : ''}
            to="/admin/announcements"
        >Bisherige Benachrichtigungen</Link>
        <Link
            aria-current={active === 'new' ? 'page' : undefined}
            className={active === 'new' ? 'active' : ''}
            to="/admin/announcements/new"
        >Neue Benachrichtigung</Link>
    </nav>;
}
