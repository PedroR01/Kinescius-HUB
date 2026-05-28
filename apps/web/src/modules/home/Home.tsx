import { HomeNavbar } from "./components/HomeNavbar";
import { HomeHero } from "./components/HomeHero";
import { TeamSection } from "./components/TeamSection";
import { RecoveryBanner } from "./components/RecoveryBanner";
import { SiteFooter } from "./components/SiteFooter";

export function Home() {
  return (
    <div className="min-h-svh ">
      <HomeNavbar />
      <main>
        <HomeHero />
        <TeamSection />
        <RecoveryBanner />
      </main>
      <SiteFooter />
    </div>
  );
}
