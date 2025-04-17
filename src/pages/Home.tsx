import { useState, useEffect } from "react";
import './home.css';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { User, Club, ReservationItem } from '../types';
import { Courts } from '../components/courts/Courts';
import { Loader } from '../components/loader/Loader';

type Props = {
    clubs: Club[];
}

export default function Home(props: Props) {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [reservations, setReservations] = useState<ReservationItem[]>([]);
    const clubId = useSelector((state: RootState) => state.auth.club._id);

    // get users and reservations
    useEffect(() => {
        const usersRequest = fetch(`/api/index?club_id=${clubId}`)
            .then(res => res.json());
        const reservationsRequest = fetch(`/api/reservations?club_id=${clubId}`)
            .then(res => res.json());

        Promise.all([usersRequest, reservationsRequest])
        .then(([usersJson, reservationsJson]) => {
            setUsers(usersJson);
            setReservations(reservationsJson);
            setLoading(false);
        }).catch(error => {
            console.error(error);
        });
    }, []);

    return (
        loading ? (
            <div className="splash">
                <Loader size="big" text="Reservierungen werden geladen" />
            </div>
        ) : (
            <div className="grid">
                <Courts reservations={reservations} users={users} />
            </div>
        )
    )
}
