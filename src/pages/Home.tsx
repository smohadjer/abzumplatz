import { useState, useEffect } from "react";
import './home.css';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { User, Club } from '../types';
import { Courts } from '../components/courts/Courts';
import { Loader } from '../components/loader/Loader';

type Props = {
    clubs: Club[];
}

export default function Home(props: Props) {
    const [users, setUsers] = useState<User[]>([]);
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

    return (
        userClub &&
        <>
            <div className="subheader">
                <p>{firstName} {lastName}</p>
                <p>{userClub!.name}</p>
            </div>
            <div className="grid">
                {users.length ? <Courts
                    club={userClub}
                    users={users}
                    courts_count={userClub!.courts_count} />
                    : <div>
                        <Loader /> Fetching data...
                    </div>
                }
            </div>
        </>
    )
}
