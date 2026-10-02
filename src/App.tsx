import { useEffect, useState } from 'react';
import { Navigate, Routes, Route, useParams } from 'react-router';
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './store';
import { isAuthenticated } from './utils/utils';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

// pages
import Home from './pages/Home';
import SelectClubPage from './pages/SelectClubPage';
import Reservations from './pages/Reservations';
import AdminHomePage from './pages/admin/Home';
import AdminChecklistPage from './pages/admin/Checklist';
import AdminMembersPage from './pages/admin/Members'
import AdminInvitePage from './pages/admin/Invite';
import AdminClubPage from './pages/admin/Club';
import AdminDeleteClubPage from './pages/admin/DeleteClub';
import AdminCourtsPage from './pages/admin/Courts';
import AdminRulesPage from './pages/admin/Rules';
import AdminBillingsPage from './pages/admin/Billings';
import AdminTournamentsPage from './pages/admin/Tournaments';
import AdminCompetitionGroupsPage from './pages/admin/CompetitionGroups';
import AdminTournamentFormPage from './pages/admin/TournamentForm';
import AdminCompetitionGroupFormPage from './pages/admin/CompetitionGroupForm';
import AdminTournamentParticipantsPage from './pages/admin/TournamentParticipants';
import AdminAnnouncementFormPage from './pages/admin/AnnouncementForm';
import AdminAnnouncementsPage from './pages/admin/Announcements';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Rules from './pages/Rules';
import Support from './pages/Support';
import Faq from './pages/Faq';
import Bookings from './pages/Bookings';
import Tournaments from './pages/Tournaments';
import RegisterPlayer from './pages/RegisterPlayer';
import RegisterClub from './pages/RegisterClub';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LoginPage from './pages/Login';
import Layout from './pages/Layout';
import NotFound from './pages/NotFound';
import Imprint from './pages/Imprint';

import { Loader } from './components/loader/Loader';
import Header from './components/header/Header';
import Footer from './components/footer/Footer';
import RouteMetadata from './components/RouteMetadata';

import { Club } from './types';
import './app.css';

type AppProps = {
    initiallyInitialized?: boolean;
};

function LegacyCompetitionGroupEditRedirect() {
    const {id} = useParams();
    return <Navigate to={id ? `/admin/competition-groups/${id}/edit` : '/admin/competition-groups'} replace />;
}

