import { useState, useEffect } from "react";
import { Link } from 'react-router';
import './home.css';
import { Logout } from "../components/logout/Logout";
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface Item {
 _id: string;
 name: string;
}

export default function Home() {
    const [data, setData] = useState([]);
    const [dbData, setDbData] = useState([]);
    const auth = useSelector((state: RootState) => state.auth.value);

    useEffect(() => {

    }, []);

    useEffect(() => {
        fetch('/api/json-server')
        .then(res => res.json())
        .then(json => {
            setData(json);
        });

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
                data.map((item: Item) => <li key={item._id}>{item._id} {item.name}</li>)
            }
            </ul>
        )
    }

    return (
        <>
            <p>Login state: {JSON.stringify(auth)}</p>
            <Logout />
            <h1>Boilerplate for building SPAs with React and Vercel's serverless</h1>
            <p><Link to="/contacts">Link to Contacts</Link></p>
            <div className="flex">
                <div>
                    <h2>Fruits from static JSON file</h2>
                    {data.length ? getList(data) : 'Loading...'}
                </div>
                <div>
                    <h2>Fruits from MongoDB database</h2>
                    {dbData.length ? getList(dbData) : 'Loading...'}
                </div>
            </div>
        </>
    )
}
