import React from 'react';
import { Flex, Text, Box } from "rebass";

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
      <Text>ALICE</Text>
    </Flex>
  )
};
