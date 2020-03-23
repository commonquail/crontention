# Crontention

Crontention visualizes potential contention caused by the
[Quartz Job Scheduler][url-quartz]'s cron trigger expressions.

Crontention evaluates Quartz cron expressions for a single UTC day and draws a
heat map of overlapping fire-times. The darker the color, the greater the risk
of contention. Use that information to spread out events to utilize resources
more evenly or arrange dependencies.

## Building

Crontention uses Java 11, Quarkus, TypeScript, and D3.js.

### Running

Package Crontention with

```sh
./mvnw package
```

and run it with

```sh
java -jar target/crontention-*-runner.jar
```

Note that dependencies are in the `target/lib` directory.

### Developing

Run Crontention in development mode with hot reloading with

```sh
./mvnw quarkus:dev
```

Recompile TypeScript with

```shell script
yarn bundle
```

after once running

```sh
yarn install
yarn fix-bundler
```

[url-quartz]: https://www.quartz-scheduler.org/
