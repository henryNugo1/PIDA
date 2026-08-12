import { LegalScreen } from "./legal-content";

export default function PrivacyPolicyScreen() {
  return (
    <LegalScreen
      title="Privacy Policy"
      subtitle="How PIDA handles account, goal, payment, and app data."
      lastUpdated="August 12, 2026"
      sections={[
        {
          title: "What PIDA Collects",
          body: [
            "PIDA collects the information needed to run your account, such as your name, email address, gender, country, date of birth, subscription status, Goach credits, goals, shifts, reminders, progress history, and app settings.",
            "When you use Goach, your messages and goal details may be sent to our AI service provider so Goach can understand your request and help create or update a plan.",
          ],
        },
        {
          title: "How We Use Your Information",
          body: [
            "We use your information to sign you in, personalize your experience, create goal cards, schedule shifts, track progress, manage Goach credits, process payments, and improve the app.",
            "We do not sell your personal information. We only share data with trusted services needed to operate PIDA, such as authentication, database, AI, payment, email, image, and hosting providers.",
          ],
        },
        {
          title: "Payments",
          body: [
            "PIDA uses payment providers such as Paystack and Paddle to process subscriptions and credit purchases. Payment card details are handled by those providers and are not stored by PIDA.",
            "We store payment status, plan type, billing provider, subscription identifiers, and credit updates so your account can receive the correct access.",
          ],
        },
        {
          title: "Your Goals And AI Messages",
          body: [
            "Your goals, shifts, progress, and Goach chats are used to help you plan and follow your routines. You should avoid adding sensitive information that is not needed for your goal.",
            "Goach can help create plans, but it does not replace professional medical, legal, financial, or mental health advice.",
          ],
        },
        {
          title: "Your Choices",
          body: [
            "You can update your profile, change your plan, cancel subscriptions, and stop using the app at any time.",
            "If you need help with your account or data, contact PIDA support through the support channel provided in the app or store listing.",
          ],
        },
        {
          title: "Data Security",
          body: [
            "We use reasonable technical and organizational measures to protect user data. No system is perfect, so users should keep their login details private and report suspicious activity.",
          ],
        },
      ]}
    />
  );
}
