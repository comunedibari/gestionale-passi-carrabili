echo "Building image..."

call docker build -t cc-harbor.comune.bari.it/citta_connessa/gpc-jobs:1.0.0 .
call docker push cc-harbor.comune.bari.it/citta_connessa/gpc-jobs:1.0.0
