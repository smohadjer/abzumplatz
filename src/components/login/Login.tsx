import { Form } from '../form/Form';
import { Link } from 'react-router';
import formJson from './loginForm.json';
import './Login.css';
import { useNavigate } from "react-router";
import { useDispatch } from 'react-redux'
import { JwtPayload } from '../../types.js';


export function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const callback = async (response: JwtPayload) => {
        dispatch({
            type: 'auth/login',
            payload: {
                value: true,
                ...response
            }
        });

        console.log('redirecting to reservations page after login...');
        navigate('/reservations');
    }

    return (
        <>
            <Form
                classNames="form-login"
                initialData={formJson.fields}
                formAttributes={formJson.form}
                label="Anmelden"
                pathSchema="/schema/login.json"
                callback={callback}
            />
            <p><Link to="/forgot-password">Passwort vergeßen?</Link></p>
        </>

    )
}
