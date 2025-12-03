import { Court } from './../../types';

type Props = {
    courts: Court[]
}

export function Header(props: Props) {
    const courts = [];
    for (let i = 0; i < props.courts.length; i++) {
        courts.push(<div className={props.courts[i].status === 'inactive' ? 'cell disabled' : 'cell'} key={i}>Platz {i+1}</div>);
    }
    return (
        <div className="courts__header">
            {courts}
        </div>
    )
}
