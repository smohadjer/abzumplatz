import { NavLink } from "react-router";

import './style.css';

export default function Nav() {
    return (
        <nav>
            <ul>
                <li><NavLink style={
                    ({isActive}) => { return isActive ? { color: "red" } : {} }
                } to="/">Home</NavLink></li>
                {/* remove attribute end if you want that item to display with active sytle
                when any of its children is active */}
                <li><NavLink end to="/about">About</NavLink>
                    <ul>
                        <li><NavLink to="/about/saeid">about subpage (nested route)</NavLink></li>
                        <li><NavLink to="/about/123">about with id</NavLink></li>
                    </ul>
                </li>
                <li><NavLink to="/login">Login</NavLink></li>
                <li><NavLink to="/register">Register</NavLink></li>
            </ul>
        </nav>
    )
}

