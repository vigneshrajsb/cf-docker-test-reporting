FROM openjdk:11.0.1-slim

RUN apt-get update && apt-get install -y curl \
  && curl -sL https://deb.nodesource.com/setup_12.x | bash - \
  && apt-get install -y nodejs

# Create app directory
WORKDIR /app

# define variables passed form codefresh
ARG BUCKET_NAME
ARG REPORT_DIR
ARG REPORT_INDEX_FILE
ARG CLEAR_TEST_REPORT
ARG ALLURE_DIR
ARG REPORT_LOGGING_LEVEL

# Install app dependencieswas specified for this step and it contains the directory for upload
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install --only=production
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .
CMD ["node", "/app/index.js"]
