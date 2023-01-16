let isExtensoinActive = true;
let isProcessing = false;
var global={
  "num_papers":10,
  "content_type":"",
  "subject_area":"",
  "sort_by":"",
  "start_year":1900,
  "end_year":new Date().getFullYear(),
}

var textarea;


chrome.storage.sync.get(["global"], (data) => {
    global =  data.global ;
});


function setTitleAndDescription() {
    const h1_title = document.evaluate("//h1[text()='ChatGPT']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (!h1_title) {
        return;
    }

    h1_title.textContent = "ChatGPT Paper Survey";

    const div = document.createElement("div");
    div.classList.add("w-full", "bg-gray-50", "dark:bg-white/5", "p-6", "rounded-md", "mb-10", "border");
    div.textContent = "With ChatGPT Paper Survey you can use ChatGPT to make a scientific paper survey.";
    h1_title.parentNode.insertBefore(div, h1_title.nextSibling);

}

function showErrorMessage(e) {
    console.log(e);
    var errorDiv = document.createElement("div");
    errorDiv.classList.add("chatgpt-paper-survey-error", "absolute", "bottom-0", "right-1", "text-white", "bg-red-500", "p-4", "rounded-lg", "mb-4", "mr-4", "text-sm");
    errorDiv.innerHTML = "<b>An error occurred</b><br>" + e + "<br><br>Check the console for more details.";
    document.body.appendChild(errorDiv);
    setTimeout(() => { errorDiv.remove(); }, 5000);
}

function pasteWebResultsToTextArea(results, query) {
    let counter = 1;
    let formattedResults = "Articles web search results:\n\n";
    formattedResults = formattedResults + results.reduce((acc, result) => acc += `[${counter++}] "${result.body}"\nSource: ${result.href}\n\n`, "");

    formattedResults = formattedResults + `\nCurrent date: ${new Date().toLocaleDateString()}`;
    formattedResults = formattedResults + `\nInstructions: Using the provided articles search results, write a scientific survey. Make sure to cite results using [[number](URL)] notation after the reference. Be precise and use academic english. Dive deeper in each article and try to make a clear picture to the landscape. Write at least ${global["num_papers"]} paragraphs.\nSubject :  ${query}`;

    textarea.value = formattedResults;
}

function pressEnter() {
    textarea.focus();
    const enterEvent = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
        code: 'Enter'
    });
    textarea.dispatchEvent(enterEvent);
}

async function api_search(query, numResults, contentType, subject_area, start_year, end_year, sort_by) {
    var url = `https://ddg-webapp-aagd.vercel.app/search?max_results=${numResults}&q=${query}`;
    if (contentType !== "") {
      url += `&cat=${contentType}`;
    }
    if (subject_area !== "") {
      url += `&sub=${subject_area}`;
    }
    if (start_year !== "") {
      url += `&from_date=${start_year}`;
    }
    if (end_year !== "") {
        url += `&to_date=${end_year}`;
      }
      if (sort_by !== "") {
      url += `&sort_by=${sort_by}`;
    }
    console.log(url);
    const response = await fetch(url);
    return await response.json();
}



function onSubmit(event) {
    console.log("On submit triggered");
    if (event.shiftKey && event.key === 'Enter') {
        return;
    }
    chrome.storage.sync.set({ "global": global });
    if ((event.type === "click" || event.key === 'Enter') && isExtensoinActive && !isProcessing) {

        isProcessing = true;

        try {
            let query = textarea.value;
            textarea.value = "";

            query = query.trim();

            if (query === "") {
                isProcessing = false;
                return;
            }

            api_search(query, global["num_papers"], global["content_type"], global["subject_area"], global["start_year"], global["end_year"], global["sort_by"])
              .then(results => {
                pasteWebResultsToTextArea(results, query);
                pressEnter();
                isProcessing = false;
              });
        } catch (error) {
            isProcessing = false;
            showErrorMessage(error);
        }
    }
}


function build_option(option_name, select_options_list){
  var dropDown = document.createElement("select");
  dropDown.classList.add("text-white", "ml-0", "bg-gray-900", "border", "w-full");

  select_options_list.forEach(function (option) {
      var optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.innerHTML = option.label;
      optionElement.classList.add("text-white");
      dropDown.appendChild(optionElement);
  });

  dropDown.onchange = function () {
    global[option_name] = this.value;
  };
  return dropDown;
}

