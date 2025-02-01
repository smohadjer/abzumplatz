import { FormEvent, useState } from 'react';
import { FormField } from '../formField/FormField';
import { normalizeErrors } from '../../utils/normalizeErrors';
import { FormProps, ServerError, FieldError } from '../../types';
import './Form.css';
import { useNavigate } from "react-router";


export function Form(props: FormProps) {
    const { method, action, fields, label } = props;
    const [errors, setErrors] = useState<FieldError[]>([]);
    const navigate = useNavigate();

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

                if (action === '/api/login') {
                    console.log('going to home');
                    navigate('/');
                    return;
                }
            }
        });
    }

    return (
        <form
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
