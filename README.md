# Qlik Core example

This repository contains an example build on the examples provided by Qlik (https://github.com/qlik-oss/core-get-started).

Note that before you deploy, you must accept the [Qlik Core EULA](https://core.qlik.com/eula/) by setting the `ACCEPT_EULA` environment variable.

```sh
ACCEPT_EULA=yes docker-compose up -d
```

## Contents

- [src](./src/) - Example source code for a line chart and a scatter plot visualization
- [data](./data) - The Airport data, used as user data in the examples
