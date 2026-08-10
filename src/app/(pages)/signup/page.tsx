"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as P from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import SignUpOrganization from "@/components/subscriptions/signUpOrganization/signUpOrganization";
import SignUpAdmin from "@/components/subscriptions/signUpAdmin/signUpAdmin";
import SignUpSubscription from "@/components/subscriptions/signUpSubscription/signUpSubscription";
import SignUpPayment from "@/components/subscriptions/signUpPayment/signUpPayment";

interface OrganizationData {
  organizationName: string;
  taxId: string;
  address: string;
}

interface AdminData {
  fullName: string;
  email: string;
  password: string;
}

interface SubscriptionData {
  planKey: string;
  planName: string;
  billingCycle: "monthly" | "annual";
  amount: number;
  userCount: number;
}

interface PaymentData {
  cardholderName: string;
  stripeToken: string;
}

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { num: 1 as Step, key: "organization" },
  { num: 2 as Step, key: "admin" },
  { num: 3 as Step, key: "subscription" },
  { num: 4 as Step, key: "payment" },
];

export default function SignUpPage() {
  const { t, locale } = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [orgData, setOrgData] = useState<OrganizationData | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleOrgContinue = useCallback((data: OrganizationData) => {
    setOrgData(data);
    setStep(2);
  }, []);

  const handleAdminContinue = useCallback((data: AdminData) => {
    setAdminData(data);
    sessionStorage.setItem("signup_user_name", data.fullName);
    sessionStorage.setItem("signup_user_email", data.email);
    setStep(3);
  }, []);

  const handleSubscriptionContinue = useCallback((data: SubscriptionData) => {
    setSubscriptionData(data);
    sessionStorage.setItem("signup_subscription_amount", String(data.amount));
    sessionStorage.setItem("signup_subscription_currency", locale === "en" ? "usd" : "brl");
    sessionStorage.setItem("signup_subscription_plan_key", data.planKey);
    sessionStorage.setItem("signup_subscription_billing_cycle", data.billingCycle);
    sessionStorage.setItem("signup_subscription_user_count", String(data.userCount));
    setStep(4);
  }, [locale]);

  const handlePaymentComplete = useCallback(async (data: { cardholderName: string; stripeToken: string }) => {
    setPaymentData(data);
    setPaymentError(null);

    if (adminData) {
      sessionStorage.setItem("signup_user_name", adminData.fullName);
      sessionStorage.setItem("signup_user_email", adminData.email);
    }

    console.log("=== SignUp completed (in-memory) ===", {
      organization: orgData,
      admin: adminData,
      subscription: subscriptionData,
      payment: data,
    });

    try {
      const authRes = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      if (authRes.ok && adminData && orgData) {
        const { token: jwtToken } = await authRes.json();

        const orgRes = await fetch("/api/organizations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            name: orgData.organizationName,
            address: orgData.address,
            cnpj: orgData.taxId,
          }),
        });

        if (orgRes.ok) {
          const orgDataJson = await orgRes.json().catch(() => null);

          if (orgDataJson?.id && subscriptionData) {
            await fetch("/api/billing/license", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jwtToken}`,
              },
              body: JSON.stringify({
                organization_id: orgDataJson.id,
                plan_key: subscriptionData.planKey,
                user_quantity: subscriptionData.userCount,
                billing_cycle: subscriptionData.billingCycle,
              }),
            });
          }

          await fetch("/api/users/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${jwtToken}`,
            },
            body: JSON.stringify({
              name: adminData.fullName,
              email: adminData.email,
              password: adminData.password,
              role: "Chief Executive Officer (CEO)",
              organization_name: orgData.organizationName,
            }),
          });
        }

        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            email: adminData.email,
            password: adminData.password,
            role: "Chief Executive Officer (CEO)",
          }),
        });

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          if (loginData.user) {
            sessionStorage.setItem("user", JSON.stringify(loginData.user));
            sessionStorage.setItem("organization_name", orgData.organizationName);
          }
        }
      }
    } catch {
      // auto-login failure should not block redirect
    }

    router.push("/dashboard");
  }, [orgData, adminData, subscriptionData, router]);

  const handlePaymentError = useCallback((error: string) => {
    setPaymentError(error);
  }, []);

  function cardState(stepNum: Step): "upcoming" | "active" | "completed" {
    if (step < stepNum) return "upcoming";
    if (step > stepNum) return "completed";
    return "active";
  }

  return (
    <P.Page>
      <P.PageBg />
      <P.Content>
        <P.StepsBar>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.num}>
              {i > 0 && <P.Connector $active={step >= s.num} />}
              <P.StepDotGroup>
                <P.Dot $active={step === s.num} $completed={step > s.num} />
                <P.StepLabel $active={step >= s.num}>
                  {t(`subscriptions.signUp.steps.${s.key}`)}
                </P.StepLabel>
              </P.StepDotGroup>
            </React.Fragment>
          ))}
        </P.StepsBar>

        <P.CardsRow>
          <P.StepCard $state={cardState(1)}>
            <P.CardInner $state={cardState(1)}>
              <P.StepBadge $state={cardState(1)}>
                <P.BadgeDot $state={cardState(1)} />
                {t("subscriptions.signUp.steps.organization")}
              </P.StepBadge>

              {step > 1 && orgData ? (
                <>
                  <P.CheckmarkCircle />
                  <P.CardTitle>
                    {t("subscriptions.signUp.organization.title")}
                  </P.CardTitle>
                  <P.SummaryBlock>
                    <P.SummaryLine>
                      <P.SummaryLabel>
                        {t("subscriptions.signUp.organization.fields.name")}
                      </P.SummaryLabel>
                      <P.SummaryValue>{orgData.organizationName}</P.SummaryValue>
                    </P.SummaryLine>
                    <P.SummaryLine>
                      <P.SummaryLabel>
                        {t("subscriptions.signUp.organization.fields.taxId")}
                      </P.SummaryLabel>
                      <P.SummaryValue>{orgData.taxId}</P.SummaryValue>
                    </P.SummaryLine>
                  </P.SummaryBlock>
                </>
              ) : (
                <SignUpOrganization onContinue={handleOrgContinue} />
              )}
            </P.CardInner>
          </P.StepCard>

          <P.StepCard $state={cardState(2)}>
            <P.CardInner $state={cardState(2)}>
              <P.StepBadge $state={cardState(2)}>
                <P.BadgeDot $state={cardState(2)} />
                {t("subscriptions.signUp.steps.admin")}
              </P.StepBadge>

              {step > 2 && adminData ? (
                <>
                  <P.CheckmarkCircle />
                  <P.CardTitle>
                    {t("subscriptions.signUp.admin.title")}
                  </P.CardTitle>
                  <P.SummaryBlock>
                    <P.SummaryLine>
                      <P.SummaryLabel>
                        {t("subscriptions.signUp.admin.fields.fullName")}
                      </P.SummaryLabel>
                      <P.SummaryValue>{adminData.fullName}</P.SummaryValue>
                    </P.SummaryLine>
                    <P.SummaryLine>
                      <P.SummaryLabel>
                        {t("subscriptions.signUp.admin.fields.email")}
                      </P.SummaryLabel>
                      <P.SummaryValue>{adminData.email}</P.SummaryValue>
                    </P.SummaryLine>
                  </P.SummaryBlock>
                </>
              ) : step === 2 ? (
                <SignUpAdmin onContinue={handleAdminContinue} />
              ) : (
                <P.PlaceholderCard>
                  <P.PlaceholderIcon>02</P.PlaceholderIcon>
                  <P.PlaceholderText>
                    {t("subscriptions.signUp.steps.admin")}
                  </P.PlaceholderText>
                </P.PlaceholderCard>
              )}
            </P.CardInner>
          </P.StepCard>

          <P.StepCard $state={cardState(3)}>
            <P.CardInner $state={cardState(3)}>
              <P.StepBadge $state={cardState(3)}>
                <P.BadgeDot $state={cardState(3)} />
                {t("subscriptions.signUp.steps.subscription")}
              </P.StepBadge>

              {step > 3 && subscriptionData ? (
                <>
                  <P.CheckmarkCircle />
                  <P.CardTitle>
                    {t("subscriptions.signUp.subscription.title")}
                  </P.CardTitle>
                  <P.SummaryBlock>
                    <P.SummaryLine>
                      <P.SummaryLabel>
                        {t("subscriptions.signUp.subscription.selectedPlan")}
                      </P.SummaryLabel>
                      <P.SummaryValue>{subscriptionData.planName}</P.SummaryValue>
                    </P.SummaryLine>
                    <P.SummaryLine>
                      <P.SummaryLabel>
                        {t("subscriptions.signUp.subscription.billingCycle")}
                      </P.SummaryLabel>
                      <P.SummaryValue>
                        {subscriptionData.billingCycle === "annual"
                          ? t("subscriptions.signUp.subscription.annual")
                          : t("subscriptions.signUp.subscription.monthly")}
                      </P.SummaryValue>
                    </P.SummaryLine>
                    <P.SummaryLine>
                      <P.SummaryLabel>
                        {t("subscriptions.signUp.subscription.users")}
                      </P.SummaryLabel>
                      <P.SummaryValue>{subscriptionData.userCount}</P.SummaryValue>
                    </P.SummaryLine>
                    <P.SummaryLine>
                      <P.SummaryLabel>
                        {t("subscriptions.signUp.subscription.totalAmount")}
                      </P.SummaryLabel>
                      <P.SummaryValue>${subscriptionData.amount}</P.SummaryValue>
                    </P.SummaryLine>
                  </P.SummaryBlock>
                </>
              ) : step === 3 ? (
                <SignUpSubscription onContinue={handleSubscriptionContinue} />
              ) : (
                <P.PlaceholderCard>
                  <P.PlaceholderIcon>03</P.PlaceholderIcon>
                  <P.PlaceholderText>
                    {t("subscriptions.signUp.steps.subscription")}
                  </P.PlaceholderText>
                </P.PlaceholderCard>
              )}
            </P.CardInner>
          </P.StepCard>

          <P.StepCard $state={cardState(4)}>
            <P.CardInner $state={cardState(4)}>
              <P.StepBadge $state={cardState(4)}>
                <P.BadgeDot $state={cardState(4)} />
                {t("subscriptions.signUp.steps.payment")}
              </P.StepBadge>

              {step === 4 ? (
                <SignUpPayment
                  subscriptionData={subscriptionData}
                  processing={paymentProcessing}
                  error={paymentError}
                  onProcessingChange={setPaymentProcessing}
                  onComplete={handlePaymentComplete}
                  onError={handlePaymentError}
                />
              ) : (
                <P.PlaceholderCard>
                  <P.PlaceholderIcon>04</P.PlaceholderIcon>
                  <P.PlaceholderText>
                    {t("subscriptions.signUp.steps.payment")}
                  </P.PlaceholderText>
                </P.PlaceholderCard>
              )}
            </P.CardInner>
          </P.StepCard>
        </P.CardsRow>
      </P.Content>
    </P.Page>
  );
}
