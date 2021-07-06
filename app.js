var currentPort = null;
var nbTextNodes = 0;
var nodeNb = [];

// Port connection
chrome.runtime.onConnect.addListener(function(port) {
  if (port.name == "disruption") {
    createModal();
    port.onMessage.addListener(function(msg) {
      console.log("Disruption port created for tab " + msg.tab);
      currentPort = port;
      // specify our style rules in a string
      var cssRules = `div :not(.disruption-modal, 
        .disruption-modal > *, 
        #disruptionCloseButton, 
        #disruptionP,
        #likertScaleDisruption, 
        #disruptionQuestion, 
        #disruptionLevel, 
        #disruptionLevelLabel,
        #disruptionImageUpload, 
        #disruptionSubmitButton,
        #disruptionError) {`;

      if (msg.disruptionArray[0] == 1) {
        // switch this to having: the drier the soil, the more words disappear, representing the cracks, so some information disappears
        //console.log(nbTextNodes);
        createSoilCracks(msg.soilMoisture);
      } else {
        console.log("No disruption in soil moisture");
      }

      if (msg.disruptionArray[1] == 1) {
        var brightnessLevel = ((6700 - msg.light)/70)*2.089; // 100% is normal level of brightness on 3350 ohms (average of resistance), 200% is the highest level of brightness, 0 ohms resistance is around 6700 ohms (when it's dark)
        cssRules += `filter: brightness(` + brightnessLevel + `%);`;
      } else {
        console.log("No disruption in light variation");
      } 

      if (msg.disruptionArray[2] == 1) {
        var opacity = 100 - msg.humidity; // (min value of opacity for low humidity = 51%) + (max value of low humidity = 49%) - (value of the sensor read)
        cssRules += `opacity: ` + opacity + `%;`;
      } else {
        console.log("No disruption in humidity");
      } 

      if (msg.disruptionArray[3] == 1) {
        // continue here
        var backgroundColor = ((36 - msg.temperature)/0.5)*1.88; // 36 degrees highest temperature and -32 degrees is the lowest temperature -> 36 degrees = 0 & -32 degrees = 255
        cssRules += `background-color: hsl(` + backgroundColor + `, 100%, 50%);`;
      } else {
        console.log("No disruption in temperature");
      } 

      cssRules += `}`;

      // create the style element
      var styleElement = document.createElement('style');

      // add style rules to the style element
      styleElement.appendChild(document.createTextNode(cssRules));

      // attach the style element to the document head
      document.getElementsByTagName('head')[0].appendChild(styleElement);
    });
  }
  return true;
});

// Get all the images from the page and replace them depending on the data received from the sensor
// function replaceImage(img) {
//   let filename = img; 
//   let imgs = document.getElementsByTagName('img'); 
//   for(imgElt of imgs) {  
//     let file = 'images/' + filename; 
//     let url = chrome.runtime.getURL(file); 
//     imgElt.src = url; 
//     console.log(url); 
//   } 
// }

// Get all the text from text nodes from the page and replace them with "cracks"
function replaceText(parentNode, numTextNodes){
  for(var i = parentNode.childNodes.length-1; i >= 0; i--){
    var node = parentNode.childNodes[i];
    // Make sure that the text is not replaced in the modal
    if (node.id != "disruptionCloseButton" && 
    node.id != "disruptionP" && 
    node.id != "disruptionQuestion" && 
    node.id != "disruptionLevelLabel" &&
    node.id != "disruptionImageUpload" &&
    node.id != "disruptionSubmitButton" && 
    node.id != "disruptionError") {
      //  Make sure this is a text node
      if(node.nodeType == Element.TEXT_NODE){
        nbTextNodes += 1;
        for (var j = 0; j < nodeNb.length; j++){
          if (nbTextNodes == nodeNb[j]) { // if the node nb is equal to any of the random numbers in the array then create the crack
            node.textContent = "";
            //console.log("Crack created at node " + node);
          }
        }
      } else if(node.nodeType == Element.ELEMENT_NODE){
        //  Check this node's child nodes for text nodes to act on
        replaceText(node, numTextNodes);
      }
    }
  }
};

