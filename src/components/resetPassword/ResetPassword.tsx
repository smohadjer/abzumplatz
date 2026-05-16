import { Form } from '../form/Form';
import formJson from './resetPasswordForm.json';
import { Field } from '../../types';
import { Link, useSearchParams, useNavigate } from 'react-router';

export function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const resetToken = searchParams.get('token');
    const callback = async () => {
        navigate('/login');
    }

    if (!resetToken) {
        return (
            <p className="error">Der Link zum Zurücksetzen des Passworts ist ungültig. Bitte öffnen Sie die Seite über den Link in Ihrer E-Mail oder fordern Sie einen <Link to="/forgot-password">neuen Link</Link> an.</p>
        )
    }

    const resetTokenField = {
        label: 'resetToken',
        name: 'resetToken',
        type: 'hidden',
        value: resetToken
    }

    const normalizedFields: Field[] = JSON.parse(JSON.stringify(formJson.fields));
    normalizedFields.push(resetTokenField);

    return (
        <Form
            pathSchema="/schema/resetPassword.json"
            classNames="reset-password"
            formAttributes={formJson.form}
            initialData={normalizedFields}
            label="Passwort zurücksetzen"
            callback={callback}
        />
    )
}
