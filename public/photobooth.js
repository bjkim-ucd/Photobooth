var portNumber = 10371;
var url = "http://localhost:" + portNumber;

loadPhotos();

function uploadFile()
{
	var tagRecognition = document.getElementById("tagRecognition");
	tagRecognition.style.display = "block";
}

function tagRecognition(filename, answer)
{
	var selectedFile = document.getElementById("fileSelector").files[0];

	var fr = new FileReader();

	var photosContainer = document.getElementById("photoAlbum");

	fr.onload = function ()
	{
		var uploadingImageContainer = document.createElement("div");
		uploadingImageContainer.id = "flexyTheImage";

		var uploadingImage = document.createElement("img");
		uploadingImage.id = "theImage";
		uploadingImage.src = fr.result;
		uploadingImageContainer.appendChild(uploadingImage);

		var progress_bar = document.createElement("progress");
		progress_bar.id = "progress_bar";
		progress_bar.style.background = "#885544";
		progress_bar.style.background.color = "#885544";
		progress_bar.style.color = "#885544";

		uploadingImageContainer.appendChild(progress_bar);

		photosContainer.insertBefore(uploadingImageContainer, photosContainer.children[0]);

		var formData = new FormData();
		formData.append("userfile", selectedFile);

		var oReq = new XMLHttpRequest();
		oReq.open("POST", url + "/query?" + "upload_image" + "?" + answer, true);
		oReq.onload = function()
		{
			// remove faded uploading image and progress bar
			uploadingImageContainer = document.getElementById("flexyTheImage");
			photosContainer.removeChild(uploadingImageContainer);

			console.log("selectedFile.name: " + selectedFile.name);
			appendImage(encodeURI(selectedFile.name), 0);

			selectedFile = document.getElementById("fileSelector").value = null;
		};

		oReq.upload.onprogress = function(progressEvent)
		{
			console.log("xmlhttprequest in progress");
			if(progressEvent.lengthComputable)
			{
				progress_bar.max = progressEvent.total;
				console.log("this is progress even total: " + progressEvent.total);
				progress_bar.value = progressEvent.loaded;
			}
		};

		oReq.send(formData);

		var stl = document.getElementById("tagRecognition");
		stl.style.display = "none";
	};

	fr.readAsDataURL(selectedFile);
}

function refreshPhotos()
{
	var album = document.getElementById("photoAlbum");
	while(album.firstChild)
	{
		console.log("removing child");
		album.removeChild(album.firstChild);
	}

	loadPhotos();
}

function removeAllPhotos()
{
	var album = document.getElementById("photoAlbum");
	while(album.firstChild)
	{
		console.log("removing child");
		album.removeChild(album.firstChild);
	}
}

function loadPhotos()
{
	var oReq = new XMLHttpRequest();
	oReq.open("GET", url + "/query?load_images", true);
	oReq.onload = function()
	{
		var obj = JSON.parse(oReq.responseText);
		for(var i = obj.length - 1; i >= 0; i--)
			appendImage(obj[obj.length - i - 1].fileName, obj[obj.length - i - 1].favorite);
	}
	oReq.send();
}

