// TypeScript interfaces for resume.yaml — do not add data here.
// Edit resume.yaml in the project root to update all page content.

export interface Role {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights: string[];
  skills?: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location: string;
  year: string;
  note?: string;
}

export interface Contact {
  email: string;
  phone?: string;
  location: string;
  website?: string;
  github?: string;
  githubOrg?: string;
  linkedin?: string;
}

export interface Project {
  name: string;
  url: string;
  description: string;
}

export interface ResumeData {
  name: string;
  tagline: string;
  contact: Contact;
  summary: string;
  experience: Role[];
  education: Education[];
  projects?: Project[];
}
