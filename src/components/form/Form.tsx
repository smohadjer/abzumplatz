import { useState, FormEvent } from 'react'
import { fetchJson } from '../../utils/utils.js';
import { validateData } from '../../utils/validate.js';
import Hint from '../Hint.js';
import Input from '../Input.js';
import Select from '../Select.js';
import Error from '../Error.js';
import Radio  from '../Radio.js';
import Checkbox from '../Checkbox.js';
import Password from '../password/Password.js';
import { useNavigate } from "react-router";
import { useDispatch } from 'react-redux'
import { Field, ErrorType, FormAttributes } from '../../types';
import './Form.css';

type Props = {
    pathSchema?: string;
    label: string;
    initialData: Field[];
    classNames?: string;
    formAttributes: FormAttributes;
}

type Option = {
    label: string;
    value: string | number;
}

export function Form(props: Props) {
    const { label, pathSchema, initialData, formAttributes} = props;
    const [disabled, setDisabled] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState<Field[]>(initialData);

    //add errors to form data
    const updateFormDataErrors = (errors: ErrorType[]) => {
        if (formData && formData.length) {
            const data = [...formData];
            errors.forEach(error => {
                console.log(error)
                let fieldName: string = '';
                if (error.instancePath.length > 0) {
                    fieldName = error.instancePath.substring(1);
                } else {
                    if (error.keyword === 'required') {
                        fieldName = error.params.missingProperty
                        error.message = `This is a required field`
                    }
                }
                data.map(field => {
                    if (field.name === fieldName) {
                        return field.error = error.message;
                    }
                });
            });

            setFormData(data);
        }
    }

    const removeErrors = () => {
        if (formData && formData.length) {
            const data = [...formData];
            data.map(field => field.error = "");
            // data.map(field => {
            //   if (field.hasOwnProperty('error')) {
            //     delete field.error;
            //     return field;
            //   }
            // });
            setFormData(data);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        console.log('handleChange', e.target.name, e.target.value, e.target.type);
        const updatedData = formData?.map(item => {
        if (item.name === e.target.name) {
            if (Array.isArray(item.value)) {
                if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
                    if (e.target.checked) {
                        item.value = [...item.value, e.target.value];
                    } else {
                        item.value = item.value.filter(arrItem => arrItem !== e.target.value);
                    }
                }
            } else {
                if (e.target.type === "checkbox") {
                    item.value = e.target.checked ? e.target.value : '';
                } else {
                    item.value = e.target.value;
                }
            }
        }
        return item;
        })
        setFormData(updatedData);
    }

    async function submitHandler(event: FormEvent) {
        event.preventDefault();
        setDisabled(true);
        removeErrors();

        const target = event.target as HTMLFormElement;
        const url = target.getAttribute('action')!;

        // Type definition: values can be string OR string[]
        const data: Record<string, string | number | string[]> = {};
        formData?.forEach((item) => {
            if (item.value) {
                data[item.name] = item.value;
            }
        });

        const json = JSON.stringify(data);
        const errorCallback = (errors: ErrorType[]) => {
            console.log(errors);
            updateFormDataErrors(errors);
            setDisabled(false);
        }

        // client-side validation
        if (pathSchema && !formAttributes?.disableClientSideValidation) {
            const schema = await fetchJson(pathSchema);
            if (!validateData(data, schema, errorCallback)) {
                console.log('client side validation failed, not submitting form');
                return;
            }
        }

        console.log('submitting form...');

        // submit form data as json to server
        fetch(url, {
            method: target.method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: json
        })
        .then((response) => response.json())
        .then(json => {
            setDisabled(false);
            if (json.error) {
                console.error(json.error);
                updateFormDataErrors(json.error);
            } else {
                console.log('Server received valid data', target.action);

                if (url === '/api/reset-password') {
                    navigate('/login');
                    return;
                }

                if (url === '/api/signup') {
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

                if (url === '/api/clubs' && formAttributes.method === 'POST') {
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

                if (url === '/api/login') {
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

    function getFields() {
        const isChecked = (item: Field, option: Option) => {
            console.log('isChecked', item.value, option.value);
            if (Array.isArray(item.value)) {
                return item.value.includes(option.value as string);
            } else {
                return item.value === option.value;
            }
        };
        const fields = formData?.map((item, index: number) => {
            switch (item.type) {
            case 'hidden':
                return <input key={index} name={item.name} value={item.value as string} type="hidden" />
                break;
            case 'radio':
                return (
                <div className={item.error  ? 'row row-error' : 'row'} key={index}>
                    <label>{item.label}: {item.required ? '*' : ''}</label>
                    <div>
                    <div>
                        <Radio item={item} handleChange={handleChange} />
                    </div>
                    <Error error={item.error} />
                    </div>
                </div>
                )
                break;
            case 'checkbox':
                return (
                 <div className={item.error  ? 'row row-error' : 'row'} key={index}>
                    <label>{item.label}: {item.required ? '*' : ''}</label>
                    <div>
                    <div>
                        {item.options?.map((option: Option, index: number) =>
                        <Checkbox
                            key={index}
                            name={item.name}
                            label={option.label}
                            checked={isChecked(item, option)}
                            value={option.value}
                            handleChange={handleChange}
                        />
                        )}
                    </div>
                    <Error error={item.error} />
                    </div>
                </div>
                )
                break;
            case 'select':
                return (
                <div className={item.error  ? 'row row-error' : 'row'} key={index}>
                    <label>{item.label}: {item.required ? '*' : ''}</label>
                    <div>
                    <Select
                        item={item}
                        handleChange={handleChange}
                    />
                    <Error error={item.error} />
                    </div>
                </div>
                )
                break;
            case 'password':
                return (
                <div className={item.error  ? 'row row-error' : 'row'} key={index}>
                    <label>{item.label}: {item.required ? '*' : ''}</label>
                    <div>
                    <Password
                        item={item}
                        handleChange={handleChange}
                    />
                    <Error error={item.error} />
                    </div>
                </div>
                )
                break;
            default:
                return (
                 <div className={item.error  ? 'row row-error' : 'row'} key={index}>
                    <label>{item.label}: {item.required ? '*' : ''}</label>
                    <div>
                    <Hint text={item.hint} />
                    <Input item={item} handleChange={handleChange} />
                    <Error error={item.error} />
                    </div>
                </div>
                )
            }
        });
        return fields;
    }

    const formClass = `form-react ${props.classNames ?? ''}`;

    return (formAttributes && formData) ? (
        <form
            className={formClass}
            method={formAttributes.method}
            action={formAttributes.action}
            onSubmit={submitHandler}
            noValidate={formAttributes.disableBrowserValidation}>
            {getFields()}
            <div className="row">
                <button disabled={disabled} type="submit">{label}</button>
            </div>
        </form>
    ) : <p>Loading...</p>
}
