"use client";

import * as S from "./styles";

interface DatabasesCardProps {
  onClick?: () => void;
}

export default function DatabasesCard({ onClick }: DatabasesCardProps) {
  return (
    <S.Wrapper>
      <S.Card type="button" onClick={onClick} aria-label="Databases">
        <S.Header>
          <S.Title>Databases</S.Title>
        </S.Header>
      </S.Card>
    </S.Wrapper>
  );
}