function appendImage(imageUrl, favorite)
{
    /** Append given image to the photoAlbum DOM element.
    * imageUrl - relative path of the image
    * favorite - 1 if favorited, 0 otherwise
    */

	// create container for image and its properties
	var flexBox = document.createElement("div");
	flexBox.className = "flexy";

	// creat container for image itself
	var imageDiv = document.createElement("div");
	imageDiv.className = "imageContainer";
	imageDiv.id = imageUrl;
	flexBox.appendChild(imageDiv);

	// create image element
	var image = document.createElement("img");
	image.src = "photos/" + imageUrl;
	image.id = "image:" + imageUrl;
	image.className = "imageDiv";

	// append image to its container
	imageDiv.appendChild(image);

	// create container for hamburger menu and options for image
	var imgOptionsDiv = document.createElement("div")
	imgOptionsDiv.className = "imgOptionsDiv";

	// create container for change tags and favorite button
	var menu = document.createElement("div");
	menu.className = "imgMenu"; // for styling all menu elements
	menu.id = "imgMenu" + imageUrl; // for accessing a specific image's menu

	// create change tags button
	var changeTagsButton = document.createElement("button");
	changeTagsButton.className = "imgOptionsButton";
	changeTagsButton.textContent = "change tags";
	changeTagsButton.setAttribute("onClick", "changeTags('" + imageUrl + "')");
	menu.appendChild(changeTagsButton);

	// create favorite button
	var favButton = document.createElement("button");
	favButton.className = "imgOptionsButton";
	favButton.id = "favorite:" + imageUrl;
	if (favorite)
	{
		favButton.textContent = "unfavorite";
		favButton.setAttribute("onClick", "markFavorite('" + imageUrl + "'," + favorite + ")");
	}
	else
	{
		favButton.textContent = "add to favorites";
		favButton.setAttribute("onClick", "markFavorite('" + imageUrl + "'," + favorite + ")");
	}
	menu.appendChild(favButton);

	// create container for hamburger image
	var burgerImageDiv = document.createElement("button");
	burgerImageDiv.className = "burgerImageDiv";
	burgerImageDiv.id = "burgerButton" + imageUrl;
	burgerImageDiv.setAttribute("onClick", "openMenu('" + imageUrl + "')");

	// create hamburger image
	var burgerMenu = document.createElement("img");
	burgerMenu.id = "burgerMenu";
	burgerMenu.backgroundImage = imageUrl;
	burgerMenu.src = "photobooth/optionsTriangle.svg";

	// append burger menu to image
	imgOptionsDiv.appendChild(menu);
	burgerImageDiv.appendChild(burgerMenu);
	imgOptionsDiv.appendChild(burgerImageDiv);
	imageDiv.appendChild(imgOptionsDiv);

	// create container for image labels and load any existing labels from database
	var labelBox = document.createElement("div");
	labelBox.className = "labelBox";
	labelBox.id = "labelBox:" + imageUrl;
	photoLabelLoad(imageUrl, labelBox);
	flexBox.appendChild(labelBox);

	// append labels input text box
	appendLabelInput(flexBox, imageUrl);

	// append entire container to the DOM
	var photosContainer = document.getElementById("photoAlbum");
	photosContainer.insertBefore(flexBox, photosContainer.children[0])
}

function changeTags(imageName)
{
	closeMenu(imageName);
	var labelBox = document.getElementById("labelBox:" + imageName);
	// display the cross button for each label for image
	for (var i = 0; i < labelBox.children.length; i++)
		labelBox.children[i].children[0].children[0].style.display = "block";

	// change background color of label box
	labelBox.style.background = "rgb(186,154,138)";
	if (labelBox.children.length < 10)
	{
		var labelInputDiv = document.getElementById("labelInputDiv:" + imageName);
		labelInputDiv.style.display = "block";
	}
}

function changeTagsClose(imageName)
{
	closeMenu(imageName);
	var labelBox = document.getElementById("labelBox:" + imageName);
	// display the cross button for each label for image
	for(var i = 0; i < labelBox.children.length; i++)
		labelBox.children[i].children[0].children[0].style.display = "none";

	// change background color of label box
	labelBox.style.background = "white";
	var labelInputDiv = document.getElementById("labelInputDiv:" + imageName);
	labelInputDiv.style.display = "none";
}

function openMenu(imageName)
{
	var imgMenu = document.getElementById("imgMenu" + imageName);
	imgMenu.style.display = "flex";

	var burgerMenu = document.getElementById("burgerButton" + imageName);
	burgerMenu.setAttribute("onClick", "closeMenu('" + imageName + "')");
	burgerMenu.style.backgroundColor = "#885544";
}

function closeMenu(imageName)
{
	var imgMenu = document.getElementById("imgMenu" + imageName);
	imgMenu.style.display = "none";

	var burgerMenu = document.getElementById("burgerButton" + imageName);
	burgerMenu.setAttribute("onClick", "openMenu('" + imageName + "')");
	burgerMenu.style.backgroundColor = "rgba(0,0,0,0)";
}

function photoLabelLoad(imageUrl, labelBox)
{
	var oReq = new XMLHttpRequest();
	oReq.open("GET", url + "/query?load_images", true);

	oReq.onload = function()
	{
		var obj = JSON.parse(oReq.responseText);

		var saveI = 0;
		for(var i = 0; i < obj.length; i++)
		{
			if(obj[i].fileName == imageUrl)
			{
				saveI = i;
				console.log("print labels for:" + obj[i].fileName);
				break;
			}
		}

		var labelsArray = obj[saveI].labels.split(",");
		console.log("test print labels:"+ labelsArray.length);

		for(var i = 0; i < labelsArray.length; i++)
		{
			console.log("test print labels:" + labelsArray[i]);
			if(labelsArray[i] != "")
				tagAppend(obj[saveI].fileName, labelBox, decodeURI(labelsArray[i]));
		}
	}

	oReq.send();
}

