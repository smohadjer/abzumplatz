import { SignupClub } from '../components/signupClub/SignupClub';

export default function RegisterClub() {
    return (
        <>
            <h2>Verein Registrieren</h2>
            <p>As admin you must register a club before you and your club's members can use the app. You can change all fields later.</p>
            <SignupClub />
        </>
    )
}
