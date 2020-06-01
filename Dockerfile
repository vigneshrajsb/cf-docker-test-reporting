FROM openjdk:11-slim

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

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install --only=production

# Bundle app source
COPY . .
CMD ["node", "index.js"]
