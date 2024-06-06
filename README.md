# Distributed Computing and Systems project
Implement distributed voting algorithm, simulate errors. 
Members propose voting subject, then the nodes apply to quorum, 
then they vote and a result is announced. Voting rounds run in parallel.

## Node.js solution
The application is implemented using Node version 20.11.1.
It uses TypeScript language.

### How to run?
To run the application you need to have Node installed on your machine.
You can download it [here](https://nodejs.org/en/download/).
```bash
# install dependencies
npm install
# compile TypeScript to JavaScript
npm run build
# run the application in production mode
NODE_ENV=production node dist/main.js
```
