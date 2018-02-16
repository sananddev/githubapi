													
var express = require('express');
//Initialize the express App
var app = express();
var server = require('http').Server(app);
var path = require('path'); 
var bodyParser = require('body-parser');
var io = require('socket.io')(server);;
//Twitter
var Twitter = require('twitter');
var request = require("request");
//MySQL
var mysql = require('mysql');
                                
													
//Establishing a connection with mysql database
var connect =  mysql.createPool({
	host : 'localhost',
	user : 'root',
	password: 'root',
	database: 'sandeep'
});

//Twitter Credentials
var client = new Twitter({
  consumer_key: '	GjGR7mrYoPfhzCM7xPxtI5zcG',
  consumer_secret: 'H1uiyd1fn2Xp82sKaF8txioTrd8J6C9oIADPUZPHXiYitrQ87b',
  access_token_key: 'Uxqkqn3qk3ZGN0zqY4UCvB3jW3rj7LY',
  access_token_secret: 'p2jfzMeOobEzhNtysuQDGgGcjmLTwra2PIsDmmNpOciDB'
});




//starting server at 3000 port
server.listen(3000);
console.log("Server listening at : 3000");
//Default Route
app.get('/',function(req,res){
	res.set({
		'Access-Control-Allow-Origin' : '*'
	});
	return res.redirect('/public/index.html');
});

app.use('/public', express.static(__dirname + '/public'));
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}));
                    
												
io.on('connection', function (socket) {
	//Default event just for testing
	socket.emit('welcome', { data: 'welcome' });
	//Keyword event is handled here
	socket.on('keyword' , function(data){
		console.log(data);
		var keyword = data.keyword;
		var stream = client.stream('statuses/filter', {track: keyword});
		
		stream.on('data', function(event) {
			var tweet = event.text;
			var user = event.user.name;
			
			var insert_R = 'INSERT INTO tweet_repo(keyword,user,tweet) VALUE(?,?,?)';
			//establishing connection
			connect.getConnection(function(err, connection){				
			  //Inserting a record into details
				connection.query(insert_R,[keyword,user,tweet], function(err,res){
					if(err) throw err;
					else {
							var content = {
								keyword : keyword,
								user : user,
								tweet : tweet
							}
							console.log("Keyword is ::>> " + keyword);
							console.log("Tweeted by ::>>" + event.user.name);
							console.log("Tweet is ::>>" + event.text );
							console.log('Details added successfully');
							//Emitting the data using sockets
							socket.emit('livetweets' , { data : content })

					}
				});
				//releasing connection
				socket.on('stop' , function(data){
					connection.release();
				});
				
			});
			
		});

		stream.on('error', function(error) {
			throw error;
		});	  
	});
});
													
												
