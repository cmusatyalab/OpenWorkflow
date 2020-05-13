# Overview

This directory contains the React source for the OpenWorkflow web GUI. This is a pure front-end 
web GUI (no backend is needed). Everything is done in the browser with HTML, CSS, and Javascript.
This Github page of this repository serves the compiled frontend code at https://cmusatyalab.github.io/OpenWorkflow/.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).


## Compilation

First install nodejs (npm). 

```
# in current directory
npm install
npm run build
```

Open build/index.html to access the web GUI.

## Other available NPM commands

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run deploy`

Deploy the application to the gh-page branch of this repository.

## Generate Javascript protobuf library for Finite State Machine serialization/deserialization.

You would only need to do this if you changed the serialization format of
OpenWorkflow finite state machine in wca-state-machine.proto.

1. Run [gen-jspb.sh](gen-jspb.sh).
2. To generate the proper protobuf js, "/* eslint-disable */" needs to be added to the top of the file. The gen-jspb.sh
script does this. See [here](https://github.com/improbable-eng/grpc-web/issues/96#issuecomment-347871452).

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