function tagAppend(originalFileName, labelBox, labelsArrayI)
{
	var tag = document.createElement("div");
	var crossContainer = document.createElement("div");
	var tagName = document.createElement("div");
	tag.className = "tag";
	tag.id = "tag:" + originalFileName + ':' + labelsArrayI;

	var crossImg = document.createElement("img");
	crossImg.className = "cross_Image";
	crossContainer.setAttribute("onClick", "deleteTag('" + originalFileName + "','" + labelsArrayI + "')");
	crossImg.src = "photobooth/removeTagButton.png";
	tagName.textContent = labelsArrayI;
	crossContainer.appendChild(crossImg);

	tag.appendChild(crossContainer);
	tag.appendChild(tagName);

	labelBox.appendChild(tag);
}

function appendLabelInput(container, originalFileName)
{
	var labelInput = document.createElement("input");

	labelInput.type = "text";
	labelInput.className ="labelInput";
	labelInput.placeholder = "type new label";
	console.log("added input text?");

	var labelInputContain = document.createElement("div");
	labelInputContain.className = "labelInputDiv";
	labelInputContain.id = "labelInputDiv:" + originalFileName;

	var labelAddDiv = document.createElement("div");
	var labelAddButton = document.createElement("button");
	labelAddButton.className = "labelAddButton";
	labelAddButton.setAttribute("onClick", "addLabel('" + originalFileName + "')");
	labelAddButton.textContent = "Add";
	labelAddDiv.appendChild(labelAddButton);

	labelInputContain.appendChild(labelInput);
	labelInputContain.appendChild(labelAddDiv);
	container.appendChild(labelInputContain);
}

function addLabel(imageName)
{
	var newLabel = document.getElementById(imageName).parentElement.childNodes[2].childNodes[0].value;

	console.log("adding tag, beginning: " + newLabel);
	var oReq = new XMLHttpRequest();
	oReq.open("GET", url + "/query?load_images", true);

	var newArray = "";
	oReq.onload = function()
	{
		var obj = JSON.parse(oReq.responseText);
		var saveI = 0;
		for(var i = 0; i < obj.length; i++)
		{
			if(obj[i].fileName == imageName)
			{
				saveI = i;
				console.log("print labels for:" + obj[i].fileName);
				break;
			}
		}

		if(obj[saveI].labels != "")
		{
			newArray = obj[saveI].labels + "," + newLabel;
			console.log("newARRAY: additional label is:" + url + "/query?add_label?" + imageName + "?" + newArray);
			var oReqTwo = new XMLHttpRequest();
			oReqTwo.open("POST", url + "/query?add_label?" + imageName + "?" + newArray, true);
			oReqTwo.onload = function()
			{
				var labelBox = document.getElementById("labelBox:" + imageName);
				tagAppend(imageName, labelBox, newLabel);
			}
			oReqTwo.send();
		}
		else
		{
			newArray = newLabel;
			console.log("single added label,  is:" + url + "/query?add_label?" + imageName + "?" + newArray);
			var oReqThree = new XMLHttpRequest();
			oReqThree.open("POST", url + "/query?add_label?" + imageName + "?" + newArray, true);
			oReqThree.onload = function()
			{
				var labelBox = document.getElementById("labelBox:" + imageName);
				tagAppend(imageName, labelBox, newLabel);
			}
			oReqThree.send();
		}
	}//end onload

	oReq.send();

	changeTagsClose(imageName);
}

function deleteTag(imageUrl, tagName)
{
	console.log("deleteTag_start DB request:" + tagName);

	var encodedTagName = encodeURI(tagName);
	var oReq = new XMLHttpRequest();
	oReq.open("GET", url + "/query?load_images", true);
	var newArray = "";
	oReq.onload = function()
	{
		var obj = JSON.parse(oReq.responseText);
		var saveI = 0;
		for(var i = 0; i < obj.length; i++)
		{
			if(obj[i].fileName == imageUrl)
			{
				saveI = i;
				console.log("print labels for:" + obj[i].fileName);
				break;
			}
		}

		console.log("current labels list: " + obj[saveI].labels);
		var labelsArray = obj[saveI].labels.split(",");
		console.log("test print labels length:" + labelsArray.length);
		var countLabels = 0;
		for(var i = 0; i < labelsArray.length; i++)
		{
			console.log("test print labels:" + labelsArray[i]);

			if(labelsArray[i] != encodedTagName)
			{
				if(countLabels == 0)
				{
					newArray = newArray + labelsArray[i];
					countLabels++;
				}
				else
					newArray = newArray + "," + labelsArray[i];
			}
		}
		console.log("new array with removed label is:" + newArray);

		var oReqTwo = new XMLHttpRequest();

		oReqTwo.open("POST", url + "/query?delete_tag?" + imageUrl + "?" + newArray, true);
		oReqTwo.onload = function()
		{
			console.log("updating deleted array with new array:" + oReq.responseText);
			var tagDiv = document.getElementById("tag:" + imageUrl + ':' + tagName);
			var tagDivParent = tagDiv.parentElement;
			tagDivParent.removeChild(tagDiv);
		}

		oReqTwo.send("deleted tag");
	}//end onload

	oReq.send();
	changeTagsClose(imageUrl);
}

