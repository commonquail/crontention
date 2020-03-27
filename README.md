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

[url-deploy]: https://crontention.herokuapp.com/
[url-quartz]: https://www.quartz-scheduler.org/
