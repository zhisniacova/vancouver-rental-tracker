export const DEFAULT_MESSAGE_TEMPLATE = `Hello {{contact_name}},

I hope this message finds you well! My name is {{full_name}}, and I'm reaching out about "{{listing_title}}" ({{listing_url}}).

My partner and I are very interested in the place. It looks like a strong fit, and I would love to know whether it is still available.

A bit about us:
{{about_us}}

If the listing is still available, I'd be happy to arrange a viewing or answer any questions.

Thank you very much, and I look forward to hearing from you.

Best,
{{full_name}}
{{account_email}}
{{phone_number}}`;

export const DEFAULT_ABOUT_US =
  "We are responsible, clean, and quiet tenants looking for a long-term rental. We can provide references and any other information you may need.";

export const TEMPLATE_VARIABLES = [
  {
    key: "contact_name",
    label: "Contact name",
    description: "Listing contact or landlord name",
  },
  {
    key: "listing_title",
    label: "Listing title",
    description: "The saved listing title",
  },
  {
    key: "listing_url",
    label: "Listing URL",
    description: "Original listing link",
  },
  {
    key: "full_name",
    label: "Full name",
    description: "Your profile full name",
  },
  {
    key: "about_us",
    label: "About us",
    description: "Reusable intro from settings",
  },
  {
    key: "account_email",
    label: "Account email",
    description: "Your login/contact email",
  },
  {
    key: "phone_number",
    label: "Phone number",
    description: "Your profile phone number",
  },
] as const;

export type TemplateVariableKey = (typeof TEMPLATE_VARIABLES)[number]["key"];

export type MessageTemplateValues = Record<TemplateVariableKey, string>;

export function renderMessageTemplate(
  template: string,
  values: MessageTemplateValues
) {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (match, key) => {
    return key in values ? values[key as TemplateVariableKey] : match;
  });
}
