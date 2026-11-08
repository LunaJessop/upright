export const LEGAL_LAST_UPDATED = "November 8, 2026";
export const LEGAL_CONTACT_EMAIL = "uprightmrp@gmail.com";
export const LEGAL_DRAFT_COMMENT = "DRAFT - review before launch";

export const PRIVACY_SECTIONS = [
  {
    title: "What this draft is",
    paragraphs: [
      "This is a plain-language draft of how Upright handles information. It is not legal advice, and it does not claim a compliance seal. Read it before launch and replace anything that is wrong.",
      "Upright is operations software for handmakers: items, recipes, batches, inventory, and the people on a shop account.",
    ],
  },
  {
    title: "Information you give us",
    paragraphs: [
      "When you create an account we store the company name, your name, your email address, and a hash of your password. We do not store the password itself.",
      "What you type into the shop is stored too: items, recipes, vendors, tags, inventory, batches, and notes you add. People you invite are stored the same way, with their name, email, role, and password hash.",
    ],
  },
  {
    title: "Where it is stored",
    paragraphs: [
      "Account and shop data sit in a Postgres database on Neon. The API that reads and writes that database is hosted on Vercel. The website may be served by Netlify or Vercel.",
      "Those hosts can see ordinary request details, such as your IP address, browser, and the page or API call you made. They do not get a separate copy of your recipes beyond what the app stores in the database.",
    ],
  },
  {
    title: "Payments",
    paragraphs: [
      "Subscriptions are billed by Stripe. You can choose a monthly or yearly plan at checkout. The founder on the account can open Stripe's billing portal from Upright to update a card or cancel.",
      "We never store card numbers. Stripe keeps the card. We store Stripe's customer id, subscription id, price id, status, and the end of the current period. When support looks at billing, Stripe can show the card brand and last four digits. That is not the full card number.",
    ],
  },
  {
    title: "If a payment fails or you cancel",
    paragraphs: [
      "If a payment fails, the shop stays editable during a grace period. That period is 7 days unless a different length is configured. The app tells the founder how many days are left and links to Stripe to update the card. While the subscription is past due, support can extend that grace, up to 90 days at a time.",
      "After the grace period, or after the subscription is canceled, the shop becomes read-only. You can still look at your data. Changes, such as editing items or starting a batch, wait until billing is active again.",
    ],
  },
  {
    title: "Email",
    paragraphs: [
      "We send transactional email, such as password reset, welcome, and invite messages. Those messages go out through Gmail. If Gmail is not configured, a backup sender (Resend) may send them instead, or the message may not be sent.",
      `Replies go to ${LEGAL_CONTACT_EMAIL} unless a different support address is configured. We do not send marketing mail from this system.`,
    ],
  },
  {
    title: "Analytics",
    paragraphs: [
      "We use PostHog to see how the product is used: page views and product events. Session replay is turned on so we can watch a visit when something breaks. Text you type into inputs is masked in those recordings.",
      "Before an event is sent, we strip passwords, reset links, and fields that look like card numbers. Your email can be attached to the analytics profile for the signed-in user. We use this to run the product. We do not sell it.",
    ],
  },
  {
    title: "When support looks at your shop",
    paragraphs: [
      "If you ask for help, a platform admin can open a read-only view of your shop. They have to enter a reason first. In that view they can look around and cannot change your data. The view lasts about 30 minutes unless they stop it sooner.",
      "Starting and ending that view is written to an activity log, including the reason. You can email us if you want to know what was opened.",
    ],
  },
  {
    title: "A copy of your data, or deletion",
    paragraphs: [
      `Email ${LEGAL_CONTACT_EMAIL} to ask for a copy of your shop's data or to ask us to delete it. We will use the account email to confirm the request.`,
      "We may keep a limited billing record after deletion when we need it to resolve a charge. We do not sell your information to anyone.",
    ],
  },
];

export const TERMS_SECTIONS = [
  {
    title: "What this draft is",
    paragraphs: [
      "These are draft terms for using Upright. They describe how the product works today. They are not legal advice, and they do not claim a compliance seal. Review them before launch.",
      "Upright is a tool for a handmaker's shop: items, recipes, batches, and inventory. You are responsible for the recipes, stock counts, and prices you enter.",
    ],
  },
  {
    title: "Your account",
    paragraphs: [
      "You need an account to use the app. Keep your password to yourself. The founder who creates the shop manages billing and can invite other people. Those people see and, when their role allows it, edit the same shop data.",
      "By creating an account you agree to these terms and to the privacy policy.",
    ],
  },
  {
    title: "Your shop data",
    paragraphs: [
      "You keep ownership of the items, recipes, vendors, and batches you enter. You let us store and display that data so the product can run, including showing it back to the people on your account.",
      "If you ask for help, support may open a read-only view of the shop after recording a reason. They cannot change data in that view. The view is logged and lasts about 30 minutes unless they stop it sooner.",
    ],
  },
  {
    title: "Plans, payment, and cancellation",
    paragraphs: [
      "The founder picks a monthly or yearly subscription and pays through Stripe. We never store card numbers. Card details stay with Stripe. You can update the card or cancel from the billing portal linked in the app. The plan pages say you can cancel anytime. Canceling stops future edits once the subscription is no longer active. You can still view what you already entered.",
      "If a payment fails, editing stays available for a grace period of 7 days unless a different length is configured. After that, the shop is read-only until the payment is updated. While a bill is past due, support can extend the grace, up to 90 days at a time. We do not promise refunds in this draft.",
    ],
  },
  {
    title: "What we expect from you",
    paragraphs: [
      "Use the shop for your own work. Do not try to open another company's data, probe the service for weaknesses, or upload anything you do not have the right to store.",
      "Do not rely on Upright as the only copy of something you cannot afford to lose. Ask us for an export if you want a copy. Email " +
        LEGAL_CONTACT_EMAIL +
        ".",
    ],
  },
  {
    title: "Availability",
    paragraphs: [
      "We work to keep Upright available, but we do not promise that it will be error-free or always up. The website may be served by Netlify or Vercel. The API and the Postgres database (Neon) can fail or be maintained.",
      "This draft does not claim a security seal or a compliance badge.",
    ],
  },
  {
    title: "Ending use",
    paragraphs: [
      `Cancel the subscription in the Stripe billing portal if you want to stop paying. Email ${LEGAL_CONTACT_EMAIL} if you want the shop's data deleted. Until it is deleted, a canceled shop can still be viewed by people on the account, without editing.`,
    ],
  },
  {
    title: "Changes and contact",
    paragraphs: [
      `If these terms change, the date at the top of the page changes with them. Questions go to ${LEGAL_CONTACT_EMAIL}.`,
    ],
  },
];

export function legalPlainText(sections) {
  return sections
    .flatMap((section) => [section.title, ...section.paragraphs])
    .join("\n");
}
