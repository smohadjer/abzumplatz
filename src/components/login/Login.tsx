import { useState, ChangeEvent } from 'react';
import { Form } from '../form/Form';
import fields from './loginForm.json';
import './Login.css';

export function Login() {
    const [disableValidation, setDisableValidation] = useState(false);

    function changeHandler(e: ChangeEvent) {
        const checkbox = e.target as HTMLInputElement;
        setDisableValidation(checkbox.checked);
    }

    return (
        <>
            <h1>Login Form</h1>
            <p>
                <label>
                    <input
                        type="checkbox"
                        name="disable-validate"
                        onChange={(e) => {changeHandler(e)}}
                    />
                    Disable browser validation (form will be submitted despite errors, but server will validate and return errors)
                </label>
            </p>
            <Form
                method="POST"
                action="/api/login"
                fields={fields}
                label="Login"
                disableValidation={disableValidation}
            />
        </>
    )
}
