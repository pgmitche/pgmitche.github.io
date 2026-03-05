import type { ResumeData, Role, Education, Project } from "./data/resume.ts";
import { el, svgIcon, ICONS } from "./dom.ts";

// =============================================================================
// Header
// =============================================================================

function renderHeader(data: ResumeData): HTMLElement {
  const { name, tagline, contact } = data;

  const items: HTMLElement[] = [
    el("li", { class: "contact-item" }, contact.location, svgIcon(ICONS.location)),
  ];

  if (contact.email) {
    items.push(el("li", { class: "contact-item" },
      el("a", { href: `mailto:${contact.email}` }, contact.email),
      svgIcon(ICONS.email)));
  }

  // Both GitHub accounts rendered on one line when both are present.
  if (contact.github || contact.githubOrg) {
    const githubContent: (string | Node)[] = [];
    if (contact.github) {
      githubContent.push(el("a", { href: `https://github.com/${contact.github}`, target: "_blank", rel: "noopener" }, `github.com/${contact.github}`));
    }
    if (contact.github && contact.githubOrg) {
      githubContent.push(" | ");
    }
    if (contact.githubOrg) {
      githubContent.push(el("a", { href: `https://github.com/${contact.githubOrg}`, target: "_blank", rel: "noopener" }, `github.com/${contact.githubOrg}`));
    }
    githubContent.push(svgIcon(ICONS.github));
    items.push(el("li", { class: "contact-item" }, ...githubContent));
  }

  if (contact.linkedin) {
    items.push(el("li", { class: "contact-item" },
      el("a", { href: `https://linkedin.com/${contact.linkedin}`, target: "_blank", rel: "noopener" }, `linkedin.com/${contact.linkedin}`),
      svgIcon(ICONS.linkedin)));
  }

  return el("header", { class: "resume-header" },
    el("div", { class: "header-name" },
      el("h1", {}, name),
      el("p", { class: "tagline" }, tagline),
    ),
    el("ul", { class: "contact-links" }, ...items),
  );
}

// =============================================================================
// Sections
// =============================================================================

function renderRole(role: Role): HTMLElement {
  const highlights = role.highlights.map((h) => el("li", {}, h));
  const children: (string | Node)[] = [
    el("div", { class: "role-header" },
      el("div", { class: "role-title-block" },
        el("h3", { class: "role-title" }, role.title),
        el("span", { class: "role-company" }, role.company),
      ),
      el("div", { class: "role-meta" },
        el("span", { class: "role-dates" }, `${role.startDate} – ${role.endDate}`),
        el("span", { class: "role-location" }, role.location),
      ),
    ),
  ];
  if (role.skills && role.skills.length > 0) {
    const tags = role.skills.map((s) => el("span", { class: "skill-tag" }, s));
    children.push(el("div", { class: "role-skills" }, ...tags));
  }
  children.push(el("ul", { class: "role-highlights" }, ...highlights));
  return el("article", { class: "role" }, ...children);
}

function renderExperience(roles: Role[]): HTMLElement {
  return el("section", { class: "resume-section" },
    el("h2", {}, "Experience"),
    ...roles.map(renderRole),
  );
}

function renderEducation(education: Education[]): HTMLElement {
  const entries = education.map((edu) => {
    const left: (string | Node)[] = [
      el("strong", {}, edu.degree),
      el("span", { class: "institution" }, edu.institution),
    ];
    if (edu.note) {
      left.push(el("span", { class: "edu-note" }, edu.note));
    }
    return el("div", { class: "education-entry" },
      el("div", { class: "education-left" }, ...left),
      el("div", { class: "education-right" },
        el("span", {}, edu.year),
        el("span", { class: "edu-location" }, edu.location),
      ),
    );
  });
  return el("section", { class: "resume-section" },
    el("h2", {}, "Education"),
    ...entries,
  );
}

function renderProjects(projects: Project[]): HTMLElement {
  const entries = projects.map((p) =>
    el("div", { class: "project-entry" },
      el("a", { class: "project-name", href: p.url, target: "_blank", rel: "noopener" }, p.name),
      el("p", { class: "project-description" }, p.description),
    )
  );
  return el("section", { class: "resume-section" },
    el("h2", {}, "Projects"),
    ...entries,
  );
}

// =============================================================================
// Entry point
// =============================================================================

export function renderResume(data: ResumeData, root: HTMLElement): void {
  root.appendChild(el("a", { href: "#", class: "view-toggle" }, "← Timeline"));
  root.appendChild(
    el("main", { class: "resume" },
      renderHeader(data),
      el("div", { class: "resume-body" },
        renderExperience(data.experience),
        renderEducation(data.education),
        ...(data.projects && data.projects.length > 0 ? [renderProjects(data.projects)] : []),
      ),
    ),
  );
}
