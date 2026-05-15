import { SelectClub } from '../components/selectClub/SelectClub';
import { Club } from '../types';

type Props = {
    clubs: Club[];
}

export default function SelectClubPage(props: Props) {
    return (
        <>
            <h1>Verein Auswählen</h1>
            <p>Bevor Sie mit der App fortfahren können, müssen Sie Ihren Club auswählen:</p>
            <SelectClub clubs={props.clubs} />
            <p>Solltest du deinen Vereinsnamen nicht finden, wende dich an den Vorstand deines Vereins und bitte ihn, den Verein auf abzumplatz.de anzumelden.</p>
        </>
    )
}
