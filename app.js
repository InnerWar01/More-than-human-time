var currentPort = null;

// Port connection
chrome.runtime.onConnect.addListener(function(port) {
    if (port.name == "soil_has_moisture") {
      port.onMessage.addListener(function(msg) {
        replaceImage("soil-moisture.jpg");
        replaceText(document.body, msg.data);
        currentPort = port;
      });
    } else if (port.name == "soil_does_not_have_moisture") {
      port.onMessage.addListener(function(msg) {
        replaceImage("soil-without-moisture.jpg");
        replaceText(document.body, msg.data);
        currentPort = port;
      });
    } else if (port.name == "high_humidity") { // maybe have the filter blur is better instead of background image
      port.onMessage.addListener(function(msg) {
        currentPort = port;
        var divIMG = document.createElement('div');
        divIMG.id = "highHumidity";
        divIMG.className = "humidity";
        var img = document.createElement('img');
        img.className = "humidity";
        img.alt = "High Humidity";
        img.src = chrome.runtime.getURL('images/high-humidity.jpg');
        document.body.appendChild(divIMG);
        divIMG.appendChild(img);
        var opacity = 100 - msg.data; // (max value of opacity for high humidity = 50%) + (min value of high humidity = 50%) - (value of the sensor read)

        var css = `
          #highHumidity {
            position: fixed; 
            top: -50%; 
            left: -50%; 
            width: 200%; 
            height: 200%;
          }
          #highHumidity img {
            position: absolute; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0; 
            margin: auto; 
            width: 50%;
            opacity: ${opacity}%; /* opacity set depending on the level of humidity, the less humidity the less transparent*/
          }
        `;
        // create the style element
        var styleElement = document.createElement('style');

        // add style rules to the style element
        styleElement.appendChild(document.createTextNode(css));

        // attach the style element to the document head
        document.getElementsByTagName('head')[0].appendChild(styleElement);
      });
    } else if (port.name == "low_humidity") {
      port.onMessage.addListener(function(msg) {
        currentPort = port;
        var divIMG = document.createElement('div');
        divIMG.id = "lowHumidity";
        divIMG.className = "humidity";
        var img = document.createElement('img');
        img.className = "humidity";
        img.alt = "Low Humidity";
        img.src = chrome.runtime.getURL('images/low-humidity.jpg');
        document.body.appendChild(divIMG);
        divIMG.appendChild(img);
        var opacity = 100 - msg.data; // (min value of opacity for low humidity = 51%) + (max value of low humidity = 49%) - (value of the sensor read)

        var css = `
          #lowHumidity {
            position: fixed; 
            top: -50%; 
            left: -50%; 
            width: 200%; 
            height: 200%;
          }
          #lowHumidity img {
            position: absolute; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0; 
            margin: auto; 
            width: 50%;
            opacity: ${opacity}%; /* opacity set depending on the level of humidity, the less humidity the less transparent*/
          }
        `;
        // create the style element
        var styleElement = document.createElement('style');

        // add style rules to the style element
        styleElement.appendChild(document.createTextNode(css));

        // attach the style element to the document head
        document.getElementsByTagName('head')[0].appendChild(styleElement);
      });
    } else if (port.name == "light") {
      port.onMessage.addListener(function(msg) {
        currentPort = port;
        var brightnessLevel = 6800 - msg.data; // 100% is normal level of brightness on 1836 ohms (average of readings in a day) + 700% is the highest level of brightness + highest resistance for bright light 6000 ohms
        document.body.style.filter = "brightness(" + brightnessLevel + "%)";
      })
    } else if (port.name == "modal") {
      currentPort = port;
      // showing the modal when wanting to leave the page
      createModal();
    }
});

// Get all the images from the page and replace them depending on the data received from the sensor
function replaceImage(img) {
  let filename = img; 
  let imgs = document.getElementsByTagName('img'); 
  for(imgElt of imgs) {  
    let file = 'images/' + filename; 
    let url = chrome.runtime.getURL(file); 
    imgElt.src = url; 
    console.log(url); 
  } 
}

