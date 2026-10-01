import { useEffect, useState } from 'react';
import { Login } from '../components/login/Login';
import { Link, useLocation, useNavigate } from 'react-router';

type LoginLocationState = {
    clubRegistrationSuccess?: boolean;
    showAdminWelcome?: boolean;
    email?: string;
};

export default function LoginPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [navigationState] = useState(() => location.state as LoginLocationState | null);

    useEffect(() => {
        if (location.state) {
            navigate(location.pathname, {replace: true, state: null});
        }
    }, [location.pathname, location.state, navigate]);

    return (
        <>
            <p><Link className="icon icon--back" to="/">Zur Startseite</Link></p>
            <h1>Einloggen</h1>
            {navigationState?.clubRegistrationSuccess ? (
                <p className="form-success-message" role="status">
                    Ihr Verein wurde erfolgreich registriert. Melden Sie sich jetzt an, um ihn einzurichten.
                </p>
            ) : null}
            <Login showAdminWelcome={navigationState?.showAdminWelcome} initialEmail={navigationState?.email} />
        </>

    )
}
