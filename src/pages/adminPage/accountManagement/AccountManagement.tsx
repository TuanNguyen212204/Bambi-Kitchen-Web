import type { JSX } from "react";
import { HeaderSection } from "./components/HeaderSection";
import MainContentSection from "./components/MainContentSection";

export default function AccountManagement(): JSX.Element {
  return (
    <div className="bg-[linear-gradient(0deg,rgba(255,247,237,1)_0%,rgba(255,247,237,1)_100%),linear-gradient(0deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_100%)] w-full min-w-[1920px] flex flex-col">
      <HeaderSection />
      <MainContentSection />
    </div>
  );
}
