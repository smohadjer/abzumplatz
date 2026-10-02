import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

type Props = {
    fallback?: string;
    fallbackLabel?: string;
};

export default function BackButton({fallback = '/', fallbackLabel = 'Zur Startseite'}: Props) {
    const navigate = useNavigate();
    const [hasHistory, setHasHistory] = useState(false);

    useEffect(() => {
        setHasHistory(window.history.length > 1);
    }, []);

    const goBack = () => {
        if (hasHistory) {
            window.history.back();
            return;
        }

        navigate(fallback, {replace: true});
    };

    return (
        <button className="back-button icon icon--back" type="button" onClick={goBack}>
            {hasHistory ? 'Zurück' : fallbackLabel}
        </button>
    );
}
