import { Metadata } from "next";
import Link from "next/link";
import { PolicySidebar } from "@/components/common/PolicySidebar";

export const metadata: Metadata = {
  title: "Our Privacy Policy | Roopshree",
  description:
    "Read Roopshree's Privacy Policy to understand how we collect, use, and protect your personal information while you shop on our website.",
  alternates: {
    canonical: "https://roopshreebandhej.com/privacy-policy",
  },
  openGraph: {
    title: "Our Privacy Policy | Roopshree",
    description:
      "Read Roopshree's Privacy Policy to understand how we collect, use, and protect your personal information while you shop on our website.",
    url: "https://roopshreebandhej.com/privacy-policy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Our Privacy Policy | Roopshree",
    description:
      "Read Roopshree's Privacy Policy to understand how we collect, use, and protect your personal information while you shop on our website.",
  },
};

const sidebarItems = [
  { id: "your-privacy-matters", label: "Your Privacy Matters" },
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use-your-information", label: "How We Use Your Information" },
  { id: "data-security", label: "Data Security" },
  { id: "third-party-services", label: "Third-Party Services" },
  { id: "cookies", label: "Cookies" },
  { id: "your-rights", label: "Your Rights" },
  { id: "changes", label: "Changes" },
  { id: "contact-us", label: "Contact Us" },
];