export default function App({initiallyInitialized = false}: AppProps) {
    const [initialized, setInitialized] = useState(initiallyInitialized);
    // const auth = useSelector((state: RootState) => state.auth);
    const clubs = useSelector((state: RootState) => state.clubs.value);
    const dispatch = useDispatch();

    useEffect(() => {
        async function getData() {
            const [clubsData, authenticated] = await Promise.all([
                fetch('/api/clubs').then(response => response.json() as Promise<Club[]>),
                isAuthenticated(),
            ]);

            // save clubs in store
            dispatch({
                type: 'clubs/fetch',
                payload: {
                    value: clubsData
                }
            });

            // save logged-in user in store
            if (!authenticated || authenticated.error) {
                dispatch({type: 'auth/setAuthChecked'});
            } else {
                // console.log('User is logged-in', authenticated)
                dispatch({type: 'auth/login', payload: {
                    value: true,
                    ...authenticated
                }});
            }

            setInitialized(true);
        }

        getData();
    }, []);

    return (
        <>
        <RouteMetadata />
        {initialized ?
        <Routes>
            <Route element={<Layout />}>
                <Route path="/reservations" element={
                    <ProtectedRoute requireActiveMembership>
                        <Reservations />
                    </ProtectedRoute>
                }/>
                <Route path="/profile" element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                }/>
                <Route path="/profile/edit" element={
                    <ProtectedRoute>
                        <EditProfile />
                    </ProtectedRoute>
                }/>
                <Route path="/settings" element={
                    <ProtectedRoute>
                        <Navigate to="/reservations" replace />
                    </ProtectedRoute>
                }/>
                <Route path="/rules" element={
                    <ProtectedRoute requireActiveMembership>
                        <Rules />
                    </ProtectedRoute>
                }/>
                <Route path="/support" element={
                    <Support />
                }/>
                <Route path="/faq" element={
                    <Faq />
                }/>
                <Route path="/bookings" element={
                    <ProtectedRoute requireActiveMembership>
                        <Bookings />
                    </ProtectedRoute>
                }/>
                <Route path="/tournaments" element={
                    <ProtectedRoute requireActiveMembership>
                        <Tournaments />
                    </ProtectedRoute>
                }/>
                <Route path="/tournaments/:id" element={
                    <ProtectedRoute requireActiveMembership>
                        <Tournaments />
                    </ProtectedRoute>
                }/>
                <Route path="/admin" element={
                    <ProtectedRoute>
                        <AdminHomePage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/checklist" element={
                    <ProtectedRoute>
                        <AdminChecklistPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/members" element={
                    <ProtectedRoute>
                        <AdminMembersPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/invite" element={
                    <ProtectedRoute>
                        <AdminInvitePage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/club" element={
                    <ProtectedRoute>
                        <AdminClubPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/club/delete" element={
                    <ProtectedRoute>
                        <AdminDeleteClubPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/courts" element={
                    <ProtectedRoute>
                        <AdminCourtsPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/rules" element={
                    <ProtectedRoute>
                        <AdminRulesPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/billings" element={
                    <ProtectedRoute>
                        <AdminBillingsPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/tournaments" element={
                    <ProtectedRoute>
                        <AdminTournamentsPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/tournaments/:id" element={
                    <ProtectedRoute>
                        <AdminTournamentsPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/tournaments/new" element={
                    <ProtectedRoute>
                        <AdminTournamentFormPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/tournaments/:id/edit" element={
                    <ProtectedRoute>
                        <AdminTournamentFormPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/tournaments/:id/participants" element={
                    <ProtectedRoute>
                        <AdminTournamentParticipantsPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/competition-groups" element={
                    <ProtectedRoute>
                        <AdminCompetitionGroupsPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/competition-groups/new" element={
                    <ProtectedRoute>
                        <AdminCompetitionGroupFormPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/competition-groups/:id/edit" element={
                    <ProtectedRoute>
                        <AdminCompetitionGroupFormPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/tournaments/groups/new" element={<Navigate to="/admin/competition-groups/new" replace />}/>
                <Route path="/admin/tournaments/groups/:id/edit" element={<LegacyCompetitionGroupEditRedirect />}/>
                <Route path="/admin/announcements/new" element={
                    <ProtectedRoute>
                        <AdminAnnouncementFormPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/announcements/:id/edit" element={
                    <ProtectedRoute>
                        <AdminAnnouncementFormPage />
                    </ProtectedRoute>
                }/>
                <Route path="/admin/announcements" element={
                    <ProtectedRoute>
                        <AdminAnnouncementsPage />
                    </ProtectedRoute>
                }/>
                <Route path="/register/club" element={
                    <PublicRoute>
                        <RegisterClub />
                    </PublicRoute>
                }/>
                <Route path="/select-club" element={
                    <ProtectedRoute>
                        <SelectClubPage clubs={clubs} />
                    </ProtectedRoute>
                }/>
                <Route path="/" element={
                    <PublicRoute>
                        <Home />
                    </PublicRoute>
                } />
                <Route path="/register/player" element={
                    <PublicRoute>
                        <RegisterPlayer />
                    </PublicRoute>
                } />
                <Route path="/login" element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                } />
                <Route path="/forgot-password" element={
                    <PublicRoute>
                        <ForgotPasswordPage />
                    </PublicRoute>
                } />
                <Route path="/reset-password" element={
                    <PublicRoute>
                        <ResetPasswordPage />
                    </PublicRoute>
                } />
                <Route path="/impressum" element={
                    <Imprint />
                } />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes> : (
            <>
                <Header />
                <main>
                    <div className="splash">
                        <Loader size="big" text="Wird geladen..." />
                    </div>
                </main>
                <Footer />
            </>
        )}
        </>
    );
}
