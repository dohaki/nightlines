import React, { useEffect, useState } from 'react';
import { Flex, Text, Box } from "rebass";
import { useHistory } from "react-router-dom";
import { get } from "lodash";
import { toast } from 'react-toastify';

import { removeCurrentUsername } from "../apis/sessionStorage";
import * as tlLib from "../apis/tlLib";

import store from "../store";

export default function NavBar(props) {
  const history = useHistory();

  const [allVKsRegistered, setAllVKsRegistered] = useState(false)

  const { selectedNetwork } = store.useContainer();

  const shieldAddress = get(selectedNetwork, "shield.address");

  useEffect(() => {
    async function getAllRegisteredVKs() {
      const allRegisteredVKs = await tlLib.getAllRegisteredVKs(
        shieldAddress
      );
      const vkTypeIndices = [0, 1, 2];
      const allRegistered = vkTypeIndices.reduce((result, index) => {
        return result && allRegisteredVKs[index].length > 0
      }, true)
      setAllVKsRegistered(allRegistered);
    }

    if (shieldAddress) {
      getAllRegisteredVKs();
    }
  }, [shieldAddress, setAllVKsRegistered]);

  const registerAllVKs = async () => {
    try {      
      await tlLib.registerVK(
        shieldAddress,
        "mint"
      );
      await tlLib.registerVK(
        shieldAddress,
        "transfer"
      );
      await tlLib.registerVK(
        shieldAddress,
        "burn"
      );
      toast(`VKs successfully registered`, { type: "success" });
      setAllVKsRegistered(true);
    } catch (error) {
      console.error(error)
      toast(`VK registration failed`, { type: "error" });
    }
  }

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
      {!allVKsRegistered && (
        <Text onClick={registerAllVKs}>
          Register VKs
        </Text>
      )}
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
