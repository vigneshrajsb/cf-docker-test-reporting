cf-docker-test-reporting
=================
This microservice runs for generate test report step as docker image. Required environment variable BUILD_ID. In working directory of this image must be directory with test report generated on unit test step (probably you must use volume for deliver directory from previous step).
After build you can see link on report on ui (probably to see link you must enable 
fycha flag for showing test report link)


