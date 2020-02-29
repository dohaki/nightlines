Nightlines
==========

Get Started
-----------

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
3. (Optional) Add ZoKrates to path 
```bash
export PATH="<PATH_TO_ZOKRATES>/target/release:$PATH"
export ZOKRATES_HOME="<PATH_TO_ZOKRATES>/zokrates_stdlib/stdlib"
```

### Install forked trustlines components
- clientlib
- relay
- index
- contracts
- end2end

### Run trusted setup
```bash
yarn zkp:setup
```


