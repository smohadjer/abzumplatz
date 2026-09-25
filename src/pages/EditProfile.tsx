import { FormEvent, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router';
import { setProfile } from '../reducers/authSlice';
import { RootState } from '../store';
import { getClub } from '../utils/utils';

export default function EditProfile() {
    const auth = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const club = getClub();
    const [firstName, setFirstName] = useState(auth.first_name);
    const [lastName, setLastName] = useState(auth.last_name);
    const [birthYear, setBirthYear] = useState(auth.birth_year?.toString() ?? '');
    const [sex, setSex] = useState(auth.sex ?? '');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const currentYear = new Date().getFullYear();

    const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const response = await fetch('/api/users', {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json', Accept: 'application/json'},
                body: JSON.stringify({
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    birth_year: birthYear ? Number(birthYear) : null,
                    sex: sex || null,
                }),
            });
            const json = await response.json();
            if (!response.ok) {
                const responseError = Array.isArray(json.error) ? json.error[0]?.message : json.error;
                throw new Error(responseError || 'Das Profil konnte nicht gespeichert werden.');
            }
            dispatch(setProfile(json));
            navigate('/profile');
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Das Profil konnte nicht gespeichert werden.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <p><Link className="icon icon--back" to="/profile">Zurück</Link></p>
            <h1>Profil bearbeiten</h1>
            <form className="form-react" onSubmit={saveProfile}>
                <div className="row"><label htmlFor="first-name">Vorname: *</label><div><input id="first-name" required maxLength={40} value={firstName} onChange={event => setFirstName(event.target.value)} /></div></div>
                <div className="row"><label htmlFor="last-name">Nachname: *</label><div><input id="last-name" required maxLength={40} value={lastName} onChange={event => setLastName(event.target.value)} /></div></div>
                <div className="row"><label htmlFor="profile-email">E-Mail:</label><div><input id="profile-email" disabled value={auth.email} /></div></div>
                <div className="row"><label htmlFor="profile-status">Status:</label><div><input id="profile-status" disabled value={auth.status === 'inactive' ? 'Inaktiv' : 'Aktiv'} /></div></div>
                <div className="row">
                    <label>Verein:</label>
                    <div>
                        {club?.name ?? '-'}
                        {auth.role !== 'admin' ? (
                            <> (<Link to="/select-club">{auth.club_id ? 'Verein wechseln' : 'Verein auswählen'}</Link>)</>
                        ) : null}
                    </div>
                </div>
                <div className="row"><label htmlFor="birth-year">Geburtsjahr:</label><div><input id="birth-year" type="number" min="1900" max={currentYear} value={birthYear} onChange={event => setBirthYear(event.target.value)} /></div></div>
                <div className="row"><label htmlFor="member-sex">Geschlecht:</label><div><select id="member-sex" value={sex} onChange={event => setSex(event.target.value as typeof sex)}><option value="">Keine Angabe</option><option value="male">Männlich</option><option value="female">Weiblich</option></select></div></div>
                {error ? <p className="form-error-message">{error}</p> : null}
                <div className="row"><button type="submit" disabled={saving}>{saving ? 'Speichern…' : 'Speichern'}</button></div>
            </form>
        </>
    );
}
