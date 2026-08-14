import { Link } from 'react-router';
import { useDispatch } from 'react-redux';
import { onLogout } from '../utils/utils';
import packageJson from '../../package.json';
import './settings.css';

export default function Settings() {
    const dispatch = useDispatch();

    return (
        <>
            <h1>Einstellungen</h1>
            <ul className="settings-links">
                <li><Link to="/profile">Mein Profil</Link></li>
                <li><Link to="/rules">Regeln</Link></li>
                <li><Link to="/support">Support</Link></li>
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/impressum">Impressum</Link></li>
                <li>
                    <a className="settings-logout-link" href="#" onClick={(event) => {
                        event.preventDefault();
                        if (confirm('Möchten Sie sich wirklich abmelden?')) {
                            onLogout(dispatch);
                        }
                    }}>Abmelden</a>
                </li>
                <li><span>App-Version: {packageJson.version}</span></li>
            </ul>
        </>
    );
}
