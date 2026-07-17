docker run -d \
  --name flowops-mongo \
  -p 27017:27017 \
  -v mongo_data:/data/db \
  -e MONGO_INITDB_ROOT_USERNAME=flowops_admin \
  -e MONGO_INITDB_ROOT_PASSWORD=flowops_secret_password \
  mongo:7