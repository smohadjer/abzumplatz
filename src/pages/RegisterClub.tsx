import { SignupClub } from '../components/signupClub/SignupClub';
// import { Link } from 'react-router';
import { Club } from '../types';

type Props = {
    clubs: Club[];
}

export default function RegisterClub(props: Props) {
    return (
        <SignupClub />
    )
}
