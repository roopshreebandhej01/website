import Image from "next/image";
import Link from "next/link";

import { ContactEnquiryForm } from "@/components/contact/ContactEnquiryForm";
import Hero from "@/components/contact/Hero";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { getCatalogCategories } from "@/services/product.service";

type TablerIconName = "map-pin" | "phone" | "brand-whatsapp" | "mail";

const contactItems = [
  {
    title: "Address",
    body: "Roop Shree Inside Tabela Gate,\nSikar, Rajasthan - 332001.",
    icon: "map-pin",
  },
  {
    title: "Phone",
    body: "+91-9783841066",
    link: "tel:9783841066",
    icon: "phone",
  },
  {
    title: "WhatsApp",
    body: "Chat on WhatsApp\n+91-7627028842",
    link: "https://wa.me/917627028842?text=Hi",
    icon: "brand-whatsapp",
  },
  {
    title: "Email",
    body: "Adityagarwal23@gmail.com\nWe reply within 24 hrs",
    link: "mailto:Adityagarwal23@gmail.com",
    icon: "mail",
  },
] satisfies {
  title: string;
  body: string;
  icon: TablerIconName;
  link?: string;
}[];

export const metadata: Metadata = {
  title: "Contact Us for Bandhani Sarees, Dupattas & Custom Orders | Roopshree",
  description:
    "Get in touch with Roopshree for enquiries about Bandhej sarees, dupattas, custom orders, or bulk requests. Reach us via phone, email, or WhatsApp. Shop now.",
  alternates: {
    canonical: "https://roopshreebandhej.com/contact",
  },
  openGraph: {
    title:
      "Contact Us for Bandhani Sarees, Dupattas & Custom Orders | Roopshree",
    description:
      "Get in touch with Roopshree for enquiries about Bandhej sarees, dupattas, custom orders, or bulk requests. Reach us via phone, email, or WhatsApp. Shop now.",
    url: "https://roopshreebandhej.com/contact",
    type: "website",
    images: [{ url: "https://roopshreebandhej.com/contact/contact_bg.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Contact Us for Bandhani Sarees, Dupattas & Custom Orders | Roopshree",
    description:
      "Get in touch with Roopshree for enquiries about Bandhej sarees, dupattas, custom orders, or bulk requests. Reach us via phone, email, or WhatsApp. Shop now.",
  },
};

async function contact() {
  let categoryNames = ["Bandhej Sarees", "Bandhej Dupattas"];
  try {
    const categoriesData = await getCatalogCategories(100);
    if (categoriesData && categoriesData.length > 0) {
      categoryNames = categoriesData.map((c) => c.name);
    }
  } catch (error) {
    console.error("Failed to load contact categories:", error);
  }

  if (!categoryNames.includes("Custom Order")) {
    categoryNames.push("Custom Order");
  }

  return (
    <div className="bg-white">
      <Hero />
      <section className="bg-white px-3 md:px-5 py-10 text-[#3F2617] sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:gap-y-0 rounded-[2px] border border-[#C39150]/30 bg-[#F7EFE6] px-5 py-8 shadow-sm md:grid-cols-4 md:px-8 md:py-10">
            {contactItems.map((item, index) => {
              return (
                <div
                  key={item.title}
                  className={`flex flex-col items-center md:px-4 py-2 md:py-6 text-center ${
                    index > 0 ? "md:border-l md:border-[#C39150]/25" : ""
                  }`}
                >
                  <span className="flex size-16 items-center justify-center rounded-full bg-[#C39150] text-white md:size-20">
                    <TablerIcon
                      name={item.icon}
                      className="size-6 md:size-7"
                      strokeWidth={1.8}
                    />
                  </span>
                  <h2 className="mt-5 font-heading text-lg font-semibold md:text-xl">
                    {item.title}
                  </h2>
                  <Link href={item.link ?? "#"}>
                    <p className="mt-3 whitespace-pre-line text-xs leading-5 text-[#22140f] md:text-sm">
                      {item.body}
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="mt-20 grid gap-14 lg:grid-cols-2 lg:gap-16 lg:items-start">
            <div>
              <h2 className="font-heading text-4xl font-semibold leading-tight text-[#17110d] md:text-[2.75rem]">
                Send Us an Enquiry
              </h2>
              <SectionEyebrow />
              <div className="mt-8 space-y-2 text-sm leading-5 text-[#3F2617]/75">
                <p>We welcome you to our studio.</p>
                <p>Come experience the art of Bandhej up close.</p>
              </div>

              <ContactEnquiryForm initialCategories={categoryNames} />
            </div>

            <div>
              <h2 className="font-heading text-4xl font-semibold leading-tight text-[#17110d] md:text-[2.75rem]">
                Visit Our Studio
              </h2>
              <SectionEyebrow />
              <div className="mt-8 space-y-2 text-sm leading-5 text-[#3F2617]/75">
                <p>Have a question or need help?</p>
                <p>Fill out the form and we&apos;ll get back to you.</p>
              </div>

              <div className="mt-7 overflow-hidden bg-[#F7EFE6] shadow-sm">
                <iframe
                  title="Roop Shree location map"
                  src="https://www.google.com/maps?q=Tabela%20Gate%20Sikar%20Rajasthan%20332001&output=embed"
                  className="h-[22rem] w-full border-0 md:h-[30rem] lg:h-[28rem]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#F7EFE6]">
        <Image
          height={700}
          width={700}
          src="/new_banners/Frame 1984079525.png"
          alt="Red Bandhej fabric with flowers"
          className="object-cover absolute inset-0 w-full h-full object-center"
        />
        <div className="relative mx-auto flex min-h-[21rem] max-w-7xl items-center px-5 py-14 sm:px-6 lg:px-8">
          <div className="max-w-xl text-[#17110d]">
            <h2 className="font-heading text-4xl leading-tight md:text-5xl">
              We&apos;d <span className="text-[#C39150]">love</span> to Hear
              from You
            </h2>
            <p className="mt-6 max-w-md text-sm leading-6 text-[#3F2617]/75">
              Whether it&apos;s a custom request, a bulk order, or just a query
              — we&apos;re here to help.
            </p>
            <Button
              asChild
              className="mt-9 h-12 rounded-[2px] bg-[#C39150] px-9 text-sm font-semibold text-white hover:bg-[#3F2617]"
            >
              <Link href="https://wa.me/917627028842">
                <TablerIcon
                  name="brand-whatsapp"
                  className="size-4"
                  strokeWidth={2}
                />
                Chat on WhatsApp
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function TablerIcon({
  name,
  className,
  strokeWidth = 2,
}: {
  name: TablerIconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      {name === "map-pin" ? (
        <>
          <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
          <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" />
        </>
      ) : null}
      {name === "phone" ? (
        <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
      ) : null}
      {name === "brand-whatsapp" ? (
        <>
          <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
          <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
        </>
      ) : null}
      {name === "mail" ? (
        <>
          <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10" />
          <path d="M3 7l9 6l9 -6" />
        </>
      ) : null}
    </svg>
  );
}

function SectionEyebrow() {
  return (
    <div className="mt-4 flex items-center gap-2 text-[#C39150]">
      <span className="size-2.5 rotate-45 bg-[#C39150]" />
      <span className="h-px w-28 bg-linear-to-r from-[#C39150] to-transparent" />
    </div>
  );
}

export default contact;
