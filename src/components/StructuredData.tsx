import { useHead } from "@unhead/react";
import { useTranslation } from "react-i18next";
import { useTranslatedPortfolio } from "@/hooks/useTranslatedPortfolio";

const SITE_URL = "https://uetuluk.com";

export function StructuredData() {
  const { i18n } = useTranslation();
  const portfolio = useTranslatedPortfolio();

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: portfolio.personal.name,
    url: SITE_URL,
    image: `${SITE_URL}/assets/profile.png`,
    jobTitle: portfolio.personal.title,
    description: portfolio.personal.bio,
    worksFor: portfolio.experience[0]
      ? {
          "@type": "Organization",
          name: portfolio.experience[0].company,
        }
      : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: portfolio.personal.location.split(", ")[0],
      addressCountry: portfolio.personal.location.split(", ")[1],
    },
    email: `mailto:${portfolio.personal.contact.email}`,
    sameAs: [
      portfolio.personal.contact.linkedin,
      portfolio.personal.contact.github,
    ],
    alumniOf: portfolio.education.map((edu) => ({
      "@type": "CollegeOrUniversity",
      name: edu.institution,
    })),
    knowsAbout: portfolio.skills,
    inLanguage: i18n.language,
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: `${portfolio.personal.name} Portfolio`,
    url: SITE_URL,
    description: portfolio.personal.bio,
    author: { "@id": `${SITE_URL}/#person` },
    inLanguage: i18n.language,
  };

  const profilePageSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${SITE_URL}/#profilepage`,
    mainEntity: { "@id": `${SITE_URL}/#person` },
    dateModified: new Date().toISOString().split("T")[0],
    inLanguage: i18n.language,
  };

  useHead({
    script: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify(personSchema),
      },
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify(websiteSchema),
      },
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify(profilePageSchema),
      },
    ],
  });

  return null;
}
