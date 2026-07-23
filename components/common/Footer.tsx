import Image from "next/image";
import Link from "next/link";

import { FooterNewsletterForm } from "@/components/common/FooterNewsletterForm";
import { Button } from "@/components/ui/button";
import { getCatalogCategories } from "@/services/product.service";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconMail,
} from "@tabler/icons-react";

type FooterLink = {
  label: string;
  href: string;
};

const quickLinks: FooterLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Shop", href: "/shop" },
  { label: "Contact Us", href: "/contact" },
  { label: "Blogs", href: "/blogs" },
];
const customerServices: FooterLink[] = [
  { label: "Orders", href: "/dashboard/orders" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Shipping", href: "/shipping" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Returns & Refunds", href: "/returns-policy" },
];

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

const Footer = async () => {
  let categories: FooterLink[] = [];

  if (!isProductionBuild) {
    try {
      categories = (await getCatalogCategories(7)).map((category) => ({
        label: category.name,
        href: category.href,
      }));
    } catch (error) {
      console.error("Footer categories failed:", error);
    }
  }

  return (
    <footer className=" print:hidden relative overflow-hidden bg-[#F1E1CD] text-[#3F2617] md:bg-[#C39150]/15">
      <Image
        sizes="100vw"
        fill
        src="/footer-bg.png"
        alt=""
        className="hidden object-cover opacity-80 md:block"
      />
      <div className="relative mx-auto grid max-w-7xl gap-9 px-5 py-12 sm:px-6 md:grid-cols-[1.25fr_1fr_1fr_1fr_1.4fr] lg:px-8">
        <div>
          <Link href="/" className="relative mb-5 block h-20 w-32">
            <Image
              sizes="128px"
              fill
              src="/header-logo.png"
              alt="Roop Shree"
              className="object-contain object-left"
            />
          </Link>
          <p className="max-w-xs text-xs leading-5 text-[#3F2617]/70">
            Roopshree blends timeless tradition and modern elegance through
            beautifully crafted dupattas designed to add grace, charm, and
            confidence everywhere.
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              href={"https://www.facebook.com/profile.php?id=100090309849419"}
              target="_blank"
            >
              <Button
                aria-label="Facebook"
                size="icon-sm"
                variant="ghost"
                className="bg-[#FEEDD0] hover:bg-[#FEEDD0]"
              >
                <IconBrandFacebook className="size-6 text-[#3F2617]/70" />
              </Button>
            </Link>
            <Link
              href={"https://www.instagram.com/Roopshreebandhej"}
              target="_blank"
            >
              <Button
                aria-label="Instagram"
                size="icon-sm"
                variant="ghost"
                className="bg-[#FEEDD0] hover:bg-[#FEEDD0]"
              >
                <IconBrandInstagram className="size-6 text-[#3F2617]/70" />
              </Button>
            </Link>
            <Link href={"mailto:Adityagarwal23@gmail.com"}>
              <Button
                aria-label="Email"
                size="icon-sm"
                variant="ghost"
                className="bg-[#FEEDD0] hover:bg-[#FEEDD0]"
              >
                <IconMail className="size-6 text-[#3F2617]/70" />
              </Button>
            </Link>
          </div>
        </div>

        <FooterColumn title="Quick Links" items={quickLinks} />
        <FooterColumn title="Categories" items={categories} />
        <FooterColumn title="Customer Services" items={customerServices} />

        <div>
          <h2 className="mb-5 text-xl font-medium text-[#3F2617]">
            Newsletter Subscription
          </h2>
          <FooterNewsletterForm />
          <p className="mt-5 text-xs leading-5 text-[#3F2617]/70">
            Your feedback helps us grow. Share your thoughts and suggestions
            with us anytime.
          </p>
        </div>
      </div>

      <div className="relative border-t border-[#C39150] bg-[#FAEBD8]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-[#3F2617]/70 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 Roopshree. All rights reserved.</p>

          <p>
            Designed & Developed by{" "}
            <Link
              href="https://www.avtechnosys.com"
              target="_blank"
              className="font-semibold text-[#3F2617]"
            >
              AV Technosys
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: FooterLink[];
}) {
  return (
    <div>
      <h2 className="mb-5 text-xl font-medium text-[#3F2617]">{title}</h2>
      <ul className="space-y-3 text-sm text-[#3F2617]/70">
        {items.map((item) => (
          <li key={`${title}-${item.href}-${item.label}`}>
            <Link
              href={item.href}
              className="transition-colors font-semibold hover:text-[#C18F50]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Footer;
