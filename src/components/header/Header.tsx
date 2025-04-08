// import Nav from '../nav/Nav';
import { Logout } from "../logout/Logout";
import { useSelector } from 'react-redux'
import { RootState } from './../../store';
import './header.css';

export default function Header() {
    const auth = useSelector((state: RootState) => state.auth.value);

    return (
        <header className="header">
            <div className="flex">
                <h1>Ab<span>Zum</span>Platz</h1>
                {auth && <Logout />}
            </div>
            {/* <Nav /> */}
        </header>
    )
  }
