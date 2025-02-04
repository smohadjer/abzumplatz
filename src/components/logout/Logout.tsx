import { Form } from '../form/Form';
import fields from './logoutForm.json';
import './Logout.css';

export function Logout() {
    return (
        <Form
            method="POST"
            action="/api/logout"
            fields={fields}
            label="Logout"
        />
    )
}
