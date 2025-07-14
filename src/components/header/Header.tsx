import './header.css';
import { getClub } from './../../utils/utils';

type Props = {
    route: string;
}

export default function Header(props: Props) {
    const club = getClub();
    const privateHeader = club ? <h1>{club.name}</h1> : '';

    return (
        <header>
            {props.route === 'public' ? (
                <>
                    <h1>abzumplatz</h1>
                    <h2>Kostenlose Tennisplatzreservierung</h2>
                </>
            )
            : privateHeader }
        </header>
    )
  }
