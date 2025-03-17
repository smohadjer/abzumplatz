import { FormEvent, useState, useEffect } from "react";
import { Link } from 'react-router';
import './home.css';
import { Logout } from "../components/logout/Logout";
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Club } from '../types';

type User = {
 _id: string;
 first_name: string;
 last_name: string;
}

type ReservationItem = {
    _id: string;
    club_id: string;
    user_id: string;
    date: string;
    court_num: number;
    start_time: number;
    end_time: number;
}

type Props = {
    clubs: Club[];
}

export default function Home(props: Props) {
    const [users, setUsers] = useState<User[]>([]);
    const [reservations, setReservations] = useState([]);
    const firstName = useSelector((state: RootState) => state.auth.first_name);
    const lastName = useSelector((state: RootState) => state.auth.last_name);
    const _id = useSelector((state: RootState) => state.auth._id);
    const clubId = useSelector((state: RootState) => state.auth.club_id);
    const userClub = props.clubs.find(club => club._id === clubId);

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

    // const getList = (data: User[]) => {
    //     return (
    //         <ul className="items">
    //         {
    //             data.map((item: User) => <li key={item._id}>
    //                 {item.first_name}
    //                 {' '}
    //                 {item.last_name}
    //             </li>)
    //         }
    //         </ul>
    //     )
    // };

    const getUserName = (userId: string) => {
        if (users.length > 0) {
            const user = users.find((item: User) => item._id === userId);
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

    function submitHandler(e: FormEvent) {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const data = new FormData(form);
        const json = JSON.stringify(Object.fromEntries(data));

        // submit form data as json to server
        fetch(form.action, {
            method: form.method,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: json
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
                }
            }
        });
    }

    return (
        <>
            <p>User: {firstName} {lastName}</p>
            <p>Club: {userClub ? userClub.name : null}</p>
            <Logout />
            <h1>Boilerplate for building SPAs with React and Vercel's serverless</h1>
            <p><Link to="/contacts">Link to Contacts</Link></p>
            <div className="flex">
                <div>
                    <h2>Reservations</h2>
                    {reservations.length ? getReservations(reservations) : 'Loading...'}
                </div>
            </div>
            <div>
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
                            <option>Select court number</option>
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
                    <button type="submit">Reserve Court</button>
                </form>
            </div>
        </>
    )
}
