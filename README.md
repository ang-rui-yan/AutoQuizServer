# AutoQuizServer

Fully automated server to run quizzes for multiplayers

## Current features

-   Emits questions and options to client
-   Have a global timer for the clients

## Getting started

1. Place the `server` directory in the same folder as `client/<repo>`
   | client
   | -> TT
   | server
1. Do `yarn install` to install dependencies
1. Generate
1. Start the server with `yarn server`
1. Run the client and head to `quiz/testws`

## Troubleshooting

If you face issues with the backend such as
`TypeError: Cannot read properties of undefined (reading 'on')`
This is just a matter of refreshing the server. Since we are using nodemon, you can just ctrl+s any files for it to refresh
