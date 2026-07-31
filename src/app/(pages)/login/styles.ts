import styled from "styled-components";

export const Container = styled.main`
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #000; /* fallback caso imagem não carregue */
`;