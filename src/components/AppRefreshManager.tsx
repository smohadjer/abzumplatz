import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { refreshAppData } from '../utils/refreshAppData';

const refreshThrottleMs = 10_000;
const minimumIndicatorMs = 500;

export default function AppRefreshManager() {
    const auth = useSelector((state: RootState) => state.auth);
    const refreshRequestVersion = useSelector((state: RootState) => state.appRefresh.requestVersion);
    const dispatch = useDispatch<AppDispatch>();
    const inFlight = useRef<Promise<void> | null>(null);
    const abortController = useRef<AbortController | null>(null);
    const refreshPending = useRef(false);
    const lastRefreshAt = useRef(0);

    const refresh = useCallback((force = false, showIndicator = true) => {
        if (!auth.value || auth.status === 'inactive' || !auth.club_id || !auth._id) return;
        if (inFlight.current) {
            if (force) refreshPending.current = true;
            return;
        }
        if (!force && Date.now() - lastRefreshAt.current < refreshThrottleMs) return;

        const startedAt = Date.now();
        const controller = new AbortController();
        abortController.current = controller;
        if (showIndicator) dispatch({type: 'appRefresh/start'});
        const request = refreshAppData(dispatch, {_id: auth._id, club_id: auth.club_id}, controller.signal)
            .catch(error => {
                if (!(error instanceof DOMException && error.name === 'AbortError')) {
                    console.error('App data could not be refreshed', error);
                }
            })
            .finally(async () => {
                if (abortController.current !== controller) return;
                const remainingIndicatorTime = minimumIndicatorMs - (Date.now() - startedAt);
                if (remainingIndicatorTime > 0) {
                    await new Promise(resolve => setTimeout(resolve, remainingIndicatorTime));
                }
                lastRefreshAt.current = Date.now();
                inFlight.current = null;
                abortController.current = null;
                if (showIndicator) dispatch({type: 'appRefresh/finish'});
                if (refreshPending.current) {
                    refreshPending.current = false;
                    refresh(true);
                }
            });
        inFlight.current = request;
    }, [auth._id, auth.club_id, auth.status, auth.value, dispatch]);

    useEffect(() => {
        refresh(true, false);
        return () => {
            abortController.current?.abort();
            abortController.current = null;
            inFlight.current = null;
            refreshPending.current = false;
            dispatch({type: 'appRefresh/finish'});
        };
    }, [dispatch, refresh]);

    useEffect(() => {
        if (refreshRequestVersion > 0) refresh(true);
    }, [refresh, refreshRequestVersion]);

    useEffect(() => {
        const refreshWhenVisible = () => {
            if (document.visibilityState === 'visible') refresh();
        };
        const refreshOnFocus = () => refresh();
        window.addEventListener('focus', refreshOnFocus);
        document.addEventListener('visibilitychange', refreshWhenVisible);
        return () => {
            window.removeEventListener('focus', refreshOnFocus);
            document.removeEventListener('visibilitychange', refreshWhenVisible);
        };
    }, [refresh]);

    return null;
}
