import React, { useState, useEffect } from 'react';
import { Box, Heading, Text } from 'rebass';
import { Input } from '@rebass/forms';
import { useHistory } from "react-router-dom";

import Container from "../components/Container";
import Button from "../components/Button";

import * as localStorage from "../apis/localStorage";
import * as sessionStorage from "../apis/sessionStorage";
import * as tlLib from "../apis/tlLib";

export default function Login() {
  const history = useHistory();
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (sessionStorage.getCurrentUsername()) {
      history.replace("/")
    }
  }, [])

  const handleClick = async () => {
    let user = localStorage.getUserByUsername(username)
    if (!user) {
      user = await tlLib.createUser(username);
      localStorage.setUser(user)
    }
    await tlLib.loadUser(user.walletData);
    sessionStorage.setCurrentUsername(username);
    history.replace("/");
  }

  return (
    <Container>
      <Heading>Welcome to Nightlines</Heading>
      <Box my={4}>
        <Text>Username</Text>
        <Input
          value={username}
          onChange={event => setUsername(event.target.value)}
        />
      </Box>
      <Button
        onClick={handleClick}
      >
        Let's Go
      </Button>
    </Container>
  )
}