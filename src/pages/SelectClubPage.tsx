import { SelectClub } from '../components/selectClub/SelectClub';
import { Club } from '../types';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Link } from 'react-router';
import { getClub } from '../utils/utils';

type Props = {
    clubs: Club[];
}

export default function SelectClubPage(props: Props) {
    const auth = useSelector((state: RootState) => state.auth);
    const isChangingClub = Boolean(auth.club_id);
    const club = getClub();

    return (
        <>
            <p><Link className="icon icon--back" to="/profile">Zurück</Link></p>
            <h1>{isChangingClub ? 'Verein wechseln' : 'Verein auswählen'}</h1>
            {isChangingClub ? <p>Aktueller Verein: <strong>{club?.name ?? '-'}</strong></p> : null}
            <p>{isChangingClub
                ? 'Wenn Sie Ihren Verein wechseln oder verlassen, werden alle aktiven Reservierungen in Ihrem aktuellen Verein gelöscht.'
                : 'Bevor Sie mit der App fortfahren können, müssen Sie Ihren Club auswählen:'}
            </p>
            <SelectClub clubs={props.clubs} />
        </>
    )
}
