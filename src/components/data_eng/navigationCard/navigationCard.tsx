"use client";

import * as S from "./styles";

interface NavigationCardProps {
  title: string;
  description?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export default function NavigationCard({
  title,
  description,
  onClick,
  icon,
}: NavigationCardProps) {
  return (
    <S.Wrapper>
      <S.Card type="button" onClick={onClick} aria-label={title}>
        {icon && <S.IconWrapper>{icon}</S.IconWrapper>}
        <S.Header>
          <S.Title>{title}</S.Title>
          {description && <S.Description>{description}</S.Description>}
        </S.Header>
      </S.Card>
    </S.Wrapper>
  );
}