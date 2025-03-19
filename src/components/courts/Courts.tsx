import './courts.css';

type ReservationItem = {
    _id: string;
    club_id: string;
    user_id: string;
    date: string;
    court_num: number;
    start_time: number;
    end_time: number;
}

type User = {
    _id: string;
    first_name: string;
    last_name: string;
}

type Props = {
    reservations: ReservationItem[];
    users: User[];
    courts_count: number;
}

export function Courts(props: Props) {
    const getUserName = (userId: string) => {
        if (props.users.length > 0) {
            const user = props.users.find((item: User) => item._id === userId);
            return user ? user.first_name : userId;
        } else {
            return userId;
        }
    };

    const getReservations = (data: ReservationItem[]) => {
        return (
            <ul className="items">
            {
                data.map((item: ReservationItem) => <li key={item._id}>
                    Court {item.court_num} is reserved by {getUserName(item.user_id)} at {item.start_time} on {item.date}.</li>)
            }
            </ul>
        )
    };

    const hours = [8, 9, 10, 11];

    return (
        <>
          <CourtsHeader count={props.courts_count} />
          <div className="table">
            {hours.map(hour => <Rows hour={hour} count={props.courts_count}/> )}
          </div>
          {getReservations(props.reservations)}
        </>
    )
}

function Rows(props: {count: number; hour: number}) {
    const courts = [];
    for (let i = 0; i < props.count; i++) {
        courts.push(<div className="cell" key={i}></div>);
    }

    return (
        <div className="courts__row">
            <span>{props.hour} am </span>
            {courts}
        </div>
    );
}

function CourtsHeader(props: {count: number}) {
    const courts = [];
    for (let i = 0; i < props.count; i++) {
        courts.push(<div className="cell" key={i}>{i+1}</div>);
    }

    return (
        <div className="courts__header">
            {courts}
        </div>
    )
}
