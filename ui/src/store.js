import { createContainer } from "unstated-next"

import useCoinBalance from "./hooks/useCoinBalance";
import useGatewayDeposit from "./hooks/useGatewayDeposit";
import useUserOverview from "./hooks/useUserOverview";
import useSelectedNetwork from "./hooks/useSelectedNetwork";
import useLoadedUser from "./hooks/useLoadedUser";
import useNetworks from "./hooks/useNetworks";

const composeHooks = (...hooks) => () => hooks.reduce(
  (acc, hook) => {
    const hookObj = hook();
    if (Object.keys(acc).every(key => hookObj[key] === undefined)) {
      return {...acc, ...hookObj}
    } else {
      throw new Error('there exist same key in multiple hooks');
    }
  }, {}
)

const store = createContainer(composeHooks(
  useCoinBalance,
  useGatewayDeposit,
  useUserOverview,
  useSelectedNetwork,
  useLoadedUser,
  useNetworks
))

export default store
