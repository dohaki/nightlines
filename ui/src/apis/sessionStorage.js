import { LOCAL_STORAGE_ITEM_PREFIX } from "../constants";

export function getCurrentUsername() {
  return sessionStorage.getItem(
    `${LOCAL_STORAGE_ITEM_PREFIX}-current-username`
  );
}

export function setCurrentUsername(username) {
  sessionStorage.setItem(
    `${LOCAL_STORAGE_ITEM_PREFIX}-current-username`,
    username.toLowerCase()
  );
}

export function removeCurrentUsername() {
  sessionStorage.removeItem(`${LOCAL_STORAGE_ITEM_PREFIX}-current-username`);
}
