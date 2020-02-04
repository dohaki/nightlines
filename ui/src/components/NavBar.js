import React from 'react';
import { Flex, Text, Box } from "rebass";

import { getCurrentUsername } from "../apis/sessionStorage";

export default function NavBar() {
  return (
    <Flex
      sx={{
        boxShadow: 'navbar'
      }}
      px={4}
      py={3}
      color='white'
      alignItems='center'
    >
      <Text fontWeight='bold'>Nightlines</Text>
      <Box mx='auto' />
      <Text>{getCurrentUsername().toUpperCase()}</Text>
    </Flex>
  )
};
