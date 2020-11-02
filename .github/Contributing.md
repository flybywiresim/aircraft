# Welcome

Welcome to the A32NX project repository. Thank you for your interest in contributing to the project. Full details and guidelines on how to ensure this project is managed well are included below.

## Required software

[git](https://git-scm.com/downloads)

[nodejs v12+](https://nodejs.org/en/download/)

[python 3.9+](https://www.python.org/downloads/)

## Optional

[vscode](https://code.visualstudio.com/download)

[vscode eslint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

It's recommended to set gitbash as your default shell in vscode

## Cloning and setup

`git clone https://github.com/flybywiresim/a32nx.git`

`cd a32nx`

`npm install`

You will want to run `npm install` every time you pull or merge master into your branch

## Asobo branch

The master branch only contains files which have been modified from the original package. If you wish to work on a file that isn't present in the master branch, simply copy it over from the latest Asobo branch, and add it in its own commit. Please DO NOT add, modify, or delete files from the Asobo branch.

## Committing changes

After making any changes to files inside the `A32NX` or `src` directories, ensure you run the `npm run build` to regenerate the `layout.json` as necessary. There's also a CI check to ensure this has been done.

## Helping others

Please help other contributors to the project wherever you can, as people all start somewhere. If you require assistance or wish to provide assistance you can ask/answer questions on the `#dev-support` channel on discord.

## Contributing to the project

As this is an open source project, anyone is free to contribute as much or as little as they like. If you're just getting started with GitHub or project contributions then we suggest you take a look at issues on the repository. These issues will vary in complexity depending on the issue itself.

If you're comfortable contributing to Open Source projects on GitHub please ensure you read our expectations for issue tracking, feature proposals and pull requests.

If you're looking for tools and tips to help you develop, see [Development Resources](../docs/resources.md).

**Please avoid** adding features that are not true to life or features without providing supported documentation.

## Testing the project

If changes are made they should always be tested to make sure they work as intended and don't conflict with other systems. If you see a pull request open it's recommended that you test the features that were implemented to check for errors or it works as intended.

## Issue Tracking

If you require **support** with the A32NX, please utilise the channels on our [Discord](https://discord.gg/TtTuKFw). Issues regarding the features or bugs will not be handled on Discord. Please use GitHub issues to track new features or bugs.

When submitting an issue, there's a few guidelines we'd ask you to respect to make it easier to manage and for others to understand:
* **Search the issue tracker** before you submit your issue - it may already be present.
* When opening an issue, a template is provided for you. Please provide as much information as requested to ensure others are able to act upon the requests or bug report.
* Please ensure you add screenshots or documentation references for bugs/changes so we can quickly ascertain if the request is suitable.

**In order to be 'assigned' an issue**, please comment on the issue itself letting others know you are working on it.

## Pull Requests

We welcome pull requests with fixes and improvements to the project.

If you wish to add a new feature or you spot a bug that you wish to fix, **please open an issue for it first** on the [A32NX issue tracker](https://github.com/flybywiresim/a32nx/issues).

The work-flow for submitting a new pull request is designed to be simple, but also to ensure consistency from **all** contributors:
* Fork the project into your personal space on GitHub.com.
* Create a new branch (with a clear name of what is being changed).
* Add changes to CHANGELOG.md with credits to yourself.
* Commit your changes.
* When writing commit messages make sure they are clear about what has been changed.
* Push the commit(s) to your fork.
* Submit a pull request (PR) to the master branch.
* The PR title should describe the change that has been made.
* Follow the PR template and write as much detail as necessary for your changes and include documents/screenshots if needed.
* Be prepared to answer any questions about your PR when it is reviewed for acceptance.

**Please** keep your changes in a single PR as small as possible (relating to one issue) as this makes it easier to review and accept.  Large PRs with a small error will prevent the entire PR from being accepted.

**Ensure** that you include a CHANGELOG with your PR.

## Expectations
As contributors and maintainers of this project, we pledge to respect all people who contribute through reporting issues, posting feature requests, updating documentation, submitting pull requests or patches, and other activities.

Project maintainers have the right and responsibility to remove, edit, or reject comments, commits, code, issues and other contributions that are not aligned to this Code of Conduct.
