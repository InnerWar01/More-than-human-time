// Service Worker Catch Any Error
try{
  // Import Firebase Local Scripts
  self.importScripts('firebase/firebase-app.js', 'firebase/firebase-database.js');

  // Your web app's Firebase configuration
  var firebaseConfig = {

  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  // Get needed references to the database service
  var dbRef = firebase.database().ref("disruptions/");
  var dbRefSnapshot = null;
  var dbRefLastSensorValues = firebase.database().ref("comparison_data/");
  // For Soil moisture
  var lastSoilMoistureValue = 0;

  // For Light
  var lastLightValue = 0;

  // For Humidity
  var lastHumidityValue = 0;

  // For Temperature
  var lastTemperatureValue = 0;

  let disruptionCase = [0, 0, 0, 0]; // 4 disruption cases
  let currentCase = 0;

  var numDisruptions = 0;
  dbRef.once("value", function(snapshotDisruptions) {
    numDisruptions = snapshotDisruptions.numChildren();
  });

  var disruption = false;

  var currentActiveTabID = 0; 

  var port = null;

  var portOpen = false;

  dbRef.on('child_added', function(snapshot) {
    var numChildren = 0;
    dbRef.once("value", function(snapshotDisruptions) {
      numChildren = snapshotDisruptions.numChildren();
    });

    dbRefLastSensorValues.once("value", function (snapshot) { 
      lastSoilMoistureValue = snapshot.val()["last_soil_moisture_value"];
    });

    dbRefLastSensorValues.once("value", function (snapshot) { 
      lastLightValue = snapshot.val()["last_light_value"];
    });

    dbRefLastSensorValues.once("value", function (snapshot) { 
      lastHumidityValue = snapshot.val()["last_humidity_value"];
    });

    dbRefLastSensorValues.once("value", function (snapshot) { 
      lastTemperatureValue = snapshot.val()["last_temperature_value"];
    });

    console.log(numDisruptions);
    console.log(numChildren);
    console.log(lastHumidityValue);
    console.log("disruptionCase should be 0 " + disruptionCase);

    // means that another child was added but previous disruption not completed yet
    if ((disruptionCase[0] != 0 || disruptionCase[1] != 0 || disruptionCase[2] != 0 || disruptionCase[3] != 0) && port != null) { 
      portOpen = true;
      firebase.database().ref("disruptions/" + dbRefSnapshot.key).update({
        disruption_case: currentCase, 
        disruption_level: 0,
        image: "disruption but another child added"
      });
      console.log("Disruption but another child was added for " + dbRefSnapshot.key);
      port.disconnect();
    }

    // checks that a new disruption was added, don't do anything else otherwise (like change things in the database)
    if (numChildren == numDisruptions + 1) {
      dbRefSnapshot = snapshot;
      numDisruptions++;
      console.log("-----------Starting the disruption check for " + dbRefSnapshot.key + "-----------");
      //firstCount = 1; // so that the first time the function runs it's not considered as child added to database

      console.log("Soil moisture value " + snapshot.val()["soil_moisture_value"] + " - last soil moisture value " + lastSoilMoistureValue + " = " + Math.abs(snapshot.val()["soil_moisture_value"] - lastSoilMoistureValue));
      if (Math.abs(snapshot.val()["soil_moisture_value"] - lastSoilMoistureValue) >= 9) { // if there is a significant change
        //console.log(snapshot.val()["soil_moisture_value"]);
        //console.log(lastSoilMoistureValue);
        disruptionCase[0] = 1; // means that it's at least the first disruptive case
        disruption = true;
      } 

      console.log("Light value " + snapshot.val()["light_value"] + " - last light value " + lastLightValue + " = " + Math.abs(snapshot.val()["light_value"] - lastLightValue));
      if (Math.abs(snapshot.val()["light_value"] - lastLightValue) >= 70) {
        disruptionCase[1] = 1; // means that it's at least the second disruptive case
        disruption = true;
      } 

      console.log("Humidity value " + snapshot.val()["humidity_value"] + " - last humidity value " + lastHumidityValue + " = " + Math.abs(snapshot.val()["humidity_value"] - lastHumidityValue));
      if (Math.abs(snapshot.val()["humidity_value"] - lastHumidityValue) >= 1) {
        disruptionCase[2] = 1; // means that it's at least the third disruptive case
        disruption = true;
      } 

      console.log("Temperature value " + snapshot.val()["temperature_value"] + " - last temperature value " + lastTemperatureValue + " = " + Math.abs(snapshot.val()["temperature_value"] - lastTemperatureValue));
      if (Math.abs(snapshot.val()["temperature_value"] - lastTemperatureValue) >= 0.5) {
        disruptionCase[3] = 1; // means that it's at least the fourth disruptive case
        disruption = true;
      }

      dbRefLastSensorValues.update({
        last_soil_moisture_value: dbRefSnapshot.val()["soil_moisture_value"],
        last_light_value: dbRefSnapshot.val()["light_value"],
        last_humidity_value: dbRefSnapshot.val()["humidity_value"],
        last_temperature_value: dbRefSnapshot.val()["temperature_value"]
      }); 

      // if there are significant changes, a disruption should occur, so page is reloaded to start that
      if (disruption) {
        // reloads the active tab
        //chrome.tabs.reload(function(){});
        if (disruptionCase[0] == 1 && disruptionCase[1] == 1 && disruptionCase[2] == 1 && disruptionCase[3] == 1) { // this is case 15, soil moisture + light + humidity + temperature
          currentCase = 15;
        } else if (disruptionCase[0] == 1 && disruptionCase[2] == 1 && disruptionCase[3] == 1) { // this is case 14, soil moisture + humidity + temperature
          currentCase = 14;
        } else if (disruptionCase[1] == 1 && disruptionCase[2] == 1 && disruptionCase[3] == 1) { // this is case 13, light + humidity + temperature
          currentCase = 13;
        } else if (disruptionCase[0] == 1 && disruptionCase[1] == 1 && disruptionCase[3] == 1) { // this is case 12, soil moisture + light + temperature
          currentCase = 12;
        } else if (disruptionCase[0] == 1 && disruptionCase[1] == 1 && disruptionCase[2] == 1) { // this is case 11, soil moisture + light + humidity
          currentCase = 11;
        } else if (disruptionCase[2] == 1 && disruptionCase[3] == 1) { // this is case 10, humidity + temperature
          currentCase = 10;
        } else if (disruptionCase[1] == 1 && disruptionCase[3] == 1) { // this is case 9, light + temperature
          currentCase = 9;
        } else if (disruptionCase[1] == 1 && disruptionCase[2] == 1) { // this is case 8, light + humidity
          currentCase = 8;
        } else if (disruptionCase[0] == 1 && disruptionCase[3] == 1) { // this is case 7, soil moisture + temperature
          currentCase = 7;
        } else if (disruptionCase[0] == 1 && disruptionCase[2] == 1) { // this is case 6, soil moisture + humidity
          currentCase = 6;
        } else if (disruptionCase[0] == 1 && disruptionCase[1] == 1) { // this is case 5, soil moisture + light
          currentCase = 5;
        } else if (disruptionCase[3] == 1) { // this is case 4, temperature alone
          currentCase = 4;
        } else if (disruptionCase[2] == 1) { // this is case 3, humidity alone
          currentCase = 3;
        } else if (disruptionCase[1] == 1) { // this is case 2, light alone
          currentCase = 2;
        } else if (disruptionCase[0] == 1) { // this is case 1, soil moisture alone
          currentCase = 1;
        }
        console.log("Current case is number " + currentCase + " for " + dbRefSnapshot.key);
        // creates port for current tab, depending on the case
        //createDisruptionPorts();
        // create disruption port for the current and active tab
        // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        //   // if there is an error with the reloading, reload again
        //   if (tabs == "undefined") {
        //     //chrome.tabs.reload(function(){});
        //     console.log("Tab undefined");
        //   } else if (tabs[0].title != "Extensions") { // so that no error shows when in the extension settings
        //     var tabID = tabs[0].id;
        //     console.log("Tab title: " + tabs[0].title);
        //     createDisruptionPort(tabID);
        //   }   
        // })
        // changes occur only to the current active tab on which the disruption is happening

        // saves the disruption case number in the database
        firebase.database().ref("disruptions/" + dbRefSnapshot.key).update({
          disruption_case: currentCase,
        });

        // if there is an active tab, reload the page to start the disruption
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          console.log(tabs.length);
          console.log(tabs);
          if (tabs.length > 0) {
            currentActiveTabID = tabs[0].id;
            chrome.tabs.reload(currentActiveTabID);
          } else {
            firebase.database().ref("disruptions/" + dbRefSnapshot.key).update({
              disruption_level: 0,
              image: "disruption but no activity"
            });
            console.log("Disruption but no activity for " + dbRefSnapshot.key);

            // reinitialize some variables
            disruptionCase = [0, 0, 0, 0];
            currentActiveTabID = 0;
            currentCase = 0;
            dbRefSnapshot = null;
          }
        });
      } else {
        console.log("No significant changes for " + dbRefSnapshot.key);
        // fill the remaining elements in the database
        currentCase = 0;
        firebase.database().ref("disruptions/" + snapshot.key).update({
          disruption_case: currentCase, // which should be case number 0, as in no disruption
          disruption_level: 0,
          image: "no disruption"
        });

        // reinitialize some variables
        disruptionCase = [0, 0, 0, 0];
        currentActiveTabID = 0;
        dbRefSnapshot = null;
      }

      // if (currentActiveTabID == 0 && currentCase != 0) {
      //   // if there is no active tab, then make no changes, just save the disruption case number an reinitialize variables
      //   firebase.database().ref(snapshot.key).update({
      //     //disruption_case: currentCase,
      //     disruption_level: 0,
      //     image: "disruption but no activity"
      //   });
      //   // reinitialize some variables
      //   currentCase = 0;
      //   disruptionCase = [0, 0, 0, 0];
      // }
      // reinitialize some variables
      disruption = false;
    } else {
      console.log("First time function run for dbRef");
    }
  });

  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete' && currentCase != 0 && tabId == currentActiveTabID) { // check that this is not a different tab so that it doesn't make any changes
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // if there is an error with the reloading, reload again
        if (tabs == "undefined") {
          chrome.tabs.reload(currentActiveTabID);
        } else if (changeInfo.status == 'complete' && tabs[0].title != "Extensions") { // so that no error shows when in the extension settings
          var tabID = tabs[0].id;
          console.log("Tab title: " + tabs[0].title);
          //console.log("creating port");
          createDisruptionPort(currentActiveTabID);
        }
      })
    }
  })

  // creating a disruption port for the specific tab
  function createDisruptionPort(tabID) {
    //console.log("Creating port for tab with id " + tabID);

    //chrome.runtime.sendMessage('ping', response => {
      // if(chrome.runtime.lastError) {
      //   console.log("Runtime error, trying again");
      //   setTimeout(1000);
      //   createDisruptionPort(tabID);
      // } else {
        //setTimeout(1000);
        //console.log("connecting port for the tab with id " + tabID);
        port = chrome.tabs.connect(tabID, {name: "disruption"});
        // sends the 4 array elements, to see which of the four sensors caused a disruption, and send the readings of the 4 sensors needed to create the disruption
        port.postMessage({
          disruptionArray: disruptionCase, 
          soilMoisture: dbRefSnapshot.val()["soil_moisture_value"], 
          light: dbRefSnapshot.val()["light_value"], 
          humidity: dbRefSnapshot.val()["humidity_value"], 
          temperature: dbRefSnapshot.val()["temperature_value"],
          tab: tabID
        }); 
        port.onMessage.addListener(function(msg) {
          console.log("Msg response: " + msg.response);
          var d = new Date();
          var currentTime = d.getTime();
          firebase.database().ref("disruptions/" + dbRefSnapshot.key).update({
            //disruption_case: currentCase,
            disruption_level: msg.disruptionLevel,
            image: msg.image,
            completedAt: currentTime
          });
          console.log("Data updated in firebase");
        });
        port.onDisconnect.addListener(function() {
          console.log("Port disconnected for tab with id " + tabID);
          console.log("currentActiveTabID, dbRefSnapshot and disruptionCase variables reset, resetting the page to normal");
          currentActiveTabID = 0;
          currentCase = 0;
          disruptionCase = [0, 0, 0, 0];
          dbRefSnapshot = null;
          port = null;

          console.log(portOpen);
          if (portOpen) {
            // means that another child was added on top, don't reload
            portOpen = false;
          } else {
            chrome.tabs.reload(tabID);
          }
        })
      //}
    //})
  }

  // // for each tab in each window, a disruption port is created
  // function createDisruptionPorts() {
  //   chrome.windows.getAll({populate:true},function(windows){
  //     windows.forEach(function(window){
  //       window.tabs.forEach(function(tab){
  //         if (tab != "undefined") {
  //           if (tab.title != "Extensions") {
  //             createDisruptionPort(tab.id);
  //           }
  //         }
  //       });
  //     });
  //   });
  // }

  // show modal when wanting to leave/close the tab
  // chrome.tabs.onRemoved.addListener(function(tabId, changeInfo, tab) {
  //   if (changeInfo.status != 'complete') {
  //     createPortShowModal(tabID);
  //   }
  // })

  // function createPortShowModal(tabID) {
  //   var port = chrome.tabs.connect(tabID, {name: "modal"});
  //   port.onMessage.addListener(function(msg) {
  //     console.log("Msg response: " + msg.response);
  //   });
  //   port.onDisconnect.addListener(function() {
  //     console.log("Port disconnected :/");
  //   })
  // }
  
} catch(e){
  // show errors
  console.log(e);
}