# run-java.sh checks for run-env.sh in run-java.sh's own directory and in
# JAVA_APP_DIR, sourcing any available. The Dockerfile places run-java.sh in
# JAVA_APP_DIR so run-env.sh gets sourced twice. We can easily make that safe
# but we'd also like to be able to inject envvar configuration. Set up a guard
# that prevents sourcing twice.
if test -z "${HAS_JAVA_APP_DIR_RUN_ENV:-}"
then
  HAS_JAVA_APP_DIR_RUN_ENV=1

  # Container forces the Java version, no point making it overrideable.
  JAVA_MAJOR_VERSION=11
  PORT="${PORT:-8080}"
  # Configure the JAVA_OPTIONS, you can add -XshowSettings:vm to also display the heap size.
  JAVA_OPTIONS="${JAVA_OPTIONS:- -Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager}"
  JAVA_OPTIONS="${JAVA_OPTIONS} -Dquarkus.http.port=$PORT"

  export HAS_JAVA_APP_DIR_RUN_ENV
  export JAVA_MAJOR_VERSION
  export JAVA_OPTIONS
fi