function updateUI() {

    if (document.querySelector(".chatgpt-paper-survey-options")) {
        return;
    }

    console.log("Updating UI");

    textarea = document.querySelector("textarea");
    var textareaWrapper = textarea.parentNode;
    var btnSubmit = textareaWrapper.querySelector("button");
    textarea.addEventListener("keydown", onSubmit);
    btnSubmit.addEventListener("click", onSubmit);


    // Web access switch
    var toggleWebAccessDiv = document.createElement("div");
    toggleWebAccessDiv.innerHTML = '<label class="chatgpt-paper-survey-toggle"><input class="chatgpt-paper-survey-toggle-checkbox" type="checkbox"><div class="chatgpt-paper-survey-toggle-switch"></div><span class="chatgpt-paper-survey-toggle-label">SurveyExtention On</span></label>';
    toggleWebAccessDiv.classList.add("chatgpt-paper-survey-toggle-web-access");
    chrome.storage.sync.get("extention_active", (data) => {
        toggleWebAccessDiv.querySelector(".chatgpt-paper-survey-toggle-checkbox").checked = data.extention_active;
    });


    var checkbox = toggleWebAccessDiv.querySelector(".chatgpt-paper-survey-toggle-checkbox");
    checkbox.addEventListener("click", () => {
            isExtensoinActive = checkbox.checked;
            chrome.storage.sync.set({ "extention_active": checkbox.checked });
        });

    var divider = document.createElement("hr");

    var optionsDiv = document.createElement("div");
    optionsDiv.classList.add("chatgpt-paper-survey-options", "p-4", "space-y-2");

    var title = document.createElement("h4");
    title.innerHTML = "ChatGPT Paper Survey Options";
    title.classList.add("text-white", "pb-4", "text-lg", "font-bold");

    var divnumPapersSlider = document.createElement("div");
    divnumPapersSlider.classList.add("flex", "justify-between");

    var label = document.createElement("label");
    label.innerHTML = "Number of papers";
    label.classList.add("text-white");

    var numPapersValue = document.createElement("span");
    numPapersValue.innerHTML = global["num_papers"];
    label.appendChild(numPapersValue);

    divnumPapersSlider.appendChild(label);
    divnumPapersSlider.appendChild(numPapersValue);

    var numPapersSlider = document.createElement("input");
    numPapersSlider.type = "range";
    numPapersSlider.min = 1;
    numPapersSlider.max = 10;
    numPapersSlider.step = 1;
    chrome.storage.sync.get("global", (data) => {
        numPapersSlider.value = num_papers;
    });
    numPapersSlider.classList.add("w-full");

    numPapersSlider.oninput = function () {
        global["num_papers"] = this.value;
        numPapersValue.innerHTML = global["num_papers"];
        num_papers = this.value
        chrome.storage.sync.set({ "num_papers": num_papers });
    };

    var contentTypeLabel = document.createElement("label");
    contentTypeLabel.innerHTML = "Content type:";
    contentTypeLabel.classList.add("text-white");

    var contentTypeOptions = [    
        { value: "", label: "Not specified" },    
        { value: "cs", label: "Computer Science" },    
      { value: "math", label: "Mathematics" },    
      { value: "physics", label: "Physics" },   
      { value: "q-bio", label: "Quantitative Biology" },    
      { value: "q-fin", label: "Quantitative Finance" },    
      { value: "stat", label: "Statistics" }
    ];
    contentTypeDropdown = build_option("content_type", contentTypeOptions);

    var subjectAreaLabel = document.createElement("label");
    subjectAreaLabel.innerHTML = "Subject area:";
    subjectAreaLabel.classList.add("text-white");

    var subjectAreaOptions = [    
        { value: "", label: "Not specified" },    
        { value: "robotics", label: "Robotics" },    
      { value: "machine_learning", label: "Machine Learning" },    
      { value: "neural_nets", label: "Neural Networks" },    
      { value: "computer_vision", label: "Computer Vision" },    
      { value: "data_mining", label: "Data Mining" },    
      { value: "deep_learning", label: "Deep Learning" 
    }];
    subjectAreaDropdown = build_option("subject_area", subjectAreaOptions);

    var sortByLabel = document.createElement("label");
    sortByLabel.innerHTML = "Sort by:";
    sortByLabel.classList.add("text-white");

    var sortByOptions = [    
        { value: "", label: "Not specified" },    
      { value: "oldest", label: "Oldest" },    
      { value: "newest", label: "Newest" }
    ];
    sortByDropdown = build_option("sort_by", sortByOptions);    


    // Create the label element
    var startYearLabel = document.createElement("LABEL");
    startYearLabel.setAttribute("for", "start-year-slider");
    startYearLabel.classList.add("text-sm", "text-gray-500");
    
    var startYearSlider = document.createElement("INPUT");
    startYearSlider.setAttribute("type", "range");
    startYearSlider.setAttribute("min", "1900");
    startYearSlider.setAttribute("max", new Date().getFullYear());
    startYearSlider.setAttribute("step", "1");
    startYearSlider.setAttribute("id", "start-year-slider");
    startYearSlider.value= global["start_year"];

    startYearLabel.innerHTML = "Selected Starting Year: " + global["start_year"];
    startYearSlider.addEventListener("input", function() {
        console.log("start year slider moved")
        // Update the text element to display the current year
        global["start_year"] = startYearSlider.value;
        startYearLabel.innerHTML = "Selected Starting Year: " + startYearSlider.value;
      });
    // Create the div element
    var startYearDiv = document.createElement("DIV");

    // Append the label and slider element to the div
    startYearDiv.appendChild(startYearLabel);
    startYearDiv.appendChild(startYearSlider);


    // Create the label element
    var endYearLabel = document.createElement("LABEL");
    endYearLabel.setAttribute("for", "end-year-slider");
    endYearLabel.classList.add("text-sm", "text-gray-500");
    var endYearSlider = document.createElement("INPUT");
    endYearSlider.setAttribute("type", "range");
    endYearSlider.setAttribute("min", "1900");
    endYearSlider.setAttribute("max", new Date().getFullYear());
    endYearSlider.setAttribute("step", "1");
    endYearSlider.setAttribute("id", "start-year-slider");
    endYearSlider.value= global["end_year"];

    endYearLabel.innerHTML = "Selected End Year: " + global["end_year"];
    // Attach an event listener to the slider
    endYearSlider.addEventListener("input", function() {
        // Update the text element to display the current year
        global["end_year"] = endYearSlider.value;
        console.log(`end year slider moved ${global["end_year"]}`)
        endYearLabel.innerHTML = "Selected End Year: " + global["end_year"];
    });    

    // Create the div element
    var endYearDiv = document.createElement("DIV");

    // Append the label and slider element to the div
    endYearDiv.appendChild(endYearLabel);
    endYearDiv.appendChild(endYearSlider);

    var emptyDiv = document.createElement("div");
    emptyDiv.classList.add("p-4");

    var credits = document.createElement("a");
    credits.innerHTML = "Written by ParisNeo and chatgpt.";
    credits.classList.add("text-sm", "text-gray-500");


    optionsDiv.appendChild(title);
    optionsDiv.appendChild(divnumPapersSlider);
    optionsDiv.appendChild(numPapersSlider);
    optionsDiv.appendChild(contentTypeLabel);
    optionsDiv.appendChild(contentTypeDropdown);
    optionsDiv.appendChild(subjectAreaLabel);
    optionsDiv.appendChild(subjectAreaDropdown);
    optionsDiv.appendChild(sortByLabel);
    optionsDiv.appendChild(sortByDropdown);
    
    
    optionsDiv.appendChild(startYearDiv);
    optionsDiv.appendChild(endYearDiv);
    optionsDiv.appendChild(emptyDiv);
    optionsDiv.appendChild(toggleWebAccessDiv);
    optionsDiv.appendChild(credits);



    var navMenu = document.querySelector('nav');
    navMenu.appendChild(divider);
    navMenu.appendChild(optionsDiv);
}


console.log("Running Chat GPT paper survey code");


window.onload = function() {
    const titleEl = document.querySelector('title');
    const observer = new MutationObserver(() => {
        setTitleAndDescription();
        setTimeout(updateUI, 1000); //updateUI();
    });

    observer.observe(titleEl, {
        childList: true
    });
};