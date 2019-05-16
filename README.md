[![Codefresh build status]( https://g.codefresh.io/api/badges/pipeline/codefresh-inc/codefresh-io%2Fcf-docker-test-reporting%2Fcf-docker-test-reporting?key=eyJhbGciOiJIUzI1NiJ9.NTY3MmQ4ZGViNjcyNGI2ZTM1OWFkZjYy.AN2wExsAsq7FseTbVxxWls8muNx_bBUnQWQVS8IgDTI&type=cf-1)]( https://g.codefresh.io/pipelines/cf-docker-test-reporting/builds?filter=trigger:build~Build;pipeline:5b96273ee88521c20c7abac9~cf-docker-test-reporting)

cf-docker-test-reporting
==================
This microservice runs for generate test report step as docker image. In working directory of this image must be directory with test report generated on unit test step (probably you must use volume for deliver directory from previous step).
After build you can see link on report on ui (probably to see link you must enable 
future flag for showing test report link)


