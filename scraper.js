// This is a template for a Node.js scraper on morph.io (https://morph.io)

var cheerio = require("cheerio");
var request = require("request");
var sqlite3 = require("sqlite3").verbose();

function initDatabase(callback) {
	// Set up sqlite database.
	var db = new sqlite3.Database("data.sqlite");
	db.serialize(function() {
		db.run("CREATE TABLE IF NOT EXISTS data (bikeName TEXT, imgUrl TEXT, price TEXT, buyLink TEXT)");
		callback(db);
	});
}

function updateRow(db, bikeName, imgUrl, price, buyLink) {
	// Insert some data.
	var statement = db.prepare("INSERT INTO data (bikeName, imgUrl, price, buyLink) VALUES (?, ?, ?, ?)");
	statement.run([bikeName, imgUrl, price, buyLink]);
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
	//clear existing data
	db.run(`DELETE FROM data`);
	db.run(`VACUUM`);
	// Use request to read in pages.
	fetchPage("https://www.giant-bicycles.com/gb/bikes", function (body) {
		// Use cheerio to find things in the page with css selectors.
		var $ = cheerio.load(body);

		var elements = $("div.tile").each(function () {
			var bikeName = $(this).find('div.caption h3').text().trim();
			var imgUrl = $(this).find('picture.image img').attr('src');
			var price= $(this).find('div.caption p.prices').text();
			var buyLink = 'https://giant-bicycles.com' + $(this).find('a').attr('href');
			updateRow(db, bikeName, imgUrl, price, buyLink);
		});

		readRows(db);
	});
	// Use request to read in pages.
	fetchPage("https://liv-cycling.com/gb/bikes", function (body) {
		// Use cheerio to find things in the page with css selectors.
		var $ = cheerio.load(body);

		var elements = $("div.tile").each(function () {
			var bikeName = $(this).find('div.caption h3').text().trim();
			var imgUrl = $(this).find('picture.image img').attr('src');
			var price= $(this).find('div.caption p.prices').text();
			var buyLink = 'https://liv-cycling.com' + $(this).find('a').attr('href');
			updateRow(db, bikeName, imgUrl, price, buyLink);
		});

		readRows(db);

		db.close();
	});
}

initDatabase(run);
