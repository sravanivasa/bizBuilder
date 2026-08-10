import { Link } from "react-router-dom";

const PrivacyPolicy = () => (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-emerald-50">
        <div className="mx-auto max-w-3xl">
            <Link to="/login" className="text-sm text-emerald-300 hover:text-emerald-200">
                ← Back to BizBuilder
            </Link>

            <h1 className="mt-6 text-3xl font-bold text-white">Privacy Policy</h1>
            <p className="mt-2 text-sm text-emerald-100/70">Last updated: August 2026</p>

            <div className="mt-8 space-y-6 text-sm leading-relaxed text-emerald-50/90">
                <section>
                    <h2 className="text-lg font-semibold text-white">Overview</h2>
                    <p className="mt-2">
                        BizBuilder helps home-based businesses manage products, orders, and customer
                        notifications. This placeholder policy describes how we handle data. Replace
                        this page with lawyer-reviewed text before marketing or charging users.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white">Data we collect</h2>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>Business owner account details (name, email, password hash)</li>
                        <li>Business profile and product information</li>
                        <li>Customer order details (name, phone, address) submitted via storefront</li>
                        <li>Product images uploaded to Cloudinary</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white">How we use data</h2>
                    <p className="mt-2">
                        Data is used to operate the service: order management, WhatsApp notifications
                        (when enabled), and displaying the public storefront. We do not sell personal
                        data.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white">Third-party services</h2>
                    <p className="mt-2">
                        We use MongoDB Atlas (database), Cloudinary (images), Meta WhatsApp Cloud API
                        (notifications), and hosting providers (Vercel, Railway). Each has its own
                        privacy policy.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white">Contact</h2>
                    <p className="mt-2">
                        For privacy questions, contact the BizBuilder team at your support email once
                        you set one up for production.
                    </p>
                </section>
            </div>

            <p className="mt-10 text-sm text-emerald-100/60">
                See also{" "}
                <Link to="/terms" className="text-emerald-300 hover:text-emerald-200">
                    Terms of Service
                </Link>
                .
            </p>
        </div>
    </div>
);

export default PrivacyPolicy;
