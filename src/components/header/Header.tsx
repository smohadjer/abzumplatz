import './header.css';
import { getClub } from './../../utils/utils';

type Props = {
    route: string;
}

export default function Header(props: Props) {
    const club = getClub();

    return (
        <header>
            {
                props.route === 'public' ? (
                    <>
                        <h1>abzumplatz</h1>
                        {/* <h2>Kostenlose Tennisplatzreservierung</h2> */}
                    </>
                ) :  <h1>{club ? club.name : 'abzumplatz'}</h1>
            }
        </header>
    )
  }
