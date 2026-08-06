import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { loginUser } from "../api/auth";
import { setCredentials } from "../store/authSlice";
import PasswordInput from "../components/PasswordInput";

const Login = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data } = await loginUser(form);
            dispatch(setCredentials({ token: data.token, user: data.user }));
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || t("loginFailed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">{t("login")}</h1>
                <p className="mt-2 text-sm text-emerald-50/70">{t("loginSubtitle")}</p>
            </div>

            {error && (
                <p className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-emerald-50">
                        {t("email")}
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-100/60 outline-none transition focus:border-emerald-300 focus:bg-white/15 focus:ring-2 focus:ring-emerald-400/30"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-medium text-emerald-50">
                            {t("password")}
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-emerald-300 transition hover:text-white"
                        >
                            {t("forgotPassword")}
                        </Link>
                    </div>
                    <PasswordInput
                        id="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? t("loading") : t("login")}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-emerald-50/70">
                {t("noAccount")}{" "}
                <Link to="/register" className="font-semibold text-white transition hover:text-emerald-200">
                    {t("register")}
                </Link>
            </p>
        </div>
    );
};

export default Login;
