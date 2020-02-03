import React from 'react';
import { Box, Heading, Text, Button } from 'rebass';
import { Input } from '@rebass/forms';

export default function Login() {
  return (
    <Box
      sx={{
        maxWidth: 512,
        mx: 'auto',
        p: 3,
        pt: 6,
      }}>
        <Heading>Welcome to Nightlines</Heading>
        <Box my={4}>
          <Text>Username</Text>
          <Input />
        </Box>
        <Button>
          Let's Go
        </Button>
    </Box>
  )
}