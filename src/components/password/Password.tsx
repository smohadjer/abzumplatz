import { useState } from "react";
import Input from '../Input';
import { StrengthChecker } from '../strengthChecker/StrengthChecker';
import { PasswordToggle } from "../passwordToggle/PasswordToggle";
import { Field } from '../../types';
import { ChangeEventHandler, ChangeEvent } from 'react';

type Props = {
    handleChange: ChangeEventHandler;
    item: Field;
}

export default function Password(props: Props) {
    const [type, setType] = useState('password');
    const [password, setPassword] = useState('');

    function changeHandler(e: ChangeEvent) {
        const input = e.target as HTMLInputElement;
        setPassword(input.value);
        props.handleChange(e)
    }

    function clickHandler() {
        const newType = (type === 'password') ? 'text' : 'password';
        setType(newType);
    }

    const passwordItem = structuredClone(props.item);
    passwordItem.type = type;

    return (
        <>
            <div className="password-label-row">
                <label>{props.item.label}: {props.item.required ? '*' : ''}</label>
                {props.item.hasDisplayToggle &&
                    <PasswordToggle type={type} onClick={clickHandler} />}
            </div>
            <Input
                item={passwordItem}
                handleChange={changeHandler}
            />
            <div className="password-wrapper">
                {props.item.hasStrengthIndicator &&
                    <StrengthChecker password={password} />}
            </div>
        </>
    )
}
