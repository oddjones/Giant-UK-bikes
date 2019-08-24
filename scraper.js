// This is a template for a Node.js scraper on morph.io (https://morph.io)

var cheerio = require("cheerio");
var request = require("request");
var sqlite3 = require("sqlite3").verbose();

function initDatabase(callback) {
	// Set up sqlite database.
	var db = new sqlite3.Database("data.sqlite");
	db.serialize(function() {
		db.run("CREATE TABLE IF NOT EXISTS data (bikeName TEXT, imgUrl TEXT)");
		callback(db);
	});
}

function updateRow(db, bikeName, imgUrl) {
	// Insert some data.
	var statement = db.prepare("INSERT INTO data (bikeName, imgUrl) VALUES (?, ?)");
	statement.run([bikeName, imgUrl]);
	statement.finalize();
}

function readRows(db) {
	// Read some data.
	db.each("SELECT rowid AS id, bikeName FROM data", function(err, row) {
		console.log(row.id + ": " + row.bikeName +" | "+row.imgUrl);
	});
}

function fetchPage(url, callback) {
	// Use request to read in pages.
	request(url, function (error, response, body) {
		if (error) {
			console.log("Error requesting page: " + error);
			return;
		}

		callback(body);
	});
}

function run(db) {
	// Use request to read in pages.
	fetchPage("https://www.giant-bicycles.com/gb/bikes", function (body) {
		// Use cheerio to find things in the page with css selectors.
		var $ = cheerio.load(body);

		var elements = $("div.tile").each(function () {
			var bikeName = $(this).find('div.caption h3').text().trim();
			var imgUrl = $(this).find('picture.image img').attr('src');
			updateRow(db, bikeName, imgUrl);
		});

		readRows(db);

		db.close();
	});
}

initDatabase(run);
