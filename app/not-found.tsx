import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Home, Search, Frown } from "lucide-react";

import { Button } from "@/components/ui/button";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { ToastProvider } from "@/components/common/ToastProvider";

const NotFound = () => {
  return (
    <ToastProvider>
      <main className="relative isolate min-h-svh overflow-hidden bg-[#fff7ef] px-5 py-12 text-center py-20">
        <Suspense>
          <Header />
        </Suspense>
        <Image
          src="/404.png"
          alt=""
          height={700}
          width={700}
          priority
          className="object-cover absolute inset-0 w-full h-full object-center"
        />

        <div className="relative mx-auto py-12 max-w-7xl">
          <div className="mx-auto max-w-xl">
            <div className="flex items-center justify-center gap-3 text-[6rem] font-bold leading-none text-[#3f2617] sm:text-[7.5rem]">
              <span>4</span>
              <span className="flex size-20 items-center justify-center rounded-full border-[10px] border-[#d9ad72] text-[#d9ad72] sm:size-24">
                <Frown className="size-11 sm:size-14" strokeWidth={2.4} />
              </span>
              <span>4</span>
            </div>

            <h1 className="mt-8 font-heading text-2xl font-semibold text-[#c39150] sm:text-3xl">
              Oops! We lost that page.
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-5 text-[#6b625d]">
              The product or page you&apos;re looking for might have been moved,
              deleted, or never existed in the first place.
            </p>

            <form className="mx-auto mt-6 flex h-12 max-w-md border border-[#3f2617]/45 bg-white/75 p-1 shadow-sm">
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <Search className="size-4 text-[#6b625d]" />
                <input
                  type="search"
                  placeholder="Search for products, brands..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8f8882]"
                />
              </label>
              <Button className="h-full rounded-[2px] bg-[#c39150] px-6 text-sm text-white hover:bg-[#3f2617]">
                Find it
              </Button>
            </form>

            <Button
              asChild
              className="mt-6 h-11 rounded-[3px] bg-[#c39150] px-6 text-sm font-semibold text-white hover:bg-[#3f2617]"
            >
              <Link href="/">
                <Home className="size-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    </ToastProvider>
  );
};

export default NotFound;
