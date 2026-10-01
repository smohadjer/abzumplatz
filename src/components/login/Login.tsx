import { Form } from '../form/Form';
import { Link } from 'react-router';
import formJson from './loginForm.json';
import './Login.css';
import { useNavigate } from "react-router";
import { useDispatch } from 'react-redux'
import { AuthenticatedUserResponse, Field } from '../../types.js';


type Props = {
    showAdminWelcome?: boolean;
    initialEmail?: string;
};

export function Login({showAdminWelcome, initialEmail}: Props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const fields: Field[] = structuredClone(formJson.fields);
    const emailField = fields.find(field => field.name === 'email');
    if (emailField && initialEmail) {
        emailField.value = initialEmail;
        const passwordField = fields.find(field => field.name === 'password');
        if (passwordField) {
            passwordField.autoFocus = true;
        }
    }

    const callback = async (response: AuthenticatedUserResponse) => {
        dispatch({
            type: 'auth/login',
            payload: {
                value: true,
                ...response
            }
        });

        if (response.status === 'inactive') {
            navigate('/profile');
            return;
        }

        navigate('/reservations', showAdminWelcome
            ? {state: {showAdminWelcome: true}}
            : undefined
        );
    }

    return (
        <>
            <Form
                classNames="form-login"
                initialData={fields}
                formAttributes={formJson.form}
                label="Einloggen"
                pathSchema="/schema/login.json"
                callback={callback}
            />
            <p><Link to="/forgot-password">Passwort vergeßen?</Link></p>
        </>

    )
}
