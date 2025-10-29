import { Form } from '../form/Form';
import { Link } from 'react-router';
import formJson from './loginForm.json';
import './Login.css';
import { useNavigate } from "react-router";
import { useDispatch } from 'react-redux'
import { JwtPayload } from '../../types.js';


export function Login() {
    // deep clone fields array to avoid mutation during validation in form
    // const  = structuredClone(formJson);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const callback = async (response: JwtPayload) => {
        console.log(response);
        // store.setState({
        //     ...state,
        //     isLoggedin: true
        // });
        dispatch({
            type: 'auth/login',
            payload: {
                value: true,
                ...response
            }
        });

        if (response.role === 'player') {
            console.log('going to reservations page');
            navigate('/reservations');
        } else {
            // user is admin
            if (response.club_id) {
                console.log('going to admin page');
                navigate('/admin');
            } else {
                console.log('going to club register page');
                navigate('/register');
            }
        }
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
