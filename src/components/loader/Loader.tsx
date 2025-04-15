import './loader.css';

type Props = {
    size?: string;
    text?: string;
}

export function Loader(props: Props) {
    return <span
        className={`loader ${props.size} ${props.text ? 'has-text' : ''}`}>{props.text}</span>
}
