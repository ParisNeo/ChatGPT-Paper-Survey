chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        extention_active: true,
        global:{
            "num_papers":10,
            "content_type":"",
            "subject_area":"",
            "sort_by":"",
            "start_year":1900,
            "end_year":new Date().getFullYear(),
          }       
    });
});
