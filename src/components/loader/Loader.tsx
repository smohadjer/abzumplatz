import './loader.css';


export function Loader({ size }: {size?: string}) {
    return <span className={`loader ${size}`}></span>
}
