import { Studio } from "sanity";
import config from "@/sanity.config";

export default function StudioPage() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <Studio config={config} />
    </div>
  );
}
