import { useState, useEffect } from "react";
import { Link } from 'react-router';
import './home.css';
import { Logout } from "../components/logout/Logout";
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { User, Club, ReservationItem, NormalizedReservationItem } from '../types';
import { Courts } from '../components/courts/Courts';

type Props = {
    clubs: Club[];
}

export default function Home(props: Props) {
    const [users, setUsers] = useState<User[]>([]);
    const [reservations, setReservations] = useState<ReservationItem[]>([]);
    const firstName = useSelector((state: RootState) => state.auth.first_name);
    const lastName = useSelector((state: RootState) => state.auth.last_name);
    const _id = useSelector((state: RootState) => state.auth._id);
    const clubId = useSelector((state: RootState) => state.auth.club_id);
    const userClub = props.clubs.find(club => club._id === clubId);
    const date = new Date().toISOString().split('T')[0];
    const filteredReservations: NormalizedReservationItem[] = reservations.filter(item => item.date === date);
    const getUserName = (userId: string) => {
        if (users.length > 0) {
            const user = users.find((item: User) => item._id === userId);
            return user ? user.first_name : userId;
        } else {
            return userId;
        }
    };

    filteredReservations.map(item => item.user_name = getUserName(item.user_id))

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
                {reservations.length ? <Courts
                    club_id={clubId}
                    user_id={_id}
                    reservations={filteredReservations}
                    users={users}
                    courts_count={userClub!.courts_count}
                    setReservations={setReservations}
                    date={date} />
                    : 'Loading...'
                }
            </div>
        </>
    )
}
