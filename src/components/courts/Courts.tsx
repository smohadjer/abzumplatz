import './courts.css';
import { Rows } from './Rows';
import { Header } from './Header';
import { ReservationItem, User } from '../../types';

type Props = {
    reservations: ReservationItem[];
    users: User[];
    courts_count: number;
    club_id: string;
    user_id: string;
    setReservations: Function;
    date: string;
}

const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export function Courts(props: Props) {
    const { club_id, user_id } = props;
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

    function clickHandler (event: React.MouseEvent) {
        if (event.target instanceof HTMLElement) {
            if (event.target.classList.contains('reserved')) {
                console.log('no click allowed');
                return;
            }

            const start = Number(event.target.dataset.hour);
            const end = start + 1;
            const data = {
                club_id,
                user_id,
                court_num: event.target.dataset.courtnumber,
                start_time: start,
                end_time: end,
                date: props.date
            }
            console.log(data);
            fetch('/api/reservations', {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then((response) => response.json())
            .then(json => {
                console.log(json);
                if (json.error) {
                    console.error(json.error)
                } else {
                    console.log('Server received valid data');
                    if (json.data) {
                        console.log(json.data);
                        props.setReservations(json.data)
                    }
                }
            });
        }
    }

    return (
        <>
          <div className="reservations">
            <div className="header">{props.date}</div>
            <div className="main">
                <div className="hours">
                    {hours.map(hour => <div className="hour" key={hour}>{hour < 10 ? '0' + hour : hour}:00</div> )}
                </div>
                <div className="slots">
                    <Header count={props.courts_count} />
                    {hours.map(hour =>
                        <Rows
                            reservations={props.reservations}
                            onClick={clickHandler}
                            key={hour}
                            hour={hour}
                            count={props.courts_count}
                        />
                    )}
                </div>
            </div>
          </div>
          {getReservations(props.reservations)}
        </>
    )
}
