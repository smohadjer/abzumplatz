import { /*FormEvent,*/ useState, useEffect } from "react";
import { Link } from 'react-router';
import './home.css';
import { Logout } from "../components/logout/Logout";
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Club, ReservationItem } from '../types';
import { Courts } from '../components/courts/Courts';

type User = {
 _id: string;
 first_name: string;
 last_name: string;
}

type Props = {
    clubs: Club[];
}

export default function Home(props: Props) {
    //const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [reservations, setReservations] = useState<ReservationItem[]>([]);
    const firstName = useSelector((state: RootState) => state.auth.first_name);
    const lastName = useSelector((state: RootState) => state.auth.last_name);
    const _id = useSelector((state: RootState) => state.auth._id);
    const clubId = useSelector((state: RootState) => state.auth.club_id);
    const userClub = props.clubs.find(club => club._id === clubId);
    const date = new Date().toISOString().split('T')[0];
    const filteredReservations = reservations.filter(item => item.date === date)

    useEffect(() => {
        fetch(`/api/index?club_id=${clubId}`)
        .then(res => res.json())
        .then(json => {
            setUsers(json);
        });
    }, []);

    useEffect(() => {
        fetch(`/api/reservations?club_id=${clubId}`)
        .then(res => res.json())
        .then(json => {
            setReservations(json);
        });
    }, []);

    // function submitHandler(e: FormEvent) {
    //     e.preventDefault();
    //     setLoading(true);
    //     const form = e.target as HTMLFormElement;
    //     const data = new FormData(form);
    //     const json = JSON.stringify(Object.fromEntries(data));

    //     // submit form data as json to server
    //     fetch(form.action, {
    //         method: form.method,
    //         headers: {
    //           'Accept': 'application/json',
    //           'Content-Type': 'application/json'
    //         },
    //         body: json
    //     })
    //     .then((response) => response.json())
    //     .then(json => {
    //         console.log(json);
    //         if (json.error) {
    //             console.error(json.error)
    //         } else {
    //             console.log('Server received valid data');
    //             if (json.data) {
    //                 console.log(json.data);
    //                 setReservations(json.data);
    //                 setLoading(false);
    //             }
    //         }
    //     });
    // }

    return (
        <>
            <p>{firstName} {lastName}, {userClub!.name}</p>
            <Logout />
            <p><Link to="/contacts">Link to Contacts</Link></p>

                <div className="grid">
                    <h2>Reservations</h2>
                    {reservations.length ?
                        <Courts
                            club_id={clubId}
                            user_id={_id}
                            reservations={filteredReservations}
                            users={users}
                            courts_count={userClub!.courts_count}
                            setReservations={setReservations}
                            date={date}
                        />
                        : 'Loading...'}
                </div>
            {/* <div>
                <h2>Make reservation</h2>
                <form
                    noValidate={true}
                    className="form-react"
                    method="POST"
                    action="/api/reservations"
                    onSubmit={submitHandler}>
                    <fieldset>
                        <input type="hidden" name="club_id" value={clubId} />
                        <input type="hidden" name="user_id" value={_id} />
                        <select name="court_num">
                            <option>Select court</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </select>
                        <input type="date" name="date" />
                        <select name="start_time">
                            <option>Start time</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                            <option value="10">10</option>
                        </select>
                        <select name="end_time">
                            <option>End time</option>
                            <option value="9">9</option>
                            <option value="10">10</option>
                            <option value="11">11</option>
                        </select>
                    </fieldset>
                    <button disabled={loading}
                        type="submit">Reserve Court</button>
                </form>
            </div>*/}
        </>
    )
}
