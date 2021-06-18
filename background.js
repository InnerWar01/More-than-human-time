// Service Worker Catch Any Error
try{
  // Import Firebase Local Scripts
  self.importScripts('firebase/firebase-app.js', 'firebase/firebase-database.js');

  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  // Get needed references to the database service
  var dbRef = firebase.database().ref();
  var dbRefSnapshot = null;
  // For Soil moisture
  //var dbRefSoil = firebase.database().ref("soil_moisture/data");
  var dbRefSoilSnapshot = null;
  var childAddedToSoil = false;
  var lastSoilMoistureValue = null;
  //var soilHasMoisture = false;
  // For Humidity
  var dbRefHumidity = firebase.database().ref("humidity/data");
  var dbRefHumiditySnapshot = null;
  var childAddedToHumidity = false;
  var highHumidity = false;
  // For Light
  var dbRefLight = firebase.database().ref("light/data");
  var dbRefLightSnapshot = null;
  var childAddedToLight = false;
  // For Temperature
  var dbRefTemperature = firebase.database().ref("temperature/data");
  var dbRefTemperatureSnapshot = null;
  var childAddedToTemperature = false;
  var highTemperature = false;

  let disruptionCase = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 16 disruption cases, where disruptionCase[0] is when no disruption occurs (i.e. none of the sensors had significant changes to cause a disruption)

  //let firstCount = [0, 0, 0, 0]; // firstCount[0] = soil moisture, firstCount[1] = light, firstCount[2] = humidity,  firstCount[3] = temperature;
  let firstCount = 0;

  var disruption = false;

  // each function will run once when it is initiated and the once more for every time a new child is added under the path
  // dbRefSoil.on('child_added', function(snapshot_soil) {
  //   firstCount[0]++;
  //   dbRefSoilSnapshot = snapshot_soil;
  //   if (firstCount[0] > 1) {
  //     //childAddedToSoil = true;
  //     firstCount[0] = 1; // so that the first time the function runs it's not considered as child added to soil
  //     if ((snapshot_soil.val()["soil_moisture_value"] - lastSoilMoistureValue) >= 9) { // if there is a significant change
  //       disruptionCase[1] = 1; // means that it's at least the first disruptive case
  //       lastSoilMoistureValue = snapshot_soil.val()["soil_moisture_value"]; // current value becomes last soil moisture value for next comparison
  //       // reloads the active tab
  //       chrome.tabs.reload(function(){});
  //     } else {
  //       console.log("No significant change in soil moisture");
  //     }
  //   } else{
  //     console.log("First time function run for dbRefSoil");
  //   }
  // });

  dbRef.on('child_added', function(snapshot) {
    firstCount++;
    dbRefSnapshot = snapshot;
    if (firstCount > 1) {
      firstCount = 1; // so that the first time the function runs it's not considered as child added to database
      if ((snapshot_soil.val()["soil_moisture_value"] - lastSoilMoistureValue) >= 9) { // if there is a significant change
        disruptionCase[1] = 1; // means that it's at least the first disruptive case
        lastSoilMoistureValue = snapshot_soil.val()["soil_moisture_value"]; // current value becomes last soil moisture value for next comparison
        disruption = true;
      } 
      // if () {
      //   // for light
      // } 
      // if () {
      //   // for humidity
      // } 
      // if () {
      //   // for temperature
      // }

      // if there are significant changes, a disruption should occur, so page is reloaded to start that
      if (disruption) {
        // reloads the active tab
        //chrome.tabs.reload(function(){});
        createDisruptionPort(tabID);
      } else {
        console.log("No significant changes");
      }
    } else {
      console.log("First time function run for dbRef");
    }
  })

  // dbRefLight.on('child_added', function(snapshot_light) {
  //   firstCount[1]++;
  //   dbRefLightSnapshot = snapshot_light;
  //   if (firstCount[1] > 1) {
  //     childAddedToLight = true;
  //     firstCount[1] = 1; // so that the first time the function runs it's not considered as child added to soil
  //     // reloads the active tab
  //     chrome.tabs.reload(function(){});
  //   }
  // });

  // dbRefHumidity.on('child_added', function(snapshot_humidity) {
  //   firstCount[2]++;
  //   dbRefHumiditySnapshot = snapshot_humidity;
  //   firebase.database().ref("humidity/boundary_value").once("value", function (snapshot) {
  //     if (firstCount[2] > 1) {
  //       childAddedToHumidity = true;
  //       firstCount[2] = 1; // so that the first time the function runs it's not considered as child added to soil
  //       if (dbRefHumiditySnapshot.val()["value"] >= snapshot.val()) {
  //         console.log("High humidity");
  //         highHumidity = true;
  //       } else {
  //         console.log("Low humidity");
  //       }
  //       // should only reload if the data has been given in the last x minutes or not, try first with no matter the time passed before the last change
  //       // reloads the active tab
  //       chrome.tabs.reload(function(){});
  //     }
  //   })
  // });

  // dbRefTemperature.on('child_added', function(snapshot) {
  //     // to complete
  // });

  // do I need to reload page or I can just make changes straight away on the current page
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // if there is an error with the reloading, reload again
        if (tabs == "undefined") {
          chrome.tabs.reload(function(){});
        } else if (changeInfo.status == 'complete' && tabs[0].title != "Extensions") { // so that no error shows when in the extension settings
          var tabID = tabs[0].id;
          console.log("Tab title: " + tabs[0].title);
          //if (childAddedToSoil == true) {
          if (disruptionCase[1] == 1) {
            //childAddedToSoil = false; // so that no changes are done on the page if no new child was added
            //console.log("Child Added to Soil");
            console.log("Disruption from soil moisture, case 1.");
            //createPortForSoil(tabID);
          } // else if (childAddedToHumidity == true) {
          //   childAddedToHumidity = false; // so that no changes are done on the page if no new child was added
          //   console.log("Child Added to Humidity");
          //   createPortForHumidity(tabID);
          // } else if (childAddedToLight == true) {
          //   childAddedToLight = false; // so that no changes are done on the page if no new child was added
          //   console.log("Child Added to Light");
          //   createPortForLight(tabID);
          // }
          else {
            disruptionCase[0] = 1; // none of the sensors had significant changes, thus, no disruption occurs
          }

          createDisruptionPort(tabID);
        }
      })
    }
  })

  function createDisruptionPort(tabID) {
    // there are disruptions, create port
    if (disruptionCase[0] == 0) {
      var port = chrome.tabs.connect(tabID, {name: "disruption"});
    } else {
      // create only one child added function
    }
  }

  function createPortForSoil(tabID) {
    var port = chrome.tabs.connect(tabID, {name: "soil_has_moisture"});
    port.postMessage({data: dbRefSoilSnapshot.val()["value"]});
    port.onMessage.addListener(function(msg) {
      console.log("Msg response: " + msg.response);
    });
    port.onDisconnect.addListener(function() {
      console.log("Port disconnected :/");
    })


      var port = chrome.tabs.connect(tabID, {name: "soil_does_not_have_moisture"});
      port.postMessage({data: dbRefSoilSnapshot.val()["value"]});
      port.onMessage.addListener(function(msg) {
        console.log("Msg response: " + msg.response);
        firebase.database().ref("soil_moisture/data/" + dbRefSoilSnapshot.key).update({
            notes: msg.thoughts,
            image: msg.image
          });
        console.log("Data updated in firebase");
      });
      port.onDisconnect.addListener(function() {
        console.log("Port disconnected :/");
      })
    dbRefSoilSnapshot = null;
  }

  // function createPortForSoil(tabID) {
  //   if (soilHasMoisture) {
  //     soilHasMoisture = false;
  //     var port = chrome.tabs.connect(tabID, {name: "soil_has_moisture"});
  //     port.postMessage({data: dbRefSoilSnapshot.val()["value"]});
  //     port.onMessage.addListener(function(msg) {
  //       console.log("Msg response: " + msg.response);
  //     });
  //     port.onDisconnect.addListener(function() {
  //       console.log("Port disconnected :/");
  //     })
  //   } else {
  //     var port = chrome.tabs.connect(tabID, {name: "soil_does_not_have_moisture"});
  //     port.postMessage({data: dbRefSoilSnapshot.val()["value"]});
  //     port.onMessage.addListener(function(msg) {
  //       console.log("Msg response: " + msg.response);
  //       firebase.database().ref("soil_moisture/data/" + dbRefSoilSnapshot.key).update({
  //           notes: msg.thoughts,
  //           image: msg.image
  //         });
  //       console.log("Data updated in firebase");
  //     });
  //     port.onDisconnect.addListener(function() {
  //       console.log("Port disconnected :/");
  //     })
  //   }
  //   dbRefSoilSnapshot = null;
  // }

  function createPortForHumidity(tabID) {
    if (highHumidity) {
      highHumidity = false;
      var port = chrome.tabs.connect(tabID, {name: "high_humidity"});
      port.postMessage({data: dbRefHumiditySnapshot.val()["value"]});
      port.onMessage.addListener(function(msg) {
        console.log("Msg response: " + msg.response);
      });
      port.onDisconnect.addListener(function() {
        console.log("Port disconnected :/");
      })
    } else {
      var port = chrome.tabs.connect(tabID, {name: "low_humidity"});
      port.postMessage({data: dbRefHumiditySnapshot.val()["value"]});
      port.onMessage.addListener(function(msg) {
        console.log("Msg response: " + msg.response);
        firebase.database().ref("humidity/data/" + dbRefSoilSnapshot.key).update({
            notes: msg.thoughts,
            image: msg.image
          });
        console.log("Data updated in firebase");
      });
      port.onDisconnect.addListener(function() {
        console.log("Port disconnected :/");
      })
    }
    dbRefHumiditySnapshot = null;
  }

  function createPortForLight(tabID) {
    var port = chrome.tabs.connect(tabID, {name: "light"});
    port.postMessage({data: dbRefLightSnapshot.val()["value"]});
    port.onMessage.addListener(function(msg) {
      console.log("Msg response: " + msg.response);
    });
    port.onDisconnect.addListener(function() {
      console.log("Port disconnected :/");
    })
    dbRefLightSnapshot = null;
  }

  function createPortForTemperature(tabID) {
    // to complete
  }

  // show modal when wanting to leave/close the tab
  chrome.tabs.onRemoved.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status != 'complete') {
      createPortShowModal(tabID);
    }
  })

  function createPortShowModal(tabID) {
    var port = chrome.tabs.connect(tabID, {name: "modal"});
    port.onMessage.addListener(function(msg) {
      console.log("Msg response: " + msg.response);
    });
    port.onDisconnect.addListener(function() {
      console.log("Port disconnected :/");
    })
  }
  
} catch(e){
  // show errors
  console.log(e);
}