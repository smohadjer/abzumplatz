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
                ? 'Sie können Ihren Verein wechseln, solange Sie in Ihrem aktuellen Verein keine aktiven Reservierungen mehr haben.'
                : 'Bevor Sie mit der App fortfahren können, müssen Sie Ihren Club auswählen:'}
            </p>
            <SelectClub clubs={props.clubs} />
            <p>Solltest du deinen Vereinsnamen nicht finden, wende dich an den Vorstand deines Vereins und bitte ihn, den Verein auf abzumplatz.de anzumelden.</p>
        </>
    )
}
