import { useState } from "react";
import { getUserReservations } from './../utils/utils';
import { MyReservations } from './../components/myReservations/MyReservations';
import { Popup } from '../components/courts/Popup';

type Slot = {
    date: string;
    hour: number;
    court_number: string;
    reservation_id?: string;
    recurring?: boolean;
}

export default function Bookings() {
    const userReservations = getUserReservations();
    const [slot, setSlot] = useState<Slot | null>(null);
    const [disabled, setDisabled] = useState(false);
    const closePopup = () => {
        setDisabled(false);
        setSlot(null);
    };
    return (
        <>
            <MyReservations
                hasPopup={true}
                showPopup={(slot: HTMLElement) => {
                    setSlot({
                        court_number: slot.dataset.court_number!,
                        date: slot.dataset.date!,
                        hour: Number(slot.dataset.hour),
                        reservation_id: slot.dataset.reservation_id,
                        recurring: slot.dataset.recurring === 'true'
                    });
                }}
                reservations={userReservations}
            />
            {slot && <Popup
                type='deleteReservation'
                slot={slot}
                disabled={disabled}
                setDisabled={setDisabled}
                closePopup={closePopup}>
            </Popup>}
        </>
    )
}
