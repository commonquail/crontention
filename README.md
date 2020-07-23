# Crontention

Crontention visualizes potential contention caused by the
[Quartz Job Scheduler][url-quartz]'s cron trigger expressions.

Crontention evaluates Quartz cron expressions for a single UTC day and draws a
heat map of overlapping fire-times. The darker the color, the greater the risk
of contention. Use that information to spread out events to utilize resources
more evenly or arrange dependencies.

[Visit Crontention on Heroku][url-deploy] to use it or learn more about it.

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

#### Acceptance tests

When Crontention is running you can execute acceptance tests. These are built
with [CodeceptJS][url-codeceptjs].

Run all acceptance tests in batch mode with something like

```sh
HEADLESS=1 yarn test:acceptance:parallel 4
```

Note that the above method suffers from an internal race condition and can, in
very rare cases, incorrectly assign a "scenario" to a different "feature",
causing a false positive failure.

Run a selection of tests in display mode with something like

```sh
yarn test:acceptance --grep home
```

After defining a new page object, run

```sh
yarn test:acceptance:def
```

Acceptance tests don't run in CI because there are no official Docker images
with both Maven and Node.js and I don't want to maintain one.

# License: Apache-2.0

Copyright 2020 Mikkel Kjeldsen

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

[url-codeceptjs]: https://codecept.io/
[url-deploy]: https://crontention.herokuapp.com/
[url-quartz]: https://www.quartz-scheduler.org/