export default function PrivacyPolicy() {
  return (
    <main className="flex-1 bg-white">
      {/* Premium Hero Header */}
      <div className="bg-gradient-to-b from-[#FDF9F4] to-white border-b border-[#C39150]/15 pb-12 pt-28 md:pb-20 md:pt-36">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C39150] md:text-sm">
            Roop Shree Policies
          </p>
          <h1 className="mt-3 font-heading text-4xl font-semibold text-[#3F2617] md:text-5xl lg:text-6xl">
            Privacy Policy
          </h1>
          <div className="mt-4 flex items-center justify-center gap-2 text-[#C39150]">
            <span className="size-1.5 rotate-45 bg-[#C39150]" />
            <span className="h-px w-12 bg-[#C39150]/30" />
            <span className="size-2.5 rotate-45 bg-[#C39150]" />
            <span className="h-px w-12 bg-[#C39150]/30" />
            <span className="size-1.5 rotate-45 bg-[#C39150]" />
          </div>
          <p className="mt-5 text-sm text-[#3F2617]/70">
            Roop Shree values your trust and is committed to protecting your
            personal information.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-12 xl:gap-16">
          {/* Sticky Left Sidebar Navigation */}
          <PolicySidebar items={sidebarItems} />

          {/* Right Column - Policy Content */}
          <div className="space-y-12 text-[#3F2617]/80 text-sm leading-relaxed md:text-base lg:space-y-16">
            <section
              id="your-privacy-matters"
              className="scroll-mt-28 bg-[#FDF9F4]/40 border border-[#C39150]/10 rounded-lg p-5 md:p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="size-1.5 rotate-45 bg-[#C39150]" />
                <h3 className="font-heading text-lg font-semibold text-[#3F2617]">
                  Your Privacy Matters
                </h3>
              </div>
              <p>
                Roop Shree values your trust and is committed to protecting your
                personal information. This Privacy Policy outlines how we
                collect, use, and protect your information when you visit or
                interact with our website.
              </p>
            </section>

            <section
              id="information-we-collect"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  Information We Collect
                </h2>
              </div>
              <p className="mb-3">We may collect:</p>
              <ul className="list-disc space-y-3 pl-5 marker:text-[#C39150]">
                <li>Name</li>
                <li>Mobile number</li>
                <li>Email address</li>
                <li>Shipping and billing address</li>
                <li>Payment details (processed securely through payment
                    gateways)</li>
                <li>Order history</li>
                <li>Device and browser information</li>
              </ul>
            </section>

            <section
              id="how-we-use-your-information"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  How We Use Your Information
                </h2>
              </div>
              <p className="mb-3">We use your information to:</p>
              <ul className="list-disc space-y-3 pl-5 marker:text-[#C39150]">
                <li>Process orders</li>
                <li>Deliver products</li>
                <li>Provide customer support</li>
                <li>Send order updates</li>
                <li>Improve our website and services</li>
                <li>Send promotional offers (only if you choose to receive them)</li>
              </ul>
            </section>

            <section
              id="data-security"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  Data Security
                </h2>
              </div>
              <p>
                We use reasonable security measures to protect your information.
                However, no online transmission is 100% secure.
              </p>
            </section>

            <section
              id="third-party-services"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  Third-Party Services
                </h2>
              </div>
              <p className="mb-3">
                We may use trusted third-party service providers for:
              </p>
              <ul className="list-disc space-y-3 pl-5 marker:text-[#C39150]">
                <li>Payment processing</li>
                <li>Shipping</li>
                <li>Website analytics</li>
                <li>SMS and email notifications</li>
              </ul>
              <p className="mt-4">
                These providers receive only the information necessary to
                perform their services.
              </p>
            </section>

            <section
              id="cookies"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  Cookies
                </h2>
              </div>
              <p>
                Our website may use cookies to improve your browsing experience
                and personalize content.
              </p>
            </section>

            <section
              id="your-rights"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  Your Rights
                </h2>
              </div>
              <p className="mb-3">You may request to:</p>
              <ul className="list-disc space-y-3 pl-5 marker:text-[#C39150]">
                <li>Access your information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your personal information (subject to legal
                    obligations)</li>
              </ul>
            </section>

            <section
              id="changes"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  Changes
                </h2>
              </div>
              <p>
                Roop Shree may update this Privacy Policy at any time. Updated
                versions will be posted on this page.
              </p>
            </section>

            {/* Premium Contact Details Card */}
            <section id="contact-us" className="scroll-mt-28">
              <div className="flex items-center gap-2 mb-6">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  Contact Us
                </h2>
              </div>
              <div className="bg-gradient-to-br from-[#FDF9F4] to-white border border-[#C39150]/20 rounded-lg p-6 md:p-8 shadow-sm">
                <h3 className="font-heading text-lg font-semibold text-[#3F2617] mb-2">
                  Roop Shree
                </h3>
                <p className="text-sm text-[#C39150] mb-6 font-medium">
                  Manufacturer & Trader of Authentic Rajasthani Bandhej Products
                </p>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-5 text-[#C39150] shrink-0 mt-0.5"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                      <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-[#3F2617] text-sm">
                        Address
                      </h4>
                      <p className="mt-1 text-sm text-[#3F2617]/80">
                        Inside Tabela Gate,
                        <br />
                        Sikar, Rajasthan - 332001, India
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-5 text-[#C39150] shrink-0 mt-0.5"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-[#3F2617] text-sm">
                        Phone
                      </h4>
                      <a
                        href="tel:+919783841066"
                        className="mt-1 block text-sm text-[#3F2617]/80 hover:text-[#C39150] transition-colors hover:underline"
                      >
                        +91 97838 41066
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-5 text-[#C39150] shrink-0 mt-0.5"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
                      <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-[#3F2617] text-sm">
                        WhatsApp
                      </h4>
                      <a
                        href="https://wa.me/917627028842"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-sm text-[#3F2617]/80 hover:text-[#C39150] transition-colors hover:underline"
                      >
                        Chat on WhatsApp (+91 7627028842)
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-5 text-[#C39150] shrink-0 mt-0.5"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10" />
                      <path d="M3 7l9 6l9 -6" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-[#3F2617] text-sm">
                        Email
                      </h4>
                      <a
                        href="mailto:Adityagarwal23@gmail.com"
                        className="mt-1 block text-sm text-[#3F2617]/80 hover:text-[#C39150] transition-colors hover:underline"
                      >
                        Adityagarwal23@gmail.com
                      </a>
                      <p className="mt-1 text-xs text-[#3F2617]/60">
                        We typically reply within 24 hours.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-8 pt-6 border-t border-[#C39150]/10 text-xs text-[#3F2617]/60">
                  Products: Peela Chunri, Bandhej Dupattas, Sarees, Lehengas,
                  Gajji Silk, Gota Patti, Zardozi & Traditional Rajasthani
                  Textiles. For any queries regarding orders, returns, shipping,
                  or privacy, please contact us.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