// Get all the text from text nodes from the page and replace them depending on the data received from the sensor
function replaceText(parentNode, data){
  for(var i = parentNode.childNodes.length-1; i >= 0; i--){
      var node = parentNode.childNodes[i];
      // Make sure that the text is not replaced in the modal
      if (node.id != "disruptionCloseButton" && node.id != "disruptionP" && node.id != "disruptionSubmitButton" && node.id != "disruptionError") {
        //  Make sure this is a text node
        if(node.nodeType == Element.TEXT_NODE){
          // Do this for the different type of data
          node.textContent = "Soil has " + data + " moisture level";
        } else if(node.nodeType == Element.ELEMENT_NODE){
          //  Check this node's child nodes for text nodes to act on
          replaceText(node, data);
        }
      }
  }
};

// Depending on the data, maybe some parts won't be created
function createModal() {
  // Modal HTML
  var div1 = document.createElement('div');
  div1.className = "disruption-modal";
  div1.id = "disruptionModal";
  var div2 = document.createElement('div');
  div2.className = "disruption-modal-content";
  var closeButton = document.createElement('button'); // will appear after countdown ends
  closeButton.type = "button";
  closeButton.className = "close";
  closeButton.id = "disruptionCloseButton";
  closeButton.textContent = "X";
  var p = document.createElement('p');
  p.id = "disruptionP";
  p.textContent = "";
  var inputText = document.createElement('input');
  inputText.type = "text";
  inputText.placeholder = "Write down your thoughts";
  inputText.id = "thoughtsText";
  var inputImage = document.createElement("input");
  inputImage.type = "file";
  inputImage.id = "imageUpload";
  inputImage.name = "filename"; 
  var submitButton = document.createElement('button'); // will appear after countdown ends
  submitButton.type = "submit";
  submitButton.className = "submit";
  submitButton.id = "disruptionSubmitButton";
  submitButton.textContent = "Submit";
  var errorP = document.createElement("p");
  errorP.id = "disruptionError";
  errorP.textContent = "Write down a note and upload an image first!";
  var div3 = document.createElement("div");
  div3.id = "likertScaleDisruption";
  var pQuestion = document.createElement("p");
  pQuestion.id = "disruptionQuestion";
  pQuestion.textContent = "What is your level of disruption?";
  div3.appendChild(pQuestion);
  var inputRadio = [];
  var label = [];

  for (i = 0; i < 7; i++) {
    inputRadio[i] = document.createElement("input");
    inputRadio[i].type = "radio";
    inputRadio[i].id = "level";
    inputRadio[i].name = "disruption-level";
    inputRadio[i].value = i+1;

    label[i] = document.createElement("label");
    label[i].htmlFor = "level";
    label[i].textContent = i+1;

    div3.appendChild(inputRadio[i]);
    div3.appendChild(label[i]);
  }

  // structuring the modal together
  div1.appendChild(div2);
  div2.appendChild(closeButton);
  div2.appendChild(p);
  //div2.appendChild(inputText);
  div2.appendChild(div3);
  div2.appendChild(inputImage);
  div2.appendChild(submitButton);
  div2.appendChild(errorP);
  document.body.appendChild(div1);

  console.log("Modal created");

  loadCSS(p); // loads the CSS for the modal
}

function loadCSS(p) 
{
  // specify our style rules in a string
  var cssRules = `/* The Modal (background) */
  #disruptionModal {
      display: none; /* Hidden by default */
      position: fixed; /* Stay in place */
      z-index: 1; /* Sit on top */
      left: 0;
      top: 0;
      width: 100%; /* Full width */
      height: 100%; /* Full height */
      overflow: auto; /* Enable scroll if needed */
      background-color: rgb(0,0,0); /* Fallback color */
      background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
    }
    
    /* Modal Content/Box */
    .disruption-modal-content {
      background-color: #fefefe;
      margin: 15% auto; /* 15% from the top and centered */
      padding: 20px;
      border: 1px solid #888;
      width: 80%; /* Could be more or less, depending on screen size */
      height: 40%;
    }

    #disruptionP {
        color: black;
        text-align: center;
        font-size: x-large;
    }

    #thoughtsText {
      width: -webkit-fill-available;
      margin: 10px;
      border-color: #52ffc5;
    }

    label {
      padding: 10px;
    }

    #likertScaleDisruption {
      margin: 10px;
    }
    
    #imageUpload {
      color: black;
      float: left;
      font-size: 15px;
      font-weight: bold;
      background-color: #52ffc5;
      padding: 14px;
      margin: 10px;
    }

    #disruptionSubmitButton {
      float: right;
      font-weight: bold;
      background-color: #52ffc5;
      margin: 10px;
      margin-top: 70px;
    }

    #disruptionError {
      display: none;
      float: left;
      position: relative;
      width: inherit;
      margin: 10px;
      color: #c5221f;
      font-weight: 500;
      font-size: small;
    }

    /* The Close Button */
    .close {
      color: black;
      float: right;
      font-size: 15px;
      font-weight: bold;
      background-color: #ff7f7f;
      padding: 14px;
    }
    
    .close:hover,
    .close:focus {
      color: black;
      text-decoration: none;
      cursor: pointer;
    }`;

  // create the style element
  var styleElement = document.createElement('style');

  // add style rules to the style element
  styleElement.appendChild(document.createTextNode(cssRules));

  // attach the style element to the document head
  document.getElementsByTagName('head')[0].appendChild(styleElement);

  console.log("CSS loaded");

  displayModal(); //displays the modal
}

