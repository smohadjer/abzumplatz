import { Form } from '../form/Form';
import { Link } from 'react-router';
import formJson from './loginForm.json';
import './Login.css';

export function Login() {
    // deep clone fields array to avoid mutation during validation in form
   //const  = structuredClone(formJson);
    return (
        <>
            <Form
                classNames="form-login"
                initialData={formJson.fields}
                formAttributes={formJson.form}
                label="Anmelden"
                pathSchema="/schema/login.json"
            />
            <p><Link to="/forgot-password">Passwort vergeßen?</Link></p>
        </>

    )
}
