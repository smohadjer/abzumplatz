import { useState, useEffect } from "react";
import { Link } from 'react-router';
import './home.css';
import { Logout } from "../components/logout/Logout";
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Club } from '../types';

interface Item {
 _id: string;
 first_name: string;
 last_name: string;
}

type Props = {
    clubs: Club[];
}

export default function Home(props: Props) {
    const [dbData, setDbData] = useState([]);
    const firstName = useSelector((state: RootState) => state.auth.first_name);
    const lastName = useSelector((state: RootState) => state.auth.last_name);
    const clubId = useSelector((state: RootState) => state.auth.club_id);

    const userClub = props.clubs.find(club => club._id === clubId);

    useEffect(() => {
        fetch('/api/index')
        .then(res => res.json())
        .then(json => {
            setDbData(json);
        });
    }, []);

    const getList = (data:Item[]) => {
        return (
            <ul className="items">
            {
                data.map((item: Item) => <li key={item._id}>
                    {item.first_name}
                    {' '}
                    {item.last_name}
                </li>)
            }
            </ul>
        )
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
                    <h2>Players</h2>
                    {dbData.length ? getList(dbData) : 'Loading...'}
                </div>
            </div>
        </>
    )
}
