npm install -g ../../
NODE_PATH="$(npm root -g):$(npm root)" NODE_OPTIONS=--experimental-vm-modules npx jest --colors
