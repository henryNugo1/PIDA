import { LegalScreen } from "./legal-content";

export default function RefundPolicyScreen() {
  return (
    <LegalScreen
      title="Refund Policy"
      subtitle="How PIDA handles subscriptions, top-ups, and cancellations."
      lastUpdated="August 12, 2026"
      sections={[
        {
          title: "Subscriptions",
          body: [
            "PIDA subscriptions renew monthly unless cancelled. If you cancel a subscription, your paid access remains active until the end of the current paid billing period.",
            "Cancelling a subscription stops future renewal. It does not automatically refund the current billing period.",
          ],
        },
        {
          title: "Goach Credit Top-Ups",
          body: [
            "Top-up credit packs are one-time digital purchases. Once credits are added to your account, they are generally not refundable unless there is a duplicate charge, failed credit delivery, or another clear payment error.",
          ],
        },
        {
          title: "When Refunds May Be Considered",
          body: [
            "Refunds may be considered when you were charged twice for the same item, paid but did not receive the plan or credits, or experienced a verified billing issue caused by PIDA or a payment provider.",
            "Refund requests may require your account email, payment reference, billing provider, date of payment, and a short explanation of the problem.",
          ],
        },
        {
          title: "Payment Providers",
          body: [
            "Payments may be handled by providers such as Paystack or Paddle. Some refunds, chargebacks, taxes, fees, and payment questions may be controlled by the payment provider's own rules.",
          ],
        },
        {
          title: "How To Request Help",
          body: [
            "If something goes wrong with a payment, use Help & Support in the PIDA app or email support@mypida.com. Include your account email and Paddle transaction ID. We usually respond within 2 business days.",
          ],
        },
      ]}
    />
  );
}
