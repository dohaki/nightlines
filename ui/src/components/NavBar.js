import React from 'react';
import { Flex, Text, Box } from "rebass";
import { useHistory } from "react-router-dom";

import { removeCurrentUsername } from "../apis/sessionStorage";

export default function NavBar(props) {
  const history = useHistory();

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
      <Text onClick={() => {
        removeCurrentUsername();
        history.replace("/login");
      }}>
        Logout
      </Text>
    </Flex>
  )
};
