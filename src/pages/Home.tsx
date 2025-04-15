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
    const firstName = useSelector((state: RootState) => state.auth.first_name);
    const lastName = useSelector((state: RootState) => state.auth.last_name);
    const clubId = useSelector((state: RootState) => state.auth.club_id);
    const userClub = props.clubs.find(club => club._id === clubId);

    if (!userClub) {
        return;
    }

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
            <>
                <div className="subheader">
                    <p>{firstName} {lastName}</p>
                    <p>{userClub!.name}</p>
                </div>
                <div className="grid">
                    <Courts
                        reservations={reservations}
                        club={userClub}
                        users={users}
                        courts_count={userClub!.courts_count}
                    />
                </div>
            </>
        )
    )
}
