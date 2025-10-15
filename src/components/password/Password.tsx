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
        console.log(input.value);
        setPassword(input.value);
        props.handleChange(e)
    }

    function clickHandler() {
        const newType = (type === 'password') ? 'text' : 'password';
        setType(newType);
    }

    const passwordItem = structuredClone(props.item);
    passwordItem.type = type;

    const flexClass = (props.item.hasStrengthIndicator &&
        props.item.hasDisplayToggle) ? 'flex' : '';
    const passwordWrapperClass = `password-wrapper ${flexClass}`;

    return (
        <>
            <Input
                item={passwordItem}
                handleChange={changeHandler}
            />
            <div className={passwordWrapperClass}>
                {props.item.hasStrengthIndicator &&
                    <StrengthChecker password={password} />}
                {props.item.hasDisplayToggle &&
                    <PasswordToggle type={type} onClick={clickHandler} />}
            </div>
        </>
    )
}
