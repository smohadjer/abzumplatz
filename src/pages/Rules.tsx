import { Link } from 'react-router';
import { defaultClubRules } from '../clubRules';
import { getClub } from '../utils/utils';
import './rules.css';

export default function Rules() {
    const club = getClub();
    const rules = Array.isArray(club?.rules) ? club.rules : defaultClubRules;

    return (
        <>
            <p><Link className="icon icon--back" to="/settings">Zurück</Link></p>
            <h1>Regeln</h1>
            {rules.length ? (
                <ol className="rules-list">
                    {rules.map((rule, index) => <li key={index}>{rule}</li>)}
                </ol>
            ) : <p>Der Administrator hat noch keine Regeln hinzugefügt.</p>}
        </>
    );
}
