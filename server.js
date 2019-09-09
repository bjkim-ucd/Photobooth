const sqlite3 = require("sqlite3").verbose();
const sendrequest = require("request");
const fs = require("fs");
const express = require("express");
const formidable = require("formidable");  // for uploading images in forms


function errorHandler(error)
{
    /** Function for handling errors
    * error - Error object
    */

    console.log("Error: ", error, "\n");
}

function sendCode(code, response, message)
{
    /** Function for sending an HTTP response with the given status code and message
    * code - integer representing an HTTP status code
    * response - Express' Response object
    * message - string of a custom message for the browser
    */

    response.status(code);
    response.send(message);
}


const port = 10371;
const baseUrl = "http://localhost:" + port;

var gcvUrl = "https://vision.googleapis.com/v1/images:annotate?key=";

var dbName = "photos.db";
const db = new sqlite3.Database(dbName);
if(!fs.existsSync("./photos.db"))
{
    var initQuery = "CREATE TABLE PhotoLabels (fileName TEXT UNIQUE NOT NULL PRIMARY KEY, labels TEXT, favorite INTEGER)";
    db.run(initQuery);
}


console.log("Starting DB operations");

const app = express();

/*
Case 1: static files
*/

app.use(express.static("public"));

/*
Case 2: GET requests

There are three GET requests:
/query?load_images
/query?tag_search
/query?load_fav
*/

app.get("/query", function (request, response)
{
    function getQueryCallback(error, tableData)
    {
        /** Callback for selecting all desired photos in the database
        * error - Error object
        * tableData - array of the selected rows of the database as objects
        */

        if(error)
            errorHandler(error);
        else
        {
            response.status(200);
            response.type("text/json");
            response.send(tableData);
        }
    }

    query = request.url.split("?");

    if (query[1] == "load_images")
        db.all("SELECT * FROM photoLabels", getQueryCallback);
    else if (query[1] == "tag_search")
        db.all("SELECT * FROM photoLabels WHERE labels LIKE  ?", ["%"+query[2]+"%"], getQueryCallback);
    else if(query[1] == "load_fav")
        db.all("SELECT * FROM PhotoLabels WHERE favorite = 1", getQueryCallback);
    else
        sendCode(400, response, "Query not recognized");
});

/*
Case 3: POST requests

There are four POST requests:
/query?upload_image?integer
/query?delete_tag?imageName?tagList
/query?add_label?imageName?tagList
/query?mark_favorite?imageName?integer
*/

app.post("/query", function (request, response)
{
    function postQueryCallback(message)
    {
        /** Callback maker for changing the database
        * message - string of a custom message for the browser
        * Returns a callback function for db.run()
        */

        return function (error)
        {
            /** Callback for changing the database.
            * error - Error object
            */

            if (error)
                errorHandler(error);
            else
            {
                response.status(201);
                response.type("text/json");
                response.send(message);
            }
        };
    }

    query = request.url.split("?");

    if(query[1] == "upload_image")
    {
        var form = new formidable.IncomingForm();
        form.parse(request);

        var filename;
        var encodedFilename;
        form.on("fileBegin", function (name, file)
        {
            /** Event handler for when a new file is detected in the upload stream
            * name - string assigned by FormData.append() in photo.js
            * file - File object from the FileList object in an input HTML element
            */

            filename = file.name;

            console.log("Filename is: "+ filename);

        	file.path = __dirname + "/public/photos/" + file.name;

            encodedFilename = encodeURI(file.name); // replaces spaces with %20, etc.
            db.run("INSERT OR REPLACE INTO photoLabels VALUES ('" + encodedFilename + "', '', 0)", errorHandler);
        });

        form.on("end", function ()
        {
            /** Event handler for when the entire request has been received
            */

        	console.log("Upload success");
            // get image labels from Google Cloud Vision

            if (query[2] == "1")
            {
                // The code that makes a request to the API
                // Uses the Node request module, which packs up and sends off
                // an XMLHttpRequest.

                sendrequest(
                {
                    // HTTP header stuff
                    url: gcvUrl,
                    method: "POST",
                    headers: {"content-type": "application/json"},
                    // stringifies object and puts into HTTP request body as JSON
                    json:
                        {
                            "requests":
                            [
                                {
                                    "image":
                                    {
                                        "source": {"imageUri": baseUrl + "/" + encodedFilename}
                                    },
                                    "features": [{"type": "TAG_RECOGNITION"}]
                                }
                            ]
                        },
                },
                function (error, apiResponse, body)
                {
                    /** Callback for Google Cloud Vision API
                    * error - Error object
                    * apiResponse
                    * body
                    */

                    if (error || apiResponse.statusCode != 200)
                        console.log("Got API error");
                    else
                    {
                        var gcvLabels = "";
                        console.log("body.responses[0]: " + JSON.stringify(body.responses[0]));
                        var apiResponseJSON = body.responses[0].labelAnnotations;
                        for (var i = 0; i < apiResponseJSON.length; i++)
                        {
                            console.log(apiResponseJSON[i].description);
                            if (gcvLabels == "")
                                gcvLabels = apiResponseJSON[i].description;
                            else
                                gcvLabels = gcvLabels + "," + apiResponseJSON[i].description;
                        }
                        console.log("Did Google API work?");
                        console.log(gcvLabels);

                        db.run("UPDATE photoLabels SET labels = ? WHERE fileName = ?", [gcvLabels, encodedFilename], errorHandler);
                        sendCode(200, response, "Received file");
                    }
                });
            }
            else
            {
                db.run("UPDATE photoLabels SET labels = '' WHERE fileName = ?", [encodedFilename], errorHandler);
                sendCode(200, response, "Received file");
            }
        });
    }
    else if(query[1] == "delete_tag")
        db.run("UPDATE photoLabels SET labels = ? WHERE fileName = ?", [query[3], query[2]], postQueryCallback("Deleted label from labels"));
    else if(query[1] == "add_label")
        db.run('UPDATE photoLabels SET labels = ? WHERE fileName = ? ', [query[3], query[2]], postQueryCallback("Added label to labels"));
    else if (query[1] == "mark_favorite")
        db.run("UPDATE photoLabels SET favorite = ? WHERE fileName = ?", [query[3], query[2]], postQueryCallback("Marked favorite"));
    else
        sendCode(400, response, "Query not recognized");
});

app.listen(port);
