var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require("body-parser");
var ejs = require('ejs');
var fs = require("fs");
var del = require('del');
var ffmpeg = require('ffmpeg');
var youtubedl = require("youtube-dl");
var ffmpeg = require("ffmpeg");
var mkdirp = require('mkdirp');
var zip = require("node-native-zip");
var cron = require('node-cron');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.render("index");
});

cron.schedule('* * * * *', function(){
  fs.readdir(__dirname + "/files/", function(err, files){
		files.forEach(function(file){
			var filePath = __dirname + "/files/" + file;
			console.log(filePath);
			fs.stat(filePath, function(err, stats){
				if(stats){
					var createdAt = new Date(stats.ctime.toString()).getTime();
					var nowTime = Date.now();
					if(nowTime - createdAt > 1000*60*20){
						del([filePath]).then(function(paths){
							console.log('Deleted files and folders:\n', paths.join('\n'));
						});
					}
				}
			});
		});
  });
});


app.post('/', function (req, res) {

	console.log(req.body);
	var downloadFile;
	var songs;
	var titles;
	var userId;
	var songName = req.body.songName;
	var searchFile;

    if (typeof songName === "undefined"){
        downloadFile = req.body.download;
    }
    else {
        userId = req.body.userName + "_" + Date.now();
        mkdirp(__dirname + "/files/" + userId, function (err) {
        });
        searchFile = songName.split(",");
    }

    if (downloadFile == "download") {
		searchFile = req.body.searchFile;
		console.log(searchFile);
		searchFile = searchFile.split(",");
        userId = req.body.userId;
        var archive = new zip();
        var archivedFiles = [];
        for (var x = 0; x < searchFile.length; x++) {
			console.log(__dirname + "/files/" + userId + "/" + searchFile[x] + ".mp3");
            archivedFiles.push({ name: searchFile[x] + ".mp3", path: __dirname + "/files/" + userId + "/" + searchFile[x] + ".mp3" });
        }

        archive.addFiles(archivedFiles, function (err) {
			if(err){
				console.log(err);
			}
			else{
				var buff = archive.toBuffer();
				fs.writeFile(__dirname + "/files/" + userId + ".zip", buff, function () {
					del([__dirname + "/files/" + userId]).then(function(paths){
						console.log('Deleted files and folders:\n', paths.join('\n'));
					});
					console.log("Finished");
					res.download(__dirname + "/files/" + userId + ".zip");
				});
			}
        },
        function (err) {
            res.end("An error occured in zipping files. Please try again.");
        });

    }

    if (typeof downloadFile === "undefined") {
        var video_url = req.body.video_id;
        songs = video_url.split(",");
        titles = songName.split(",");
        insertone(songs, titles, userId, searchFile, res);
    }
});

function insertone(songs, titles, userId, searchFile, res) {

    var record = songs[0];
    var recordname = titles[0];
	var size = 0;
	var pos = 0;
    var percentage = 0;
    var rendered = false;
    
    console.log(record);

    var video = youtubedl(
		record,
        ["--format=140"],
        { cwd: __dirname }
    );
    
    video.pipe(fs.createWriteStream(__dirname + "/files/" + userId + "/" + recordname + '.mp3'));

    songs.splice(0, 1);
    titles.splice(0, 1);

    video.on('info', function (info) {
        size = info.size;
    });

    video.on('data', function (data) {
        pos += data.length;
        if (size) {
            var percent = (pos / size * 100).toFixed(2);
            percentage = percent;
            console.log(percentage);
        }

        if (percentage == 100) {
			if (songs.length === 0 && rendered === false) {
				console.log("Ready to be downloaded");
				rendered = true;
				res.render("download", {
					searchFile : searchFile,
					userId : userId
                });
            }
            else {
				if(rendered === false){
					insertone(songs, titles, userId, searchFile, res);
				}
            }
        }
    });

}
    

app.listen(process.env.PORT || 8000,function(){
  console.log("Started on PORT 8000");
});

process.on('uncaughtException', function(err) {
  console.log(err);
});

console.log = function(msg){
};
