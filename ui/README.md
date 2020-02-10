# Nightlines

## Get Started

1. Start the trustlines end2end setup on `nightlines` branch
```
cd <PATH_TO_END_2_END_REPO>
./run-e2e.sh -b
```
2. Setup ZoKrates files (PK and VK generation, compilation, key registration)
```
cd <PATH_TO_NIGHTLINES_REPO>
yarn zkp:setup
```
3. Sart nightlines instance
```
cd <PATH_TO_NIGHTLINES_REPO>
yarn start
```
4. Start demo ui
```
cd <PATH_TO_NIGHTLINES_REPO>/ui
yarn start
```
