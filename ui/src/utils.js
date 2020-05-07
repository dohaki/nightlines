export function copyToClipboard(id) {
  window.getSelection().selectAllChildren(document.getElementById(id));
  document.execCommand("copy");
  document.getSelection().empty();
}
