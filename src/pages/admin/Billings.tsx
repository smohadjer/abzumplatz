import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Loader } from "../../components/loader/Loader";
import { BillingPeriod } from "../../types";
import { getCoveredUntilFromPeriodEnd, getPlanName } from "../../planConfig";

function parseLocalDate(dateString: string) {
    return new Date(`${dateString}T12:00:00`);
}

export default function AdminBillingsPage() {
    const [loading, setLoading] = useState(false);
    const [billings, setBillings] = useState<BillingPeriod[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/billing');
                const data = await response.json();

                if (!response.ok || data.error) {
                    throw new Error(data.error ?? 'Abrechnungszeiträume konnten nicht geladen werden.');
                }

                setBillings(data);
            } catch (fetchError) {
                console.error(fetchError);
                setError(fetchError instanceof Error ? fetchError.message : 'Abrechnungszeiträume konnten nicht geladen werden.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        loading ? (
            <div className="splash">
                <Loader size="big" text="Abrechnungszeiträume werden geladen..." />
            </div>
        ) : (
            <>
                <p><Link className="icon icon--back" to="/admin">Zurück</Link></p>
                <h1>Abrechnungen</h1>
                {error ? <p>{error}</p> : null}
                {!error && !billings.length ? (
                    <p>Keine Abrechnungszeiträume vorhanden.</p>
                ) : null}
                {!error && billings.length ? (
                    <table className="profile-table billings-table">
                        <thead>
                            <tr>
                                <th>Plan</th>
                                <th className="billings-table__period">Zeitraum</th>
                                <th>Status</th>
                                <th className="billings-table__date">Erstellt am</th>
                            </tr>
                        </thead>
                        <tbody>
                            {billings.map(period => {
                                const coveredUntil = getCoveredUntilFromPeriodEnd(period.period_end) ?? period.period_end;

                                return (
                                    <tr key={period._id ?? `${period.period_start}-${period.period_end}`}>
                                        <td>{getPlanName(period.plan_type)}</td>
                                        <td className="billings-table__period">
                                            {parseLocalDate(period.period_start).toLocaleDateString('de-DE')}
                                            {' - '}
                                            {parseLocalDate(coveredUntil).toLocaleDateString('de-DE')}
                                        </td>
                                        <td>{period.status}</td>
                                        <td className="billings-table__date">{new Date(period.created_at).toLocaleDateString('de-DE')}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : null}
            </>
        )
    );
}
