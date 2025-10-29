import { Form } from '../form/Form';
import formJson from './signupForm.json';
import { useNavigate } from "react-router";

export function Signup() {
    const navigate = useNavigate();
    const callback = async () => {
        // update users in state
        // dispatch({
        //     type: 'users/fetch',
        //     payload: {
        //         value: json.data
        //     }
        // });
        navigate('/login');
    }

    return (
        <Form
            classNames="signup"
            initialData={formJson.fields}
            formAttributes={formJson.form}
            label="Registrieren"
            pathSchema="/schema/signup.json"
            callback={callback}
        />
    )
}
