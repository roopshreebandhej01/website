import { Metadata } from "next";
import Link from "next/link";
import { PolicySidebar } from "@/components/common/PolicySidebar";

export const metadata: Metadata = {
  title: "Returns & Refund Policy | Roopshree Shopping Policies",
  description:
    "Read Roopshree's Orders, Returns & Refund Policy covering return conditions, non-returnable items, processing timelines, and exchanges.",
  alternates: {
    canonical: "https://roopshreebandhej.com/returns-policy",
  },
  openGraph: {
    title: "Returns & Refund Policy | Roopshree Shopping Policies",
    description:
      "Read Roopshree's Orders, Returns & Refund Policy covering return conditions, non-returnable items, processing timelines, and exchanges.",
    url: "https://roopshreebandhej.com/returns-policy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Returns & Refund Policy | Roopshree Shopping Policies",
    description:
      "Read Roopshree's Orders, Returns & Refund Policy covering return conditions, non-returnable items, processing timelines, and exchanges.",
  },
};

const sidebarItems = [
  { id: "placing-an-order", label: "Placing an Order" },
  { id: "order-cancellation", label: "Order Cancellation" },
  { id: "returns", label: "Returns" },
  { id: "return-conditions", label: "Return Conditions" },
  { id: "non-returnable-products", label: "Non-Returnable Products" },
  { id: "refunds", label: "Refunds" },
  { id: "exchange", label: "Exchange" },
  { id: "contact-us", label: "Contact Us" },
];

export default function ReturnsPolicy() {
  return (
    <main className="flex-1 bg-white">
      {/* Premium Hero Header */}
      <div className="bg-gradient-to-b from-[#FDF9F4] to-white border-b border-[#C39150]/15 pb-12 pt-28 md:pb-20 md:pt-36">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C39150] md:text-sm">
            Roop Shree Policies
          </p>
          <h1 className="mt-3 font-heading text-4xl font-semibold text-[#3F2617] md:text-5xl lg:text-6xl">
            Returns & Refund Policy
          </h1>
          <div className="mt-4 flex items-center justify-center gap-2 text-[#C39150]">
            <span className="size-1.5 rotate-45 bg-[#C39150]" />
            <span className="h-px w-12 bg-[#C39150]/30" />
            <span className="size-2.5 rotate-45 bg-[#C39150]" />
            <span className="h-px w-12 bg-[#C39150]/30" />
            <span className="size-1.5 rotate-45 bg-[#C39150]" />
          </div>
          <p className="mt-5 text-sm text-[#3F2617]/70">
            Learn about placing orders, cancellation rules, eligible return
            conditions, refunds, and exchanges.
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
              id="placing-an-order"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  Placing an Order
                </h2>
              </div>
              <p>
                After placing an order, customers will receive an order
                confirmation via email, SMS, or WhatsApp.
              </p>
            </section>

            <section
              id="order-cancellation"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  Order Cancellation
                </h2>
              </div>
              <ul className="list-none space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-[#C39150] border">•</span>
                  <span>
                    Orders may be cancelled before dispatch by contacting our
                    customer support.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C39150] mt-1.5">•</span>
                  <span>
                    Once dispatched, cancellation requests cannot be accepted.
                  </span>
                </li>
              </ul>
            </section>

            <section
              id="returns"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  Returns
                </h2>
              </div>
              <p className="mb-3">
                As our products include handcrafted, traditional, and textile
                items, returns are accepted only in the following situations:
              </p>
              <ul className="list-none space-y-3 pl-4">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1.5">•</span>
                  <span>Wrong product received</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1.5">•</span>
                  <span>Damaged product received</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1.5">•</span>
                  <span>Manufacturing defect</span>
                </li>
              </ul>
            </section>

            <section
              id="return-conditions"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  Return Conditions
                </h2>
              </div>
              <ul className="list-none space-y-3">
                <li className="flex items-start gap-2 bg-yellow-50/50 border border-yellow-200/50 rounded p-3">
                  <span className="text-[#C39150] font-semibold">
                    Important:
                  </span>
                  <span>
                    Return request must be raised within{" "}
                    <strong>48 hours</strong> of delivery.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C39150] mt-1.5">•</span>
                  <span>
                    The product must be unused, unwashed, and in its original
                    packaging with all tags intact.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C39150] mt-1.5">•</span>
                  <span>
                    Clear photos or videos may be required for verification.
                  </span>
                </li>
              </ul>
            </section>

            <section
              id="non-returnable-products"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  Non-Returnable Products
                </h2>
              </div>
              <p className="mb-3">Returns will not be accepted for:</p>
              <ul className="list-none space-y-3 pl-4">
                <li className="flex items-start gap-2">
                  <span className="text-[#C39150] mt-1.5">•</span>
                  <span>Customized or personalized products</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C39150] mt-1.5">•</span>
                  <span>Used or washed products</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C39150] mt-1.5">•</span>
                  <span>Products damaged after delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C39150] mt-1.5">•</span>
                  <span>
                    Slight colour variations due to photography or screen
                    settings
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C39150] mt-1.5">•</span>
                  <span>Natural variations in handcrafted products</span>
                </li>
              </ul>
            </section>

            <section
              id="refunds"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  Refunds
                </h2>
              </div>
              <p className="mb-3">After inspection and approval:</p>
              <ul className="list-none space-y-3 pl-4">
                <li className="flex items-start gap-2">
                  <span className="text-[#C39150] mt-1.5">•</span>
                  <span>
                    Refunds will be processed within{" "}
                    <strong>5–7 business days</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C39150] mt-1.5">•</span>
                  <span>
                    Refunds will be made to the original payment method.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C39150] mt-1.5">•</span>
                  <span>
                    Shipping charges are generally non-refundable unless the
                    error is from our side.
                  </span>
                </li>
              </ul>
            </section>

            <section
              id="exchange"
              className="scroll-mt-28 border-b border-[#C39150]/10 pb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2 rotate-45 bg-[#C39150]" />
                <h2 className="font-heading text-xl font-semibold text-[#3F2617] md:text-2xl">
                  Exchange
                </h2>
              </div>
              <p>Exchange requests are subject to product availability.</p>
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
                        href="https://wa.me/919529888006"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-sm text-[#3F2617]/80 hover:text-[#C39150] transition-colors hover:underline"
                      >
                        Chat on WhatsApp (+91 95298 88006)
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
