import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { RootState } from '../store';
import {
    getClub,
    getUserReservations,
    fetchAppData,
    fetchUsers,
    fetchReservations,
} from '../utils/utils';
import { getInactiveUserMessage } from '../messages';
import { ReservationItem, NormalizedReservationItem, StateUser } from '../types';
import { Rows } from '../components/courts/Rows';
import { Header } from '../components/courts/Header';
import { Popup } from '../components/courts/Popup';
import { Calendar } from '../components/courts/Calendar';
import { Loader } from '../components/loader/Loader';
import AdminBackButton from '../components/AdminBackButton';

import './reservations.css';
import { getIsoDateString, getZonedDateTime, isReservationTimeInPast, reservationIsOnSameDay } from '../utils/reservationTime';

type Slot = {
    date: string;
    reservation_date?: string;
    hour: number;
    court_number: string;
    court_nums?: string[];
    club_id?: string;
    reservation_id?: string;
    end_time?: number;
    recurring?: boolean;
    user_name?: string;
    user_id?: string;
    label?: string;
    deleted_dates?: string[];
    end_date?: string;
    timestamp?: string;
}

export default function Reservations() {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showAdminWelcome, setShowAdminWelcome] = useState(() => (
        Boolean((location.state as {showAdminWelcome?: boolean} | null)?.showAdminWelcome)
        || searchParams.get('welcome') === '1'
    ));
    const welcomeDialogRef = useRef<HTMLElement>(null);
    const openedFromAdminChecklist = Boolean(
        (location.state as {fromAdminChecklist?: boolean} | null)?.fromAdminChecklist
    );
    const [loading, setLoading] = useState(false);
    const usersData = useSelector((state: RootState) => state.users);
    const reservationsData = useSelector((state: RootState) => state.reservations);
    const [disabled, setDisabled] = useState(false);
    const [popupType, setPopupType] = useState('');
    const [slot, setSlot] = useState<Slot | null>(null);
    const user = useSelector((state: RootState) => state.auth);
    const club = getClub();
    const users = usersData.value;
    const reservations = reservationsData.value;
    const adminName = usersData.loaded && usersData.clubId === user.club_id
        ? (() => {
            const adminUser = users.find(member => member.role === 'admin');
            return adminUser ? `${adminUser.first_name} ${adminUser.last_name}`.trim() : '';
        })()
        : '';

    if (club === undefined) {
        return (
            <>
                <p>Verein nicht gefunden!</p>
            </>
        )
    }

    const clubHours = Array.from({
        length: club.end_hour - club.start_hour
    }, (_, i) => i + club.start_hour);
    const [reservationDate, setReservationDate] = useState(() => {
        const requestedDate = searchParams.get('date');
        const initialDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
            ? requestedDate
            : getZonedDateTime(new Date(), club.timezone).date;
        const parsedDate = new Date(`${initialDate}T12:00:00`);

        return Number.isNaN(parsedDate.getTime())
            ? new Date(`${getZonedDateTime(new Date(), club.timezone).date}T12:00:00`)
            : parsedDate;
    });
    const isoDate = getIsoDateString(reservationDate);
    const reservationFilter = (reservationItem: ReservationItem) => {
        return reservationIsOnSameDay(reservationItem, isoDate);
    };
    const getUserName = (userId: string) => {
        if (users.length > 0) {
            const user = users.find((item: StateUser) => item._id === userId);
            return user ? `${user.first_name} ${user.last_name}` : `${userId} (Ehemaliges Mitglied)`;
        } else {
            console.warn('no user found', users)
            return `${userId} (Ehemaliges Mitglied)`;
        }
    };
    const filteredReservations: ReservationItem[] = reservations.filter(reservationFilter);
    const normalizedReservations: NormalizedReservationItem[] = filteredReservations.map(item => ({...item, user_name: getUserName(item.user_id)}));
    const userReservations = getUserReservations();
    const closePopup = () => {
        setDisabled(false);
        setSlot(null);
    };
    const parseDatasetArray = (value: string | undefined) => value ? JSON.parse(value) : undefined;
    const getReservationSlot = (slot: HTMLElement): Slot => ({
        court_number: slot.dataset.court_number!,
        date: slot.dataset.date!,
        reservation_date: slot.dataset.reservation_date,
        hour: Number(slot.dataset.hour),
        court_nums: parseDatasetArray(slot.dataset.court_nums),
        club_id: slot.dataset.club_id,
        reservation_id: slot.dataset.reservation_id,
        end_time: slot.dataset.end_time ? Number(slot.dataset.end_time) : undefined,
        recurring: slot.dataset.recurring === 'true',
        user_name: slot.dataset.user_name,
        user_id: slot.dataset.user_id,
        label: slot.dataset.label,
        deleted_dates: parseDatasetArray(slot.dataset.deleted_dates),
        end_date: slot.dataset.end_date,
        timestamp: slot.dataset.timestamp
    });
    const clickHandler = (event: React.MouseEvent) => {
        if (disabled) {
            return;
        }

        if (event.target instanceof HTMLElement) {
            const slot = event.target.closest<HTMLElement>('.cell');

            if (!slot) {
                return;
            }

            if (slot.classList.contains('disabled')) {
                alert('Reservierungen für diesen Platz wurden von der Verwaltung Ihres Vereins deaktiviert.');
                return;
            }

            const reservedByOthers = slot.classList.contains('reserved') && !slot.classList.contains('my-reservation');

            if (reservedByOthers && user.role !== 'admin') {
                setPopupType('reservationDetails');
                setSlot(getReservationSlot(slot));
                return;
            }

            // slots in the past should not be clickable unless user is admin
            if (user.role !== 'admin' && slot.classList.contains('past')) {
                return;
            }

            // users can delete their own reservations
            // admins can delete other users' reservations for their club,
            // subject to backend restrictions such as past one-time bookings
            if (slot.classList.contains('my-reservation') ||
                (reservedByOthers && user.role === 'admin')) {
                setPopupType('deleteReservation');
                setSlot(getReservationSlot(slot));
                return;
            }

            if (user.role !== 'admin' && user.status === 'inactive') {
                alert(getInactiveUserMessage(adminName));
                return;
            }

            // if user is not admin and has reached max allowed reservations alert and return
            const limit = club?.reservations_limit;
            if (user.role !== 'admin' && limit != null && userReservations.length >= limit) {
                alert(`Sie haben die maximal zulässige Anzahl an Reservierungen (${limit}) erreicht!`);
                return;
            }

            // if user is trying to make a reservation in the past alert and return
            if (isReservationTimeInPast(isoDate, Number(slot.dataset.hour), club.timezone)) {
                alert('Eine Reservierung in der Vergangenheit ist nicht möglich!');
                return;
            }

            setPopupType('makeReservation');
            setSlot({
                court_number: slot.dataset.court_number!,
                date: slot.dataset.date!,
                hour: Number(slot.dataset.hour)
            });
        }
    };

    // get users and reservations
    useEffect(() => {
        if (!usersData.loaded && !reservationsData.loaded) {
            (async () => {
                setLoading(true);
                await fetchAppData(user.club_id, dispatch);
                setLoading(false);
            })();
        } else if (!usersData.loaded) {
            (async () => {
                setLoading(true);
                await fetchUsers(user.club_id, dispatch);
                setLoading(false);
            })();
        } else if (!reservationsData.loaded) {
            (async () => {
                setLoading(true);
                await fetchReservations(dispatch);
                setLoading(false);
            })();
        }
    }, []);

    useEffect(() => {
        if ((location.state as {showAdminWelcome?: boolean} | null)?.showAdminWelcome) {
            navigate(`${location.pathname}${location.search}`, {replace: true, state: null});
        }
    }, [location.pathname, location.search, location.state, navigate]);

    useEffect(() => {
        if (!showAdminWelcome) return;

        const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const dialog = welcomeDialogRef.current;
        const backgroundElements = Array.from(document.querySelectorAll<HTMLElement>('#root > header, #root > footer'));
        const previousInertValues = backgroundElements.map(element => element.inert);
        backgroundElements.forEach(element => { element.inert = true; });
        const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
        requestAnimationFrame(() => dialog?.querySelector<HTMLElement>(focusableSelector)?.focus());

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setShowAdminWelcome(false);
                return;
            }

            if (event.key !== 'Tab' || !dialog) return;
            const focusableElements = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
            if (!focusableElements.length) {
                event.preventDefault();
                return;
            }
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            backgroundElements.forEach((element, index) => { element.inert = previousInertValues[index]; });
            if (previouslyFocused?.isConnected) previouslyFocused.focus();
        };
    }, [showAdminWelcome]);

    return (
        loading ? (
            <div className="splash">
                <Loader size="big" text="Reservierungen werden geladen" />
            </div>
        ) : (
            <>
                {showAdminWelcome && user.role === 'admin' ? (
                    <div className="admin-welcome-backdrop">
                        <section
                            ref={welcomeDialogRef}
                            className="admin-welcome-dialog"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="admin-welcome-title"
                        >
                            <button
                                className="admin-welcome-close"
                                type="button"
                                aria-label="Schließen"
                                autoFocus
                                onClick={() => setShowAdminWelcome(false)}
                            >×</button>
                            <h2 id="admin-welcome-title">Willkommen bei abzumplatz!</h2>
                            <p>Ihr Verein wurde erfolgreich eingerichtet. Wir haben eine kurze Checkliste vorbereitet, mit der Sie Vereinsdaten, Plätze und Reservierungsregeln überprüfen können.</p>
                            <Link className="button-link" to="/admin/checklist">Checkliste öffnen</Link>
                        </section>
                    </div>
                ) : null}
                <div className="grid" inert={showAdminWelcome && user.role === 'admin'}>
                <div className="reservations">
                    {user.role === 'admin' && openedFromAdminChecklist ? (
                        <p className="reservations-checklist-back"><AdminBackButton fallback="/admin/checklist" /></p>
                    ) : null}
                    <Calendar
                        reservationDate={reservationDate}
                        setReservationDate={setReservationDate}
                        user={user}
                        setLoading={setLoading}
                        timeZone={club.timezone}
                    />
                    <div className="reservations-legend" aria-label="Legende für Platzstatus">
                        <span className="reservations-legend__item">
                            <span className="reservations-legend__swatch reservations-legend__swatch--available" aria-hidden="true"></span>
                            Frei
                        </span>
                        <span className="reservations-legend__item">
                            <span className="reservations-legend__swatch reservations-legend__swatch--reserved" aria-hidden="true"></span>
                            Reserviert
                        </span>
                        <span className="reservations-legend__item">
                            <span className="reservations-legend__swatch reservations-legend__swatch--reserved reservations-legend__swatch--recurring" aria-hidden="true">
                                <span className="reservations-legend__marker">W</span>
                            </span>
                            Wöchentlich
                        </span>
                        <span className="reservations-legend__item">
                            <span className="reservations-legend__swatch reservations-legend__swatch--past" aria-hidden="true"></span>
                            Vergangen
                        </span>
                        <span className="reservations-legend__item">
                            <span className="reservations-legend__swatch reservations-legend__swatch--disabled" aria-hidden="true"></span>
                            Deaktiviert
                        </span>
                    </div>
                    <div className="main">
                        <div className="hours">
                            {clubHours.map(hour => <div className="hour" key={hour}>{hour < 10 ? '0' + hour : hour}:00</div>)}
                        </div>
                        <div className="slots">
                            <Header courts={club.courts} />
                            {clubHours.map(hour =>
                                <Rows
                                    reservations={normalizedReservations}
                                    onClick={clickHandler}
                                    key={hour}
                                    hour={hour}
                                    date={isoDate}
                                    courts={club.courts}
                                    user_id={user._id}
                                    isPast={isReservationTimeInPast(isoDate, hour, club.timezone)}
                                />
                            )}
                        </div>
                    </div>
                    {slot &&
                    <Popup
                        type={popupType}
                        slot={slot}
                        disabled={disabled}
                        setDisabled={setDisabled}
                        closePopup={closePopup}>
                    </Popup>}
                </div>
                </div>
            </>
        )
    )
}
