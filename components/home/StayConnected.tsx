import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { NEXT_PUBLIC_S3_BASE_URL } from "@/env";
import { IconBrandFacebook } from "@tabler/icons-react";

const s3Base = NEXT_PUBLIC_S3_BASE_URL.replace(/\/$/, "");

const instagramVideos = [
  `${s3Base}/videos/IMG_2301.mp4`,
  `${s3Base}/videos/IMG_2302.mp4`,
  `${s3Base}/videos/IMG_2332.mp4`,
  `${s3Base}/videos/IMG_6730.mp4`,
];

const facebookVideos = [
  `${s3Base}/videos/IMG_2667.mp4`,
  `${s3Base}/videos/IMG_3035.mp4`,
  `${s3Base}/videos/IMG_4894.mp4`,
  `${s3Base}/videos/IMG_6634.mp4`,
];

const InstagramMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <circle cx="12" cy="12" r="3.5" />
    <circle cx="17" cy="7" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);
const StayConnected = () => {
  return (
    <div>
      {/* Instagram Section (Light Theme) */}
      <section className="relative isolate overflow-hidden bg-[#efe0cf] py-10 sm:py-14 lg:py-16">
        <Image
          src="/home/connected_bg.png"
          alt=""
          height={700}
          width={700}
          className=" object-cover w-full h-auto absolute inset-0"
        />

        <div className="relative mx-auto max-w-7xl px-5 text-center sm:px-6 lg:px-8">
          <h2 className="mt-3 font-semibold text-2xl leading-tight text-[#3f2617] sm:text-5xl lg:text-6xl">
            Follow Roopshree on Instagram
          </h2>

          <div className="mx-auto mt-4 flex w-52 items-center justify-center gap-3 text-[#c39150]">
            <span className="h-px flex-1 bg-linear-to-r from-transparent to-[#c39150]" />
            <span className="size-2.5 rotate-45 bg-[#C39150]" />
            <span className="h-px flex-1 bg-linear-to-l from-transparent to-[#c39150]" />
          </div>

          <p className="mx-auto mt-4 max-w-[19rem] text-[0.82rem] font-medium leading-[1.65] text-[#6b625d] sm:max-w-3xl sm:text-lg">
            Get inspired by our latest collections, styling ideas, and behind
            the scenes moments. Follow us on social media and be part of the
            Roopshree family.
          </p>

          <div className="scrollbar-hidden mx-auto mt-9 flex max-w-5xl snap-x gap-3 overflow-x-auto px-[calc(50%-9.5rem)] sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
            {instagramVideos.map((video, index) => (
              <Link
                key={index}
                href="https://www.instagram.com/Roopshreebandhej"
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-[3/4] w-[19rem] shrink-0 snap-center border-[5px] border-[#F1E1CD] bg-[#eadac6] shadow-sm sm:w-auto overflow-hidden group rounded-[2px]"
              >
                <video
                  src={video}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="object-cover w-full h-full transition duration-500 group-hover:scale-[1.04]"
                />
              </Link>
            ))}
          </div>

          <Button
            asChild
            className="mt-9 h-10 bg-[#C39150] px-9 text-sm font-semibold text-white shadow-none hover:bg-[#efe0cf] hover:text-[#3F2617] sm:h-12 sm:min-w-[21rem] sm:px-8 sm:text-xl"
          >
            <Link
              href="https://www.instagram.com/Roopshreebandhej"
              target="_blank"
            >
              <InstagramMark className="size-5 sm:size-7" />
              Follow us on Instagram
            </Link>
          </Button>
        </div>
      </section>

      {/* Facebook Section (Dark Theme) */}
      <section className="relative isolate overflow-hidden bg-[#3F2617] py-10 sm:py-14 lg:py-16">
        <Image
          src="/home/connected_bg.png"
          alt=""
          height={700}
          width={700}
          sizes="100vw"
          className=" object-cover w-full h-auto absolute inset-0 opacity-10 mix-blend-overlay"
        />

        <div className="relative mx-auto max-w-7xl px-5 text-center sm:px-6 lg:px-8">
          <h2 className="mt-3 font-semibold text-2xl leading-tight text-white sm:text-5xl lg:text-6xl">
            Follow Roopshree on Facebook
          </h2>

          <div className="mx-auto mt-4 flex w-52 items-center justify-center gap-3 text-[#c39150]">
            <span className="h-px flex-1 bg-linear-to-r from-transparent to-[#c39150]" />
            <span className="size-2.5 rotate-45 bg-[#C39150]" />
            <span className="h-px flex-1 bg-linear-to-l from-transparent to-[#c39150]" />
          </div>

          <p className="mx-auto mt-4 max-w-[19rem] text-[0.82rem] font-medium leading-[1.65] text-[#efe0cf]/70 sm:max-w-3xl sm:text-lg">
            Stay updated with our latest announcements, user reviews, and
            events. Connect with our community on Facebook.
          </p>

          <div className="scrollbar-hidden mx-auto mt-9 flex max-w-5xl snap-x gap-3 overflow-x-auto px-[calc(50%-9.5rem)] sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
            {facebookVideos.map((video, index) => (
              <Link
                key={index}
                href="https://www.facebook.com/profile.php?id=100090309849419"
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-[3/4] w-[19rem] shrink-0 snap-center border-[5px] border-[#c39150]/30 bg-[#2d180f] shadow-sm sm:w-auto overflow-hidden group rounded-[2px]"
              >
                <video
                  src={video}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="object-cover w-full h-full transition duration-500 group-hover:scale-[1.04]"
                />
              </Link>
            ))}
          </div>

          <Button
            asChild
            className="mt-9 h-10 bg-[#C39150] px-9 text-sm font-semibold text-white shadow-none hover:bg-[#efe0cf] hover:text-[#3F2617] sm:h-12 sm:min-w-[21rem] sm:px-8 sm:text-xl"
          >
            <Link
              href="https://www.facebook.com/profile.php?id=100090309849419"
              target="_blank"
            >
              <IconBrandFacebook className="size-5 sm:size-7 fill-current" />
              Follow us on Facebook
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default StayConnected;
