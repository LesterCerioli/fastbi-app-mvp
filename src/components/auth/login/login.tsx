"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as S from "./styles";
import Image from "next/image";
import { useTranslations } from "@/lib/i18n/useTranslations";

import authmedia from "@/app/assets/auth_media.jpg";

const ROLES = [
  "Chief Executive Officer (CEO)",
  "Chief Operating Officer (COO)",
  "Chief Financial Officer (CFO)",
  "Chief Technology Officer (CTO)",
  "Chief Information Officer (CIO)",
  "Chief Marketing Officer (CMO)",
  "Chief Product Officer (CPO)",
  "Chief Human Resources Officer (CHRO)",
  "Chief Security Officer (CSO)",
  "Chief Data Officer (CDO)",
  "Chief Legal Officer (CLO)",
  "Executive Director",
  "Managing Director",
  "General Manager",
  "Regional Manager",
  "Department Manager",
  "Operations Manager",
  "Project Manager",
  "Program Manager",
  "Product Manager",
  "Engineering Manager",
  "Sales Manager",
  "Marketing Manager",
  "Human Resources Manager",
  "Customer Success Manager",
  "Finance Manager",
  "IT Manager",
  "Software Engineer",
  "Senior Software Engineer",
  "Staff Software Engineer",
  "Principal Software Engineer",
  "Solutions Architect",
  "Enterprise Architect",
  "Cloud Architect",
  "DevOps Engineer",
  "Site Reliability Engineer (SRE)",
  "Platform Engineer",
  "Backend Developer",
  "Frontend Developer",
  "Full Stack Developer",
  "Mobile Developer",
  "QA Engineer",
  "Test Automation Engineer",
  "Security Engineer",
  "Data Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "AI Engineer",
  "Database Administrator (DBA)",
  "Systems Administrator",
  "Network Engineer",
  "Technical Support Engineer",
  "Business Analyst",
  "Business Consultant",
  "Operations Analyst",
  "Operations Specialist",
  "Process Analyst",
  "Process Manager",
  "Procurement Specialist",
  "Supply Chain Analyst",
  "Logistics Coordinator",
  "Sales Executive",
  "Account Executive",
  "Account Manager",
  "Business Development Manager",
  "Business Development Representative (BDR)",
  "Sales Development Representative (SDR)",
  "Customer Success Specialist",
  "Marketing Specialist",
  "Marketing Coordinator",
  "Digital Marketing Manager",
  "Content Strategist",
  "Brand Manager",
  "SEO Specialist",
  "Social Media Manager",
  "Accountant",
  "Financial Analyst",
  "Controller",
  "Auditor",
  "Compliance Officer",
  "Risk Analyst",
  "Legal Counsel",
  "Contract Manager",
  "HR Generalist",
  "HR Specialist",
  "HR Business Partner (HRBP)",
  "Talent Acquisition Specialist",
  "Recruiter",
  "Training Coordinator",
  "Learning and Development Manager",
  "Compensation and Benefits Specialist",
  "Product Owner",
  "Product Designer",
  "UX Designer",
  "UI Designer",
  "UX Researcher",
  "Graphic Designer",
  "Executive Assistant",
  "Administrative Assistant",
  "Office Manager",
  "Receptionist",
  "Hospital Administrator",
  "Medical Director",
  "Clinical Operations Manager",
  "Department Coordinator",
  "Corporate Administrator",
  "Billing Specialist",
  "Scheduling Coordinator",
  "Medical Records Administrator",
  "Organization Owner",
  "Organization Administrator",
  "Team Lead",
  "Employee",
  "IT Administrator",
  "Support Agent",
  "Read-Only User",
  "FastBI Admin"
];

export default function Login() {
  const { t } = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const tokenRes = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const tokenData = await tokenRes.json().catch(() => ({}));
      const token = tokenData.token;

      const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (token) authHeaders["Authorization"] = `Bearer ${token}`;

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ email, password, role }),
      });

      const data = await loginRes.json();

      if (!loginRes.ok) {
        setError(data.error || t("login.errors.invalidCredentials"));
        setLoading(false);
        return;
      }

      sessionStorage.setItem("user", JSON.stringify(data.user));

      const sessionRes = await fetch("/api/session/init", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ organization_id: data.user.organization_id }),
      });
      const sessionData = await sessionRes.json().catch(() => ({}));
      if (sessionData.organization_name) {
        sessionStorage.setItem("organization_name", sessionData.organization_name);
      }

      router.push("/dashboard");
    } catch {
      setError(t("login.errors.default"));
      setLoading(false);
    }
  }

  return (
    <S.Container>
      <S.Background>
        <Image
          src={authmedia}
          alt={t("login.alt")}
          fill
          priority
          style={{ objectFit: "cover" }}
        />
      </S.Background>
      <S.Overlay />
      <S.Card>
        <S.Header>
          <h1>{t("login.heading")}</h1>
          <p>{t("login.subtitle")}</p>
        </S.Header>
        <S.Form onSubmit={handleSubmit}>
          {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
          <S.InputGroup>
            <label>{t("login.form.emailLabel")}</label>
            <input
              type="email"
              placeholder={t("login.form.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </S.InputGroup>
          <S.InputGroup>
            <label>{t("login.form.passwordLabel")}</label>
            <input
              type="password"
              placeholder={t("login.form.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </S.InputGroup>
          <S.InputGroup>
            <label>{t("login.form.roleLabel")}</label>
            <S.Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="">{t("login.form.rolePlaceholder")}</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </S.Select>
          </S.InputGroup>
          <S.ForgotLink onClick={() => router.push("/forgotpassword")}>
            {t("login.form.forgotPassword")}
          </S.ForgotLink>
          <S.Button type="submit" disabled={loading}>
            {loading ? t("login.button") + "..." : t("login.button")}
          </S.Button>
          <S.CancelButton type="button" onClick={() => router.push("/")}>
            Cancel
          </S.CancelButton>
        </S.Form>
      </S.Card>
    </S.Container>
  );
}