function displayModal() {
  // Get the modal
  var modal = document.getElementById("disruptionModal");

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];

  // Get the p that display the countdown
  var p = document.getElementById("countdownP");

  // Get the error paragraph in case notes and image was not submitted
  var errorP = document.getElementById("disruptionError");

  // Get the input text element
  var inputText = document.getElementById("thoughtsText");

  // Get the upload image element
  var inputImage = document.getElementById("imageUpload");

  // Get the button that will submit the info
  var submitButton = document.getElementById("disruptionSubmitButton");
  submitButton.onclick = function() { 
    if (inputImage.value != "" && inputText.value != "") {
      errorP.style.display = "none";
      console.log("Sending data to the database");
      currentPort.postMessage({response: "Image and text replaced", thoughts: inputText.value, image: inputImage.value});
      currentPort.disconnect(); // disconnects from port
      currentPort = null;
      modal.style.display = "none"; 
    } else {
      errorP.style.display = "block";
    }    
  };

  // Get the button that will close the modal
  var closeButton = document.getElementById("disruptionCloseButton");
  closeButton.onclick = function() { 
    if (inputImage.value != "" && inputText.value != "") {
      errorP.style.display = "none";
      console.log("Closing modal"); // can't close until the fields are completed
      modal.style.display = "none"; 
    } else {
      errorP.style.display = "block";
    }
  };

  modal.style.display = "block";
  console.log("Modal displayed");
}

// function closeModal() {
//   // Get the modal
//   var modal = document.getElementById("disruptionModal");
//   console.log("Closing modal"); // can't close until the fields are completed
//   modal.style.display = "none";
// }

// chrome.runtime.sendMessage({command: "fetch"}, (response) => {
//     showData(response.data);
// });

// Sending messages from Content Script
// const msg = 'Hello from content Script ⚡'
// chrome.runtime.sendMessage({ message: msg }, function(response) {
//     console.log(response);
// });

// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//     console.log(request);
//     console.log(sender.tab ?
//                 "from a content script:" + sender.tab.url :
//                 "from the extension");
//     if (request.greeting == "hello")
//     sendResponse({farewell: "goodbye"});
//     return true;
// });

// console.log("Image tags " + document.getElementsByTagName("img"));
// document.getElementsByTagName("img")[0].src = "images/soil-moisture.jpg"

    //   console.log("msg command " + msg.command);
  
    //   if (msg.command == "post"){
    //     console.log("process msg post", msg, sender, resp);
    //     db.collection("cities").doc("test-doc").set({
    //         data: msg.data
    //     })
    //     .then(function() {
    //       console.log("success", result);
    //     })
    //     .catch(function(error) {
    //       // Error, getting document error
    //       resp({type: "result", status: "error", data: error, request: msg}); 
    //     });
    //   }
  
    //   if (msg.command == "fetch"){
    //     console.log("process msg fetch", msg, sender, resp);
    //     db.ref('/soil-moisture/').once('value').then(function(snapshot){
    //       resp({type: "result", status: "success", data: snapshot.val(), request: msg}); 
    //     });
    //   }
  
    //   // if the message says disrupt then reload page and show the modal
  
    //   return true;

// chrome.runtime.sendMessage({command: "post", data:"Test Data"}, (response) => {
//     showData(response.data);
// });

// var showData = function(data) {
//     dataDB = data;
//     console.log('From Extension--', dataDB);
// }