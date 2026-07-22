import { Suspense } from "react"
import Link from "next/link"
// @ts-ignore
import { IconBrandWhatsapp } from "@tabler/icons-react"

import Footer from "@/components/common/Footer"
import Header from "@/components/common/Header"
import { StoreHydrator } from "@/components/global/StoreHydrator"
import { getCurrentSession } from "@/lib/auth"


export default async function Layout({ children }: {
    children: React.ReactNode
}) {
   const session = await getCurrentSession()
   

    return <>
      <StoreHydrator isAuthenticated={Boolean(session)} />
      <Suspense>
        <Header isAuthenticated={Boolean(session)} />
      </Suspense>
        {children}
       <Footer />
       <Link 
          href="https://wa.me/917627028842?text=Hi"
          target="_blank"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
       >
          <IconBrandWhatsapp size={32} />
       </Link>
    </>
}
