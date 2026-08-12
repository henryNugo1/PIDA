import { LegalScreen } from "./legal-content";

export default function TermsOfServiceScreen() {
  return (
    <LegalScreen
      title="Terms of Service"
      subtitle="The rules for using PIDA and Goach."
      lastUpdated="August 12, 2026"
      sections={[
        {
          title: "Using PIDA",
          body: [
            "PIDA helps users set goals, create shifts, follow routines, receive reminders, and track progress. By using PIDA, you agree to use the app responsibly and only for lawful purposes.",
            "You are responsible for the goals, schedules, and personal information you add to the app.",
          ],
        },
        {
          title: "Goach",
          body: [
            "Goach is an AI goal coach inside PIDA. It helps turn user intent into realistic plans, goal cards, shifts, and routine suggestions.",
            "Goach may make mistakes. You should review any plan before using it, especially if it affects health, money, safety, school, work, or other important parts of your life.",
          ],
        },
        {
          title: "Subscriptions And Credits",
          body: [
            "Paid plans give users monthly Goach credits. Top-up packs add extra Goach credits without changing the current plan.",
            "Unused Goach credits may stay on your account depending on the active app rules shown at checkout or inside the pricing screen.",
          ],
        },
        {
          title: "Account Rules",
          body: [
            "You must keep your account secure and not share access with others. You may not use PIDA to abuse, harm, threaten, scam, or break the law.",
            "We may limit, suspend, or remove access if an account is used in a harmful, fraudulent, illegal, or abusive way.",
          ],
        },
        {
          title: "Availability",
          body: [
            "We work to keep PIDA available, but the app may sometimes be unavailable because of maintenance, internet problems, payment provider issues, AI provider issues, or other technical problems.",
          ],
        },
        {
          title: "Changes",
          body: [
            "PIDA may update features, pricing, credits, plans, or these terms over time. Important changes will be reflected inside the app or store listing where appropriate.",
          ],
        },
      ]}
    />
  );
}
