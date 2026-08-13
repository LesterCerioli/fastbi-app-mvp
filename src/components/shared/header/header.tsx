"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation"; 
import { useState, useEffect } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { LogOut } from "lucide-react";

import logo from "@/app/assets/homeimages/logo.jpeg";

const navLinks = [
  { path: "/home", key: "home" },
  { path: "/features", key: "features" },
  { path: "/pricing", key: "pricing" },
  { path: "/contact", key: "contact" },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslations();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    setMobileOpen(false);
    const stored = sessionStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { setUser(null); }
    } else {
      setUser(null);
    }
  }, [pathname]);

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { setUser(null); }
    }
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    setUser(null);
    router.push("/home");
  };

  const isActive = (path: string) => {
    if (path === '/home' && (pathname === '/' || pathname === '/home')) return true;
    return pathname === path;
  };

  return (
    <S.Container>
      <S.LogoWrapper onClick={() => handleNavigation('/home')}>
        <Image src={logo} alt="FastBI Logo" priority />
        <S.LogoText>FastBI</S.LogoText>
      </S.LogoWrapper>

      <S.Nav>
        {navLinks.map((link) => (
          <S.NavItem
            key={link.path}
            $active={isActive(link.path)}
            onClick={() => handleNavigation(link.path)}
          >
            {t(`header.nav.${link.key}`)}
          </S.NavItem>
        ))}
      </S.Nav>

      <S.RightSection>
        <S.HideMobile>
          <S.Button 
            $variant="primary"
            onClick={() => handleNavigation('/signup')}
          >
            {t("header.buttons.getStarted")}
          </S.Button>
        </S.HideMobile>
        
        {user ? (
          <>
            <S.UserInfo onClick={() => handleNavigation('/profile')}>
              {user.name || user.email}
            </S.UserInfo>
            <S.LogoutButton onClick={handleLogout}>
              <LogOut size={16} />
              {t("header.buttons.logout")}
            </S.LogoutButton>
          </>
        ) : (
          <S.HideMobile>
            <S.Button 
              $variant="secondary"
              onClick={() => handleNavigation('/login')}
            >
              {t("header.buttons.login")}
            </S.Button>
          </S.HideMobile>
        )}

        <S.Hamburger onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? "✕" : "☰"}
        </S.Hamburger>
      </S.RightSection>

      <S.MobileOverlay $open={mobileOpen}>
        {navLinks.map((link) => (
          <S.MobileNavItem
            key={link.path}
            $active={isActive(link.path)}
            onClick={() => handleNavigation(link.path)}
          >
            {t(`header.nav.${link.key}`)}
          </S.MobileNavItem>
        ))}
        <S.MobileButtons>
          <S.Button $variant="primary" onClick={() => handleNavigation('/signup')}>
            {t("header.buttons.getStarted")}
          </S.Button>
          {user ? (
            <S.Button $variant="secondary" onClick={handleLogout}>
              <LogOut size={16} />
              {t("header.buttons.logout")}
            </S.Button>
          ) : (
            <S.Button $variant="secondary" onClick={() => handleNavigation('/login')}>
              {t("header.buttons.login")}
            </S.Button>
          )}
        </S.MobileButtons>
      </S.MobileOverlay>
    </S.Container>
  );
}
