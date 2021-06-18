// Countdown function
const go = {
	timer: null,
	message:'',
	time:0,
    paragraph: null,
	countdown: (duration = 10) => {
		clearInterval(go.timer);
		return new Promise(function(resolve, reject) {
			go.timer = setInterval(function() {
				go.time--;
				console.log(go.message + ': ' + go.time);
                go.paragraph.textContent = `${go.message}: ${go.time}`;
			if (!go.time) {
				clearInterval(go.timer);
				resolve();
			}
			}, 1000);
		});
	},
	do: async (msg, time=10, p) => {
		go.time = time;
		go.message = msg;
        go.paragraph = p;
		await go.countdown(go.time);
        go.paragraph.textContent = "Done! You can get back to whatever you were doing :)";
		console.log('fim');
	},
}

//(function() {
    // createModal()
    // .then(p => loadCSS('modal.css', p))
    // .then(displayModal())
    // .then(window.addEventListener("click", modalListener()))
    // .then(finalResult => countdown(2000, p))
    // .catch(failureCallbackfunction);

    createModal(); // creates the modal
//})();

// Shows countdown in the console
// function countdown2(milliseconds, p) {
//     let time = milliseconds/1000;
    
//     if (document.getElementById("countdownModal")) {
//         if (time >= 1) {
//             for (let i = time; i >= 0; i--) {
//                 console.log(i);
//                 p.textContent = i + " seconds left";
//                 sleep(1000);
//             }
//         }
//     }
// }

// function countdown(milliseconds, p){
//     let time = milliseconds/1000;

//     return new Promise((resolve,reject)=>{
//         //here our function should be implemented 
//         setTimeout(()=>{
//             if (document.getElementById("countdownModal")) {
//                 if (time >= 1) {
//                     for (let i = time; i >= 0; i--) {
//                         console.log(i);
//                         p.textContent = i + " seconds left";
//                         sleep(1000);
//                         resolve();
//                     }
//                 }
//             }
//         ;} , 5000
//         );
//     });
// }

// async function showLeft(i,p) {
//     return new Promise((resolve,reject)=>{
//         //here our function should be implemented 
        
//                     //setTimeout(()=>{
//                         console.log(i);
//                         p.textContent = i + " seconds left";
//                         resolve();
//                         sleep(1000);
//                     //;} , 1000
//                     //);
               
//     });
// }

// Stops execution for the amount of milliseconds
// function sleep(milliseconds) {
//     const date = Date.now();
//     let currentDate = null;
    
//     do {
//       currentDate = Date.now();
//     } while (currentDate - date < milliseconds);
// }

function createModal() {
    // Modal HTML
	var div1 = document.createElement('div');
    div1.className = "countdown-modal";
    div1.id = "countdownModal";
    var div2 = document.createElement('div');
    div2.className = "countdown-modal-content";
    var span1 = document.createElement('span'); // will appear after countdown ends
    span1.className = "close";
    span1.textContent = "X";
    var p = document.createElement('p');
    p.id = "countdownP";
    p.textContent = "";
    // var span2 = document.createElement('span');
    // span2.id = "countdownSpan";
    // span2.textContent = "seconds left";


    // Modal CSS
    // div1.setAttribute('style', 'display: none; position: fixed; z-index: 1; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgb(0,0,0); background-color: rgba(0,0,0,0.4);'); 
    // div2.setAttribute('style', 'background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 80%;');

    // structuring the modal together
    div1.appendChild(div2);
    div2.appendChild(span1);
    div2.appendChild(p);
    // p.appendChild(span2);
    document.body.appendChild(div1);

    console.log("Modal created");

    loadCSS('modal.css', p); // loads the CSS for the modal
}

function loadCSS(filename, p) 
{
    // specify our style rules in a string
    var cssRules = `/* The Modal (background) */
    #countdownModal {
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
      .countdown-modal-content {
        background-color: #fefefe;
        margin: 15% auto; /* 15% from the top and centered */
        padding: 20px;
        border: 1px solid #888;
        width: 80%; /* Could be more or less, depending on screen size */
        height: 30%;
      }

      #countdownP {
          color: black;
          text-align: center;
          font-size: x-large;
      }
      
      /* The Close Button */
      .close {
        color: black;
        float: right;
        font-size: 15px;
        font-weight: bold;
        background-color: aquamarine;
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

    displayModal(p); //displays the modal
}

function displayModal(p) {
    // Get the modal
    var modal = document.getElementById("countdownModal");

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // Get the p that display the countdown
    var p = document.getElementById("countdownP");

    modal.style.display = "block";

    console.log("Modal displayed");
    // listens for the click to get out of the modal
    window.addEventListener("click", modalListener(modal,span));

    // Calls countdown function
    go.do("Seconds left", 6, p); // here the number should be from the database
}

function modalListener(modal, span) {
    // When the user clicks anywhere outside of the modal or the X, close it
    window.onclick = function(event) {
        if ((event.target == modal || event.target == span) && !go.time) { // only applies if the countdown has reached 0
            modal.style.display = "none";
        }
    }

    console.log("Event listener added");
}