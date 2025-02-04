import { FormEvent, useState } from 'react';
import { FormField } from '../formField/FormField';
import { normalizeErrors } from '../../utils/normalizeErrors';
import { FormProps, ServerError, FieldError } from '../../types';
import './Form.css';
import { useNavigate } from "react-router";
import { useDispatch } from 'react-redux'
import { login, logout } from '../../authSlice'

export function Form(props: FormProps) {
    const { method, action, fields, label } = props;
    const [errors, setErrors] = useState<FieldError[]>([]);
    const navigate = useNavigate();
    //const auth = useSelector(state => state.auth.value)
    const dispatch = useDispatch()

    function updateErrors(newErrors: FieldError[]) {
        setErrors(newErrors);
    }

    function submitHandler(e: FormEvent) {
        e.preventDefault();
        const data = new FormData(e.target as HTMLFormElement);
        const json = JSON.stringify(Object.fromEntries(data));

        // submit form data as json to server
        fetch(action, {
            method: method,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: json
        })
        .then((response) => response.json())
        .then(json => {
            console.log(json);
            if (json.error) {
                const errors: ServerError[] = [...json.error];
                updateErrors(normalizeErrors(errors));
            } else {
                console.log('Server received valid data');

                if (json.data) {
                    console.log(json.data);
                }

                if (action === '/api/signup') {
                    console.log('going to login');
                    navigate('/login');
                    return;
                }

                if (action === '/api/logout') {
                    // store.setState({
                    //     ...state,
                    //     isLoggedin: false
                    // });
                    dispatch({type: 'auth/logout', payload: {
                        value: false,
                        first_name: '',
                    }});
                    //console.log('going to login');
                    //navigate('/login');
                    //return;
                }

                if (action === '/api/login') {
                    // store.setState({
                    //     ...state,
                    //     isLoggedin: true
                    // });
                    dispatch({type: 'auth/login', payload: {
                        value: true,
                        first_name: json.first_name,
                    }});
                    //console.log('going to home', store.getState());
                    //navigate('/');
                    //return;
                }
            }
        });
    }

    return (
        <form
            noValidate={true}
            className="form-react"
            method={method}
            action={action}
            onSubmit={submitHandler}>
            <fieldset>
                {fields.map((item: any, index: number) => {
                    const error = errors.find((error) => error.id === item.id);

                    // change default error message to error returned from server
                    if (error) {
                        item.error = error.error;
                        item.hasError = true;
                    }

                    return <FormField key={index} {...item} />
                })}
            </fieldset>
            <button type="submit">{label}</button>
        </form>
    )
}
