import { Logout } from "../logout/Logout";
import { useSelector } from 'react-redux'
import { RootState } from './../../store';
import './footer.css';

export default function Footer() {
    const auth = useSelector((state: RootState) => state.auth.value);

    return (
        <footer>
            <span>&copy; 2025 Saeid Mohadjer</span>
            <span>
            {auth && <Logout />}
            <a href="mailto:abzumplatz@gmail.com?subject=Feedback von der App">Kontakt</a>
            </span>
        </footer>
    )
}
