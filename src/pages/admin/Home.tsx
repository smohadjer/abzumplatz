import { Link } from "react-router";

export default function AdminHomePage() {
    return (
        <>
            <h2>Admin</h2>
            <ul>
                <li><Link to="/admin/members">Mitgliederliste</Link></li>
                <li><Link to="/admin/club">Verein editieren</Link></li>
                <li><Link to="/admin/courts">Plätze verwalten</Link></li>
            </ul>
        </>
    )
}
