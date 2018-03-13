function onError(error) {
  console.log(`Error: ${error}`);
}

function shareURL(selectionContent,currentTab){

		browser.storage.local.get(["instance_url","window_width","window_height","remove_querystrings","exceptUrlList"],function(item){

		instance = item["instance_url"];
		windowWidth = item["window_width"];
		windowHeight = item["window_height"];
		noQueryStrings = item["remove_querystrings"];
    exceptUrlList = item["exceptUrlList"];

		// manages Mozilla Firefox reader mode
		var rawUrl = currentTab.url;
		var partToRemove = "about:reader?url=";
		if(rawUrl.includes(partToRemove)) {
		rawUrl = rawUrl.substring(partToRemove.length);
		rawUrl = decodeURIComponent(rawUrl);
	  }

		// manages URL query strings
		if (noQueryStrings == true) {
      var flagRemove = true;
      var urlList = exceptUrlList.split(/,\s*/);
      urlList.forEach(function(baseUrl) {
        if (rawUrl.startsWith(baseUrl)) {
          flagRemove = false
        }
      });
      if (flagRemove) {rawUrl = rawUrl.split("?")[0];}
		}

		var url = instance + "/bookmarks.php?action=add&address=" + encodeURIComponent(rawUrl) + "&title=" + encodeURIComponent(currentTab.title) + "&description=" + encodeURIComponent(selectionContent);
		widthInt = Number(windowWidth);
		heightInt = Number(windowHeight);

		browser.windows.create({
			url: url,
			width: widthInt,
			height: heightInt,
			type: "popup"
		},(win)=>{
			browser.tabs.onUpdated.addListener((tabId,changeInfo) =>{
				if(tabId === win.tabs[0].id){
					if(changeInfo.url){
						var new_url
						new_url = changeInfo.url
						if((new_url.includes("action=add") == false) && (new_url.includes("edit.php") == false)){
							browser.windows.remove(win.id);
						}
					}
				}
			});
		});
	});
}

browser.contextMenus.create({
	id: "semantic-scuttle",
	title: "Add to Bookmarkz",
	onclick: function(){
    browser.tabs.query({ currentWindow: true, active: true }, function(tabs) {
      tab = tabs[0];
      if((tab.url.includes("about:reader?url=") == true) || (tab.url.includes("https://addons.mozilla.org/") == true)){
        shareURL("",tab);
      }
      else
      {
    browser.tabs.sendMessage(tab.id, {method: "getSelection"}).then(response => {
  	shareURL(response.response,tab);
    }).catch(onError);
    }
  });
	},
	contexts: ["all"]
});

browser.contextMenus.create({
	id: "my-scuttle",
	title: "My Bookmarkz",
	onclick: function(){
    browser.storage.local.get(["instance_url","username"],function(item){
      myurl = item["instance_url"] + "/bookmarks.php/" + item["username"];
      var creating = browser.tabs.create({url: myurl});
    })
	},
	contexts: ["all"]
});

browser.browserAction.onClicked.addListener((tab) => {
  if((tab.url.includes("about:reader?url=") == true) || (tab.url.includes("https://addons.mozilla.org/") == true)){
    shareURL("",tab);
  }
  else
  {
  browser.tabs.sendMessage(tab.id, {method: "getSelection"}).then(response => {
	shareURL(response.response,tab);
  }).catch(onError);
  }
});
