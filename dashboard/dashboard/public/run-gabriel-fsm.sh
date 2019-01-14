#! /bin/bash -ex

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# source conda
. /home/junjuew/miniconda3/etc/profile.d/conda.sh &&
conda activate gabriel &&
cd /home/junjuew/work/gabriel-tool &&
rm -f /tmp/gabriel-fsm.log &&
exec python gabrieltool/statemachine/sample-cognitive-engine.py -s 127.0.0.1:8021 --fsm_path ${DIR}/../../uploads/app.pbfsm