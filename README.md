# Chimp
Chimp is an Offline RSS Reader for Android based on Apache Cordova.
To run:
- Install Apache Cordova: https://cordova.apache.org/docs/en/4.0.0/guide/platforms/android/
- Build the project from the command line: $ cordova build
- Test it in Chrome browser: $ cordova emulate browser
    - You may need to install the Allow-Control-Allow-Origing extensions for Chrome: https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi
- Alternatively, you can test changes in realtime:
    - From the command line go to the www folder and run: $ python -m SimpleHTTPServer 8000
    - Now you can browse to http://localhost:8000/index.html and refresh after any code changes.
![Alt text](/Chimp-screenshot.png?raw=true "Chimp Screenshot")

