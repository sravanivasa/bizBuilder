import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProfile } from "../api/auth";
import { logout, setAuthReady, setUser } from "../store/authSlice";

const AuthBootstrap = ({ children }) => {
    const dispatch = useDispatch();
    const token = useSelector((state) => state.auth.token);
    const authReady = useSelector((state) => state.auth.authReady);

    useEffect(() => {
        let cancelled = false;

        const bootstrap = async () => {
            if (!token) {
                dispatch(setAuthReady());
                return;
            }

            try {
                const { data } = await getProfile();

                if (!cancelled) {
                    dispatch(setUser(data.user));
                    dispatch(setAuthReady());
                }
            } catch {
                if (!cancelled) {
                    dispatch(logout());
                }
            }
        };

        bootstrap();

        return () => {
            cancelled = true;
        };
    }, [dispatch, token]);

    if (!authReady) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-emerald-100">
                Loading...
            </div>
        );
    }

    return children;
};

export default AuthBootstrap;
