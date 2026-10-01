import { useNavigate } from 'react-router';

type Props = {
    fallback?: string;
};

export default function AdminBackButton({fallback = '/admin'}: Props) {
    const navigate = useNavigate();

    const goBack = () => {
        const historyIndex = Number(window.history.state?.idx);
        if (Number.isFinite(historyIndex) && historyIndex > 0) {
            navigate(-1);
            return;
        }

        navigate(fallback, {replace: true});
    };

    return (
        <button className="admin-back-button icon icon--back" type="button" onClick={goBack}>
            Zurück
        </button>
    );
}
