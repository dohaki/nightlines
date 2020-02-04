import { LOCAL_STORAGE_ITEM_PREFIX } from '../constants';

export function getUserByUsername(username = "") {
  return JSON.parse(
    localStorage.getItem(
      `${LOCAL_STORAGE_ITEM_PREFIX}-user-${username.toLowerCase()}`
      )
  );
}

export function setUser({ username, walletData }) {
  localStorage.setItem(
    `${LOCAL_STORAGE_ITEM_PREFIX}-user-${username.toLowerCase()}`,
    JSON.stringify({ username, walletData })
  );
}
