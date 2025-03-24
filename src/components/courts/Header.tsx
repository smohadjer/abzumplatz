export function Header(props: {count: number}) {
    const courts = [];
    for (let i = 0; i < props.count; i++) {
        courts.push(<div className="cell" key={i}>Platz {i+1}</div>);
    }

    return (
        <div className="courts__header">
            {courts}
        </div>
    )
}