function markFavorite(imageName, yesOrNo)
{
	closeMenu(imageName);
	var newYesOrNo = 0;
	if(yesOrNo == 0)
		newYesOrNo = 1;

	var oReqTwo = new XMLHttpRequest();
	oReqTwo.open("POST", url + "/query?mark_favorite?" + imageName + "?" + newYesOrNo, true);
	oReqTwo.onload = function() {
		console.log(this.response);
		var favButton = document.getElementById("favorite:" + imageName);
		var favButtonParent = favButton.parentElement;
		favButtonParent.removeChild(favButton);
		favButton = document.createElement("button");
		favButton.className = "imgOptionsButton";
		favButton.id = "favorite:" + imageName;
		if (yesOrNo) {
			favButton.textContent = "add to favorites";
			favButton.setAttribute("onClick", "markFavorite('" + imageName + "',0)");
			favButtonParent.appendChild(favButton);
		}
		else
		{
			favButton.textContent = "unfavorite";
			favButton.setAttribute("onClick", "markFavorite('" + imageName + "',1)");
			favButtonParent.appendChild(favButton);
		}
	}
	oReqTwo.send();
}

function enterInputTagSearch(event)
{
	if(event.keyCode == 13)
	{
		var answer = document.getElementById("searchTagInput").value;
		tagSearchFunction(answer);
	}
}

function inputTagSearch()
{
	var answer = document.getElementById("searchTagInput").value;
	tagSearchFunction(answer);
}

function clearFilter()
{
	document.getElementById("searchTagInput").value = "";

	var resultsTag = document.getElementById("resultsTag");
	resultsTag.innerHTML = "";

	refreshPhotos();
}

function tagSearchFunction(target_tag)
{
	console.log("did it work, tag search?" + target_tag);
	var oReq = new XMLHttpRequest();

	oReq.open("GET", url + "/query?tag_search?" + target_tag, true);
	oReq.onload = function()
	{
		var obj = JSON.parse(oReq.responseText);
		var searchedTag = document.getElementById("resultsTag");
		searchedTag.innerHTML = "results for: '" + target_tag +"'";
		removeAllPhotos();
		for(var i = obj.length - 1; i >= 0; i--)
			appendImage(obj[obj.length - i - 1].fileName, obj[obj.length - i - 1].favorite);
	}
	oReq.send();
}

function showUpload(number)
{
	console.log("shownUpload() pressed" + number);
	var shownUpload = document.getElementById("shownUpload");
	var upload = document.getElementById("upload");
	var mobileUpload = document.getElementById("mobileUpload");
	if(number == 1)
	{
		shownUpload.style.display = "flex";
		upload.setAttribute("onClick", "showUpload(0)");
		mobileUpload.setAttribute("onClick", "showUpload(0)");
	}
	else
	{
		shownUpload.style.display = "none";
		upload.setAttribute("onClick", "showUpload(1)");
		mobileUpload.setAttribute("onClick", "showUpload(1)");
	}
}

function showFilter(number)
{
	var shownFilter = document.getElementById("shownFilter");
	var filter = document.getElementById("searchTag");
	var filter_m = document.getElementById("mobileSearchTag");
	if(number == 1)
	{
		shownFilter.style.display = "flex";
		filter.setAttribute("onClick", "showFilter(0)");
		filter_m.setAttribute("onClick", "showFilter(0)");
	}
	else
	{
		shownFilter.style.display = "none";
		filter.setAttribute("onClick", "showFilter(1)");
		filter_m.setAttribute("onClick", "showFilter(1)");
	}
}

function loadFav()
{
	var favMenu = document.getElementById("favMenu");
	favMenu.style.display = "flex";

	var resultsTag = document.getElementById("resultsTag");
	resultsTag.innerHTML = "Favorites";

	var oReq = new XMLHttpRequest();
	oReq.open("GET", url + "/query?load_fav", true);
	oReq.onload = function()
	{
		removeAllPhotos();

		var obj = JSON.parse(oReq.responseText);
		for(var i = obj.length - 1; i >= 0; i--)
			appendImage(obj[obj.length - i - 1].fileName, obj[obj.length - i - 1].favorite);
	};
	oReq.send();
}

function favToHome()
{
	var favMenu = document.getElementById("favMenu");
	favMenu.style.display = "none";

	var resultsTag = document.getElementById("resultsTag");
	resultsTag.innerHTML = "";

	refreshPhotos();
}
