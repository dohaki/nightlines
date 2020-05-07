# Nightlines

This is a Proof-of-Concept for providing privacy to the `Trustlines Protocol` by combining gateways and zkSNARKs-based shield contracts.

## Get Started

### Prerequisites

- Node.js v13.9
- Yarn v1.22.0
- Docker v19.03.8

### Install ZoKrates

Install rust via rustup

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup install nightly-2020-02-28
```

Build ZoKrates v0.5.1 from source with libsnark as backend

```bash
git clone https://github.com/ZoKrates/ZoKrates
git checkout tags/0.5.1
cd ZoKrates
cargo +nightly -Z package-features build --release --package zokrates_cli --features="libsnark"
```

Add ZoKrates to path

```bash
export PATH="<PATH_TO_ZOKRATES>/target/release:$PATH"
export ZOKRATES_HOME="<PATH_TO_ZOKRATES>/zokrates_stdlib/stdlib"
```

### Setup modified trustlines components

Before being able to start `Nightlines` you have to setup the modified `Trustlines Protocol` components.
The respective repositories of the components are:

- clientlib (https://github.com/dakingha69/clientlib#nightlines)
- relay (https://github.com/dakingha69/relay#nightlines)
- index (https://github.com/dakingha69/py-eth-index#nightlines)
- contracts (https://github.com/dakingha69/contracts#nightlines)

The most convenient way to get them running is to use the `end2end` repository which provides a docker-compose configuration for all components.

```bash
git clone https://github.com/dakingha69/end2end#nightlines
cd end2end
./run-e2e.sh -b
```

This will start a parity development node, compile and deploy the contracts and start a relay server with an event indexer.

### Setup Nightlines

With `ZoKrates` installed and the `end2end` setup running you can now start `Nightlines`.

Clone this repository and install the dependencies.

```bash
git clone https://github.com/dakingha69/nightlines.git
cd nightlines
yarn install
```

Compile the `ZoKrates` programs and perform a trusted setup.

```bash
yarn zkp:setup
```

The previous step might take quite a while depending on your hardware.
If the step succeeded you can start the `Nightlines` server by running

```bash
yarn start
```

This will start the `Nightlines` proof generator on `http://localhost:3001`.

### Start Demo UI

This repository comes with a demo UI to interact with `Nightlines`.
To start the UI run

```bash
cd <NIGHTINES_REPO>/ui
yarn install
yarn start
```

This will serve the UI on `http://localhost:3000`.

## Benchmarks

Benchmarking scripts are provided with this repository in `./benchmark`.
To run them, make sure to have the `end2end` setup running and run in the project root of this repository

```bash
yarn benchmark [n]
```

where `n` is the number of runs to perform and defaults to `2`.

The generated data is saved as CSV in `./benchmark/data`.

See [./benchmark/README.md](./benchmark/README.md) for details.
