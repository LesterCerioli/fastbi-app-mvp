import styled from "styled-components";

export const Wrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

export const Content = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  text-align: center;
  max-width: 600px;
  width: 100%;
`;

export const Title = styled.h1`
  color: #333;
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
`;

export const Subtitle = styled.p`
  color: #666;
  font-size: 1rem;
  margin-bottom: 2rem;
`;

export const ImageContainer = styled.div`
  width: 150px;
  height: 150px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #667eea;
`;

export const WorkingImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const ShirtText = styled.div`
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #667eea;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

