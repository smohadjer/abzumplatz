import { PasswordProps } from '../../types';
import { useState } from "react";
import { Input } from '../input/Input';
import { StrengthChecker } from '../strengthChecker/StrengthChecker';
import { PasswordToggle } from "../passwordToggle/PasswordToggle";

export function Password(props: PasswordProps) {
    const [type, setType] = useState('password');
    const [password, setPassword] = useState('');

    function inputHandler(e: React.FormEvent) {
        const input = e.target as HTMLInputElement;
        setPassword(input.value);
    }

    function clickHandler() {
        const newType = (type === 'password') ? 'text' : 'password';
        setType(newType);
    }

    const flexClass = (props.hasStrengthIndicator &&
        props.hasDisplayToggle) ? 'flex' : '';
    const passwordWrapperClass = `password-wrapper ${flexClass}`;

    return (
        <>
            <Input {...props}
                type={type}
                onInput={(e) => {inputHandler(e)}}
                autocomplete='new-password'
            />
            <div className={passwordWrapperClass}>
                {props.hasStrengthIndicator &&
                    <StrengthChecker password={password} />}
                {props.hasDisplayToggle &&
                    <PasswordToggle type={type} onClick={clickHandler} />}
            </div>
        </>
    )
}
