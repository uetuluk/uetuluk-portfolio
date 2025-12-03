import { useTranslation } from "react-i18next";
import basePortfolio from "@/content/portfolio.json";

export function useTranslatedPortfolio() {
  const { t } = useTranslation("portfolio");

  const projects = basePortfolio.projects.map((project) => ({
    ...project,
    title: t(`projects.${project.id}.title`, { defaultValue: project.title }),
    description: t(`projects.${project.id}.description`, {
      defaultValue: project.description,
    }),
    longDescription: t(`projects.${project.id}.longDescription`, {
      defaultValue: project.longDescription,
    }),
  }));

  const experience = basePortfolio.experience.map((exp) => ({
    ...exp,
    company: t(`experience.${exp.id}.company`, { defaultValue: exp.company }),
    role: t(`experience.${exp.id}.role`, { defaultValue: exp.role }),
    period: t(`experience.${exp.id}.period`, { defaultValue: exp.period }),
    description: t(`experience.${exp.id}.description`, {
      defaultValue: exp.description,
    }),
    highlights: exp.highlights?.map((h, i) =>
      t(`experience.${exp.id}.highlights.${i}`, { defaultValue: h })
    ),
  }));

  const education = basePortfolio.education.map((edu) => ({
    ...edu,
    institution: t(`education.${edu.id}.institution`, {
      defaultValue: edu.institution,
    }),
    degree: t(`education.${edu.id}.degree`, { defaultValue: edu.degree }),
    period: t(`education.${edu.id}.period`, { defaultValue: edu.period }),
    highlights: edu.highlights?.map((h, i) =>
      t(`education.${edu.id}.highlights.${i}`, { defaultValue: h })
    ),
  }));

  return {
    personal: {
      ...basePortfolio.personal,
      name: t("personal.name", { defaultValue: basePortfolio.personal.name }),
      title: t("personal.title", { defaultValue: basePortfolio.personal.title }),
      bio: t("personal.bio", { defaultValue: basePortfolio.personal.bio }),
      location: t("personal.location", {
        defaultValue: basePortfolio.personal.location,
      }),
    },
    projects,
    experience,
    skills: basePortfolio.skills, // Keep technical terms in English
    education,
  };
}
