# Oracle Knowledge Accelerator Custom Component Package

The Knowledge Accelerator is a skill for the Oracle Digital Assistant platform that allows users to use a chat interface to search for articles in Knowledge Advanced for Oracle Service Cloud. The accelerator includes both the skill as well as the source code for the custom component package, and it can be imported into ODA and used immediately or customized to your requirements.

## Getting Started

If you simply want to import the accelerator skill into your ODA instance, you can download the skill as a ZIP in our releases tab. In Oracle Digital Assistant, under the Skills tab, use "Import Skill" to import the ZIP file into your skills catalogue. See our [blog post] for full instructions on importing the skill into ODA.

To make changes to the custom component Javascript code, you can clone this repository. See below for build instructions.

### Prerequisites
Install the latest version of [Node.js](https://nodejs.org/en/download/)

Acquire access to [Oracle Digital Assistant](https://cloud.oracle.com/digital-assistant)

## Structure

```text
.
├── .npmignore
├── components
│   └── ...
├── lib
│   └── ...
├── main.js
└── package.json
```

| | Description |
|--|--|
| `.npmignore` | Ignore files when packaging as `npm` module |
| `components` | Directory where component implementations are stored |
| `lib` | Directory for common and utility functions |
| `main.js` | Entrypoint for the Custom Component Package configuration |

The Component Package behaves like any other `npm` project. To install dependencies, use:
```shell
npm install
#from the root folder
```

For full documentation of the custom components, see [blog post - Technical Details].

## Deployment

As this package is designed to be installed and run with a corresponding service
wrapper, run `npm pack` and upload the resulting `.tgz` as a package for
the _Embedded Container_ service.

```shell
npm pack
# or validate and package with the @oracle/bots-node-sdk command line
npm run bots-node-sdk -- pack .
```

> **TIP:** use `npm run bots-node-sdk -- pack --help` for additional packaging
options.

## How to Contribute

To learn how to contribute, please read [CONTRIBUTING.md](CONTRIBUTING.md).