function getNbTextNodes(parentNode) {
  for(var i = parentNode.childNodes.length-1; i >= 0; i--){
    var node = parentNode.childNodes[i];
    // Make sure that the modal text is not considered
    if (//node.id != "disruptionModal" && 
    //node.id != "disruptionModalContent" && 
    node.id != "disruptionCloseButton" && 
    node.id != "disruptionP" && 
    node.id != "disruptionQuestion" && 
    node.id != "disruptionLevelLabel" &&
    node.id != "disruptionImageUpload" &&
    node.id != "disruptionSubmitButton" && 
    node.id != "disruptionError") {
      //  Make sure this is a text node
      if(node.nodeType == Element.TEXT_NODE){
        nbTextNodes += 1;
      } else if(node.nodeType == Element.ELEMENT_NODE){
        //  Check this node's child nodes for text nodes to act on
        getNbTextNodes(node);
      }
    } else {
      console.log(node);
    }
  }
}

function createSoilCracks(soilMoisture) {
  var soilMoistureDefficit = ((880 - soilMoisture)*100)/880; // how much % less moisture than max moisture value
  // get the nb of text nodes
  getNbTextNodes(document.body); 
  var nbNodesDisappear = Math.round((nbTextNodes*soilMoistureDefficit)/100); // how many nodes need to disappear (to create the cracks)

  // generate randomly the array of numbers of the nodes that will become the "cracks"
  for (var i=nbNodesDisappear; i>0; i--) {
    nodeNb.push(Math.round(Math.random() * (nbNodesDisappear - 1) + 1));
  }

  nbTextNodes = 0;
  replaceText(document.body, nbTextNodes);
  nodeNb = [];
}

// Depending on the data, maybe some parts won't be created
function createModal() {
  // Modal HTML
  var div1 = document.createElement('div');
  div1.className = "disruption-modal";
  div1.id = "disruptionModal";
  var div2 = document.createElement('div');
  div2.id = "disruptionModalContent";
  div2.className = "disruption-modal-content";
  var closeButton = document.createElement('button'); // will appear after countdown ends
  closeButton.type = "button";
  closeButton.className = "close";
  closeButton.id = "disruptionCloseButton";
  closeButton.textContent = "X";
  var p = document.createElement('p');
  p.id = "disruptionP";
  p.textContent = "";
  var inputImage = document.createElement("input");
  inputImage.type = "file";
  inputImage.id = "disruptionImageUpload";
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
    inputRadio[i].id = "disruptionLevel";
    inputRadio[i].name = "disruption-level";
    inputRadio[i].value = i+1;

    label[i] = document.createElement("label");
    label[i].htmlFor = "level";
    label[i].id = "disruptionLevelLabel";
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
    
    #disruptionImageUpload {
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

  // Get the error paragraph in case notes and image was not submitted
  var errorP = document.getElementById("disruptionError");

  // Get the input text element
  // var inputText = document.getElementById("thoughtsText");

  // Get the radio button input
  var radios = document.getElementsByName('disruption-level');
  var radioChecked = false;
  var radioValue = 0;

  // Get the upload image element
  var inputImage = document.getElementById("disruptionImageUpload");

  // Get the button that will submit the info
  var submitButton = document.getElementById("disruptionSubmitButton");
  submitButton.onclick = function() { 
    for (var i = 0, length = radios.length; i < length; i++) {
      if (radios[i].checked) {
        radioChecked = true;
        radioValue = radios[i].value;
        break;
      }
    }

    if (inputImage.value != "" && radioChecked) {
      errorP.style.display = "none";
      console.log("Sending data to the database");
      currentPort.postMessage({response: "Disruption occurred", disruptionLevel: radioValue, image: inputImage.value});
      currentPort.disconnect(); // disconnects from port
      //blockNonActiveTabs(mag.tab, false);
      currentPort = null;
      modal.style.display = "none"; 
      radioChecked = false;
      radioValue = 0;
    } else {
      errorP.style.display = "block";
    }    
  };

  // Get the button that will close the modal
  var closeButton = document.getElementById("disruptionCloseButton");
  closeButton.onclick = function() { 
    for (var i = 0, length = radios.length; i < length; i++) {
      if (radios[i].checked) {
        radioChecked = true;
        break;
      }
    }

    if (radioChecked && inputImage.value != "") {
      errorP.style.display = "none";
      console.log("Closing modal"); // can't close until the fields are completed
      modal.style.display = "none";
    } else {
      errorP.style.display = "block";
    }
  };
}