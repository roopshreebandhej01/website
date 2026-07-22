import { Metadata } from "next";
import Link from "next/link";
import { PolicySidebar } from "@/components/common/PolicySidebar";

export const metadata: Metadata = {
  title: "Terms & Conditions | Roopshree Shopping Policies",
  description:
    "Review Roopshree's Terms & Conditions covering orders, payments, shipping, returns, and website usage policies for our Bandhej saree and dupatta collections.",
  alternates: {
    canonical: "https://roopshreebandhej.com/terms-and-conditions",
  },
  openGraph: {
    title: "Terms & Conditions | Roopshree Shopping Policies",
    description:
      "Review Roopshree's Terms & Conditions covering orders, payments, shipping, returns, and website usage policies for our Bandhej saree and dupatta collections.",
    url: "https://roopshreebandhej.com/terms-and-conditions",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms & Conditions | Roopshree Shopping Policies",
    description:
      "Review Roopshree's Terms & Conditions covering orders, payments, shipping, returns, and website usage policies for our Bandhej saree and dupatta collections.",
  },
};

const sidebarItems = [
  { id: "about-us", label: "1. About Us" },
  { id: "product-info", label: "2. Product Information" },
  { id: "pricing", label: "3. Pricing" },
  { id: "order-acceptance", label: "4. Order Acceptance" },
  { id: "intellectual-property", label: "5. Intellectual Property" },
  { id: "user-responsibilities", label: "6. User Responsibilities" },
  { id: "limitation-of-liability", label: "7. Limitation of Liability" },
  { id: "governing-law", label: "8. Governing Law" },
  { id: "contact-us", label: "Contact Us" },
];

export default function TermsAndConditions() {
  return (
    <main className="flex-1 bg-white">
      {/* Premium Hero Header */}
      <div className="bg-gradient-to-b from-[#FDF9F4] to-white border-b border-[#C39150]/15 pb-12 pt-28 md:pb-20 md:pt-36">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C39150] md:text-sm">
            Roop Shree Policies
          </p>
          <h1 className="mt-3 font-heading text-4xl font-semibold text-[#3F2617] md:text-5xl lg:text-6xl">
            Terms & Conditions
          </h1>
          <div className="mt-4 flex items-center justify-center gap-2 text-[#C39150]">
            <span className="size-1.5 rotate-45 bg-[#C39150]" />
            <span className="h-px w-12 bg-[#C39150]/30" />
            <span className="size-2.5 rotate-45 bg-[#C39150]" />
            <span className="h-px w-12 bg-[#C39150]/30" />
            <span className="size-1.5 rotate-45 bg-[#C39150]" />
          </div>
          <p className="mt-5 text-sm text-[#3F2617]/70">
            Welcome to Roop Shree. Please read our Terms & Conditions carefully.
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
            <section className="bg-[#FDF9F4]/40 border border-[#C39150]/10 rounded-lg p-5 md:p-6">
              <p>
                <strong>Welcome to Roop Shree.</strong> By accessing our website
                or placing an order, you agree to comply with the following
                Terms & Conditions. Please read them carefully before using our
                website.
              </p>
            </section>

            <section
              id="about-us"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  1. About Us
                </h2>
              </div>
              <p className="mt-2">
                Roop Shree is engaged in manufacturing and trading authentic
                Rajasthani Bandhej products, including Peela Chunri, Dupattas,
                Sarees, Lehengas, and handcrafted traditional textiles.
              </p>
            </section>

            <section
              id="product-info"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  2. Product Information
                </h2>
              </div>
              <ul className="list-none space-y-3">
                <li>We strive to display products as accurately as possible.</li>
                <li>Due to different screen settings, slight variations in color
                    may occur.</li>
                <li>As many of our products are handcrafted, slight
                    irregularities in dyeing, weaving, embroidery, zari work, or
                    handwork are natural and should not be considered defects.</li>
              </ul>
            </section>

            <section
              id="pricing"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  3. Pricing
                </h2>
              </div>
              <ul className="list-none space-y-3">
                <li>All prices are in Indian Rupees (INR).</li>
                <li>Prices are subject to change without prior notice.</li>
                <li>Applicable taxes, if any, will be charged at checkout.</li>
              </ul>
            </section>

            <section
              id="order-acceptance"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  4. Order Acceptance
                </h2>
              </div>
              <p className="mb-3">
                Roop Shree reserves the right to accept, reject, or cancel any
                order due to:
              </p>
              <ul className="list-disc space-y-3 pl-5 marker:text-[#C39150]">
                <li>Product unavailability</li>
                <li>Pricing errors</li>
                <li>Payment issues</li>
                <li>Suspected fraudulent transactions</li>
                <li>Incorrect customer information</li>
              </ul>
            </section>

            <section
              id="intellectual-property"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  5. Intellectual Property
                </h2>
              </div>
              <p>
                All website content including images, logos, product
                descriptions, videos, graphics, and designs belongs to Roop
                Shree and may not be copied, reproduced, or used without written
                permission.
              </p>
            </section>

            <section
              id="user-responsibilities"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  6. User Responsibilities
                </h2>
              </div>
              <p>
                Customers agree not to misuse the website, attempt unauthorized
                access, or engage in fraudulent activities.
              </p>
            </section>

            <section
              id="limitation-of-liability"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  7. Limitation of Liability
                </h2>
              </div>
              <p>
                Roop Shree shall not be liable for indirect or consequential
                damages arising from the use of our products or website.
              </p>
            </section>

            <section
              id="governing-law"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  8. Governing Law
                </h2>
              </div>
              <p>
                These Terms & Conditions shall be governed by the laws of India.
                Any disputes shall be subject to the jurisdiction of the
                competent courts in Rajasthan.
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
