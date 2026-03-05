import "./style.css";
import rawResume from "../resume.yaml";
import type { ResumeData } from "./data/resume.ts";
import { renderResume } from "./render.ts";
import { renderTimeline, cleanupTimeline } from "./timeline.ts";

const resume = rawResume as ResumeData;

const maybeRoot = document.getElementById("app");
if (!maybeRoot) throw new Error("Missing #app mount point — check index.html");
const appRoot: HTMLElement = maybeRoot;

function route(): void {
  appRoot.innerHTML = "";
  if (location.hash === "#resume") {
    cleanupTimeline();
    document.documentElement.classList.remove("is-timeline");
    renderResume(resume, appRoot);
    document.title = `${resume.name} — CV`;
  } else {
    document.documentElement.classList.add("is-timeline");
    renderTimeline(resume, appRoot);
    document.title = `${resume.name} — Timeline`;
  }
}

window.addEventListener("hashchange", route);
route();
