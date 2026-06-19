import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { fetchClub, fetchUsers } from "../../utils/utils";
import { Loader } from "../../components/loader/Loader";
import { getCoveredUntilFromPeriodEnd, getPlanName, getMembersLimitForPlan, hasFutureBillingPeriodEnd } from "../../planConfig";

export default function AdminHomePage() {
    const [loadingClub, setLoadingClub] = useState(false);
    const user = useSelector((state: RootState) => state.auth);
    const clubData = useSelector((state: RootState) => state.club);
    const usersData = useSelector((state: RootState) => state.users);
    const dispatch = useDispatch();
    const club = clubData.value;
    const membersCount = usersData.loaded ? usersData.value.length : null;
    const activeMembersCount = usersData.loaded
        ? usersData.value.filter(member => member.status !== 'inactive').length
        : null;
    const hasPaidEntitlement = hasFutureBillingPeriodEnd(club.current_billing_period_end);
    const accessPlanType = club.access_plan_type ?? club.plan_type;
    const membersLimit = getMembersLimitForPlan(accessPlanType);
    const remainingMembersCount = membersLimit != null && activeMembersCount != null
        ? Math.max(membersLimit - activeMembersCount, 0)
        : null;
    const adminName = `${user.first_name} ${user.last_name}`.trim();
    const address = [club.address_line1, club.postal_code, club.city, club.country]
        .filter(Boolean)
        .join(', ');
    const paidUntilLabel = club.current_billing_period_end
        ? new Date(getCoveredUntilFromPeriodEnd(club.current_billing_period_end) ?? club.current_billing_period_end).toLocaleDateString('de-DE')
        : '-';
    const accessPlanName = getPlanName(accessPlanType);
    const billedPlanName = getPlanName(club.plan_type);
    const nextPlanName = getPlanName(club.next_plan_type);
    const planLabel = hasPaidEntitlement
        ? nextPlanName !== accessPlanName
            ? `${accessPlanName} (bezahlt bis ${paidUntilLabel}, danach ${nextPlanName})`
            : accessPlanName !== billedPlanName
                ? `${accessPlanName} (Abrechnung als ${billedPlanName} bis ${paidUntilLabel})`
                : `${accessPlanName} (bezahlt bis ${paidUntilLabel})`
        : accessPlanName;
    const registeredAtLabel = club.timestamp
        ? new Date(club.timestamp).toLocaleDateString('de-DE')
        : '-';

    useEffect(() => {
        if (!clubData.loaded || clubData.value._id !== user.club_id) {
            (async () => {
                setLoadingClub(true);
                await fetchClub(user.club_id, dispatch);
                setLoadingClub(false);
            })();
        }
    }, [clubData.loaded, clubData.value._id, dispatch, user.club_id]);

    useEffect(() => {
        if (!usersData.loaded) {
            (async () => {
                await fetchUsers(user.club_id, dispatch);
            })();
        }
    }, [dispatch, user.club_id, usersData.loaded]);

    return (
        <>
            <h1>Admin</h1>
            <div className="admin-actions">
                <Link className="button-link" to="/admin/members">Mitglieder verwalten</Link>
                <Link className="button-link" to="/admin/club">Verein editieren</Link>
                <Link className="button-link" to="/admin/courts">Plätze verwalten</Link>
                <Link className="button-link" to="/admin/billings">Abrechnungen</Link>
            </div>
            {loadingClub || !clubData.loaded ? (
                <Loader size="small" text="Vereinsdaten werden geladen..." />
            ) : (
                <table className="profile-table">
                    <tbody>
                        <tr>
                            <th>Verein</th>
                            <td>{club.name}</td>
                        </tr>
                        <tr>
                            <th>Registriert am</th>
                            <td>{registeredAtLabel}</td>
                        </tr>
                        <tr>
                            <th>Adresse</th>
                            <td>{address}</td>
                        </tr>
                        <tr>
                            <th>Vereinsadmin</th>
                            <td>{adminName}</td>
                        </tr>
                        <tr>
                            <th>Mitglieder</th>
                            <td>
                                {membersCount === null || activeMembersCount === null
                                    ? '...'
                                    : `${membersCount} (${activeMembersCount} aktiv)`}
                            </td>
                        </tr>
                        <tr>
                            <th>Mitgliederlimit</th>
                            <td>
                                {membersLimit != null && remainingMembersCount != null
                                    ? `${membersLimit} (noch ${remainingMembersCount} aktive Mitglieder erlaubt)`
                                    : membersLimit != null
                                        ? '...'
                                        : 'Kein Limit'}
                            </td>
                        </tr>
                        <tr>
                            <th>Plan</th>
                            <td>{planLabel}</td>
                        </tr>
                        <tr>
                            <th>Plätze</th>
                            <td>{club.courts.length}</td>
                        </tr>
                        <tr>
                            <th>Zeiten</th>
                            <td>{club.start_hour}:00 - {club.end_hour}:00 Uhr</td>
                        </tr>
                    </tbody>
                </table>
            )}
        </>
    )
}
