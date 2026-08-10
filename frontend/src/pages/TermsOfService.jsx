import { Link } from "react-router-dom";

const TermsOfService = () => (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-emerald-50">
        <div className="mx-auto max-w-3xl">
            <Link to="/login" className="text-sm text-emerald-300 hover:text-emerald-200">
                ← Back to BizBuilder
            </Link>

            <h1 className="mt-6 text-3xl font-bold text-white">Terms of Service</h1>
            <p className="mt-2 text-sm text-emerald-100/70">Last updated: August 2026</p>

            <div className="mt-8 space-y-6 text-sm leading-relaxed text-emerald-50/90">
                <section>
                    <h2 className="text-lg font-semibold text-white">Agreement</h2>
                    <p className="mt-2">
                        By using BizBuilder, you agree to these terms. This is a placeholder document
                        for MVP launch — replace with lawyer-reviewed terms before marketing or
                        accepting payments.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white">Service description</h2>
                    <p className="mt-2">
                        BizBuilder provides tools for home businesses to list products, accept orders
                        via a shareable link, and send WhatsApp notifications. Features may change as
                        the product evolves.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white">Your responsibilities</h2>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>Provide accurate business and product information</li>
                        <li>Handle customer orders and payments outside the app (MVP)</li>
                        <li>Comply with local laws for food, goods, and messaging</li>
                        <li>Keep your login credentials secure</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white">Limitation of liability</h2>
                    <p className="mt-2">
                        BizBuilder is provided &quot;as is&quot; during MVP. We are not liable for lost
                        orders, messaging failures, or business losses. WhatsApp delivery depends on
                        Meta&apos;s API and your configuration.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white">Contact</h2>
                    <p className="mt-2">
                        For support or legal questions, use your production support email once configured.
                    </p>
                </section>
            </div>

            <p className="mt-10 text-sm text-emerald-100/60">
                See also{" "}
                <Link to="/privacy" className="text-emerald-300 hover:text-emerald-200">
                    Privacy Policy
                </Link>
                .
            </p>
        </div>
    </div>
);

export default TermsOfService;
