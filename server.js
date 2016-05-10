var express = require('express');
var app = express();
var bodyParser = require("body-parser");
var fs = require("fs");
var youtubedl = require("youtube-dl");
var mkdirp = require('mkdirp');
var zip = require("node-native-zip");
var fse = require("fs-extra");
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res){
  res.sendfile("index.html");
});

var searchfile;
var test;
var songs;
var titles;
var userid;
app.post('/', function (req, res) {	
	if (typeof req.body.songName == "undefined") {
        var downloadfile = req.body.download;		
    }
    else {
        var filename = req.body.songName;
		userid = req.body.userName;		
		mkdirp(__dirname + "/files/"+userid, function(err) { 
			console.log("new folder created.");
		});			
        searchfile = filename.split(",");		
    }
    if (downloadfile == "download") {				
		var archive = new zip();
		var array =  [];
		for(var x = 0 ; x < searchfile.length ; x++)
		{
			array.push({ name: searchfile[x]+".mp4", path: __dirname + "/files/"+userid+"/"+searchfile[x]+".mp4" });
		}
		console.log(array);
    archive.addFiles(array, 
		function () {
        var buff = archive.toBuffer();        
        fs.writeFile(__dirname + "\\files\\"+userid+".zip", buff, function () {
            console.log("Finished");
			res.download(__dirname + "\\files\\" + userid + ".zip");
        });
		}, function (err) {
			console.log(err);
		});
			//res.download(__dirname + "\\files\\" + userid + ".zip");		
		}
		
    if (downloadfile == "delete") {	
		
	}
	
    if (typeof downloadfile == "undefined") {
        var video_url = req.body.video_id;
		console.log(video_url);
		console.log(filename);
        songs = video_url.split(",");
        titles = filename.split(",");
		//console.log("4");
		insertone();			
	}
	
	function insertone(){
		var record = songs[0];
		var recordname = titles[0];
		var video = youtubedl(record,
            ["--extract-audio"],
            { cwd: __dirname });                        
            video.pipe(fs.createWriteStream(__dirname + "\\files\\" + userid + "\\" + recordname + '.mp4'));
			//console.log("5");
			songs.splice(0,1);
			titles.splice(0,1);
			var size = 0;
			video.on('info', function(info) {
			console.log('Download started');
			console.log('filename: ' + info.filename);
			size  = info.size;
			});
			var pos = 0;
		var percentage;
		video.on('data', function(data) {
			 pos += data.length;			
		 if (size) {
			var percent = (pos / size * 100).toFixed(2);
			process.stdout.cursorTo(0);
			process.stdout.clearLine(1);
			process.stdout.write(percent + '%');
			percentage = percent;
			}
			
		if(percentage == 100){
		console.log("\narray length : " + songs.length);
		if(songs.length == 0)	{
			console.log("Download completed");
			res.sendfile("download.html");
		}
		else{			
			insertone();
		}						
		}
		});
	}
		
});



app.listen(8000,function(){
  console.log("Started on PORT 8000");
})
