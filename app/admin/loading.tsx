import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className=" p-6">
      <Loader2 className=" animate-spin duration-100 h-4 w-4 " />
    </div>
  );
}
