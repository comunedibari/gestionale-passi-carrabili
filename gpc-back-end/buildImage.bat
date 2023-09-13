echo "Building image..."

call docker build -t cc-harbor.comune.bari.it/citta_connessa/gpc-back-end:1.0.5 .
call docker push cc-harbor.comune.bari.it/citta_connessa/gpc-back-end:1.0.5
