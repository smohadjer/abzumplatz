import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Loader } from "../../components/loader/Loader";
import { BillingPeriod } from "../../types";
import { getCoveredUntilFromPeriodEnd, getPlanName } from "../../planConfig";

function parseLocalDate(dateString: string) {
    return new Date(`${dateString}T12:00:00`);
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
    }).format(value);
}

export default function AdminBillingsPage() {
    const [loading, setLoading] = useState(false);
    const [billings, setBillings] = useState<BillingPeriod[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [invoiceError, setInvoiceError] = useState<string | null>(null);
    const [invoiceMessage, setInvoiceMessage] = useState<string | null>(null);
    const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setLoadError(null);

            try {
                const response = await fetch('/api/billing');
                const data = await response.json();

                if (!response.ok || data.error) {
                    throw new Error(data.error ?? 'Abrechnungszeiträume konnten nicht geladen werden.');
                }

                setBillings(data);
            } catch (fetchError) {
                console.error(fetchError);
                setLoadError(fetchError instanceof Error ? fetchError.message : 'Abrechnungszeiträume konnten nicht geladen werden.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    async function sendInvoice(period: BillingPeriod) {
        if (!period._id) {
            setInvoiceError('Die Rechnung kann für diesen Abrechnungszeitraum nicht erneut versendet werden.');
            return;
        }

        setSendingInvoiceId(period._id);
        setInvoiceMessage(null);
        setInvoiceError(null);

        try {
            const response = await fetch('/api/billing', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'send_invoice',
                    billing_period_id: period._id,
                })
            });
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error ?? 'Die Rechnung konnte nicht versendet werden.');
            }

            setInvoiceMessage(`Die Rechnung für den Zeitraum ab ${parseLocalDate(period.period_start).toLocaleDateString('de-DE')} wurde erneut versendet.`);
        } catch (sendError) {
            console.error(sendError);
            setInvoiceError(sendError instanceof Error ? sendError.message : 'Die Rechnung konnte nicht versendet werden.');
        } finally {
            setSendingInvoiceId(null);
        }
    }

    return (
        loading ? (
            <div className="splash">
                <Loader size="big" text="Abrechnungszeiträume werden geladen..." />
            </div>
        ) : (
            <>
                <p><Link className="icon icon--back" to="/admin">Zurück</Link></p>
                <h1>Abrechnungen</h1>
                {loadError ? <p>{loadError}</p> : null}
                {invoiceError ? <p>{invoiceError}</p> : null}
                {invoiceMessage ? <p>{invoiceMessage}</p> : null}
                {!loadError && !billings.length ? (
                    <p>Keine Abrechnungszeiträume vorhanden.</p>
                ) : null}
                {!loadError && billings.length ? (
                    <table className="profile-table billings-table">
                        <thead>
                            <tr>
                                <th>Plan</th>
                                <th>Preis</th>
                                <th className="billings-table__period">Zeitraum</th>
                                <th>Status</th>
                                <th className="billings-table__date">Erstellt am</th>
                                <th>Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {billings.map(period => {
                                const coveredUntil = getCoveredUntilFromPeriodEnd(period.period_end) ?? period.period_end;

                                return (
                                    <tr key={period._id ?? `${period.period_start}-${period.period_end}`}>
                                        <td>{getPlanName(period.plan_type)}</td>
                                        <td>{formatCurrency(period.price)}</td>
                                        <td className="billings-table__period">
                                            {parseLocalDate(period.period_start).toLocaleDateString('de-DE')}
                                            {' - '}
                                            {parseLocalDate(coveredUntil).toLocaleDateString('de-DE')}
                                        </td>
                                        <td>{period.status}</td>
                                        <td className="billings-table__date">{new Date(period.created_at).toLocaleDateString('de-DE')}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="button-link button-link--secondary"
                                                disabled={!period._id || sendingInvoiceId === period._id}
                                                onClick={() => sendInvoice(period)}
                                            >
                                                {sendingInvoiceId === period._id ? 'Wird gesendet...' : 'Rechnung senden'}
                                            </button>
                                        </td>
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
