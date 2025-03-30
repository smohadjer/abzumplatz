import { useState, useEffect } from "react";
// import { Link } from 'react-router';
import './home.css';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { User, Club, ReservationItem } from '../types';
import { Courts } from '../components/courts/Courts';

type Props = {
    clubs: Club[];
}

export default function Home(props: Props) {
    const [users, setUsers] = useState<User[]>([]);
    const [reservations, setReservations] = useState<ReservationItem[]>([]);
    const firstName = useSelector((state: RootState) => state.auth.first_name);
    const lastName = useSelector((state: RootState) => state.auth.last_name);
    const clubId = useSelector((state: RootState) => state.auth.club_id);
    const userClub = props.clubs.find(club => club._id === clubId);

    // get all users
    useEffect(() => {
        fetch(`/api/index?club_id=${clubId}`)
        .then(res => res.json())
        .then(json => {
            setUsers(json);
        });
    }, []);

    // get all reservations
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
            <div className="subheader">
                <p>{firstName} {lastName}</p>
                <p>{userClub!.name}</p>
            </div>
            {/* <p><Link to="/contacts">Link to Contacts</Link></p> */}
            <div className="grid">
                {reservations.length ? <Courts
                    club_id={clubId}
                    reservations={reservations}
                    users={users}
                    courts_count={userClub!.courts_count}
                    setReservations={setReservations} />
                    : 'Loading...'
                }
            </div>
        </>
    )
}
