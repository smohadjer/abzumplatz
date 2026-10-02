import { FormEvent, useState } from 'react';
import './contactForm.css';

export default function ContactForm() {
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState('');
    const [hasError, setHasError] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);
        setStatus('');
        setHasError(false);

        const form = event.currentTarget;
        const formData = new FormData(form);

        try {
            const response = await fetch('/api/auth?action=contact', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(Object.fromEntries(formData)),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error ?? 'Die Nachricht konnte nicht gesendet werden.');
            }

            setStatus(result.message);
            form.reset();
        } catch (error) {
            setHasError(true);
            setStatus(error instanceof Error ? error.message : 'Die Nachricht konnte nicht gesendet werden.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form className="contact-form" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="contact-name">Name</label>
                <input id="contact-name" name="name" autoComplete="name" minLength={2} maxLength={100} required />
            </div>
            <div>
                <label htmlFor="contact-email">E-Mail</label>
                <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required />
            </div>
            <div>
                <label htmlFor="contact-message">Nachricht</label>
                <textarea id="contact-message" name="message" rows={6} minLength={10} maxLength={5000} required />
            </div>
            <div className="contact-form-honeypot" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <button className="primary-action-button" type="submit" disabled={submitting}>
                {submitting ? 'Wird gesendet...' : 'Nachricht senden'}
            </button>
            {status ? <p className={hasError ? 'contact-form-status contact-form-status--error' : 'contact-form-status'} role="status">{status}</p> : null}
        </form>
    );
}
