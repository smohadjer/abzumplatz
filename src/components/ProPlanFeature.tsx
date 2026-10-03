import { ReactNode } from 'react';
import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import AdminBackButton from './AdminBackButton';

type Props = {
    children: ReactNode;
    description?: string;
};

export default function ProPlanFeature({children, description = 'Turniere erstellen und Konkurrenzen verwalten ist nur im Pro-Plan verfügbar.'}: Props) {
    const user = useSelector((state: RootState) => state.auth);
    const club = useSelector((state: RootState) =>
        state.clubs.value.find(item => item._id === user.club_id)
    );

    if (club?.access_plan_type === 'pro') return children;

    return (
        <>
            <p><AdminBackButton /></p>
            <h1>Pro-Funktion</h1>
            <p>{description}</p>
            <p><Link className="button-link" to="/admin/club">Zum Pro-Plan wechseln</Link></p>
        </>
    );
}
