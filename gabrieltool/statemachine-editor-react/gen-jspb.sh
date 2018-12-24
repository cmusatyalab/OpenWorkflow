#!/bin/bash -ex
# This script generate javascript protobuf library
# from .proto files.

protoc --proto_path=../statemachine/proto --js_out=import_style=commonjs,binary:src ../statemachine/proto/wca-state-machine.proto && \
sed -i '1s/^/<added text> /\n' src/wca-state-machine_pb.js
