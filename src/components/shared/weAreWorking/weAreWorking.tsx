"use client";

import Image from "next/image";
import * as S from "./styles";

export default function WeAreWorking() {
  return (
    <S.Wrapper>
      <S.Content>
        <S.ImageContainer>
          <S.WorkingImage
            src="/placeholder-construction.jpg"
            alt="Homens trabalhando em obra usando capacetes"
            width={150}
            height={150}
          />
        </S.ImageContainer>
        <S.Title>We Are Working</S.Title>
        <S.Subtitle>Somos uma equipe dedicada à construção de dados</S.Subtitle>
        <S.ShirtText>We Are Working</S.ShirtText>
      </S.Content>
    </S.Wrapper>
  );
}