import { PricingTable } from "@clerk/nextjs";

export const metadata = {
  title: "Pricing · Pdfied",
  description: "Choose the plan that fits the way you read.",
};

const PricingPage = () => {
  return (
    <main className="clerk-subscriptions">
      <h1 className="page-title-xl">Choose your plan</h1>
      <p className="page-description max-w-2xl">
        Unlock more books, longer voice sessions, and full conversation history.
        Upgrade or downgrade anytime.
      </p>

      <div className="clerk-pricing-table-wrapper mt-10 w-full">
        <PricingTable />
      </div>
    </main>
  );
};

export default PricingPage;
