import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './../../store';
import { fetchClub } from '../../utils/utils';
import { Loader } from '../../components/loader/Loader';
import { SignupClub } from '../../components/signupClub/SignupClub';
import AdminBackButton from '../../components/AdminBackButton';
import { useLocation, useNavigate } from 'react-router';
import { Club } from '../../types';

type Response = {
    message: string;
    data: {
        club_id: string;
        clubs: Club[];
        invoice_email_error?: string;
        cancellation?: {
            effective: 'immediate' | 'period_end';
            refund_eligible: boolean;
            refund_amount: number;
        };
    }
}

export default function AdminClubPage() {
    const [loading, setLoading] = useState(false);
    const user = useSelector((state: RootState) => state.auth);
    const clubData = useSelector((state: RootState) => state.club);
    const club_id = user.club_id;
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const openedFromAdminChecklist = Boolean((location.state as {fromAdminChecklist?: boolean} | null)?.fromAdminChecklist);
    const registeredAtLabel = clubData.value.timestamp
        ? new Date(clubData.value.timestamp).toLocaleDateString('de-DE')
        : '-';

    const callback = async (response: Response) => {
        if (response.data) {
            dispatch({
                type: 'clubs/fetch',
                payload: {
                    value: response.data.clubs
                }
            });

            const updatedClub = response.data.clubs.find(item => item._id === club_id);

            dispatch({
                type: 'club/fetch',
                payload: {
                    value: updatedClub,
                    loaded: true,
                }
            });

            if (response.data.cancellation) {
                const cancellation = response.data.cancellation;
                if (cancellation.refund_eligible) {
                    alert(`Der Pro-Plan wurde sofort beendet. Die Erstattung von ${cancellation.refund_amount} € wurde zur manuellen Bearbeitung vorgemerkt.`);
                } else {
                    alert('Der Pro-Plan endet mit dem laufenden Abrechnungsjahr. Für den verbleibenden Zeitraum erfolgt keine anteilige Erstattung.');
                }
            }

            if (response.data.invoice_email_error) {
                alert('Der Pro-Abrechnungszeitraum wurde angelegt, aber die Rechnungs-E-Mail konnte nicht gesendet werden. Sie können die Rechnung unter Abrechnungen erneut senden.');
            }

            navigate(openedFromAdminChecklist ? '/admin/checklist' : '/admin');
        }
    }

    useEffect(() => {
        if (!clubData.loaded || clubData.value._id !== club_id) {
            (async () => {
                setLoading(true);
                await fetchClub(club_id, dispatch);
                setLoading(false);
            })();
        }
    }, [club_id, clubData.loaded, clubData.value._id, dispatch]);

    return (
        loading || !clubData.loaded ? (
            <div className="splash">
                <Loader size="big" text="Daten werden geladen..." />
            </div>
        ) : (
            <>
                <p><AdminBackButton /></p>
                <h1>Vereinseinstellungen</h1>
                <p>Verein registriert am: {registeredAtLabel}</p>
                <SignupClub
                    callback={callback}
                    data={clubData.value} />
            </>
        )
    )
}
