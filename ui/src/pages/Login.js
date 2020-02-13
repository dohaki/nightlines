import React, { useState, useEffect } from 'react';
import { Box, Heading, Text } from 'rebass';
import { Input } from '@rebass/forms';
import { useHistory } from "react-router-dom";
import { toast } from 'react-toastify';

import Container from "../components/Container";
import Button from "../components/Button";

import * as localforage from "../apis/localforage";
import * as sessionStorage from "../apis/sessionStorage";
import * as tlLib from "../apis/tlLib";

export default function Login() {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (sessionStorage.getCurrentUsername()) {
      history.replace("/")
    }
  }, [history])

  const handleClick = async () => {
    try {
      setLoading(true);
      let user = await localforage.getUserByUsername(username)
      if (!user) {
        user = await tlLib.createUser(username);
        await localforage.setUser(user)
      }
      await tlLib.loadUser(user.walletData);
      sessionStorage.setCurrentUsername(username);
      history.replace("/");
    } catch (error) {
      toast(error.toString(), { type: "error" });
    }
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
        disabled={loading}
        minWidth={200}
      >
        {loading ? "Loading..." : "Let's Go"}
      </Button>
    </Container>
  )
}