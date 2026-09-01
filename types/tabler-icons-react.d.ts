declare module "@tabler/icons-react" {
  import type { ComponentType, SVGProps } from "react"

  export type IconProps = SVGProps<SVGSVGElement> & {
    size?: string | number
    stroke?: string | number
  }

  export const IconBrandInstagram: ComponentType<IconProps>
  export const IconBrandFacebook: ComponentType<IconProps>
  export const IconBrandWhatsapp: ComponentType<IconProps>
  export const IconDeviceFloppy: ComponentType<IconProps>
  export const IconMail: ComponentType<IconProps>
  export const IconPhoto: ComponentType<IconProps>
  export const IconRefresh: ComponentType<IconProps>
  export const IconUser: ComponentType<IconProps>
  export const IconX: ComponentType<IconProps>
}
