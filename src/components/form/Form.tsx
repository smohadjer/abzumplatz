import { FormEvent, useState } from 'react';
import { FormField } from '../formField/FormField';
import { normalizeErrors } from '../../utils/normalizeErrors';
import { ServerError, FieldError, FieldProps } from '../../types';
import './Form.css';
import { useNavigate } from "react-router";
import { useDispatch } from 'react-redux'

type FormProps = {
    method: string;
    action: string;
    fields: FieldProps[];
    label: string;
    disableValidation?: boolean;
    classNames?: string;
}

export function Form(props: FormProps) {
    const { method, action, fields, label } = props;
    const [errors, setErrors] = useState<FieldError[]>([]);
    const navigate = useNavigate();
    const noValidate = props.disableValidation ?? false;
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
            console.log(action, json);

            if (json.error) {
                const errors: ServerError[] = [...json.error];
                updateErrors(normalizeErrors(errors));
            } else {
                console.log('Server received valid data');
                setErrors([]);

                if (action === '/api/reset-password') {
                    navigate('/login');
                    return;
                }

                if (action === '/api/signup') {
                    console.log(json.message);
                    // update users in state
                    dispatch({
                        type: 'users/fetch',
                        payload: {
                            value: json.data
                        }
                    });
                    navigate('/login');
                    return;
                }

                if (action === '/api/clubs' && method === 'POST') {
                    console.log(json.message);
                    // update clubs in state
                    dispatch({
                        type: 'clubs/fetch',
                        payload: {
                            value: json.data
                        }
                    });
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
                        last_name: json.last_name,
                        email: json.email,
                        _id: json._id,
                        club_id: json.club_id,
                        role: json.role,
                    }});
                    console.log('going to reservations page');
                    navigate('/reservations');
                    return;
                }
            }
        });
    }

    const formClass = `form-react ${props.classNames ?? ''}`;

    return (
        <form
            noValidate={noValidate}
            className={formClass}
            method={method}
            action={action}
            onSubmit={submitHandler}>
            {fields.length ?
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
                </fieldset> : null
            }
            <button type="submit">{label}</button>
        </form>
    )
}
