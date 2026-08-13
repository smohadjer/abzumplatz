import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { fetchClub } from "../../utils/utils";
import { Loader } from "../../components/loader/Loader";
import "../settings.css";

export default function AdminHomePage() {
    const [loadingClub, setLoadingClub] = useState(false);
    const user = useSelector((state: RootState) => state.auth);
    const clubData = useSelector((state: RootState) => state.club);
    const dispatch = useDispatch();
    const club = clubData.value;
    const registeredAtLabel = club.timestamp
        ? new Date(club.timestamp).toLocaleDateString('de-DE')
        : '-';

    useEffect(() => {
        if (!clubData.loaded || clubData.value._id !== user.club_id) {
            (async () => {
                setLoadingClub(true);
                await fetchClub(user.club_id, dispatch);
                setLoadingClub(false);
            })();
        }
    }, [clubData.loaded, clubData.value._id, dispatch, user.club_id]);

    return (
        <>
            <h1>Admin</h1>
            <ul className="settings-links">
                <li><Link to="/admin/members">Mitglieder verwalten</Link></li>
                <li><Link to="/admin/club">Verein editieren</Link></li>
                <li><Link to="/admin/courts">Plätze verwalten</Link></li>
                <li><Link to="/admin/rules">Regeln verwalten</Link></li>
                <li><Link to="/admin/billings">Abrechnungen</Link></li>
                <li>
                    <span>
                        {loadingClub || !clubData.loaded
                            ? <Loader size="small" text="Vereinsdaten werden geladen..." />
                            : `Verein registriert am: ${registeredAtLabel}`}
                    </span>
                </li>
            </ul>
        </>
    )
}
