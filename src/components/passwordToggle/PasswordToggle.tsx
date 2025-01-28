import { MouseEventHandler } from "react";
import imageUrlShow from './eye-fill.svg';
import imageUrlHide from './eye-slash-fill.svg';
import './PasswordToggle.css';

interface Props {
    type: string;
    onClick: MouseEventHandler;
}

const title = (type: string) => {
    return (type === 'password') ? 'Show password' : 'Hide password';
};

export function PasswordToggle({type, onClick}: Props) {
    return (
        <button
            className="password-toggle"
            aria-label={title(type)}
            title={title(type)}
            type="button"
            onClick={onClick}>
            <img
                width="25"
                src={type === 'password' ? imageUrlShow : imageUrlHide}
                alt={title(type)} />
        </button>
    )
}
