import { Form } from '../form/Form';
import fields from './signupForm.json';
import './Signup.css';

export function Signup() {
    return (
        <Form
            method="POST"
            action="/api/signup"
            fields={fields}
            label="Sign Up"
        />
    )
}
