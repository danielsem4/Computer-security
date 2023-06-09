import React, { FC, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

import {
  FormContainer,
  FormWrapper,
  AnimatedForm,
  FormInput,
  ErrorText,
  Button,
  CheckBoxWrapper,
  CheckBoxInput,
  CheckBoxLabel,
  NavigateLinks,
} from './Login.style';
import Lottie from 'lottie-react';
import animationData from '../../assets/lottie/helloLogin.json';
import { toast } from 'react-toastify';

const Login: FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (username === '' || password === '')
      return setError('Please enter username and password');

    setError('');
    axios
      .post('https://localhost:8080/api/userauthentication', {
        password,
        email: username,
      })
      .then((res) => navigate('/System'))
      .catch((error) => {
        toast.error(error.response.data);
      });
  };

  const handleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  return (
    <FormContainer>
      <FormWrapper>
        <Lottie
          animationData={animationData}
          style={{ width: '40%', margin: 'auto', height: '30%' }}
        />
        <AnimatedForm onSubmit={handleSubmit}>
          <FormInput
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <FormInput
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <ErrorText>{error}</ErrorText>}
          <CheckBoxWrapper>
            <CheckBoxInput
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={handleRememberMe}
            />
            <CheckBoxLabel htmlFor="rememberMe">Remember me</CheckBoxLabel>
          </CheckBoxWrapper>
          <Button type="submit">Login</Button>
        </AnimatedForm>
        <NavigateLinks>
          <Link to="ForgotPassword">Forgot password?</Link>
          <Link to="RegisterPage">Don't have an account? press here</Link>
        </NavigateLinks>
      </FormWrapper>
    </FormContainer>
  );
};

export default Login;
