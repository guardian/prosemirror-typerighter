DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

installBrewfile() {
  echo -e "\033[32mInstalling requirements from Brewfile\033[0m\n"
  brew bundle --no-lock
}

setupNginx() {
  echo -e "\033[32mInstalling homebrew dependencies\033[0m\n"
  dev-nginx setup-app ${DIR}/nginx/nginx-mapping.yaml
}

installNpm() {
  echo -e "\033[32mInstalling JS dependencies\033[0m\n"
  npm install
}

main() {
  installBrewfile
  setupNginx
  installNpm
  echo -e "\033[32mInstallation complete.\033[0m\n"
}

main
