// Initialize button which will trigger showing the modal
let showModal = document.getElementById("showModal");

// When the button is clicked, inject showDisruptionModal into current page
showModal.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: showDisruptionModal,
    });
});
  
// The body of this function will be executed as a content script inside the
// current page
function showDisruptionModal() {
    if (document.getElementById("disruptionModal")) {
        let modal = document.getElementById("disruptionModal");
        // removing all the changes done to the body page
        document.body.style.filter = "";
        document.body.style.opacity = "";
        document.body.style.backgroundColor = "";
        modal.style.display = "block";
    }
}